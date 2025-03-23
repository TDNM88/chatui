"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"

export function Settings() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">{t("settings.language")}</h3>
              <RadioGroup
                value={language}
                onValueChange={(value) => setLanguage(value as "en" | "vi")}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="language-en" />
                  <Label htmlFor="language-en">{t("settings.english")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vi" id="language-vi" />
                  <Label htmlFor="language-vi">{t("settings.vietnamese")}</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

