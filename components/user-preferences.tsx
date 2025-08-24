"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Settings, Save } from "lucide-react"

interface UserPreferencesProps {
  userId: string
  onPreferencesChange?: (preferences: UserPreferences) => void
}

interface UserPreferences {
  preferredVoice: string
  defaultSpeed: number
  highlightMode: "word" | "sentence"
  autoScroll: boolean
}

export function UserPreferences({ userId, onPreferencesChange }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredVoice: "alloy",
    defaultSpeed: 1,
    highlightMode: "word",
    autoScroll: true,
  })
  const [saving, setSaving] = useState(false)

  // Voice options for OpenAI TTS
  const voiceOptions = [
    { value: "alloy", label: "Alloy (Neutral)" },
    { value: "echo", label: "Echo (Male)" },
    { value: "fable", label: "Fable (British Male)" },
    { value: "onyx", label: "Onyx (Deep Male)" },
    { value: "nova", label: "Nova (Female)" },
    { value: "shimmer", label: "Shimmer (Soft Female)" },
  ]

  useEffect(() => {
    loadPreferences()
  }, [userId])

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/preferences`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error("Failed to load preferences:", error)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      })

      if (response.ok) {
        onPreferencesChange?.(preferences)
      }
    } catch (error) {
      console.error("Failed to save preferences:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Voice & Reading Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preferred Voice</label>
          <Select
            value={preferences.preferredVoice}
            onValueChange={(value) => setPreferences((prev) => ({ ...prev, preferredVoice: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voiceOptions.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  {voice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Speed */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Default Reading Speed</label>
          <div className="px-2">
            <Slider
              value={[preferences.defaultSpeed]}
              onValueChange={(value) => setPreferences((prev) => ({ ...prev, defaultSpeed: value[0] }))}
              min={0.5}
              max={2}
              step={0.25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.5x</span>
              <span className="font-medium">{preferences.defaultSpeed}x</span>
              <span>2x</span>
            </div>
          </div>
        </div>

        {/* Highlight Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Text Highlighting</label>
          <Select
            value={preferences.highlightMode}
            onValueChange={(value: "word" | "sentence") =>
              setPreferences((prev) => ({ ...prev, highlightMode: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="word">Word-by-word (Amazon Polly)</SelectItem>
              <SelectItem value="sentence">Sentence-by-sentence (OpenAI TTS)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto Scroll */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Auto-scroll to current position</label>
          <Button
            variant={preferences.autoScroll ? "default" : "outline"}
            size="sm"
            onClick={() => setPreferences((prev) => ({ ...prev, autoScroll: !prev.autoScroll }))}
          >
            {preferences.autoScroll ? "On" : "Off"}
          </Button>
        </div>

        {/* Save Button */}
        <Button onClick={savePreferences} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  )
}
