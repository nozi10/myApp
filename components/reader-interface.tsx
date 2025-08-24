"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Settings, ArrowLeft, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { AudioControls } from "@/components/audio-controls"
import { EnhancedTextDisplay } from "@/components/enhanced-text-display"
import { UserPreferences } from "@/components/user-preferences"

interface Document {
  id: string
  title: string
  cleanedText: string
  audioUrl: string
  fileType: string
  uploadedAt: string
  speechMarks?: any[] // Amazon Polly word timestamps
}

interface ReaderInterfaceProps {
  document: Document
  userId: string
}

export function ReaderInterface({ document, userId }: ReaderInterfaceProps) {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    preferredVoice: "alloy",
    defaultSpeed: 1,
    highlightMode: "word" as "word" | "sentence",
    autoScroll: true,
  })

  const audioRef = useRef<HTMLAudioElement>(null)

  // Split text into words and sentences
  const words = document.cleanedText.split(/(\s+)/).filter(Boolean)
  const sentences = document.cleanedText.split(/(?<=[.!?])\s+/).filter(Boolean)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setPlaybackRate(preferences.defaultSpeed)
      audio.playbackRate = preferences.defaultSpeed
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)

      if (document.speechMarks && document.speechMarks.length > 0) {
        // Use real Amazon Polly timestamps for word-level highlighting
        const currentMark = document.speechMarks.find((mark, index) => {
          const nextMark = document.speechMarks[index + 1]
          const currentTimeMs = audio.currentTime * 1000
          return currentTimeMs >= mark.time && (!nextMark || currentTimeMs < nextMark.time)
        })

        if (currentMark) {
          setCurrentWordIndex(currentMark.wordIndex || 0)
        }
      } else {
        // Fallback to proportional calculation
        const progress = audio.currentTime / audio.duration

        if (preferences.highlightMode === "sentence") {
          const sentenceIndex = Math.floor(progress * sentences.length)
          setCurrentSentenceIndex(Math.min(sentenceIndex, sentences.length - 1))
        } else {
          const wordIndex = Math.floor(progress * words.length)
          setCurrentWordIndex(Math.min(wordIndex, words.length - 1))
        }
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentWordIndex(0)
      setCurrentSentenceIndex(0)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [words.length, sentences.length, preferences.defaultSpeed, preferences.highlightMode, document.speechMarks])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (value[0] / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSpeedChange = (speed: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.playbackRate = speed
    setPlaybackRate(speed)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0] / 100
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, audio.currentTime - 10)
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.min(duration, audio.currentTime + 10)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{document.title}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {document.fileType} • {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="mt-4 max-w-md">
            <input
              type="text"
              placeholder="Search in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Text Panel */}
        <div className="flex-1 overflow-auto">
          <EnhancedTextDisplay
            text={document.cleanedText}
            currentWordIndex={currentWordIndex}
            currentSentenceIndex={currentSentenceIndex}
            highlightMode={preferences.highlightMode}
            searchQuery={searchQuery}
            autoScroll={preferences.autoScroll}
            onWordClick={(index) => {
              const audio = audioRef.current
              if (audio) {
                const progress = index / words.length
                audio.currentTime = progress * duration
              }
            }}
            onSentenceClick={(index) => {
              const audio = audioRef.current
              if (audio) {
                const progress = index / sentences.length
                audio.currentTime = progress * duration
              }
            }}
          />
        </div>

        {/* Audio Controls Panel */}
        <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-auto">
          <AudioControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            playbackRate={playbackRate}
            volume={volume}
            onTogglePlayPause={togglePlayPause}
            onSeek={handleSeek}
            onSpeedChange={handleSpeedChange}
            onVolumeChange={handleVolumeChange}
            onSkipBackward={skipBackward}
            onSkipForward={skipForward}
            formatTime={formatTime}
          />

          {showSettings && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <UserPreferences userId={userId} onPreferencesChange={setPreferences} />
            </div>
          )}
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={document.audioUrl} preload="metadata" />
    </div>
  )
}
