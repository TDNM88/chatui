import type { NextRequest } from "next/server"
import {
  getKnowledgeItems,
  getKnowledgeItemById,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  toggleKnowledgeItemPin,
  getKnowledgeItemVersions,
  getKnowledgeItemVersion,
  restoreKnowledgeItemVersion,
} from "@/lib/knowledge"

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    const versionId = req.nextUrl.searchParams.get("versionId")

    // Get versions for a knowledge item
    if (id && req.nextUrl.searchParams.get("versions") === "true") {
      const versions = await getKnowledgeItemVersions(id)
      return Response.json({ versions })
    }

    // Get a specific version
    if (versionId) {
      const version = await getKnowledgeItemVersion(versionId)

      if (!version) {
        return Response.json({ error: "Version not found" }, { status: 404 })
      }

      return Response.json({ version })
    }

    // Get a specific knowledge item
    if (id) {
      const item = await getKnowledgeItemById(id)

      if (!item) {
        return Response.json({ error: "Knowledge item not found" }, { status: 404 })
      }

      return Response.json({ item })
    }

    // Get all knowledge items with search and pagination
    const query = req.nextUrl.searchParams.get("query") || undefined
    const categoryId = req.nextUrl.searchParams.get("categoryId") || undefined
    const tagIds = req.nextUrl.searchParams.get("tagIds")?.split(",") || undefined
    const isPinned = req.nextUrl.searchParams.get("isPinned") === "true" ? true : undefined
    const page = Number.parseInt(req.nextUrl.searchParams.get("page") || "1")
    const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") || "10")

    const result = await getKnowledgeItems({
      query,
      categoryId,
      tagIds,
      isPinned,
      page,
      limit,
    })

    return Response.json(result)
  } catch (error) {
    console.error("Error fetching knowledge items:", error)
    return Response.json({ error: "Failed to fetch knowledge items" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { title, content, files, categoryId, tagNames, isPinned } = await req.json()

    if (!title || !content) {
      return Response.json({ error: "Title and content are required" }, { status: 400 })
    }

    const id = await createKnowledgeItem({
      title,
      content,
      files,
      categoryId,
      tagNames,
      isPinned,
    })

    return Response.json({ id, success: true })
  } catch (error) {
    console.error("Error creating knowledge item:", error)
    return Response.json({ error: "Failed to create knowledge item" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, title, content, files, categoryId, tagNames, isPinned, action, versionId } = await req.json()

    if (!id) {
      return Response.json({ error: "Knowledge item ID is required" }, { status: 400 })
    }

    // Handle special actions
    if (action === "togglePin") {
      const success = await toggleKnowledgeItemPin(id)

      if (!success) {
        return Response.json({ error: "Knowledge item not found" }, { status: 404 })
      }

      return Response.json({ success: true })
    }

    if (action === "restoreVersion" && versionId) {
      const success = await restoreKnowledgeItemVersion(id, versionId)

      if (!success) {
        return Response.json({ error: "Failed to restore version" }, { status: 404 })
      }

      return Response.json({ success: true })
    }

    // Regular update
    const success = await updateKnowledgeItem(id, {
      title,
      content,
      files,
      categoryId,
      tagNames,
      isPinned,
    })

    if (!success) {
      return Response.json({ error: "Knowledge item not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating knowledge item:", error)
    return Response.json({ error: "Failed to update knowledge item" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Knowledge item ID is required" }, { status: 400 })
    }

    const success = await deleteKnowledgeItem(id)

    if (!success) {
      return Response.json({ error: "Knowledge item not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting knowledge item:", error)
    return Response.json({ error: "Failed to delete knowledge item" }, { status: 500 })
  }
}

