import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 POST /api/auth/upload-logo - Iniciando subida...")

    // Verificar autenticación
    const sessionCookie = cookies().get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie)
    const supabase = createServerSupabaseClient()

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get("logo") as File

    if (!file) {
      return NextResponse.json({ message: "No se proporcionó archivo" }, { status: 400 })
    }

    console.log("📁 Archivo recibido:", file.name, "Tamaño:", file.size, "Tipo:", file.type)

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "El archivo debe ser una imagen" }, { status: 400 })
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "El archivo es demasiado grande (máximo 5MB)" }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split(".").pop()
    const fileName = `${session.id}/logo.${fileExtension}`

    console.log("📂 Nombre del archivo en storage:", fileName)

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("agency-assets")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true, // Sobrescribir si ya existe
      })

    if (uploadError) {
      console.error("❌ Error uploading to Supabase Storage:", uploadError)
      return NextResponse.json({ message: "Error al subir el archivo" }, { status: 500 })
    }

    console.log("✅ Archivo subido a Supabase Storage:", uploadData)

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage.from("agency-assets").getPublicUrl(fileName)

    const logoUrl = urlData.publicUrl
    console.log("🔗 URL pública generada:", logoUrl)

    // Actualizar la base de datos con la nueva URL
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({ agency_logo_url: logoUrl })
      .eq("id", session.id)
      .select("agency_logo_url")

    if (updateError) {
      console.error("❌ Error updating database:", updateError)
      return NextResponse.json({ message: "Error al actualizar la base de datos" }, { status: 500 })
    }

    console.log("✅ Base de datos actualizada:", updateData)

    return NextResponse.json({
      message: "Logo subido correctamente",
      logoUrl,
    })
  } catch (error) {
    console.error("💥 Error general en upload-logo:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
