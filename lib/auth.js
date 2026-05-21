import { supabase } from './supabase'

// Returns the current access token (JWT) for use in Authorization headers.
export async function getAccessToken() {
  const session = await getSession()
  return session?.access_token ?? null
}

// Returns the public.users profile row for the current user, or null.
export async function getUserProfile() {
  const session = await getSession()
  if (!session?.user) return null

  const { data } = await supabase
    .from('users')
    .select('id, role, full_name, email, company_id, is_active')
    .eq('id', session.user.id)
    .single()

  return data ?? null
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Returns an unsubscribe function — call it on component unmount.
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => subscription.unsubscribe()
}
