export const metadata = {
  title: "Términos de Uso | PlanDeViajeAMedida",
  description: "Términos y condiciones de uso de PlanDeViajeAMedida",
}

export default function TerminosPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Términos de Uso</h1>
          <p className="text-lg text-muted-foreground">Última actualización: Enero 2024</p>
        </div>

        <div className="prose max-w-none">
          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar PlanDeViajeAMedida, usted acepta estar sujeto a estos términos de uso y a todas las
            leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, no debe utilizar este
            servicio.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            PlanDeViajeAMedida es una plataforma de software como servicio (SaaS) que permite a las agencias de viajes
            generar itinerarios personalizados utilizando inteligencia artificial. El servicio incluye:
          </p>
          <ul>
            <li>Generación automática de itinerarios de viaje</li>
            <li>Verificación de lugares y destinos</li>
            <li>Análisis de sentimiento de reseñas</li>
            <li>Integración con datos meteorológicos</li>
            <li>Exportación de itinerarios en formato PDF</li>
          </ul>

          <h2>3. Registro y Cuenta de Usuario</h2>
          <p>
            Para utilizar nuestros servicios, debe crear una cuenta proporcionando información precisa y completa. Usted
            es responsable de mantener la confidencialidad de su cuenta y contraseña, y de todas las actividades que
            ocurran bajo su cuenta.
          </p>

          <h2>4. Uso Aceptable</h2>
          <p>
            Usted se compromete a utilizar el servicio únicamente para fines legítimos y de acuerdo con estos términos.
            No debe:
          </p>
          <ul>
            <li>Utilizar el servicio para actividades ilegales o no autorizadas</li>
            <li>Intentar acceder a sistemas o datos no autorizados</li>
            <li>Interferir con el funcionamiento del servicio</li>
            <li>Compartir su cuenta con terceros no autorizados</li>
          </ul>

          <h2>5. Planes y Pagos</h2>
          <p>
            Los precios de nuestros planes están disponibles en nuestra página de precios. Los pagos se realizan
            mensualmente mediante transferencia bancaria. Nos reservamos el derecho de modificar los precios con un
            aviso previo de 30 días.
          </p>

          <h2>6. Propiedad Intelectual</h2>
          <p>
            El servicio y todo su contenido, características y funcionalidades son propiedad de PlanDeViajeAMedida y
            están protegidos por derechos de autor, marcas comerciales y otras leyes de propiedad intelectual.
          </p>

          <h2>7. Limitación de Responsabilidad</h2>
          <p>
            PlanDeViajeAMedida no será responsable de daños indirectos, incidentales, especiales o consecuentes que
            resulten del uso o la imposibilidad de usar el servicio.
          </p>

          <h2>8. Terminación</h2>
          <p>
            Podemos terminar o suspender su cuenta inmediatamente, sin previo aviso, por cualquier motivo, incluyendo el
            incumplimiento de estos términos.
          </p>

          <h2>9. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en
            vigor inmediatamente después de su publicación en el sitio web.
          </p>

          <h2>10. Ley Aplicable</h2>
          <p>
            Estos términos se regirán e interpretarán de acuerdo con las leyes de España, sin tener en cuenta sus
            disposiciones sobre conflictos de leyes.
          </p>

          <h2>11. Contacto</h2>
          <p>
            Si tiene preguntas sobre estos términos, puede contactarnos en:
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
