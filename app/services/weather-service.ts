"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Tipos para la respuesta de la API
export type WeatherForecast = {
  date: string
  minTemp: number
  maxTemp: number
  condition: string
  chanceOfRain: number
  icon: string
}

export type LocationInfo = {
  name: string
  region: string
  country: string
  lat: number
  lon: number
  timezone: string
  localtime: string
}

export type WeatherData = {
  location: LocationInfo
  forecast: WeatherForecast[]
}

// Función para verificar y normalizar la ubicación
export async function verifyLocation(location: string): Promise<{
  verified: boolean
  normalizedLocation: string
  message: string
}> {
  try {
    const prompt = `
      Actúa como un experto en geografía y turismo. Necesito verificar y normalizar el siguiente destino turístico:
      
      "${location}"
      
      Por favor:
      1. Determina si este es un destino turístico real y conocido (ciudad, pueblo, región, etc.)
      2. Si es real, proporciona el nombre normalizado en formato "Ciudad, País" (o "Región, País" si es una región)
      3. Si no estás seguro o el destino parece ambiguo o no existe, indícalo
      
      Responde SOLO en formato JSON con esta estructura exacta:
      {
        "verified": true o false,
        "normalizedLocation": "Nombre normalizado en formato Ciudad, País",
        "message": "Breve explicación de tu decisión o información adicional relevante"
      }
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    })

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No se pudo extraer JSON de la respuesta")
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("Error verificando ubicación:", error)
    return {
      verified: false,
      normalizedLocation: location,
      message: "Error al verificar la ubicación. Por favor, intenta con un destino más específico.",
    }
  }
}

// Función para obtener el pronóstico del tiempo
export async function getWeatherForecast(location: string, days = 7): Promise<WeatherData | null> {
  try {
    // Verificar que tenemos una API key
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      console.warn("API key de OpenWeatherMap no configurada")
      throw new Error("Datos climáticos no disponibles. Contacte con el administrador para configurar la API key.")
    }

    console.log(`Obteniendo datos para: ${location}`)

    // Primero obtenemos las coordenadas de la ubicación
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}&lang=es`

    console.log(`Llamando a API de geolocalización: ${geoUrl.replace(apiKey, "API_KEY")}`)

    const geoResponse = await fetch(geoUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store", // Evitar caché
    })

    // Manejar error 401 específicamente
    if (geoResponse.status === 401) {
      console.error("Error de autenticación con la API de OpenWeatherMap (401 Unauthorized)")
      console.error("La API key proporcionada no es válida o ha expirado")
      throw new Error("Error de autenticación con la API del clima. Contacte con el administrador.")
    }

    if (!geoResponse.ok) {
      const errorText = await geoResponse.text()
      console.error(`Error en respuesta de geolocalización: ${geoResponse.status} ${geoResponse.statusText}`)
      console.error(`Cuerpo de respuesta: ${errorText}`)
      throw new Error("Error al obtener datos de geolocalización. Contacte con el administrador.")
    }

    const geoData = await geoResponse.json()
    console.log(`Respuesta de geolocalización:`, geoData)

    if (!geoData || geoData.length === 0) {
      console.warn(`No se encontró la ubicación: ${location}`)
      throw new Error(`No se encontró la ubicación: ${location}. Intente con un nombre más específico.`)
    }

    const { lat, lon, name, country, state } = geoData[0]

    // Ahora obtenemos el pronóstico con las coordenadas
    // Usamos la API de pronóstico de 5 días / 3 horas que está disponible en el plan gratuito
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=es`

    console.log(`Llamando a API de pronóstico: ${forecastUrl.replace(apiKey, "API_KEY")}`)

    const weatherResponse = await fetch(forecastUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store", // Evitar caché
    })

    // Manejar error 401 específicamente
    if (weatherResponse.status === 401) {
      console.error("Error de autenticación con la API de OpenWeatherMap (401 Unauthorized)")
      console.error("La API key proporcionada no es válida o ha expirado")
      throw new Error("Error de autenticación con la API del clima. Contacte con el administrador.")
    }

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text()
      console.error(`Error en respuesta de pronóstico: ${weatherResponse.status} ${weatherResponse.statusText}`)
      console.error(`Cuerpo de respuesta: ${errorText}`)
      throw new Error("Error al obtener datos del pronóstico. Contacte con el administrador.")
    }

    const weatherData = await weatherResponse.json()
    console.log(`Respuesta de pronóstico recibida con ${weatherData.list?.length || 0} entradas`)

    // Procesamos los datos de la API de pronóstico de 5 días / 3 horas
    const dailyForecast = processForecastData(weatherData, days)

    // Transformar los datos al formato que necesitamos
    const result: WeatherData = {
      location: {
        name: name,
        region: state || "",
        country: country,
        lat: lat,
        lon: lon,
        timezone: weatherData.city?.timezone || "",
        localtime: new Date().toISOString(),
      },
      forecast: dailyForecast,
    }

    return result
  } catch (error) {
    console.error("Error obteniendo pronóstico del tiempo:", error)
    // En caso de cualquier error, lanzar el error para que se maneje en el componente
    throw error
  }
}

// Función auxiliar para procesar los datos de pronóstico de OpenWeatherMap
function processForecastData(data: any, days: number): WeatherForecast[] {
  // La API de pronóstico de OpenWeatherMap devuelve datos cada 3 horas
  // Necesitamos agruparlos por día para obtener min/max y condiciones predominantes
  const dailyData: Record<string, any> = {}

  // Verificar que tenemos datos válidos
  if (!data.list || !Array.isArray(data.list) || data.list.length === 0) {
    console.error("Datos de pronóstico inválidos:", data)
    return []
  }

  // Procesar cada entrada de pronóstico
  data.list.forEach((item: any) => {
    // Convertir timestamp a fecha (YYYY-MM-DD)
    const date = new Date(item.dt * 1000).toISOString().split("T")[0]

    // Inicializar el objeto del día si no existe
    if (!dailyData[date]) {
      dailyData[date] = {
        temps: [],
        conditions: [],
        icons: [],
        rain: 0,
        rainCount: 0,
      }
    }

    // Añadir temperatura
    dailyData[date].temps.push(item.main.temp)

    // Añadir condición climática
    if (item.weather && item.weather[0]) {
      dailyData[date].conditions.push(item.weather[0].description)
      dailyData[date].icons.push(item.weather[0].icon)
    }

    // Añadir probabilidad de lluvia si existe
    if (item.pop !== undefined) {
      dailyData[date].rain += item.pop * 100 // Convertir a porcentaje
      dailyData[date].rainCount++
    }
  })

  // Convertir los datos agrupados en el formato que necesitamos
  const forecast: WeatherForecast[] = Object.keys(dailyData)
    .slice(0, days) // Limitar al número de días solicitado
    .map((date) => {
      const day = dailyData[date]

      // Calcular temperatura mínima y máxima
      const minTemp = Math.min(...day.temps)
      const maxTemp = Math.max(...day.temps)

      // Determinar la condición predominante (la que más se repite)
      const conditionCounts: Record<string, number> = {}
      day.conditions.forEach((condition: string) => {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1
      })

      let predominantCondition = day.conditions[0] || "desconocido"
      let maxCount = 0

      Object.entries(conditionCounts).forEach(([condition, count]) => {
        if (count > maxCount) {
          maxCount = count as number
          predominantCondition = condition
        }
      })

      // Calcular probabilidad media de lluvia
      const chanceOfRain = day.rainCount > 0 ? Math.round(day.rain / day.rainCount) : 0

      // Determinar el icono predominante
      const iconCounts: Record<string, number> = {}
      day.icons.forEach((icon: string) => {
        iconCounts[icon] = (iconCounts[icon] || 0) + 1
      })

      let predominantIcon = day.icons[0] || "01d" // Icono por defecto (cielo despejado)
      maxCount = 0

      Object.entries(iconCounts).forEach(([icon, count]) => {
        if (count > maxCount) {
          maxCount = count as number
          predominantIcon = icon
        }
      })

      return {
        date,
        minTemp: Math.round(minTemp * 10) / 10, // Redondear a 1 decimal
        maxTemp: Math.round(maxTemp * 10) / 10,
        condition: predominantCondition,
        chanceOfRain,
        icon: `https://openweathermap.org/img/wn/${predominantIcon}@2x.png`,
      }
    })

  return forecast
}
