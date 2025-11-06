import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyDock - App d\'Estudi per a Oposicions',
  description: 'Gestiona els teus apunts i tests d\'estudi amb format automàtic i audiollibre',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  )
}
