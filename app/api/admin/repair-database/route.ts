import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de base de datos incompleta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("🔧 Iniciando reparación de base de datos...")

    // 1. Verificar qué columnas existen
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "users")

    if (columnsError) {
      console.error("Error verificando columnas:", columnsError)
      return NextResponse.json({ error: "Error verificando estructura de tabla" }, { status: 500 })
    }

    const existingColumns = columns?.map((col) => col.column_name) || []
    console.log("📋 Columnas existentes en users:", existingColumns)

    const requiredColumns = ["itineraries_created_today", "last_reset_date", "last_itinerary_date"]
    const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col))

    console.log("❌ Columnas faltantes:", missingColumns)

    // 2. Agregar columnas faltantes una por una
    const results = []

    for (const column of missingColumns) {
      try {
        let sql = ""
        switch (column) {
          case "itineraries_created_today":
            sql = "ALTER TABLE users ADD COLUMN itineraries_created_today INTEGER DEFAULT 0"
            break
          case "last_reset_date":
            sql = "ALTER TABLE users ADD COLUMN last_reset_date DATE"
            break
          case "last_itinerary_date":
            sql = "ALTER TABLE users ADD COLUMN last_itinerary_date DATE"
            break
        }

        console.log(`🔧 Agregando columna ${column}...`)
        const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

        if (error) {
          console.error(`Error agregando columna ${column}:`, error)
          results.push({ column, status: "error", error: error.message })
        } else {
          console.log(`✅ Columna ${column} agregada exitosamente`)
          results.push({ column, status: "success" })
        }
      } catch (error) {
        console.error(`Error procesando columna ${column}:`, error)
        results.push({ column, status: "error", error: error instanceof Error ? error.message : "Error desconocido" })
      }
    }

    // 3. Inicializar valores para usuarios existentes
    if (missingColumns.includes("itineraries_created_today")) {
      try {
        console.log("🔧 Inicializando valores de contadores...")
        const { error: updateError } = await supabase
          .from("users")
          .update({
            itineraries_created_today: 0,
            last_reset_date: new Date().toISOString().split("T")[0],
          })
          .is("itineraries_created_today", null)

        if (updateError) {
          console.error("Error inicializando valores:", updateError)
          results.push({ column: "initialization", status: "error", error: updateError.message })
        } else {
          console.log("✅ Valores inicializados correctamente")
          results.push({ column: "initialization", status: "success" })
        }
      } catch (error) {
        console.error("Error en inicialización:", error)
        results.push({
          column: "initialization",
          status: "error",
          error: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    // 4. Verificar el estado final
    const { data: finalCheck, error: finalError } = await supabase
      .from("users")
      .select("id, itineraries_created_today, last_reset_date, last_itinerary_date")
      .limit(1)

    const repairSummary = {
      timestamp: new Date().toISOString(),
      missingColumns,
      results,
      finalCheck: finalError ? { error: finalError.message } : { success: true, sampleUser: finalCheck?.[0] },
      recommendations: [],
    }

    // Generar recomendaciones
    if (results.some((r) => r.status === "error")) {
      repairSummary.recommendations.push("❌ Algunas reparaciones fallaron - revisar logs y ejecutar manualmente")
    }
    if (missingColumns.length === 0) {
      repairSummary.recommendations.push("✅ No se encontraron problemas de estructura")
    }
    if (results.every((r) => r.status === "success")) {
      repairSummary.recommendations.push("✅ Todas las reparaciones completadas exitosamente")
    }

    return NextResponse.json(repairSummary)
  } catch (error) {
    console.error("Error en reparación de base de datos:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

// También permitir GET para verificar sin reparar
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de base de datos incompleta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar estructura actual
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_name", "users")

    if (columnsError) {
      return NextResponse.json({ error: "Error verificando estructura" }, { status: 500 })
    }

    const existingColumns = columns?.map((col) => col.column_name) || []
    const requiredColumns = ["itineraries_created_today", "last_reset_date", "last_itinerary_date"]
    const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col))

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      existingColumns,
      requiredColumns,
      missingColumns,
      needsRepair: missingColumns.length > 0,
      columnDetails: columns,
    })
  } catch (error) {
    console.error("Error verificando estructura:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
