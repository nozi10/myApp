"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"

// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

interface DocumentViewerProps {
  fileUrl: string
  fileType: string
}

export function DocumentViewer({ fileUrl, fileType }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>()

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages)
  }

  if (fileType.startsWith("image/")) {
    return (
      <div className="flex justify-center p-4">
        <img src={fileUrl} alt="Document" className="max-w-full h-auto shadow-lg" />
      </div>
    )
  }

  if (fileType === "application/pdf") {
    return (
      <div className="flex justify-center">
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              className="mb-4 shadow-lg"
            />
          ))}
        </Document>
      </div>
    )
  }

  // Fallback for other document types or as a placeholder
  return (
    <div className="p-4">
      <p className="text-center text-red-500">
        Unsupported file type for direct viewing: {fileType}. Text-based view will be used for highlighting.
      </p>
    </div>
  )
}
