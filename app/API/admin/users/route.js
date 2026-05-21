import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdmin } from '@/lib/apiAuth'

// POST /api/admin/users — admin creates a new user with a temp password
export async function POST(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const body = await request.json()
  const { email, full_name, role = 'user', company_id, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!/\d/.test(password)) {
    return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 })
  }

  // Create auth user — email_confirm: true skips the email confirmation flow
  const { data: { user: newAuthUser }, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  })

  if (createErr) {
    // Surface Supabase's message so the frontend can show it directly
    return NextResponse.json({ error: createErr.message }, { status: 400 })
  }

  // The handle_new_user trigger already created the public.users profile row.
  // Now enrich it with the fields we know at creation time.
  const { data: profile, error: updateErr } = await supabaseAdmin
    .from('users')
    .update({
      full_name: full_name?.trim() || null,
      role:       role === 'admin' ? 'admin' : 'user',
      company_id: company_id || null,
    })
    .eq('id', newAuthUser.id)
    .select('*, companies(id, name)')
    .single()

  if (updateErr) {
    // Auth user was created but profile update failed — return partial success
    console.error('Profile update failed for', newAuthUser.id, updateErr)
    return NextResponse.json({ user: newAuthUser, warning: 'Profile update failed' }, { status: 207 })
  }

  return NextResponse.json({ user: profile }, { status: 201 })
}

// GET /api/admin/users — list all users with company join
export async function GET(request) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*, companies(id, name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}
