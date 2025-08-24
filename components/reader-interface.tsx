"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Settings, ArrowLeft, Search, ZoomIn, ZoomOut, Minimize, Maximize } from "lucide-react"
import { useRouter } from "next/navigation"
import { AudioControls } from "@/components/audio-controls"
import { EnhancedTextDisplay } from "@/components/enhanced-text-display"
import { UserPreferences } from "@/components/user-preferences"
import { DocumentViewer } from "./document-viewer"

interface Document {
  id: string
  title: string
  cleanedText: string
  audioUrl: string
  fileUrl: string
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
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header (can be extracted to its own component later) */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{document.title}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {document.fileType} • {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-500 w-10 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
            <Button variant="outline" size="icon" onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="outline" size="sm" onClick={() => setShowSearch(s => !s)}>
              Search
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(s => !s)}>
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`${isFullscreen ? "hidden" : "w-80"} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto flex flex-col space-y-4 transition-all duration-300`}>
          {showSearch && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Search Document</h2>
              <input
                type="text"
                placeholder="Search in document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {showSettings && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Settings</h2>
              <UserPreferences userId={userId} onPreferencesChange={setPreferences} />
            </div>
          )}

          {!showSearch && !showSettings && (
             <div>
              <h2 className="text-lg font-semibold mb-4">Features</h2>
              {/* Placeholder for future sidebar content */}
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Click Search or Settings to get started.</p>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6"></div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Document Viewer */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }} className="transition-transform duration-300">
              {/* The visual document (PDF/Image) */}
              <DocumentViewer fileUrl={document.fileUrl} fileType={document.fileType} />
            </div>

            {/* The text layer for highlighting */}
            <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Transcript for Highlighting</h3>
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

          {/* Player Bar */}
          <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 z-10">
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
          </footer>
        </main>
      </div>

      {/* Hidden Audio Element remains the same */}
      <audio ref={audioRef} src={document.audioUrl} preload="metadata" />
    </div>
  )
}
