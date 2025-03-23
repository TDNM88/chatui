import { sql, toCamelCase } from "./db"
import { v4 as uuidv4 } from "uuid"

export type Category = {
  id: string
  name: string
  description: string | null
  createdAt: Date
}

export async function getCategories(): Promise<Category[]> {
  try {
    const result = await sql`
      SELECT id, name, description, created_at
      FROM categories
      ORDER BY name ASC
    `

    return toCamelCase<Category>(result)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const result = await sql`
      SELECT id, name, description, created_at
      FROM categories
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    const categories = toCamelCase<Category>(result)
    return categories[0]
  } catch (error) {
    console.error("Error fetching category:", error)
    return null
  }
}

export async function createCategory(category: {
  name: string
  description?: string
}): Promise<string> {
  try {
    const id = uuidv4()

    const result = await sql`
      INSERT INTO categories (id, name, description)
      VALUES (${id}, ${category.name}, ${category.description || null})
      RETURNING id
    `

    return result[0].id
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}

export async function updateCategory(
  id: string,
  data: {
    name?: string
    description?: string
  }
): Promise<boolean> {
  try {
    const updates = []
    const values: any[] = []

    if (data.name !== undefined) {
      updates.push(`name = $${updates.length + 1}`)
      values.push(data.name)
    }

    if (data.description !== undefined) {
      updates.push(`description = $${updates.length + 1}`)
      values.push(data.description)
    }

    if (updates.length === 0) {
      return false
    }

    values.push(id)

    const result = await sql`
      UPDATE categories 
      SET ${sql(updates.join(", "))} 
      WHERE id = ${id} 
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error("Error updating category:", error)
    throw error
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM categories
      WHERE id = ${id}
      RETURNING id
    `

    return result.length > 0
  } catch (error) {
    console.error("Error deleting category:", error)
    throw error
  }
}

