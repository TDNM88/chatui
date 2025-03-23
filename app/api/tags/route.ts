import type { NextRequest } from "next/server"
import {
  getTags,
  getTagById,
  getTagsByKnowledgeItemId,
  createTag,
  updateTag,
  deleteTag,
  addTagToKnowledgeItem,
  removeTagFromKnowledgeItem,
  getOrCreateTags,
} from "@/lib/tags"

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    const knowledgeItemId = req.nextUrl.searchParams.get("knowledgeItemId")

    if (id) {
      const tag = await getTagById(id)

      if (!tag) {
        return Response.json({ error: "Tag not found" }, { status: 404 })
      }

      return Response.json({ tag })
    } else if (knowledgeItemId) {
      const tags = await getTagsByKnowledgeItemId(knowledgeItemId)
      return Response.json({ tags })
    } else {
      const tags = await getTags()
      return Response.json({ tags })
    }
  } catch (error) {
    console.error("Error fetching tags:", error)
    return Response.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, names, knowledgeItemId } = await req.json()

    // Create multiple tags
    if (names && Array.isArray(names)) {
      const tagIds = await getOrCreateTags(names)
      return Response.json({ tagIds, success: true })
    }

    // Create a single tag
    if (!name) {
      return Response.json({ error: "Tag name is required" }, { status: 400 })
    }

    const id = await createTag(name)

    // Associate with knowledge item if provided
    if (knowledgeItemId) {
      await addTagToKnowledgeItem(knowledgeItemId, id)
    }

    return Response.json({ id, success: true })
  } catch (error) {
    console.error("Error creating tag:", error)
    return Response.json({ error: "Failed to create tag" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name } = await req.json()

    if (!id || !name) {
      return Response.json({ error: "Tag ID and name are required" }, { status: 400 })
    }

    const success = await updateTag(id, name)

    if (!success) {
      return Response.json({ error: "Tag not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating tag:", error)
    return Response.json({ error: "Failed to update tag" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    const knowledgeItemId = req.nextUrl.searchParams.get("knowledgeItemId")

    if (!id) {
      return Response.json({ error: "Tag ID is required" }, { status: 400 })
    }

    // Remove tag from knowledge item if provided
    if (knowledgeItemId) {
      await removeTagFromKnowledgeItem(knowledgeItemId, id)
      return Response.json({ success: true })
    }

    // Delete the tag entirely
    const success = await deleteTag(id)

    if (!success) {
      return Response.json({ error: "Tag not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return Response.json({ error: "Failed to delete tag" }, { status: 500 })
  }
}

