import { sql, toCamelCase } from "./db"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { v4 as uuidv4 } from "uuid"
import { getTagsByKnowledgeItemId, getOrCreateTags } from "./tags"
import { getCategoryById } from "./categories"

export type KnowledgeItem = {
  id: string
  title: string
  content: string
  files?: string[]
  categoryId?: string
  category?: {
    id: string
    name: string
  }
  tags?: {
    id: string
    name: string
  }[]
  version: number
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export type KnowledgeItemVersion = {
  id: string
  knowledgeItemId: string
  title: string
  content: string
  files?: string[]
  version: number
  createdAt: Date
}

export type KnowledgeItemSearchParams = {
  query?: string
  categoryId?: string
  tagIds?: string[]
  isPinned?: boolean
  page?: number
  limit?: number
}

export async function getKnowledgeItems(params: KnowledgeItemSearchParams = {}): Promise<{
  items: KnowledgeItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  try {
    const { query, categoryId, tagIds, isPinned, page = 1, limit = 10 } = params

    const offset = (page - 1) * limit

    // Build the base query
    let queryText = `
      SELECT 
        ki.id, 
        ki.title, 
        ki.content, 
        ki.files, 
        ki.category_id, 
        c.name as category_name,
        ki.version,
        ki.is_pinned,
        ki.created_at,
        ki.updated_at
      FROM knowledge_items ki
      LEFT JOIN categories c ON ki.category_id = c.id
    `

    // Add tag join if filtering by tags
    if (tagIds && tagIds.length > 0) {
      queryText += `
        JOIN (
          SELECT knowledge_item_id, COUNT(*) as tag_count
          FROM knowledge_item_tags
          WHERE tag_id IN (${tagIds.map((_, i) => `$${i + 1}`).join(", ")})
          GROUP BY knowledge_item_id
          HAVING COUNT(*) = ${tagIds.length}
        ) tag_match ON ki.id = tag_match.knowledge_item_id
      `
    }

    // Build the WHERE clause
    const whereConditions = []
    const queryParams: any[] = tagIds || []
    let paramIndex = queryParams.length

    if (query) {
      whereConditions.push(`(
        ki.title ILIKE $${++paramIndex} 
        OR ki.content ILIKE $${++paramIndex}
      )`)
      queryParams.push(`%${query}%`, `%${query}%`)
    }

    if (categoryId) {
      whereConditions.push(`ki.category_id = $${++paramIndex}`)
      queryParams.push(categoryId)
    }

    if (isPinned !== undefined) {
      whereConditions.push(`ki.is_pinned = $${++paramIndex}`)
      queryParams.push(isPinned)
    }

    if (whereConditions.length > 0) {
      queryText += ` WHERE ${whereConditions.join(" AND ")}`
    }

    // Add order by and pagination
    queryText += `
      ORDER BY ki.is_pinned DESC, ki.updated_at DESC
      LIMIT $${++paramIndex} OFFSET $${++paramIndex}
    `

    queryParams.push(limit, offset)

    // Execute the query
    const items = await sql.query(queryText, ...queryParams)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM knowledge_items ki
    `

    // Add tag join if filtering by tags
    if (tagIds && tagIds.length > 0) {
      countQuery += `
        JOIN (
          SELECT knowledge_item_id
          FROM knowledge_item_tags
          WHERE tag_id IN (${tagIds.map((_, i) => `$${i + 1}`).join(", ")})
          GROUP BY knowledge_item_id
          HAVING COUNT(*) = ${tagIds.length}
        ) tag_match ON ki.id = tag_match.knowledge_item_id
      `
    }

    // Add WHERE clause to count query
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(" AND ")}`
    }

    const countResult = await sql.query(countQuery, ...queryParams.slice(0, -2))
    const total = Number.parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / limit)

    // Transform the results
    const knowledgeItems = toCamelCase<KnowledgeItem>(items).map((item) => ({
      ...item,
      category: item.categoryId
        ? {
            id: item.categoryId,
            name: item.categoryName,
          }
        : undefined,
      categoryName: undefined, // Remove the flat property
    }))

    // Fetch tags for each knowledge item
    for (const item of knowledgeItems) {
      item.tags = await getTagsByKnowledgeItemId(item.id)
    }

    return {
      items: knowledgeItems,
      total,
      page,
      limit,
      totalPages,
    }
  } catch (error) {
    console.error("Error fetching knowledge items:", error)
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    }
  }
}

