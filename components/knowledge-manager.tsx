import React from "react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { Loader2 } from "lucide-react"
import { FileMetadata } from "@/lib/files"
import { FileUploadResult } from "@/lib/files"

export function KnowledgeManager() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast({
        title: t("notification.validationError"),
        description: "Title and content are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/knowledge", {
        method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          title,
          content,
          files: files.map((file) => file.url),
          }),
        })

      if (response.ok) {
        toast({
          title: t("notification.success"),
          description: "Knowledge item created successfully",
        })
        // Reset form
        setTitle("")
        setContent("")
        setFiles([])
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to create knowledge item")
      }
    } catch (error) {
      toast({
        title: t("notification.error"),
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (uploadedFiles: FileUploadResult[]) => {
    const fileMetadata: FileMetadata[] = uploadedFiles.map((file) => ({
      ...file,
      createdAt: new Date().toISOString(),
    }))
    setFiles((prev) => [...prev, ...fileMetadata])
  }

  return (
    <div className="space-y-8">
          <Card>
            <CardHeader>
          <CardTitle>Add Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />
                <FileUpload onUpload={handleFileUpload} />
            <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                      </>
                    ) : (
                "Create Knowledge"
                    )}
                  </Button>
              </form>
            </CardContent>
          </Card>
    </div>
  )
}
