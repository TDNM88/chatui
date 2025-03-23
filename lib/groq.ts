import { createGroq } from "@ai-sdk/groq"

// Create a custom Groq client with configuration
export const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
  // Optional: Add custom headers or other configuration
  headers: {
    "User-Agent": "DeepSeek-R1-Chatbot/1.0",
  },
})

