import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { MotionProvider } from '@/components/shared/motion-provider'
import { PlaceholderFill } from '@/components/shared/placeholder-fill'
import { ChatWidget } from '@/components/chat/chat-widget'
import { SkipToMain } from '@/components/shared/skip-to-main'
import { CookieConsent } from '@/components/shared/cookie-consent'
import { getSession } from '@/lib/dal'
import { siteConfig } from '@/config/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ['electronics', 'fashion', 'beauty', 'toys', 'online store', 'US e-commerce'],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    // OG image is auto-generated via app/opengraph-image.tsx — no static file needed
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/opengraph-image'],
    creator: '@uniflexstore',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1520' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  // CRM staff share the same auth session shape but session.user.id is a
  // CrmStaff id, not a storefront User id — never hand that to the chat
  // widget, which persists threads via a FK to User.
  const userId = session?.user && session.user.userType !== 'crm' ? session.user.id : null

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col antialiased">
        {/* Claim manual scroll restoration before React hydrates so the browser
            never restores a saved position on top of Lenis. */}
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual'" }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <MotionProvider>
            <SkipToMain />
            {children}
            <PlaceholderFill />
            {/* Chat widget mounts here once and persists across all client-side navigation */}
            <ChatWidget userId={userId} />
            <CookieConsent />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
