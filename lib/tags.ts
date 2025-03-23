import { sql, toCamelCase } from "./db"
import { v4 as uuidv4 } from "uuid"

export type Tag = {
  id: string
  name: string
  createdAt: Date
}

export async function getTags(): Promise<Tag[]> {
  try {
    const result = await sql`
      SELECT id, name, created_at
      FROM tags
      ORDER BY name ASC
    `

    return toCamelCase<Tag>(result)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return []
  }
}

export async function getTagById(id: string): Promise<Tag | null> {
  try {
    const result = await sql`
      SELECT id, name, created_at
      FROM tags
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    const tags = toCamelCase<Tag>(result)
    return tags[0]
  } catch (error) {
    console.error("Error fetching tag:", error)
    return null
  }
}

export async function getTagsByKnowledgeItemId(knowledgeItemId: string): Promise<Tag[]> {
  try {
    const result = await sql`
      SELECT t.id, t.name, t.created_at
      FROM tags t
      JOIN knowledge_item_tags kit ON t.id = kit.tag_id
      WHERE kit.knowledge_item_id = ${knowledgeItemId}
      ORDER BY t.name ASC
    `

    return toCamelCase<Tag>(result)
  } catch (error) {
    console.error("Error fetching tags for knowledge item:", error)
    return []
  }
}

export async function createTag(name: string): Promise<string> {
  try {
    const id = uuidv4()

    const result = await sql`
      INSERT INTO tags (id, name)
      VALUES (${id}, ${name})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `

    return result[0].id
  } catch (error) {
    console.error("Error creating tag:", error)
    throw error
  }
}

export async function updateTag(id: string, name: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE tags
      SET name = ${name}
      WHERE id = ${id}
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error("Error updating tag:", error)
    throw error
  }
}

export async function deleteTag(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM tags
      WHERE id = ${id}
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error("Error deleting tag:", error)
    throw error
  }
}

export async function addTagToKnowledgeItem(knowledgeItemId: string, tagId: string): Promise<boolean> {
  try {
    await sql`
      INSERT INTO knowledge_item_tags (knowledge_item_id, tag_id)
      VALUES (${knowledgeItemId}, ${tagId})
      ON CONFLICT DO NOTHING
    `

    return true
  } catch (error) {
    console.error("Error adding tag to knowledge item:", error)
    throw error
  }
}

export async function removeTagFromKnowledgeItem(knowledgeItemId: string, tagId: string): Promise<boolean> {
  try {
    await sql`
      DELETE FROM knowledge_item_tags
      WHERE knowledge_item_id = ${knowledgeItemId} AND tag_id = ${tagId}
    `

    return true
  } catch (error) {
    console.error("Error removing tag from knowledge item:", error)
    throw error
  }
}

export async function getOrCreateTags(tagNames: string[]): Promise<string[]> {
  try {
    const tagIds: string[] = []

    for (const name of tagNames) {
      const trimmedName = name.trim()
      if (!trimmedName) continue

      const result = await sql`
        INSERT INTO tags (id, name)
        VALUES (${uuidv4()}, ${trimmedName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `

      tagIds.push(result[0].id)
    }

    return tagIds
  } catch (error) {
    console.error("Error creating tags:", error)
    throw error
  }
}

