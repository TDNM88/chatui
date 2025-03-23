"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileUpload } from "@/components/file-upload"
import { Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { FileUploadResult } from "@/lib/files"

// Define available models
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

  // Fetch personas on component mount
  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    try {
      const response = await fetch("/api/personas")
      if (response.ok) {
        const data = await response.json()
        setPersonas(data.personas || [])

        // Set the first persona as default if available
        if (data.personas && data.personas.length > 0 && !selectedPersona) {
          setSelectedPersona(data.personas[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching personas:", error)
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

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex flex-col gap-4 mb-4">
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

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 rounded-lg border">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <p>{t("chat.welcome")}</p>
          </div>
        ) : (
          messages.map((message) => (
            <Card
              key={message.id}
              className={cn(
                "max-w-[80%]",
                message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "mr-auto",
                message.role === "assistant" && "font-sans",
                message.content === "Thinking..." && "font-mono"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
                    {message.role === "assistant" && <AvatarImage src="/placeholder.svg?height=32&width=32" />}
                  </Avatar>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
            onChange={handleInputChange}
            placeholder={t("chat.placeholder")}
            className="flex-1 min-h-[80px] resize-none"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}

