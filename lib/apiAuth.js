import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Verifies the caller is a signed-in admin.
 * Reads the Bearer token from the Authorization header.
 *
 * Returns { user } on success, or sends a 401/403 response and returns null.
 * Usage in a route handler:
 *
 *   const auth = await requireAdmin(request)
 *   if (!auth) return  // response already sent
 *   const { user } = auth
 */
export async function requireAdmin(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) {
    return { error: NextResponse.json({ error: 'Missing token' }, { status: 401 }) }
  }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) {
    return { error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) }
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  return { user }
}
