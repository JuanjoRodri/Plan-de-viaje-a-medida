# Plan de Viaje a Medida

Una aplicación web moderna que utiliza inteligencia artificial para generar itinerarios de viaje personalizados basados en las preferencias del usuario.

## Características

- Interfaz de usuario moderna y responsiva construida con Next.js y Bootstrap 5
- Integración con GPT-4.1-nano para generar itinerarios personalizados
- Formulario intuitivo para recopilar preferencias de viaje
- Generación de itinerarios detallados día por día
- Recomendaciones adaptadas a la ubicación, duración y preferencias

## Tecnologías utilizadas

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Server Actions
- **IA**: OpenAI GPT-4o mediante AI SDK
- **Estilos**: Tailwind CSS con efectos personalizados

## Instalación

1. Clona este repositorio:
\`\`\`bash
git clone https://github.com/tu-usuario/plan-de-viaje-a-medida.git
cd plan-de-viaje-a-medida
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Crea un archivo `.env.local` con tu clave de API de OpenAI:


4. Inicia el servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

1. Completa el formulario con los detalles de tu viaje:
   - Destino
   - Número de días
   - Hotel o dirección de alojamiento
   - Edad
   - Preferencias de actividades

2. Haz clic en "Generar itinerario"

3. Revisa el itinerario personalizado generado por la IA

## Personalización

Puedes personalizar los colores principales de la aplicación modificando las variables CSS en `app/globals.css`:

\`\`\`css
:root {
  --primary: 210 100% 35%;
  --secondary: 25 95% 53%;
  /* Otras variables... */
}
\`\`\`

## Desarrollado por

JJ Rodriguez Studio

## Licencia

MIT
