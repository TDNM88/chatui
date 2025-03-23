// ... existing code ...

export function PersonaManager() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  // Fetch personas on component mount
  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    try {
      setIsLoadingPersonas(true)
      const response = await fetch("/api/personas")
      if (response.ok) {
        const data = await response.json()
        setPersonas(data.personas || [])
      }
    } catch (error) {
      toast({
        title: t("notification.error"),
        description: "Failed to fetch personas",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPersonas(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !systemPrompt.trim()) {
      toast({
        title: t("notification.validationError"),
        description: "Name and system prompt are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch("/api/personas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          systemPrompt,
        }),
      })

      if (response.ok) {
        toast({
          title: t("notification.success"),
          description: t("notification.personaCreated"),
        })

        // Reset form
        setName("")
        setDescription("")
        setSystemPrompt("")

        // Refresh personas
        fetchPersonas()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to create persona")
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

  const openEditDialog = (persona: Persona) => {
    setEditingPersona(persona)
    setName(persona.name)
    setDescription(persona.description || "")
    setSystemPrompt(persona.systemPrompt)
    setIsDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingPersona) return

    if (!name.trim() || !systemPrompt.trim()) {
      toast({
        title: t("notification.validationError"),
        description: "Name and system prompt are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch("/api/personas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingPersona.id,
          name,
          description,
          systemPrompt,
        }),
      })

      if (response.ok) {
        toast({
          title: t("notification.success"),
          description: t("notification.personaUpdated"),
        })

        // Close dialog
        setIsDialogOpen(false)
        setEditingPersona(null)

        // Reset form
        setName("")
        setDescription("")
        setSystemPrompt("")

        // Refresh personas
        fetchPersonas()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to update persona")
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

  const deletePersona = async (id: string) => {
    try {
      const response = await fetch(`/api/personas?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: t("notification.success"),
          description: t("notification.personaDeleted"),
        })

        // Refresh personas
        fetchPersonas()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete persona")
      }
    } catch (error) {
      toast({
        title: t("notification.error"),
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("personas.create")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input placeholder={t("personas.name")} value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                placeholder={t("personas.description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Textarea
                placeholder={t("personas.systemPrompt")}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("personas.saving")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("personas.save")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("personas.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPersonas ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : personas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("personas.empty")}</div>
          ) : (
            <div className="space-y-4">
              {personas.map((persona) => (
                <Card key={persona.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{persona.name}</h3>
                        {persona.description && (
                          <p className="text-sm text-muted-foreground mt-1">{persona.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {persona.systemPrompt.length > 100
                            ? `${persona.systemPrompt.substring(0, 100)}...`
                            : persona.systemPrompt}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(persona)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePersona(persona.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("personas.edit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input placeholder={t("personas.name")} value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                placeholder={t("personas.description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Textarea
                placeholder={t("personas.systemPrompt")}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("personas.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("personas.saving")}
                </>
              ) : (
                t("personas.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}