/**
 * upload-alameda.mjs
 *
 * Uploads Alameda building permits from CSV into Supabase.
 *
 * Usage:
 *   node upload-alameda.mjs --test      ← parse + preview only, no upload
 *   node upload-alameda.mjs --sample    ← upload first 10 rows only
 *   node upload-alameda.mjs             ← upload all rows
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync }  from 'fs'

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL   = 'https://dmataerylfryldrpuicg.supabase.co'
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXRhZXJ5bGZyeWxkcnB1aWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTQ3NTIsImV4cCI6MjA5NDI3MDc1Mn0.9FDnQs6JgIuAYK97okuaRRh60PJy64Db5AEPsZOYgNA'
const ALAMEDA_UUID   = 'b8c5d2e1-f3a4-4b7c-9e0d-5f6a7b8c9d0e'
const CSV_PATH       = 'C:\\Users\\kenml\\permittrack\\Data Files\\Alameda Building Permits 1.1.14-5.18.26.csv'
const BATCH_SIZE     = 500

const TEST_ONLY   = process.argv.includes('--test')
const SAMPLE_ONLY = process.argv.includes('--sample')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const values  = []
  let current   = ''
  let inQuotes  = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }  // escaped quote
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  values.push(current)
  return values
}

function parseCSV(text) {
  const lines   = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''))
  const rows    = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const vals = parseCSVLine(line)
    const row  = {}
    headers.forEach((h, idx) => { row[h] = (vals[idx] ?? '').trim() })
    rows.push(row)
  }
  return rows
}

// ── Date conversion ───────────────────────────────────────────────────────────
// Input:  MM/DD/YYYY  →  Output: YYYY-MM-DD

function parseDate(s) {
  if (!s?.trim()) return null
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('━'.repeat(70))
console.log('  Alameda Permit Uploader')
console.log('━'.repeat(70))
console.log()

// 1. Read + parse CSV
console.log('📂  Reading CSV...')
const csvText = readFileSync(CSV_PATH, 'utf-8')
const rawRows = parseCSV(csvText)
console.log(`    ${rawRows.length} raw rows parsed\n`)

// 2. Map to Supabase schema
const permits        = []
const skippedNoNum   = []
const skippedBadDate = []

for (const r of rawRows) {
  const permitNumber = r['Permit Number']?.trim()
  if (!permitNumber) { skippedNoNum.push(r); continue }

  const appliedDate = parseDate(r['Date'])
  if (r['Date']?.trim() && !appliedDate) skippedBadDate.push(r)

  // "Project Name" is the closest thing to an address in Alameda's export.
  // Fall back to Description if blank.
  const address = r['Project Name']?.trim() || r['Description']?.trim() || ''

  permits.push({
    permit_number:  permitNumber,
    address,
    applied_date:   appliedDate,
    issued_date:    null,
    finalized_date: null,
    city_id:        ALAMEDA_UUID,
    status:         r['Status']?.trim()      || null,
    description:    r['Description']?.trim() || null,
    // permit_type included; if column doesn't exist Supabase will return a clear error
    permit_type:    r['Permit Type']?.trim() || null,
  })
}

console.log('📋  Row summary:')
console.log(`    ✅  Valid rows:              ${permits.length}`)
console.log(`    ⚠   Skipped (no permit #):  ${skippedNoNum.length}`)
console.log(`    ⚠   Unparseable dates:       ${skippedBadDate.length}`)
if (skippedBadDate.length > 0) {
  skippedBadDate.slice(0, 3).forEach(r =>
    console.log(`         → "${r['Date']}" for ${r['Permit Number']}`)
  )
}

// 3. Status breakdown
const statusCounts = {}
for (const p of permits) {
  const s = p.status || '(blank)'
  statusCounts[s] = (statusCounts[s] || 0) + 1
}
console.log('\n📊  Status breakdown:')
Object.entries(statusCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, n]) => console.log(`    ${String(n).padStart(5)}  ${s}`))

// 4. Preview
console.log('\n📄  First 10 rows preview:')
console.log('─'.repeat(80))
console.log('  PERMIT #           STATUS      DATE        ADDRESS')
console.log('─'.repeat(80))
for (const p of permits.slice(0, 10)) {
  const num  = (p.permit_number || '').padEnd(18)
  const st   = (p.status || 'n/a').padEnd(10)
  const dt   = (p.applied_date || 'no-date  ')
  const addr = (p.address || '').slice(0, 30)
  console.log(`  ${num} ${st} ${dt}  ${addr}`)
}
console.log('─'.repeat(80))

if (TEST_ONLY) {
  console.log('\n✅  --test mode: parse complete. No data uploaded.')
  console.log('    Re-run without --test to upload all rows.')
  console.log('    Re-run with --sample to test-upload 10 rows.\n')
  process.exit(0)
}

// 5. Upload
let toUpload = SAMPLE_ONLY ? permits.slice(0, 10) : permits
const label  = SAMPLE_ONLY ? `first 10 (sample)` : `all ${permits.length}`

console.log(`\n🚀  Uploading ${label}...`)
console.log(`    Batch size: ${BATCH_SIZE}  |  Conflict strategy: ignoreDuplicates on permit_number\n`)

let uploaded   = 0
let duplicates = 0
let errored    = 0
const errors   = []

// Pre-check: find any Alameda permits already in DB so we can skip them
console.log('🔍  Checking for existing Alameda permits in Supabase...')
const { data: existingData, error: existingErr } = await supabase
  .from('permits')
  .select('permit_number')
  .eq('city_id', ALAMEDA_UUID)
  .limit(10000)

if (existingErr) {
  console.log(`    ⚠  Could not check existing records: ${existingErr.message}`)
  console.log('    Proceeding with full insert (may get duplicate errors for any re-runs).\n')
} else {
  const existingNums = new Set((existingData || []).map(r => r.permit_number))
  const before = toUpload.length
  toUpload = toUpload.filter(p => !existingNums.has(p.permit_number))
  duplicates = before - toUpload.length
  console.log(`    Already in DB: ${duplicates}  |  New to insert: ${toUpload.length}\n`)
}

if (toUpload.length === 0) {
  console.log('  ✅  Nothing to upload — all permits already exist in Supabase.\n')
  process.exit(0)
}

// Detect whether permit_type column exists by probing one row
let includePermitType = true
{
  const probe = [{ ...toUpload[0] }]
  const { error: probeErr } = await supabase.from('permits').insert(probe)
  if (probeErr) {
    if (probeErr.message.includes('permit_type') || probeErr.code === '42703') {
      console.log('    ℹ  permit_type column not found in table — will omit it from all rows.')
      includePermitType = false
    } else if (probeErr.message.toLowerCase().includes('duplicate') ||
               probeErr.message.includes('unique') ||
               probeErr.code === '23505') {
      // Duplicate on first row — already exists, strip it from toUpload
      toUpload = toUpload.slice(1)
      console.log('    ℹ  First row already exists — skipped in main loop.')
    } else {
      console.error(`\n  ❌  Probe insert failed: ${probeErr.message}`)
      console.error('  This may be an RLS (Row Level Security) issue.')
      console.error('  Ask your Supabase admin to grant INSERT for the anon role on the permits table,')
      console.error('  or use the Supabase dashboard CSV import instead.')
      process.exit(1)
    }
  } else {
    // Probe succeeded — that row is now in the DB, remove it from the remaining list
    toUpload = toUpload.slice(1)
    uploaded += 1
  }
}

for (let i = 0; i < toUpload.length; i += BATCH_SIZE) {
  const batchRaw   = toUpload.slice(i, i + BATCH_SIZE)
  const batch      = includePermitType ? batchRaw : batchRaw.map(({ permit_type, ...rest }) => rest)
  const batchNum   = Math.floor(i / BATCH_SIZE) + 1
  const totalBatch = Math.ceil(toUpload.length / BATCH_SIZE)

  const { error } = await supabase.from('permits').insert(batch)

  if (error) {
    // Handle duplicate rows gracefully: insert one-by-one, skip dupes
    if (error.message.toLowerCase().includes('duplicate') ||
        error.message.includes('unique') || error.code === '23505') {
      let batchUploaded = 0
      let batchSkipped  = 0
      for (const row of batch) {
        const r = includePermitType ? row : (({ permit_type, ...rest }) => rest)(row)
        const { error: rowErr } = await supabase.from('permits').insert([r])
        if (rowErr && (rowErr.code === '23505' || rowErr.message.toLowerCase().includes('duplicate'))) {
          batchSkipped++
        } else if (rowErr) {
          errored++
          errors.push(`Row ${r.permit_number}: ${rowErr.message}`)
        } else {
          batchUploaded++
        }
      }
      uploaded   += batchUploaded
      duplicates += batchSkipped
      process.stdout.write(`    ✓  Batch ${batchNum}/${totalBatch} — ${uploaded} uploaded, ${duplicates} dupes skipped\r`)
    } else {
      errored += batch.length
      errors.push(`Batch ${batchNum}: ${error.message}`)
      console.error(`\n    ❌  Batch ${batchNum}/${totalBatch} failed: ${error.message}`)
    }
  } else {
    uploaded += batch.length
    process.stdout.write(`    ✓  Batch ${batchNum}/${totalBatch} — ${uploaded} uploaded\r`)
  }
}

// 6. Final report
console.log('\n')
console.log('━'.repeat(70))
console.log('  Upload complete')
console.log('━'.repeat(70))
console.log(`  ✅  Uploaded / upserted:       ${uploaded}`)
console.log(`  ⚠   Skipped (no permit #):     ${skippedNoNum.length}`)
console.log(`  ❌  Errors:                     ${errored}`)
if (errors.length > 0) {
  console.log('\n  Error details:')
  errors.forEach(e => console.log(`    • ${e}`))
}
console.log()

if (errored === 0) {
  console.log(`  🎉  Alameda UUID: ${ALAMEDA_UUID}`)
  console.log('  Add this to lib/supabase.js → CITIES array.\n')
}
