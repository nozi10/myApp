"use client"

import { useEffect, useRef } from "react"

interface TextDisplayProps {
  words: string[]
  currentWordIndex: number
  searchQuery: string
  onWordClick: (index: number) => void
}

export function TextDisplay({ words, currentWordIndex, searchQuery, onWordClick }: TextDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentWordRef = useRef<HTMLSpanElement>(null)

  // Auto-scroll to current word
  useEffect(() => {
    if (currentWordRef.current && containerRef.current) {
      const container = containerRef.current
      const currentWord = currentWordRef.current
      const containerRect = container.getBoundingClientRect()
      const wordRect = currentWord.getBoundingClientRect()

      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        currentWord.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [currentWordIndex])

  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
  }

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
                  ref={isCurrentWord ? currentWordRef : undefined}
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
            <span>Reading Progress</span>
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
