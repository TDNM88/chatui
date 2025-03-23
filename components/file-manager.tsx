"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload, type FileUploadResult } from "@/components/file-upload"
import { Loader2, Trash2, FileText, Image, File, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

type FileMetadata = {
  id: string
  name: string
  url: string
  contentType: string
  size: number
  knowledgeIds?: string[]
  chatIds?: string[]
  createdAt: number
}

export function FileManager() {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/files")
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (uploadedFiles: FileUploadResult[]) => {
    // Files are already uploaded at this point, just refresh the list
    fetchFiles()
  }

  const deleteFile = async (id: string) => {
    try {
      const response = await fetch(`/api/files?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "File deleted successfully",
        })

        // Refresh files
        fetchFiles()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete file")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return <Image className="h-6 w-6" />
    } else if (contentType.startsWith("text/")) {
      return <FileText className="h-6 w-6" />
    } else {
      return <File className="h-6 w-6" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload onUpload={handleFileUpload} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Library</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No files found. Upload some files above.</div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded bg-muted">
                        {getFileIcon(file.contentType)}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-medium">{file.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {file.contentType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(file.size)}
                          </Badge>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          Uploaded: {new Date(file.createdAt).toLocaleString()}
                        </div>

                        {(file.knowledgeIds?.length || 0) > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Used in {file.knowledgeIds?.length} knowledge items
                          </div>
                        )}

                        {(file.chatIds?.length || 0) > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">Used in {file.chatIds?.length} chats</div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteFile(file.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

