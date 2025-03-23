import type { NextRequest } from "next/server"
import { uploadFile, deleteFile } from "@/lib/files"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    const metadata = await uploadFile(file)

    return Response.json({
      id: metadata.id,
      name: metadata.name,
      url: metadata.url,
      contentType: metadata.contentType,
      size: metadata.size,
      success: true,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return Response.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
      return Response.json({ error: "File URL is required" }, { status: 400 })
    }

    const success = await deleteFile(url)

    if (!success) {
      return Response.json({ error: "Failed to delete file" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return Response.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

