'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { bulkImportProspects } from '@/server/actions/crm/prospects'
import { mapRowsToProspects, type ParsedCsvRow, parseCsv } from '@/lib/csv'

type Caller = { id: string; name: string }

interface ImportProspectsFormProps {
  isAdmin: boolean
  callers: Caller[]
  selfId: string
}

export function ImportProspectsForm({ isAdmin, callers, selfId }: ImportProspectsFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ParsedCsvRow[]>([])
  const [skipped, setSkipped] = useState(0)
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  const [assignedToId, setAssignedToId] = useState('')
  const [parsing, setParsing] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleFile(file: File) {
    setParsing(true)
    setFileName(file.name)
    setRows([])
    setMissingColumns([])

    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let raw: string[][]

      if (ext === 'xlsx' || ext === 'xls') {
        // Parsed entirely client-side — the raw file never touches the server,
        // only the validated {name, phone, email…} strings extracted here do.
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        raw = (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]).map((r) =>
          r.map((c) => (c == null ? '' : String(c)))
        )
      } else {
        const text = await file.text()
        raw = parseCsv(text)
      }

      const result = mapRowsToProspects(raw)
      setRows(result.rows)
      setSkipped(result.skipped)
      setMissingColumns(result.missingColumns)
    } catch {
      toast.error('Could not read that file. Make sure it\'s a valid CSV or Excel file.')
    } finally {
      setParsing(false)
    }
  }

  function submit() {
    const finalAssignedToId = isAdmin ? assignedToId : selfId
    if (!finalAssignedToId) {
      toast.error('Choose which caller to assign this list to')
      return
    }

    startTransition(async () => {
      const result = await bulkImportProspects({
        rows,
        assignedToId: finalAssignedToId,
        importBatch: `${fileName} — ${new Date().toLocaleString('en-US')}`,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success(`Imported ${result.count} prospects`)
        router.push('/crm/prospects')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-base)] p-8 text-center">
        <FileUp className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Upload a CSV or Excel file with at least a <strong>name</strong> and <strong>phone</strong> column.
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Also recognized: email, truck type, route.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <Button type="button" variant="outline" className="mt-4" onClick={() => fileRef.current?.click()} loading={parsing}>
          Choose file
        </Button>
        {fileName && <p className="mt-2 text-xs text-[var(--text-muted)]">{fileName}</p>}
      </div>

      {missingColumns.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Couldn&apos;t find a column for: {missingColumns.join(', ')}. Check your file has header names like
          &quot;Name&quot; and &quot;Phone&quot;.
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--border-default)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Truck type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{r.name}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{r.phone}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{r.email ?? '—'}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{r.truckType ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {rows.length} ready to import{rows.length > 5 ? ` (showing first 5)` : ''}
            {skipped > 0 ? ` · ${skipped} row${skipped === 1 ? '' : 's'} skipped (missing name or phone)` : ''}
          </p>

          {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="import-assign">Assign this list to</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger id="import-assign">
                  <SelectValue placeholder="Select a caller" />
                </SelectTrigger>
                <SelectContent>
                  {callers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="button" onClick={submit} loading={pending} disabled={rows.length === 0}>
            Import {rows.length} prospects
          </Button>
        </>
      )}
    </div>
  )
}
