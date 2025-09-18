"use client"

import { useState, useEffect } from "react"
import { FileUpload } from "@/components/ui/file-upload"
import { Loader2 } from "lucide-react"

export default function LogoUploadSection() {
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  // Cargar logo actual
  useEffect(() => {
    loadCurrentLogo()
  }, [])

  const loadCurrentLogo = async () => {
    try {
      console.log("🔍 Cargando logo actual...")
      const response = await fetch("/api/auth/business-info")
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Datos empresariales:", data)
        setCurrentLogo(data.agency_logo_url || null)
        console.log("🖼️ Logo URL:", data.agency_logo_url || "No hay logo")
      }
    } catch (error) {
      console.error("❌ Error loading current logo:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    console.log("📤 Iniciando subida de archivo:", file.name)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("logo", file)

      const response = await fetch("/api/auth/upload-logo", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("📥 Respuesta del servidor:", data)

      if (response.ok) {
        setCurrentLogo(data.logoUrl)
        alert("Logo subido correctamente")
        console.log("✅ Logo subido exitosamente:", data.logoUrl)
      } else {
        alert(data.message || "Error al subir el logo")
        console.error("❌ Error del servidor:", data.message)
      }
    } catch (error) {
      console.error("💥 Error uploading logo:", error)
      alert("Error al subir el logo")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar el logo?")) {
      return
    }

    console.log("🗑️ Eliminando logo...")
    setUploading(true)

    try {
      const response = await fetch("/api/auth/remove-logo", {
        method: "DELETE",
      })

      if (response.ok) {
        setCurrentLogo(null)
        alert("Logo eliminado correctamente")
        console.log("✅ Logo eliminado exitosamente")
      } else {
        const error = await response.json()
        alert(error.message || "Error al eliminar el logo")
        console.error("❌ Error eliminando logo:", error.message)
      }
    } catch (error) {
      console.error("💥 Error removing logo:", error)
      alert("Error al eliminar el logo")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Logo de la Empresa</h3>
        <p className="text-sm text-muted-foreground">
          Sube el logo de tu empresa para incluirlo en los PDFs de itinerarios
        </p>
        {currentLogo && <p className="text-xs text-green-600 mt-1">✅ Logo actual: {currentLogo.split("/").pop()}</p>}
      </div>

      {uploading ? (
        <div className="flex items-center justify-center p-8 border rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Subiendo logo...</span>
        </div>
      ) : (
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="image/*"
          maxSize={5}
          currentFile={currentLogo || undefined}
          onRemove={currentLogo ? handleRemoveLogo : undefined}
        />
      )}
    </div>
  )
}
