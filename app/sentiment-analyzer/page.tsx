import PlaceSentimentAnalyzer from "@/components/place-sentiment-analyzer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SentimentAnalyzerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary mb-2">Analizador de Sentimiento</h1>
        <p className="text-muted-foreground">
          Utiliza inteligencia artificial para analizar las opiniones sobre lugares turísticos, restaurantes y
          atracciones. Esta herramienta te ayuda a tomar mejores decisiones para tus itinerarios.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <PlaceSentimentAnalyzer />

        <div className="bg-muted/30 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">¿Cómo funciona?</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-2 rounded-full text-primary">1</div>
              <div>
                <h3 className="font-medium">Busca un lugar</h3>
                <p className="text-sm text-muted-foreground">
                  Introduce el nombre del lugar y su ubicación para comenzar el análisis.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-2 rounded-full text-primary">2</div>
              <div>
                <h3 className="font-medium">Recopilación de reseñas</h3>
                <p className="text-sm text-muted-foreground">
                  El sistema recopila reseñas recientes sobre el lugar de diversas fuentes.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-2 rounded-full text-primary">3</div>
              <div>
                <h3 className="font-medium">Análisis de sentimiento</h3>
                <p className="text-sm text-muted-foreground">
                  La IA analiza el tono, las palabras clave y el contexto de las reseñas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-2 rounded-full text-primary">4</div>
              <div>
                <h3 className="font-medium">Resultados y recomendación</h3>
                <p className="text-sm text-muted-foreground">
                  Obtienes un resumen del sentimiento general y una recomendación clara.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
