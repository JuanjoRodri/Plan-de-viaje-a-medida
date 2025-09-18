"use server"

import { getPlaceDetails } from "./google-places-service"
import { getCachedPlaceSentiment } from "./place-sentiment-analysis"
import type { JsonActivity } from "@/types/enhanced-database"

/**
 * Enriquece una actividad con información completa de Google Places y análisis de sentimiento
 */
export async function enrichActivity(baseActivity: JsonActivity, destinationName: string): Promise<JsonActivity> {
  try {
    // Si no tiene placeId, no podemos enriquecer
    if (!baseActivity.location?.placeId) {
      console.log("⚠️ Actividad sin placeId, no se puede enriquecer")
      return baseActivity
    }

    console.log(`🔍 Enriqueciendo actividad: ${baseActivity.title}`)

    // 1. Obtener detalles completos del lugar
    const placeDetails = await getPlaceDetails(baseActivity.location.placeId)

    if (!placeDetails) {
      console.log("❌ No se pudieron obtener detalles del lugar")
      return baseActivity
    }

    // 2. Obtener análisis de sentimiento
    const sentiment = await getCachedPlaceSentiment(baseActivity.location.placeId)

    // 3. Crear la actividad enriquecida
    const enrichedActivity: JsonActivity = {
      ...baseActivity,
      location: {
        ...baseActivity.location,
        // Información básica
        name: placeDetails.name || baseActivity.location.name,
        address: placeDetails.formatted_address || baseActivity.location.address,
        coordinates: placeDetails.geometry?.location || baseActivity.location.coordinates,

        // Información enriquecida de Google Places
        phoneNumber: placeDetails.formatted_phone_number,
        website: placeDetails.website,
        userRating: placeDetails.rating,
        userRatingsTotal: placeDetails.user_ratings_total,
        priceLevel: placeDetails.price_level,
        openingHours: placeDetails.opening_hours?.weekday_text?.join("; "),

        // URLs útiles
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${baseActivity.location.placeId}`,

        // Estado de verificación
        verified: true,
        verificationSource: "google_places",
      },

      // Análisis de sentimiento
      sentiment: {
        score: sentiment.score,
        label: sentiment.score >= 4 ? "positive" : sentiment.score >= 2.5 ? "neutral" : "negative",
        summary: sentiment.summary,
        keywords: sentiment.keywords,
        confidence: sentiment.confidence,
      },

      // Estimación de duración basada en el tipo de actividad
      durationMinutes: estimateActivityDuration(baseActivity.type, placeDetails),

      // Mejorar estimación de precio si no la tiene
      priceEstimate: baseActivity.priceEstimate || estimatePrice(baseActivity.type, placeDetails),
    }

    console.log("✅ Actividad enriquecida exitosamente")
    return enrichedActivity
  } catch (error) {
    console.error("❌ Error enriqueciendo actividad:", error)
    return baseActivity // Devolver la actividad original si hay error
  }
}

/**
 * Estima la duración de una actividad basada en su tipo y detalles del lugar
 */
function estimateActivityDuration(type: JsonActivity["type"], placeDetails: any): number {
  // Duraciones base por tipo (en minutos)
  const baseDurations = {
    sightseeing: 120,
    meal: 90,
    transport: 30,
    accommodation: 0, // No aplica
    event: 180,
    free_time: 60,
    custom: 90,
  }

  let duration = baseDurations[type] || 90

  // Ajustar según el tipo de lugar de Google
  if (placeDetails.types) {
    if (placeDetails.types.includes("museum")) duration = 150
    if (placeDetails.types.includes("park")) duration = 120
    if (placeDetails.types.includes("restaurant")) duration = 90
    if (placeDetails.types.includes("tourist_attraction")) duration = 120
    if (placeDetails.types.includes("shopping_mall")) duration = 180
  }

  return duration
}

/**
 * Estima el precio de una actividad basada en su tipo y detalles del lugar
 */
function estimatePrice(type: JsonActivity["type"], placeDetails: any) {
  // Si Google Places tiene información de precio, usarla
  if (placeDetails.price_level) {
    const priceRanges = {
      1: { min: 5, max: 15 }, // Económico
      2: { min: 15, max: 30 }, // Moderado
      3: { min: 30, max: 60 }, // Caro
      4: { min: 60, max: 100 }, // Muy caro
    }

    const range = priceRanges[placeDetails.price_level as keyof typeof priceRanges]
    if (range) {
      return {
        amount: (range.min + range.max) / 2,
        currency: "EUR" as const,
        perPerson: true,
      }
    }
  }

  // Estimaciones por defecto según el tipo
  const defaultPrices = {
    sightseeing: 15,
    meal: 25,
    transport: 10,
    accommodation: 80,
    event: 30,
    free_time: 0,
    custom: 20,
  }

  const amount = defaultPrices[type] || 20

  return amount > 0
    ? {
        amount,
        currency: "EUR" as const,
        perPerson: true,
      }
    : undefined
}
