/**
 * fix-alameda-city.mjs
 *
 * 1. Finds the "Oakland" row in the cities table and renames it to "Alameda"
 * 2. Captures its real UUID
 * 3. Migrates the 4,294 permits that were uploaded with the temporary UUID
 *    (b8c5d2e1-f3a4-4b7c-9e0d-5f6a7b8c9d0e) to the real city UUID
 *
 * Usage:  node fix-alameda-city.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dmataerylfryldrpuicg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXRhZXJ5bGZyeWxkcnB1aWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTQ3NTIsImV4cCI6MjA5NDI3MDc1Mn0.9FDnQs6JgIuAYK97okuaRRh60PJy64Db5AEPsZOYgNA'
const TEMP_UUID    = 'b8c5d2e1-f3a4-4b7c-9e0d-5f6a7b8c9d0e'   // the made-up UUID used during upload

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

console.log('━'.repeat(60))
console.log('  Alameda City Fix')
console.log('━'.repeat(60))
console.log()

// ── Step 1: Find "Oakland" in cities table ────────────────────────────────────
console.log('🔍  Step 1: Looking up "Oakland" in cities table...')

const { data: oaklandRows, error: findErr } = await supabase
  .from('cities')
  .select('*')
  .eq('name', 'Oakland')

if (findErr) {
  console.error(`  ❌  Query failed: ${findErr.message}`)
  process.exit(1)
}

if (!oaklandRows || oaklandRows.length === 0) {
  console.log('  ⚠  No row named "Oakland" found. Checking if "Alameda" already exists...')

  const { data: alamedaRows } = await supabase
    .from('cities')
    .select('*')
    .eq('name', 'Alameda')

  if (alamedaRows?.length > 0) {
    console.log(`  ✅  "Alameda" already exists:`)
    alamedaRows.forEach(r => console.log(`      id: ${r.id}  county: ${r.county}  state: ${r.state}`))
    const realUUID = alamedaRows[0].id
    await migrateTempPermits(realUUID)
  } else {
    console.error('  ❌  Neither "Oakland" nor "Alameda" found in cities table.')
    console.log('\n  All cities currently in table:')
    const { data: all } = await supabase.from('cities').select('id, name, county, state')
    all?.forEach(r => console.log(`    • ${r.name} (${r.id})`))
  }
  process.exit(0)
}

console.log(`  Found ${oaklandRows.length} row(s):`)
oaklandRows.forEach(r =>
  console.log(`    id: ${r.id}  name: ${r.name}  county: ${r.county}  state: ${r.state}`)
)
console.log()

const realUUID = oaklandRows[0].id

// ── Step 2: Rename Oakland → Alameda ─────────────────────────────────────────
console.log('✏️   Step 2: Renaming "Oakland" → "Alameda"...')

const { data: updated, error: updateErr } = await supabase
  .from('cities')
  .update({ name: 'Alameda' })
  .eq('name', 'Oakland')
  .select()

if (updateErr) {
  console.error(`  ❌  Update failed: ${updateErr.message}`)
  process.exit(1)
}

console.log(`  ✅  Updated ${updated.length} row(s):`)
updated.forEach(r =>
  console.log(`    id: ${r.id}  name: ${r.name}  county: ${r.county}  state: ${r.state}`)
)
console.log()

// ── Step 3: Verify ────────────────────────────────────────────────────────────
console.log('🔎  Step 3: Verifying...')

const { data: verify, error: verifyErr } = await supabase
  .from('cities')
  .select('id, name, county, state, region')
  .eq('id', realUUID)
  .single()

if (verifyErr || !verify) {
  console.error(`  ❌  Verification failed: ${verifyErr?.message}`)
} else {
  console.log('  ✅  Verified row in database:')
  console.log(`    id:     ${verify.id}`)
  console.log(`    name:   ${verify.name}`)
  console.log(`    county: ${verify.county}`)
  console.log(`    state:  ${verify.state}`)
  console.log(`    region: ${verify.region}`)
}
console.log()

// ── Step 4: Migrate permits to real UUID ──────────────────────────────────────
await migrateTempPermits(realUUID)

// ── Helper ────────────────────────────────────────────────────────────────────
async function migrateTempPermits(realUUID) {
  if (realUUID === TEMP_UUID) {
    console.log('ℹ️   Temp UUID matches real UUID — no permit migration needed.')
    return
  }

  console.log(`🔄  Step 4: Migrating permits from temp UUID → real UUID...`)
  console.log(`    Temp: ${TEMP_UUID}`)
  console.log(`    Real: ${realUUID}`)
  console.log()

  // Count how many permits use the temp UUID
  const { count, error: countErr } = await supabase
    .from('permits')
    .select('permit_number', { count: 'exact', head: true })
    .eq('city_id', TEMP_UUID)

  if (countErr) {
    console.error(`  ❌  Count query failed: ${countErr.message}`)
    return
  }

  console.log(`  Permits using temp UUID: ${count}`)

  if (count === 0) {
    console.log('  ✅  No permits need migration.')
    return
  }

  // Update all permits with temp UUID to use the real UUID
  const { data: migrated, error: migrateErr } = await supabase
    .from('permits')
    .update({ city_id: realUUID })
    .eq('city_id', TEMP_UUID)
    .select('permit_number')

  if (migrateErr) {
    console.error(`  ❌  Migration failed: ${migrateErr.message}`)
    console.log()
    console.log('  ⚠  The permits table may not allow UPDATE via the anon key.')
    console.log('  If so, run this SQL directly in the Supabase SQL Editor:')
    console.log()
    console.log(`  UPDATE permits`)
    console.log(`  SET city_id = '${realUUID}'`)
    console.log(`  WHERE city_id = '${TEMP_UUID}';`)
    console.log()
    return
  }

  console.log(`  ✅  Migrated ${migrated?.length ?? count} permit rows to real UUID`)
  console.log()

  // Final verify
  const { count: remaining } = await supabase
    .from('permits')
    .select('permit_number', { count: 'exact', head: true })
    .eq('city_id', TEMP_UUID)

  const { count: realCount } = await supabase
    .from('permits')
    .select('permit_number', { count: 'exact', head: true })
    .eq('city_id', realUUID)

  console.log(`  Permits still on temp UUID: ${remaining}`)
  console.log(`  Permits on real UUID:       ${realCount}`)
  console.log()

  if (remaining === 0) {
    console.log('  🎉  All Alameda permits are now linked to the real city UUID.')
    console.log()
    console.log(`  ⚠  UPDATE REQUIRED in your app code:`)
    console.log(`     lib/supabase.js → CITIES array → Alameda id:`)
    console.log(`     OLD: '${TEMP_UUID}'`)
    console.log(`     NEW: '${realUUID}'`)
  }
}
