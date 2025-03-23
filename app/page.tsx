"use client"

import { Chat } from "@/components/chat"
import { KnowledgeManager } from "@/components/knowledge-manager"
import { PersonaManager } from "@/components/persona-manager"
import { Settings } from "@/components/settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"

export default function Home() {
  const { t } = useLanguage()

  return (
    <main className="container flex flex-col items-center justify-between p-4 md:p-24 mx-auto">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center">{t("app.title")}</h1>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="chat">{t("nav.chat")}</TabsTrigger>
            <TabsTrigger value="knowledge">{t("nav.knowledge")}</TabsTrigger>
            <TabsTrigger value="personas">{t("nav.personas")}</TabsTrigger>
            <TabsTrigger value="settings">{t("nav.settings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="w-full">
            <Chat />
          </TabsContent>

          <TabsContent value="knowledge" className="w-full">
            <KnowledgeManager />
          </TabsContent>

          <TabsContent value="personas" className="w-full">
            <PersonaManager />
          </TabsContent>

          <TabsContent value="settings" className="w-full">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

