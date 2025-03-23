import type { NextRequest } from "next/server"
import {
  createChat,
  getChats,
  getChat,
  updateChatTitle,
  deleteChat,
  addMessageToChat,
  associateFilesWithChat,
} from "@/lib/chat"

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (id) {
      // Get a specific chat
      const chat = await getChat(id)

      if (!chat) {
        return Response.json({ error: "Chat not found" }, { status: 404 })
      }

      return Response.json({ chat })
    } else {
      // Get all chats
      const chats = await getChats()
      return Response.json({ chats })
    }
  } catch (error) {
    console.error("Error fetching chats:", error)
    return Response.json({ error: "Failed to fetch chats" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json()
    const chat = await createChat(title || "New Chat")

    return Response.json({ chat, success: true })
  } catch (error) {
    console.error("Error creating chat:", error)
    return Response.json({ error: "Failed to create chat" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, title, message, fileIds } = await req.json()

    if (!id) {
      return Response.json({ error: "Chat ID is required" }, { status: 400 })
    }

    // Update chat title
    if (title) {
      const success = await updateChatTitle(id, title)

      if (!success) {
        return Response.json({ error: "Chat not found" }, { status: 404 })
      }
    }

    // Add message to chat
    if (message) {
      const newMessage = await addMessageToChat(id, message)

      if (!newMessage) {
        return Response.json({ error: "Chat not found" }, { status: 404 })
      }
    }

    // Associate files with chat
    if (fileIds && fileIds.length > 0) {
      const success = await associateFilesWithChat(id, fileIds)

      if (!success) {
        return Response.json({ error: "Chat not found" }, { status: 404 })
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating chat:", error)
    return Response.json({ error: "Failed to update chat" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Chat ID is required" }, { status: 400 })
    }

    const success = await deleteChat(id)

    if (!success) {
      return Response.json({ error: "Chat not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return Response.json({ error: "Failed to delete chat" }, { status: 500 })
  }
}

