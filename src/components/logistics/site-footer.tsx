import Link from 'next/link'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { logisticsConfig } from '@/config/logistics'

export function SiteFooter() {
  const { address } = logisticsConfig

  return (
    <footer className="border-t border-white/10 bg-[#060d15]">
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link href="/logistics" className="flex items-baseline gap-1.5">
              <span className="font-sans text-xl font-800 tracking-tight text-white">Uniflex</span>
              <span className="font-sans text-xl font-300 tracking-tight text-[#29c4d9]">Logistics</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Truck dispatch for owner-operators and small fleets who&apos;d rather drive than
              chase brokers. We find the freight, book the rate, handle the paperwork.
            </p>
          </div>

          <div>
            <p className="text-xs font-700 uppercase tracking-[0.1em] text-white/40">Contact</p>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li>
                <a
                  href={`tel:${logisticsConfig.phone.replace(/[^+\d]/g, '')}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[#29c4d9]" strokeWidth={2} aria-hidden="true" />
                  {logisticsConfig.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${logisticsConfig.email}`}
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0 text-[#29c4d9]" strokeWidth={2} aria-hidden="true" />
                  {logisticsConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#29c4d9]" strokeWidth={2} aria-hidden="true" />
                <span>
                  {address.line1}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-[#29c4d9]" strokeWidth={2} aria-hidden="true" />
                {logisticsConfig.hours}
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-700 uppercase tracking-[0.1em] text-white/40">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li>
                <a href="#services" className="transition-colors hover:text-white">Services</a>
              </li>
              <li>
                <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
              </li>
              <li>
                <a href="#why-us" className="transition-colors hover:text-white">Why us</a>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Uniflex Global Store ↗
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {logisticsConfig.legalName}. {logisticsConfig.companyName}{' '}
            is a trade name of {logisticsConfig.legalName}. All rights reserved.{' '}
            <span aria-hidden="true">·</span>{' '}
            <a
              href="https://nuvforge.com"
              className="underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Website by Nuvforge
            </a>
          </p>
          <p>{logisticsConfig.serviceArea}</p>
        </div>
      </div>
    </footer>
  )
}
