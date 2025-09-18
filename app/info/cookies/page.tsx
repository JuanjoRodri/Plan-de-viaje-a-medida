export const metadata = {
  title: "Política de Cookies | PlanDeViajeAMedida",
  description: "Información sobre el uso de cookies en PlanDeViajeAMedida",
}

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Política de Cookies</h1>
          <p className="text-lg text-muted-foreground">Última actualización: Enero 2024</p>
        </div>

        <div className="prose max-w-none">
          <h2>¿Qué son las Cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web.
            Nos ayudan a hacer que el sitio web funcione, mejorar su experiencia y proporcionarnos información sobre
            cómo utiliza nuestro sitio.
          </p>

          <h2>Tipos de Cookies que Utilizamos</h2>

          <h3>Cookies Esenciales</h3>
          <p>
            Estas cookies son necesarias para que el sitio web funcione correctamente. No se pueden desactivar en
            nuestros sistemas.
          </p>
          <ul>
            <li>Cookies de sesión para mantener su sesión activa</li>
            <li>Cookies de autenticación para verificar su identidad</li>
            <li>Cookies de seguridad para proteger contra ataques</li>
          </ul>

          <h3>Cookies de Rendimiento</h3>
          <p>
            Estas cookies nos permiten contar las visitas y fuentes de tráfico para medir y mejorar el rendimiento de
            nuestro sitio.
          </p>
          <ul>
            <li>Google Analytics para análisis de uso</li>
            <li>Cookies de velocidad de carga</li>
            <li>Cookies de monitoreo de errores</li>
          </ul>

          <h3>Cookies Funcionales</h3>
          <p>Estas cookies permiten que el sitio web proporcione funcionalidad y personalización mejoradas.</p>
          <ul>
            <li>Preferencias de idioma</li>
            <li>Configuraciones de interfaz</li>
            <li>Recordar información del formulario</li>
          </ul>

          <h2>Cookies de Terceros</h2>
          <p>Algunos de nuestros socios pueden establecer cookies en su dispositivo cuando utiliza nuestro sitio:</p>
          <ul>
            <li>
              <strong>Google Analytics:</strong> Para análisis de tráfico web
            </li>
            <li>
              <strong>Google Maps:</strong> Para mostrar mapas interactivos
            </li>
            <li>
              <strong>Vercel:</strong> Para hosting y análisis de rendimiento
            </li>
          </ul>

          <h2>Gestión de Cookies</h2>
          <p>
            Puede controlar y/o eliminar las cookies como desee. Puede eliminar todas las cookies que ya están en su
            dispositivo y configurar la mayoría de los navegadores para evitar que se coloquen.
          </p>

          <h3>Configuración del Navegador</h3>
          <ul>
            <li>
              <strong>Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies
            </li>
            <li>
              <strong>Firefox:</strong> Opciones &gt; Privacidad y seguridad &gt; Cookies
            </li>
            <li>
              <strong>Safari:</strong> Preferencias &gt; Privacidad &gt; Cookies
            </li>
            <li>
              <strong>Edge:</strong> Configuración &gt; Privacidad &gt; Cookies
            </li>
          </ul>

          <h2>Consecuencias de Desactivar Cookies</h2>
          <p>Si desactiva las cookies, algunas funciones de nuestro sitio web pueden no funcionar correctamente:</p>
          <ul>
            <li>Puede que tenga que iniciar sesión repetidamente</li>
            <li>Sus preferencias pueden no guardarse</li>
            <li>Algunas funciones personalizadas pueden no estar disponibles</li>
          </ul>

          <h2>Duración de las Cookies</h2>
          <p>Utilizamos tanto cookies de sesión como persistentes:</p>
          <ul>
            <li>
              <strong>Cookies de sesión:</strong> Se eliminan cuando cierra su navegador
            </li>
            <li>
              <strong>Cookies persistentes:</strong> Permanecen en su dispositivo durante un período específico o hasta
              que las elimine manualmente
            </li>
          </ul>

          <h2>Actualizaciones de esta Política</h2>
          <p>
            Podemos actualizar esta política de cookies ocasionalmente para reflejar cambios en las cookies que
            utilizamos o por otras razones operativas, legales o reglamentarias.
          </p>

          <h2>Contacto</h2>
          <p>
            Si tiene preguntas sobre nuestra política de cookies, puede contactarnos en:
            <br />
            Email: info@plandeviajeamedida.com
            <br />
            Dirección: Valencia, España
          </p>
        </div>
      </div>
    </div>
  )
}
