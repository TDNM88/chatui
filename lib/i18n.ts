export type Language = "en" | "vi"

export type Translations = {
  [key: string]: {
    [key in Language]: string
  }
}

export const translations: Translations = {
  // Common
  "app.title": {
    en: "TDNM CHATBOT",
    vi: "Trợ lý TDNM",
  },
  "app.description": {
    en: "A chatbot powered by TDNM",
    vi: "Chatbot được phát triển bởi TDNM",
  },

  // Navigation
  "nav.chat": {
    en: "Chat",
    vi: "Trò chuyện",
  },
  "nav.knowledge": {
    en: "Knowledge Manager",
    vi: "Quản lý kiến thức",
  },
  "nav.personas": {
    en: "Personas",
    vi: "Nhân cách",
  },
  "nav.settings": {
    en: "Settings",
    vi: "Cài đặt",
  },

  // Chat
  "chat.placeholder": {
    en: "Type your message...",
    vi: "Nhập tin nhắn của bạn...",
  },
  "chat.send": {
    en: "Send",
    vi: "Gửi",
  },
  "chat.useKnowledge": {
    en: "Use Knowledge Base",
    vi: "Sử dụng cơ sở kiến thức",
  },
  "chat.welcome": {
    en: "Start a conversation with the DeepSeek R1 model.",
    vi: "Bắt đầu cuộc trò chuyện với mô hình DeepSeek R1.",
  },
  "chat.model": {
    en: "Model",
    vi: "Mô hình",
  },
  "chat.persona": {
    en: "Persona",
    vi: "Nhân cách",
  },

  // Knowledge
  "knowledge.title": {
    en: "Add Knowledge",
    vi: "Thêm kiến thức",
  },
  "knowledge.titlePlaceholder": {
    en: "Title",
    vi: "Tiêu đề",
  },
  "knowledge.contentPlaceholder": {
    en: "Content",
    vi: "Nội dung",
  },
  "knowledge.add": {
    en: "Add Knowledge",
    vi: "Thêm kiến thức",
  },
  "knowledge.adding": {
    en: "Adding...",
    vi: "Đang thêm...",
  },
  "knowledge.base": {
    en: "Knowledge Base",
    vi: "Cơ sở kiến thức",
  },
  "knowledge.empty": {
    en: "No knowledge items found. Add some knowledge above.",
    vi: "Không tìm thấy mục kiến thức nào. Thêm kiến thức ở trên.",
  },
  "knowledge.added": {
    en: "Added",
    vi: "Đã thêm",
  },
  "knowledge.fileAttached": {
    en: "File attached",
    vi: "Tệp đính kèm",
  },
  "knowledge.filesAttached": {
    en: "file(s) attached",
    vi: "tệp đính kèm",
  },

  // Personas
  "personas.title": {
    en: "Manage Personas",
    vi: "Quản lý nhân cách",
  },
  "personas.create": {
    en: "Create Persona",
    vi: "Tạo nhân cách",
  },
  "personas.name": {
    en: "Name",
    vi: "Tên",
  },
  "personas.description": {
    en: "Description",
    vi: "Mô tả",
  },
  "personas.systemPrompt": {
    en: "System Prompt",
    vi: "Lời nhắc hệ thống",
  },
  "personas.save": {
    en: "Save Persona",
    vi: "Lưu nhân cách",
  },
  "personas.saving": {
    en: "Saving...",
    vi: "Đang lưu...",
  },
  "personas.empty": {
    en: "No personas found. Create a new persona above.",
    vi: "Không tìm thấy nhân cách nào. Tạo nhân cách mới ở trên.",
  },
  "personas.edit": {
    en: "Edit",
    vi: "Chỉnh sửa",
  },
  "personas.delete": {
    en: "Delete",
    vi: "Xóa",
  },

  // File Upload
  "file.upload": {
    en: "Attach Files",
    vi: "Đính kèm tệp",
  },
  "file.uploading": {
    en: "Uploading...",
    vi: "Đang tải lên...",
  },

  // Settings
  "settings.title": {
    en: "Settings",
    vi: "Cài đặt",
  },
  "settings.language": {
    en: "Language",
    vi: "Ngôn ngữ",
  },
  "settings.english": {
    en: "English",
    vi: "Tiếng Anh",
  },
  "settings.vietnamese": {
    en: "Vietnamese",
    vi: "Tiếng Việt",
  },

  // Notifications
  "notification.success": {
    en: "Success",
    vi: "Thành công",
  },
  "notification.error": {
    en: "Error",
    vi: "Lỗi",
  },
  "notification.knowledgeAdded": {
    en: "Knowledge item added successfully",
    vi: "Đã thêm mục kiến thức thành công",
  },
  "notification.knowledgeDeleted": {
    en: "Knowledge item deleted successfully",
    vi: "Đã xóa mục kiến thức thành công",
  },
  "notification.personaCreated": {
    en: "Persona created successfully",
    vi: "Đã tạo nhân cách thành công",
  },
  "notification.personaUpdated": {
    en: "Persona updated successfully",
    vi: "Đã cập nhật nhân cách thành công",
  },
  "notification.personaDeleted": {
    en: "Persona deleted successfully",
    vi: "Đã xóa nhân cách thành công",
  },
  "notification.filesUploaded": {
    en: "Successfully uploaded file(s)",
    vi: "Đã tải lên tệp thành công",
  },
  "notification.uploadFailed": {
    en: "Failed to upload files",
    vi: "Tải lên tệp thất bại",
  },
  "notification.validationError": {
    en: "Validation Error",
    vi: "Lỗi xác thực",
  },
}

export function t(key: string, language: Language): string {
  if (!translations[key]) {
    console.warn(`Translation key not found: ${key}`)
    return key
  }

  return translations[key][language] || translations[key]["en"]
}

