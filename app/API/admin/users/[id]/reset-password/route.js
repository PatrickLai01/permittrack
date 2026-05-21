import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/apiAuth'

// POST /api/admin/users/:id/reset-password — sends password reset email
export async function POST(request, { params }) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const { id } = params

  // Look up the user's email
  const { data: { user }, error: lookupErr } = await supabaseAdmin.auth.admin.getUserById(id)
  if (lookupErr || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Generate a recovery link — Supabase sends the email automatically
  const { error: resetErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
  })

  if (resetErr) {
    return NextResponse.json({ error: resetErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email: user.email })
}
