"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in MB
  currentFile?: string
  onRemove?: () => void
}

export function FileUpload({ onFileSelect, accept = "image/*", maxSize = 5, currentFile, onRemove }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`El archivo es demasiado grande. Máximo ${maxSize}MB.`)
      return
    }
    onFileSelect(file)
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={handleChange} />

      {currentFile ? (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <img src={currentFile || "/placeholder.svg"} alt="Logo actual" className="w-12 h-12 object-cover rounded" />
            <span className="text-sm text-muted-foreground">Logo actual</span>
          </div>
          <div className="flex space-x-2">
            <Button onClick={onButtonClick} variant="outline" size="sm">
              Cambiar
            </Button>
            {onRemove && (
              <Button onClick={onRemove} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors ${
            dragActive ? "border-primary bg-muted/50" : "border-muted-foreground/25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="mt-4">
            <Button onClick={onButtonClick} variant="outline">
              Seleccionar archivo
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">O arrastra y suelta aquí</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta {maxSize}MB</p>
          </div>
        </div>
      )}
    </div>
  )
}
