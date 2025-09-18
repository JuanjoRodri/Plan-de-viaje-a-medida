import { z } from "zod"

export const TravelFormSchema = z.object({
  destination: z.string().min(2, {
    message: "El destino debe tener al menos 2 caracteres.",
  }),
  days: z.string().min(1, {
    message: "Debes especificar el número de días.",
  }),
  nights: z.string().min(1, {
    message: "Debes especificar el número de noches.",
  }),
  hotel: z.string().min(2, {
    message: "El alojamiento debe tener al menos 2 caracteres.",
  }),
  boardType: z.enum(["sin-pension", "solo-desayuno", "media-pension", "pension-completa"], {
    required_error: "Debes seleccionar un tipo de pensión.",
  }),
  preferences: z.string().optional(),
  arrivalDate: z
    .date({
      required_error: "Debes seleccionar una fecha de llegada.",
    })
    .optional(),
  arrivalTime: z.string().min(1, {
    message: "Debes especificar la hora de llegada.",
  }),
  departureTime: z.string().min(1, {
    message: "Debes especificar la hora de salida.",
  }),
  travelers: z.string().min(1, {
    message: "Debes especificar el número de viajeros.",
  }),
  budget: z.enum(["bajo", "medio", "alto", "personalizado"], {
    required_error: "Debes seleccionar un tipo de presupuesto.",
  }),
  customBudget: z.string().optional(),
  transportModes: z
    .array(z.enum(["walking", "driving", "transit", "bicycling"]), {
      required_error: "Debes seleccionar al menos un modo de transporte.",
    })
    .nonempty({
      message: "Selecciona al menos un modo de transporte.",
    }),
  maxDistance: z.string().min(1, {
    message: "Debes especificar la distancia máxima.",
  }),
  age: z.string().min(1, {
    message: "Debes especificar el rango de edad.",
  }),
  // Nuevo campo para el tipo de viaje (opcional)
  tripType: z
    .enum(["familiar", "romántico", "aventura", "cultural", "relax", "gastronómico", "compras", "negocios"], {
      required_error: "Selecciona un tipo de viaje válido.",
    })
    .optional(),
})

// Exportamos también con nombre en minúscula para compatibilidad
export const travelFormSchema = TravelFormSchema

// Exportamos el tipo derivado del schema
export type TravelFormValues = z.infer<typeof TravelFormSchema>
