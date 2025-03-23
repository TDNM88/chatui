import type { NextRequest } from "next/server"
import { getFiles, getFile, updateFileMetadata, deleteFile } from "@/lib/files"

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (id) {
      // Get a specific file
      const file = await getFile(id)

      if (!file) {
        return Response.json({ error: "File not found" }, { status: 404 })
      }

      return Response.json({ file })
    } else {
      // Get all files
      const files = await getFiles()
      return Response.json({ files })
    }
  } catch (error) {
    console.error("Error fetching files:", error)
    return Response.json({ error: "Failed to fetch files" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...updates } = await req.json()

    if (!id) {
      return Response.json({ error: "File ID is required" }, { status: 400 })
    }

    const success = await updateFileMetadata(id, updates)

    if (!success) {
      return Response.json({ error: "File not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating file:", error)
    return Response.json({ error: "Failed to update file" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (!id) {
      return Response.json({ error: "File ID is required" }, { status: 400 })
    }

    const success = await deleteFile(id)

    if (!success) {
      return Response.json({ error: "File not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return Response.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

