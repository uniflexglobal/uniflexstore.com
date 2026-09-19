import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/config/site'
import { NewsletterForm } from '@/components/shared/newsletter-form'

const footerLinks = {
  Shop: [
    { label: 'Electronics', href: '/categories/electronics' },
    { label: 'Fashion', href: '/categories/fashion' },
    { label: 'Beauty', href: '/categories/beauty' },
    { label: 'Toys', href: '/categories/toys' },
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Deals', href: '/deals' },
  ],
  Help: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Shipping & Returns', href: '/shipping' },
    { label: 'Order Tracking', href: '/orders' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'Store Locator', href: '/stores' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Affiliate Program', href: '/affiliates' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Accessibility', href: '/accessibility' },
  ],
}

// Inline SVG icons avoid the missing lucide social brand icons
const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/uniflexstore',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'X (Twitter)',
    href: 'https://twitter.com/uniflexstore',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/uniflexstore',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/uniflexstore',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
      {/* Newsletter strip */}
      <div className="border-b border-[var(--border-strong)] bg-[var(--brand-primary)] dark:border-[var(--border-strong)]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div>
            <p className="font-serif text-lg font-500 text-white">
              Get 10% off your first order
            </p>
            <p className="mt-0.5 text-sm text-white/60">
              Join our community. Unsubscribe anytime.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link href="/" aria-label="UniFlex Global home">
              <span className="inline-flex h-10 items-center rounded-xl bg-white px-2 shadow-sm transition-opacity hover:opacity-90">
                <Image
                  src="/logo.png"
                  alt="UniFlex Global"
                  width={110}
                  height={34}
                  className="h-8 w-auto object-contain"
                />
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
              Electronics, fashion, beauty, and toys — sourced from authorized resellers
              and shipped across the US.
            </p>

            {/* Social links */}
            <nav aria-label="Social media links" className="mt-5">
              <ul className="flex items-center gap-3" role="list">
                {socialLinks.map(({ href, label, icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] transition-all duration-150 hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)]"
                    >
                      {icon}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <nav key={title} aria-label={`${title} links`}>
              <h3 className="text-sm font-600 text-[var(--text-secondary)]">
                {title}
              </h3>
              <ul className="mt-3 space-y-2.5" role="list">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border-subtle)]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-[var(--text-muted)] sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.{' '}
            <span aria-hidden="true">·</span>{' '}
            <a
              href="https://nuvforge.com"
              className="underline-offset-2 transition-colors duration-150 hover:text-[var(--text-primary)] hover:underline"
            >
              Built by Nuvforge
            </a>
          </p>
          <p className="flex items-center gap-2">
            <span><span aria-hidden="true">🇺🇸</span> United States</span>
            <span aria-hidden="true">·</span>
            <span>USD ($)</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
