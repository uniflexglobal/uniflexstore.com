// Minimal CSV parser — no external dependency. Handles quoted fields
// (commas and escaped "" inside quotes) but not multi-line quoted cells,
// which covers the vast majority of real-world exported contact lists.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++
      row.push(field)
      field = ''
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((c) => c.trim() !== '')) rows.push(row)
  }

  return rows
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'full name', 'contact', 'contact name'],
  phone: ['phone', 'phone number', 'mobile', 'cell', 'telephone'],
  email: ['email', 'e-mail', 'email address'],
  truckType: ['truck type', 'trucktype', 'equipment', 'equipment type'],
  route: ['route', 'lane', 'preferred route', 'lanes'],
}

export interface ParsedCsvRow {
  name: string
  phone: string
  email?: string
  truckType?: string
  route?: string
}

export interface ParseCsvResult {
  rows: ParsedCsvRow[]
  skipped: number
  headers: string[]
  missingColumns: string[]
}

/** Maps raw spreadsheet rows (first row = headers) to prospect fields by header name. */
export function mapRowsToProspects(raw: string[][]): ParseCsvResult {
  if (raw.length === 0) return { rows: [], skipped: 0, headers: [], missingColumns: ['name', 'phone'] }

  const headers = raw[0].map((h) => h.trim().toLowerCase())
  const colIndex: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {}

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = headers.findIndex((h) => aliases.includes(h))
    if (idx !== -1) colIndex[field as keyof typeof HEADER_ALIASES] = idx
  }

  const missingColumns = ['name', 'phone'].filter((f) => colIndex[f as keyof typeof HEADER_ALIASES] === undefined)
  if (missingColumns.length > 0) {
    return { rows: [], skipped: 0, headers, missingColumns }
  }

  const rows: ParsedCsvRow[] = []
  let skipped = 0

  for (const cells of raw.slice(1)) {
    const name = cells[colIndex.name!]?.trim()
    const phone = cells[colIndex.phone!]?.trim()
    if (!name || !phone) {
      skipped++
      continue
    }
    rows.push({
      name,
      phone,
      email: colIndex.email !== undefined ? cells[colIndex.email]?.trim() || undefined : undefined,
      truckType: colIndex.truckType !== undefined ? cells[colIndex.truckType]?.trim() || undefined : undefined,
      route: colIndex.route !== undefined ? cells[colIndex.route]?.trim() || undefined : undefined,
    })
  }

  return { rows, skipped, headers, missingColumns: [] }
}

export function parseProspectCsv(text: string): ParseCsvResult {
  return mapRowsToProspects(parseCsv(text))
}
