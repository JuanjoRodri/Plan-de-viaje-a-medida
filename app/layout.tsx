import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { CookieBanner } from "@/components/cookie-banner"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Si tuvieras otros iconos en public, los enlazarías aquí */}
       <link rel="icon" href="https://i.ibb.co/RTyhgvpf/7db4fe6b-0033-4fc0-b9cf-64969aa334f0-removebg-preview.png" sizes="any" />
        {/* <link rel="apple-touch-icon" href="/images/apple-icon.png" /> */}

        {/* Google Analytics con consentimiento */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Configuración inicial sin consentimiento
            gtag('consent', 'default', {
              'analytics_storage': 'denied'
            });
            
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <main className="min-h-screen bg-background">{children}</main>
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
