import { createClient } from '@supabase/supabase-js'

let client = null

// Created on first use rather than at module load, so `next build`'s page-data
// collection can import admin routes without the service-role key being present.
function getClient() {
  if (client) return client

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — admin API routes are unavailable.')
  }

  client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return client
}

// Service-role client: bypasses RLS, never expose to the browser.
// Lazy proxy keeps existing `supabaseAdmin.x` call sites unchanged.
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      const value = getClient()[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  }
)
