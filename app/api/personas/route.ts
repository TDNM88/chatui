import type { NextRequest } from "next/server"
import { getPersonas, getPersonaById, createPersona, updatePersona, deletePersona } from "@/lib/personas"

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (id) {
      const persona = await getPersonaById(id)

      if (!persona) {
        return Response.json({ error: "Persona not found" }, { status: 404 })
      }

      return Response.json({ persona })
    } else {
      const personas = await getPersonas()
      return Response.json({ personas })
    }
  } catch (error) {
    console.error("Error fetching personas:", error)
    return Response.json({ error: "Failed to fetch personas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, systemPrompt } = await req.json()

    if (!name || !systemPrompt) {
      return Response.json({ error: "Name and system prompt are required" }, { status: 400 })
    }

    const id = await createPersona({ name, description, systemPrompt })

    return Response.json({ id, success: true })
  } catch (error) {
    console.error("Error creating persona:", error)
    return Response.json({ error: "Failed to create persona" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, description, systemPrompt } = await req.json()

    if (!id) {
      return Response.json({ error: "Persona ID is required" }, { status: 400 })
    }

    await updatePersona(id, { name, description, systemPrompt })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating persona:", error)
    return Response.json({ error: "Failed to update persona" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Persona ID is required" }, { status: 400 })
    }

    await deletePersona(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting persona:", error)
    return Response.json({ error: "Failed to delete persona" }, { status: 500 })
  }
}

