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
  speechMarks?: any[]
}

interface ReaderInterfaceProps {
  document: Document
  userId: string
}

// DEBUGGING: Stripped down version to find syntax error
export function ReaderInterface({ document, userId }: ReaderInterfaceProps) {
  const router = useRouter()
  // Dummy data to prevent rendering errors
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
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
      <div className="flex-1 flex overflow-hidden">
        <aside className={`w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto flex flex-col space-y-4 transition-all duration-300`}>
          {showSearch && <p>Search UI placeholder</p>}
          {showSettings && <p>Settings UI placeholder</p>}
          {!showSearch && !showSettings && <p>Features placeholder</p>}
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }} className="transition-transform duration-300">
              <DocumentViewer fileUrl={document.fileUrl} fileType={document.fileType} />
            </div>
            <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">Transcript for Highlighting</h3>
              <p>{document.cleanedText.substring(0, 500)}...</p>
            </div>
          </div>
          <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 z-10">
            <p className="text-center text-sm">Audio controls placeholder</p>
          </footer>
        </main>
      </div>
      <audio src={document.audioUrl} preload="metadata" />
    </div>
  )
}
