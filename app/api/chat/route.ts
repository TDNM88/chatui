import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"
import { getKnowledgeContext } from "@/lib/knowledge"
import { extractFileContent } from "@/lib/files"
import { getPersonaById } from "@/lib/personas"

export const maxDuration = 60 // Allow streaming responses up to 60 seconds

export async function POST(req: Request) {
  try {
    // Extract the messages and other data from the request
    const {
      messages,
      useKnowledge = true,
      attachments = [],
      model = "deepseek-r1-distill-llama-70b",
      personaId = null,
      language = "en",
    } = await req.json()

    // Get the last user message
    const lastUserMessage = messages.findLast((message: any) => message.role === "user")

    // Process any file attachments
    let fileContents = ""
    if (attachments && attachments.length > 0) {
      const extractedContents = await Promise.all(attachments.map((url: string) => extractFileContent(url)))
      fileContents = extractedContents.join("\n\n")
    }

    // Get knowledge context if enabled
    let knowledgeContext = ""
    if (useKnowledge && lastUserMessage) {
      knowledgeContext = await getKnowledgeContext(lastUserMessage.content)
    }

    // Get persona if provided
    let systemPrompt = "You are a helpful AI assistant powered by the Groq API."

    if (personaId) {
      const persona = await getPersonaById(personaId)
      if (persona) {
        systemPrompt = persona.systemPrompt
      }
    }

    // Add language instruction
    if (language === "vi") {
      systemPrompt += "\n\nPlease respond in Vietnamese."
    }

    // Add knowledge context if available
    if (knowledgeContext) {
      systemPrompt +=
        "\n\nHere is some relevant information that might help you answer the user's question:\n" + knowledgeContext
    }

    // Add file content if available
    if (fileContents) {
      systemPrompt += "\n\nThe user has attached the following file content:\n" + fileContents
    }

    // Call the language model with the enhanced context
    const result = streamText({
      model: groq(model),
      messages,
      system: systemPrompt,
    })

    // Respond with the stream
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(
      JSON.stringify({
        error: "There was an error processing your request",
      }),
      { status: 500 },
    )
  }
}

