import { kv } from "@vercel/kv"
import { v4 as uuidv4 } from "uuid"

export type ChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: number
}

export type Chat = {
  id: string
  title: string
  messages: ChatMessage[]
  fileIds?: string[]
  createdAt: number
  updatedAt: number
}

const CHAT_KEY_PREFIX = "chat:"
const CHAT_INDEX_KEY = "chat_index"

// Create a new chat
export async function createChat(title = "New Chat"): Promise<Chat> {
  try {
    const id = uuidv4()
    const timestamp = Date.now()

    const chat: Chat = {
      id,
      title,
      messages: [],
      fileIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await kv.set(`${CHAT_KEY_PREFIX}${id}`, chat)
    await kv.sadd(CHAT_INDEX_KEY, id)

    return chat
  } catch (error) {
    console.error("Error creating chat:", error)
    throw error
  }
}

// Get all chats
export async function getChats(): Promise<Chat[]> {
  try {
    const ids = await kv.smembers<string[]>(CHAT_INDEX_KEY)

    if (!ids || ids.length === 0) {
      return []
    }

    const keys = ids.map((id) => `${CHAT_KEY_PREFIX}${id}`)
    const chats = await kv.mget<Chat[]>(keys)

    return chats.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (error) {
    console.error("Error fetching chats:", error)
    return []
  }
}

// Get a single chat
export async function getChat(id: string): Promise<Chat | null> {
  try {
    return await kv.get<Chat>(`${CHAT_KEY_PREFIX}${id}`)
  } catch (error) {
    console.error(`Error fetching chat ${id}:`, error)
    return null
  }
}

// Add a message to a chat
export async function addMessageToChat(
  chatId: string,
  message: Omit<ChatMessage, "id" | "createdAt">,
): Promise<ChatMessage | null> {
  try {
    const chat = await getChat(chatId)

    if (!chat) {
      return null
    }

    const newMessage: ChatMessage = {
      id: uuidv4(),
      ...message,
      createdAt: Date.now(),
    }

    chat.messages.push(newMessage)
    chat.updatedAt = Date.now()

    await kv.set(`${CHAT_KEY_PREFIX}${chatId}`, chat)

    return newMessage
  } catch (error) {
    console.error(`Error adding message to chat ${chatId}:`, error)
    throw error
  }
}

// Update chat title
export async function updateChatTitle(chatId: string, title: string): Promise<boolean> {
  try {
    const chat = await getChat(chatId)

    if (!chat) {
      return false
    }

    chat.title = title
    chat.updatedAt = Date.now()

    await kv.set(`${CHAT_KEY_PREFIX}${chatId}`, chat)
    return true
  } catch (error) {
    console.error(`Error updating chat ${chatId} title:`, error)
    throw error
  }
}

// Delete a chat
export async function deleteChat(id: string): Promise<boolean> {
  try {
    await kv.srem(CHAT_INDEX_KEY, id)
    await kv.del(`${CHAT_KEY_PREFIX}${id}`)
    return true
  } catch (error) {
    console.error(`Error deleting chat ${id}:`, error)
    throw error
  }
}

// Associate files with a chat
export async function associateFilesWithChat(chatId: string, fileIds: string[]): Promise<boolean> {
  try {
    const chat = await getChat(chatId)

    if (!chat) {
      return false
    }

    const existingFileIds = new Set(chat.fileIds || [])
    fileIds.forEach((id) => existingFileIds.add(id))

    chat.fileIds = Array.from(existingFileIds)
    chat.updatedAt = Date.now()

    await kv.set(`${CHAT_KEY_PREFIX}${chatId}`, chat)
    return true
  } catch (error) {
    console.error(`Error associating files with chat ${chatId}:`, error)
    throw error
  }
}

