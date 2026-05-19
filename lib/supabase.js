import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton client — created once, reused everywhere
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── City registry ─────────────────────────────────────────────────────────────

export const CITIES = [
  { name: 'Alameda',     id: 'f6726596-875e-4f1b-b3bc-89b518e445a1'  },
  { name: 'Los Gatos',   id: '68e3b302-178f-42a3-a1da-3eed8d39fe94'  },
  { name: 'San Jose',    id: '0e873f5c-7e76-484a-9a33-c28984a55a4f'   },
  { name: 'San Mateo',   id: '12345678-1234-1234-1234-123456789012'   },
  { name: 'Santa Clara', id: 'a90a4dd9-4fa8-42e3-829f-b49816d32083'  },
]

const CITY_ID_TO_NAME = Object.fromEntries(CITIES.map((c) => [c.id, c.name]))

export function getCityName(cityId) {
  return CITY_ID_TO_NAME[cityId] ?? 'Unknown City'
}

// ── Search ────────────────────────────────────────────────────────────────────

/**
 * Search permits by permit number (exact prefix) or address (partial).
 * cityId is optional — pass null to search all cities.
 * Returns the first matching permit row, or null if none found.
 */
export async function searchPermit(rawQuery, cityId = null) {
  const q = rawQuery.trim()
  if (!q) return null

  // Select only the columns we actually render — keeps payload small
  const SELECT =
    'permit_number, address, status, description, applied_date, issued_date, finalized_date, city_id'

  // Build base query
  let builder = supabase.from('permits').select(SELECT)

  // Narrow to city when one is chosen
  if (cityId) builder = builder.eq('city_id', cityId)

  // Try permit_number starts-with first (cheap if indexed), then address contains
  builder = builder
    .or(`permit_number.ilike.${q}%,address.ilike.%${q}%`)
    .limit(1)

  const { data, error } = await builder

  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}
