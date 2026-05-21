import { supabase } from './supabase'

// Stable anonymous visitor ID, persisted in localStorage.
// Groups all searches from the same browser across page loads.
function getSessionId() {
  if (typeof window === 'undefined') return null
  let id = localStorage.getItem('pt_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('pt_session_id', id)
  }
  return id
}

// Permit numbers look like: M26-054, PLN26-0303, 26TMP-003212, EN24-0001
// Anything else is treated as an address search.
function inferSearchType(query) {
  return /^[A-Z0-9]{1,4}[0-9]{2}-/i.test(query.trim()) ? 'permit' : 'address'
}

/**
 * Logs a permit search to the search_log table.
 * Non-blocking — a failure here must never surface to the user.
 *
 * @param {object} opts
 * @param {string}  opts.query          - Raw search query entered by the user
 * @param {string}  [opts.municipalityId] - Selected municipality UUID, or null
 * @param {object}  [opts.result]       - Permit row returned, or null
 * @param {string}  [opts.userId]       - auth.uid() of signed-in user, or null for anon
 */
export async function logSearch({ query, municipalityId = null, result = null, userId = null }) {
  try {
    const searchType = inferSearchType(query)
    const isPermit   = searchType === 'permit'

    await supabase.from('search_log').insert({
      user_id:               userId ?? null,
      company_id:            null,          // enriched later when user profiles are loaded
      session_id:            getSessionId(),
      permit_number_searched: isPermit  ? query.trim() : null,
      address_searched:       !isPermit ? query.trim() : null,
      municipality_id:        municipalityId ?? null,
      search_type:            searchType,
      result_count:           result ? 1 : 0,
      result_found:           !!result,
      // ip_address: null — must be captured server-side (API route) to be accurate
    })
  } catch {
    // Intentionally swallowed — logging must never break the search flow
  }
}