export async function getKnowledgeItemById(id: string): Promise<KnowledgeItem | null> {
  try {
    const result = await sql`
      SELECT 
        ki.id, 
        ki.title, 
        ki.content, 
        ki.files, 
        ki.category_id, 
        c.name as category_name,
        ki.version,
        ki.is_pinned,
        ki.created_at,
        ki.updated_at
      FROM knowledge_items ki
      LEFT JOIN categories c ON ki.category_id = c.id
      WHERE ki.id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    const item = toCamelCase<KnowledgeItem>(result)[0]

    // Add category object
    if (item.categoryId) {
      item.category = {
        id: item.categoryId,
        name: item.categoryName as string,
      }
    }
    delete item.categoryName // Remove the flat property

    // Fetch tags
    item.tags = await getTagsByKnowledgeItemId(id)

    return item
  } catch (error) {
    console.error("Error fetching knowledge item:", error)
    return null
  }
}

export async function createKnowledgeItem(item: {
  title: string
  content: string
  files?: string[]
  categoryId?: string
  tagNames?: string[]
  isPinned?: boolean
}): Promise<string> {
  try {
    const id = uuidv4()
    const now = new Date()
    const files = item.files ? JSON.stringify(item.files) : null

    // Verify category exists if provided
    if (item.categoryId) {
      const category = await getCategoryById(item.categoryId)
      if (!category) {
        throw new Error("Category not found")
      }
    }

    // Create the knowledge item
    const result = await sql`
      INSERT INTO knowledge_items (
        id, 
        title, 
        content, 
        files, 
        category_id, 
        is_pinned,
        created_at,
        updated_at
      )
      VALUES (
        ${id}, 
        ${item.title}, 
        ${item.content}, 
        ${files}::jsonb, 
        ${item.categoryId || null}, 
        ${item.isPinned || false},
        ${now},
        ${now}
      )
      RETURNING id
    `

    // Create initial version
    await sql`
      INSERT INTO knowledge_item_versions (
        id,
        knowledge_item_id,
        title,
        content,
        files,
        version,
        created_at
      )
      VALUES (
        ${uuidv4()},
        ${id},
        ${item.title},
        ${item.content},
        ${files}::jsonb,
        1,
        ${now}
      )
    `

    // Add tags if provided
    if (item.tagNames && item.tagNames.length > 0) {
      const tagIds = await getOrCreateTags(item.tagNames)

      for (const tagId of tagIds) {
        await sql`
          INSERT INTO knowledge_item_tags (knowledge_item_id, tag_id)
          VALUES (${id}, ${tagId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    return id
  } catch (error) {
    console.error("Error creating knowledge item:", error)
    throw error
  }
}

export async function updateKnowledgeItem(
  id: string,
  updates: {
    title?: string
    content?: string
    files?: string[]
    categoryId?: string | null
    tagNames?: string[]
    isPinned?: boolean
  },
): Promise<boolean> {
  try {
    // Get the current item to create a version
    const currentItem = await getKnowledgeItemById(id)
    if (!currentItem) {
      return false
    }

    // Verify category exists if provided
    if (updates.categoryId) {
      const category = await getCategoryById(updates.categoryId)
      if (!category) {
        throw new Error("Category not found")
      }
    }

    // Build the SET part of the query dynamically based on provided fields
    const updateFields = []
    const updateValues: any[] = []

    if (updates.title !== undefined) {
      updateFields.push(`title = $${updateFields.length + 1}`)
      updateValues.push(updates.title)
    }

    if (updates.content !== undefined) {
      updateFields.push(`content = $${updateFields.length + 1}`)
      updateValues.push(updates.content)
    }

    if (updates.files !== undefined) {
      updateFields.push(`files = $${updateFields.length + 1}::jsonb`)
      updateValues.push(JSON.stringify(updates.files))
    }

    if (updates.categoryId !== undefined) {
      updateFields.push(`category_id = $${updateFields.length + 1}`)
      updateValues.push(updates.categoryId)
    }

    if (updates.isPinned !== undefined) {
      updateFields.push(`is_pinned = $${updateFields.length + 1}`)
      updateValues.push(updates.isPinned)
    }

    // Always update the updated_at timestamp and increment version
    const now = new Date()
    updateFields.push(`updated_at = $${updateFields.length + 1}`)
    updateValues.push(now)

    updateFields.push(`version = version + 1`)

    if (updateFields.length === 0) {
      return false // Nothing to update
    }

    // Add the ID as the last parameter
    updateValues.push(id)

    // Update the knowledge item
    const result = await sql.query(
      `UPDATE knowledge_items 
       SET ${updateFields.join(", ")} 
       WHERE id = $${updateValues.length} 
       RETURNING id, version`,
      ...updateValues,
    )

    if (result.length === 0) {
      return false
    }

    const newVersion = result[0].version

    // Create a new version record
    await sql`
      INSERT INTO knowledge_item_versions (
        id,
        knowledge_item_id,
        title,
        content,
        files,
        version,
        created_at
      )
      VALUES (
        ${uuidv4()},
        ${id},
        ${updates.title || currentItem.title},
        ${updates.content || currentItem.content},
        ${updates.files ? JSON.stringify(updates.files) : currentItem.files ? JSON.stringify(currentItem.files) : null}::jsonb,
        ${newVersion},
        ${now}
      )
    `

    // Update tags if provided
    if (updates.tagNames !== undefined) {
      // First, remove all existing tags
      await sql`
        DELETE FROM knowledge_item_tags
        WHERE knowledge_item_id = ${id}
      `

      // Then add the new tags
      if (updates.tagNames.length > 0) {
        const tagIds = await getOrCreateTags(updates.tagNames)

        for (const tagId of tagIds) {
          await sql`
            INSERT INTO knowledge_item_tags (knowledge_item_id, tag_id)
            VALUES (${id}, ${tagId})
            ON CONFLICT DO NOTHING
          `
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error updating knowledge item:", error)
    throw error
  }
}

export async function deleteKnowledgeItem(id: string): Promise<boolean> {
  try {
    // Delete the knowledge item (cascade will delete versions and tag associations)
    const result = await sql`
      DELETE FROM knowledge_items
      WHERE id = ${id}
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error("Error deleting knowledge item:", error)
    throw error
  }
}

export async function toggleKnowledgeItemPin(id: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE knowledge_items
      SET is_pinned = NOT is_pinned,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, is_pinned
    `

    return result.length > 0
  } catch (error) {
    console.error("Error toggling knowledge item pin:", error)
    throw error
  }
}

export async function getKnowledgeItemVersions(knowledgeItemId: string): Promise<KnowledgeItemVersion[]> {
  try {
    const result = await sql`
      SELECT id, knowledge_item_id, title, content, files, version, created_at
      FROM knowledge_item_versions
      WHERE knowledge_item_id = ${knowledgeItemId}
      ORDER BY version DESC
    `

    return toCamelCase<KnowledgeItemVersion>(result)
  } catch (error) {
    console.error("Error fetching knowledge item versions:", error)
    return []
  }
}

export async function getKnowledgeItemVersion(versionId: string): Promise<KnowledgeItemVersion | null> {
  try {
    const result = await sql`
      SELECT id, knowledge_item_id, title, content, files, version, created_at
      FROM knowledge_item_versions
      WHERE id = ${versionId}
    `

    if (result.length === 0) {
      return null
    }

    return toCamelCase<KnowledgeItemVersion>(result)[0]
  } catch (error) {
    console.error("Error fetching knowledge item version:", error)
    return null
  }
}

export async function restoreKnowledgeItemVersion(knowledgeItemId: string, versionId: string): Promise<boolean> {
  try {
    // Get the version to restore
    const version = await getKnowledgeItemVersion(versionId)
    if (!version) {
      return false
    }

    // Update the knowledge item with the version data
    const result = await sql`
      UPDATE knowledge_items
      SET 
        title = ${version.title},
        content = ${version.content},
        files = ${version.files}::jsonb,
        version = version + 1,
        updated_at = NOW()
      WHERE id = ${knowledgeItemId}
      RETURNING id, version
    `

    if (result.length === 0) {
      return false
    }

    const newVersion = result[0].version

    // Create a new version record
    await sql`
      INSERT INTO knowledge_item_versions (
        id,
        knowledge_item_id,
        title,
        content,
        files,
        version,
        created_at
      )
      VALUES (
        ${uuidv4()},
        ${knowledgeItemId},
        ${version.title},
        ${version.content},
        ${version.files}::jsonb,
        ${newVersion},
        NOW()
      )
    `

    return true
  } catch (error) {
    console.error("Error restoring knowledge item version:", error)
    throw error
  }
}

export async function getKnowledgeContext(query: string): Promise<string> {
  try {
    // Get all knowledge items
    const { items } = await getKnowledgeItems({ limit: 100 })

    if (items.length === 0) {
      return ""
    }

    // Use the model to find relevant knowledge
    const { text } = await generateText({
      model: groq("deepseek-r1-distill-llama-70b"),
      prompt: `
I have a knowledge base with the following items:

${items.map((item, index) => `${index + 1}. ${item.title}: ${item.content.substring(0, 100)}...`).join("\n")}

Given the user query: "${query}"

Return the numbers of the most relevant knowledge items (up to 3) that would help answer this query. Only return the numbers separated by commas, nothing else.
      `,
    })

    // Parse the response to get the relevant item numbers
    const relevantIndices = text
      .split(",")
      .map((num) => Number.parseInt(num.trim()) - 1)
      .filter((index) => !isNaN(index) && index >= 0 && index < items.length)

    if (relevantIndices.length === 0) {
      return ""
    }

    // Construct the context from the relevant items
    const relevantItems = relevantIndices.map((index) => items[index])
    const context = relevantItems
      .map((item) => {
        let itemText = `Title: ${item.title}\nContent: ${item.content}`
        if (item.category) {
          itemText += `\nCategory: ${item.category.name}`
        }
        if (item.tags && item.tags.length > 0) {
          itemText += `\nTags: ${item.tags.map((tag) => tag.name).join(", ")}`
        }
        return itemText
      })
      .join("\n\n")

    return context
  } catch (error) {
    console.error("Error getting knowledge context:", error)
    return ""
  }
}

