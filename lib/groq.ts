import { createGroq } from "@ai-sdk/groq"

// Tạo một Groq client tùy chỉnh với cấu hình
export const groqClient = createGroq({
  // Sử dụng API key từ biến môi trường
  apiKey: process.env.GROQ_API_KEY,
  
  // Cấu hình tùy chọn: Thêm các header hoặc cấu hình khác
  // Bật chế độ gỡ lỗi để theo dõi các yêu cầu API
  headers: {
    // Xác định user agent cho các yêu cầu API
    "User-Agent": "DeepSeek-R1-Chatbot/1.0",
  },
})
