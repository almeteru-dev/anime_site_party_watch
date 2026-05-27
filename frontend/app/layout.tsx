import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/contexts/language-context'
import { AuthProvider } from '@/contexts/auth-context'
import CookieConsent from '@/components/CookieConsent'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  applicationName: "LycorisLib",
  title: 'LycorisLib - Stream Your Favorite Anime',
  description: 'Discover and stream the best anime titles. Watch latest episodes, trending series, and top-rated anime all in one place.',
  keywords: ['anime', 'streaming', 'watch anime', 'anime catalog', 'latest episodes'],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#040D1F' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const enableVercelAnalytics = process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "1"

  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="ll_theme">
          <AuthProvider>
            <LanguageProvider>
              {children}
              <Toaster />
              <CookieConsent />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && enableVercelAnalytics && <Analytics />}
      </body>
    </html>
  )
}
