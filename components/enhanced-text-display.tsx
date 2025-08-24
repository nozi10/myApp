"use client"

import { useEffect, useRef } from "react"

interface EnhancedTextDisplayProps {
  text: string
  currentWordIndex: number
  currentSentenceIndex: number
  highlightMode: "word" | "sentence"
  searchQuery: string
  autoScroll: boolean
  onWordClick: (index: number) => void
  onSentenceClick: (index: number) => void
}

export function EnhancedTextDisplay({
  text,
  currentWordIndex,
  currentSentenceIndex,
  highlightMode,
  searchQuery,
  autoScroll,
  onWordClick,
  onSentenceClick,
}: EnhancedTextDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentElementRef = useRef<HTMLSpanElement>(null)

  // Split text into sentences and words
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  const words = text.split(/(\s+)/).filter(Boolean)

  // Auto-scroll to current element
  useEffect(() => {
    if (autoScroll && currentElementRef.current && containerRef.current) {
      const container = containerRef.current
      const currentElement = currentElementRef.current
      const containerRect = container.getBoundingClientRect()
      const elementRect = currentElement.getBoundingClientRect()

      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        currentElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [currentWordIndex, currentSentenceIndex, autoScroll])

  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
  }

  if (highlightMode === "sentence") {
    return (
      <div ref={containerRef} className="h-full overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="text-lg leading-relaxed space-y-4">
              {sentences.map((sentence, index) => {
                const isCurrentSentence = index === currentSentenceIndex

                return (
                  <span
                    key={index}
                    ref={isCurrentSentence ? currentElementRef : undefined}
                    className={`block cursor-pointer transition-all duration-300 p-3 rounded-lg ${
                      isCurrentSentence
                        ? "bg-blue-500 text-white shadow-lg scale-[1.02]"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => onSentenceClick(index)}
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(sentence, searchQuery),
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Reading Progress */}
          <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Reading Progress (Sentences)</span>
              <span>{Math.round((currentSentenceIndex / sentences.length) * 100)}%</span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentSentenceIndex / sentences.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Word-level highlighting (default)
  return (
    <div ref={containerRef} className="h-full overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="text-lg leading-relaxed">
            {words.map((word, index) => {
              const isCurrentWord = index === currentWordIndex
              const isWhitespace = /^\s+$/.test(word)

              if (isWhitespace) {
                return <span key={index}>{word}</span>
              }

              return (
                <span
                  key={index}
                  ref={isCurrentWord ? currentElementRef : undefined}
                  className={`cursor-pointer transition-all duration-200 ${
                    isCurrentWord
                      ? "bg-blue-500 text-white px-1 py-0.5 rounded shadow-lg scale-105"
                      : "hover:bg-slate-100 dark:hover:bg-slate-700 px-1 py-0.5 rounded"
                  }`}
                  onClick={() => onWordClick(index)}
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchTerm(word, searchQuery),
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Reading Progress */}
        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Reading Progress (Words)</span>
            <span>{Math.round((currentWordIndex / words.length) * 100)}%</span>
          </div>
          <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentWordIndex / words.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
