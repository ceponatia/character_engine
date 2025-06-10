import type { Metadata } from 'next'
import './globals.css'
import Header from './components/Header'
import Footer from './components/Footer'
import HamburgerMenu from './components/HamburgerMenu'

export const metadata: Metadata = {
  title: 'CharacterEngine AI',
  description: 'AI-powered character interaction framework',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-romantic-gradient text-slate-100 font-sans antialiased flex flex-col">
        <Header />
        <HamburgerMenu />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}