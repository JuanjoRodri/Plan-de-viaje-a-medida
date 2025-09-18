"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import SentimentAnalysis from "./sentiment-analysis"

export default function PlaceSentimentAnalyzer() {
  const [placeName, setPlaceName] = useState("")
  const [location, setLocation] = useState("")
  const [searchedPlace, setSearchedPlace] = useState<{ name: string; location: string } | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (placeName && location) {
      setSearchedPlace({ name: placeName, location })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analizador de Opiniones</CardTitle>
        <CardDescription>
          Analiza el sentimiento de las reseñas para cualquier lugar turístico, restaurante o atracción
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="place-name">Nombre del lugar</Label>
              <Input
                id="place-name"
                placeholder="Ej: Restaurante El Mirador"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Ej: Barcelona, España"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Buscar lugar
          </Button>
        </form>

        {searchedPlace && <SentimentAnalysis placeName={searchedPlace.name} location={searchedPlace.location} />}
      </CardContent>
    </Card>
  )
}
