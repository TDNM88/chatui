"\"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"

export type FileUploadResult = {
  id: string
  name: string
  url: string
  contentType: string
  size: number
}

interface FileUploadProps {
  onUpload: (fileUrls: FileUploadResult[]) => void
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        return data
      })

      const fileUploadResults = await Promise.all(uploadPromises)
      onUpload(fileUploadResults)

      toast({
        title: t("notification.success"),
        description: t("notification.filesUploaded").replace("{count}", files.length.toString()),
      })
    } catch (error) {
      toast({
        title: t("notification.error"),
        description: error instanceof Error ? error.message : t("notification.uploadFailed"),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the input
      e.target.value = ""
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        id="file-upload"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => document.getElementById("file-upload")?.click()}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("file.uploading")}
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {t("file.upload")}
          </>
        )}
      </Button>
    </div>
  )
}

