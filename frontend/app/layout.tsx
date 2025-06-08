import type { Metadata } from 'next'
import './globals.css'
import './custom.css'

export const metadata: Metadata = {
  title: 'Chatbot Test',
  description: 'Emily-OS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  )
}