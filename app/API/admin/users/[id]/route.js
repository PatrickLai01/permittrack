import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/apiAuth'

// PATCH /api/admin/users/:id — change role or active status
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const { id } = params
  const body  = await request.json()

  const allowed = {}
  if (body.role      !== undefined) allowed.role      = body.role === 'admin' ? 'admin' : 'user'
  if (body.is_active !== undefined) allowed.is_active = Boolean(body.is_active)
  if (body.full_name !== undefined) allowed.full_name = body.full_name?.trim() || null
  if (body.company_id !== undefined) allowed.company_id = body.company_id || null

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(allowed)
    .eq('id', id)
    .select('*, companies(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data })
}
