import { put, del } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"
import { sql, toCamelCase } from "./db"

export interface FileMetadata {
  id: string
  name: string
  url: string
  contentType: string
  size: number
  createdAt: string
}

export interface FileUploadResult {
  id: string
  name: string
  url: string
  contentType: string
  size: number
}

export async function uploadFile(file: File): Promise<FileMetadata> {
  try {
    // Generate a unique filename
    const uniqueFilename = `${Date.now()}-${file.name}`

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: "public",
    })

    const metadata: FileMetadata = {
      id: uuidv4(),
      name: file.name,
      url: blob.url,
      contentType: file.type,
      size: file.size,
      createdAt: new Date().toISOString(),
    }

    // Store file metadata in database
    await sql`
      INSERT INTO files (
        id, 
        name, 
        url, 
        content_type, 
        size, 
        created_at
      )
      VALUES (
        ${metadata.id}, 
        ${metadata.name}, 
        ${metadata.url}, 
        ${metadata.contentType}, 
        ${metadata.size}, 
        ${metadata.createdAt}
      )
    `

    return metadata
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export async function deleteFile(url: string): Promise<boolean> {
  try {
    await del(url)

    // Delete file metadata from database
    await sql`
      DELETE FROM files
      WHERE url = ${url}
    `

    return true
  } catch (error) {
    console.error("Error deleting file:", error)
    return false
  }
}

export async function extractFileContent(url: string): Promise<string> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("text/")) {
      return await response.text()
    } else if (contentType.includes("application/pdf")) {
      return "PDF content extraction is not implemented in this demo."
    } else if (contentType.includes("application/json")) {
      const json = await response.json()
      return JSON.stringify(json, null, 2)
    } else if (contentType.includes("image/") || contentType.includes("audio/") || contentType.includes("video/")) {
      return `[This is a ${contentType} file available at ${url}]`
    } else {
      return `[Unsupported file type: ${contentType}]`
    }
  } catch (error) {
    console.error("Error extracting file content:", error)
    return `[Error extracting file content: ${error instanceof Error ? error.message : "Unknown error"}]`
  }
}

// Add the missing exports

export async function getFiles(): Promise<FileMetadata[]> {
  try {
    const result = await sql`
      SELECT id, name, url, content_type, size, created_at
      FROM files
      ORDER BY created_at DESC
    `

    return toCamelCase<FileMetadata>(result)
  } catch (error) {
    console.error("Error fetching files:", error)
    return []
  }
}

export async function getFile(id: string): Promise<FileMetadata | null> {
  try {
    const result = await sql`
      SELECT id, name, url, content_type, size, created_at
      FROM files
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return null
    }

    return toCamelCase<FileMetadata>(result)[0]
  } catch (error) {
    console.error("Error fetching file:", error)
    return null
  }
}

export async function updateFileMetadata(
  id: string,
  metadata: {
    name?: string
    contentType?: string
  },
): Promise<boolean> {
  try {
    // Build the SET part of the query dynamically based on provided fields
    const updates = []
    const values: any[] = []

    if (metadata.name !== undefined) {
      updates.push(`name = $${updates.length + 1}`)
      values.push(metadata.name)
    }

    if (metadata.contentType !== undefined) {
      updates.push(`content_type = $${updates.length + 1}`)
      values.push(metadata.contentType)
    }

    if (updates.length === 0) {
      return false // Nothing to update
    }

    // Add the ID as the last parameter
    values.push(id)

    const result = await sql.query(
      `UPDATE files SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING id`,
      ...values,
    )

    return result.length > 0
  } catch (error) {
    console.error("Error updating file metadata:", error)
    throw error
  }
}

