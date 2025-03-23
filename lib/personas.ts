import { sql, toCamelCase } from "./db"
import { v4 as uuidv4 } from "uuid"

export type Persona = {
  id: string
  name: string
  description: string | null
  systemPrompt: string
  createdAt: Date
}

export async function getPersonas(): Promise<Persona[]> {
  try {
    const result = await sql`
      SELECT id, name, description, system_prompt, created_at
      FROM personas
      ORDER BY created_at DESC
    `

    return toCamelCase<Persona>(result)
  } catch (error) {
    console.error("Error fetching personas:", error)
    return []
  }
}

export async function getPersonaById(id: string): Promise<Persona | null> {
  try {
    const result = await sql`
      SELECT id, name, description, system_prompt, created_at
      FROM personas
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    const personas = toCamelCase<Persona>(result)
    return personas[0]
  } catch (error) {
    console.error("Error fetching persona:", error)
    return null
  }
}

export async function createPersona(persona: {
  name: string
  description?: string
  systemPrompt: string
}): Promise<string> {
  try {
    const id = uuidv4()

    const result = await sql`
      INSERT INTO personas (id, name, description, system_prompt)
      VALUES (${id}, ${persona.name}, ${persona.description || null}, ${persona.systemPrompt})
      RETURNING id
    `

    return result[0].id
  } catch (error) {
    console.error("Error creating persona:", error)
    throw error
  }
}

export async function updatePersona(
  id: string,
  persona: {
    name?: string
    description?: string
    systemPrompt?: string
  },
): Promise<void> {
  try {
    // Build the SET part of the query dynamically based on provided fields
    const updates = []
    const values: any[] = []

    if (persona.name !== undefined) {
      updates.push(`name = $${updates.length + 1}`)
      values.push(persona.name)
    }

    if (persona.description !== undefined) {
      updates.push(`description = $${updates.length + 1}`)
      values.push(persona.description)
    }

    if (persona.systemPrompt !== undefined) {
      updates.push(`system_prompt = $${updates.length + 1}`)
      values.push(persona.systemPrompt)
    }

    if (updates.length === 0) {
      return // Nothing to update
    }

    // Add the ID as the last parameter
    values.push(id)

    await sql.query(`UPDATE personas SET ${updates.join(", ")} WHERE id = $${values.length}`, ...values)
  } catch (error) {
    console.error("Error updating persona:", error)
    throw error
  }
}

export async function deletePersona(id: string): Promise<void> {
  try {
    await sql`
      DELETE FROM personas
      WHERE id = ${id}
    `
  } catch (error) {
    console.error("Error deleting persona:", error)
    throw error
  }
}

