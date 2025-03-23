"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileUpload } from "@/components/file-upload"
import { Loader2, Send, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { FileUploadResult } from "@/lib/files"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDebouncedCallback } from "use-debounce"

// Định nghĩa các model có sẵn
const AVAILABLE_MODELS = [
  { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B" },
  { id: "llama3-8b-8192", name: "Llama 3 8B" },
  { id: "llama3-70b-8192", name: "Llama 3 70B" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
  { id: "gemma-7b-it", name: "Gemma 7B" },
]

type Persona = {
  id: string
  name: string
  systemPrompt: string
}

export function Chat() {
  const [useKnowledge, setUseKnowledge] = useState(true)
  const [attachments, setAttachments] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const { t, language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Fetch personas on component mount
  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    try {
      const response = await fetch("/api/personas")
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Unexpected response: ${text}`)
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to fetch personas")
      }

      const data = await response.json()
      setPersonas(data.personas || [])

      if (data.personas && data.personas.length > 0 && !selectedPersona) {
        setSelectedPersona(data.personas[0].id)
      }
    } catch (error) {
      console.error("Error fetching personas:", error)
      toast({
        title: t("notification.error"),
        description: error instanceof Error ? error.message : "Failed to fetch personas",
        variant: "destructive",
      })
    }
  }

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      useKnowledge,
      attachments,
      model: selectedModel,
      personaId: selectedPersona,
      language,
    },
    onResponse: () => {
      // Clear attachments after sending
      setAttachments([])
    },
  })

  const handleFileUpload = (uploadedFiles: FileUploadResult[]) => {
    setAttachments((prev) => [...prev, ...uploadedFiles.map((file) => file.url)])
  }

  const handleSubmitWrapper = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      toast({
        title: t("notification.validationError"),
        description: "Message cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await handleSubmit(e);
    } catch (error) {
      console.error("Error submitting message:", error);
      toast({
        title: t("notification.error"),
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce input change to improve performance
  const debouncedHandleInputChange = useDebouncedCallback(handleInputChange, 300)

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto">
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <Settings className="h-4 w-4 mr-2" />
          {t("chat.settings")}
        </Button>
      </div>

      {isSettingsOpen && (
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model-select">{t("chat.model")}</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select">
                  <SelectValue placeholder={t("chat.model")} />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="persona-select">{t("chat.persona")}</Label>
              <Select value={selectedPersona || ""} onValueChange={setSelectedPersona}>
                <SelectTrigger id="persona-select">
                  <SelectValue placeholder={t("chat.persona")} />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="use-knowledge" checked={useKnowledge} onCheckedChange={setUseKnowledge} />
            <Label htmlFor="use-knowledge">{t("chat.useKnowledge")}</Label>
          </div>
        </div>
      )}

      {/* Chat messages */}
      <ScrollArea className="flex-1 mb-4 rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <p>{t("chat.welcome")}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 mb-4",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>AI</AvatarFallback>
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>DeepSeek R1 Assistant</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-lg relative",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div className="absolute -bottom-5 text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
                {message.role === "user" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>You</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((url, index) => (
              <div key={index} className="text-xs bg-muted p-1 rounded flex items-center">
                <span className="truncate max-w-[200px]">{t("knowledge.fileAttached")}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmitWrapper} className="flex flex-col gap-2">
          <FileUpload onUpload={handleFileUpload} />

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={debouncedHandleInputChange}
              placeholder={t("chat.placeholder")}
              className="flex-1 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitWrapper(e)
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="h-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

