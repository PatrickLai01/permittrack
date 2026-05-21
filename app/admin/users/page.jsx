'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Plus, X, Eye, EyeOff, RefreshCw, ShieldCheck, ShieldOff,
  UserCheck, UserX, Copy, Check, Loader2, ChevronDown, Building2, LogOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSession, getAccessToken, signOut } from '@/lib/auth'

// ── Helpers ───────────────────────────────────────────────────────────────────

function generatePassword() {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower   = 'abcdefghjkmnpqrstuvwxyz'
  const digits  = '23456789'
  const all     = upper + lower + digits
  let pw = ''
  pw += upper[Math.floor(Math.random() * upper.length)]
  pw += lower[Math.floor(Math.random() * lower.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  for (let i = 0; i < 6; i++) pw += all[Math.floor(Math.random() * all.length)]
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

function validatePassword(pw) {
  if (!pw || pw.length < 8)  return 'Minimum 8 characters'
  if (!/\d/.test(pw))        return 'Must contain at least one number'
  return null
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── API helpers (attach Bearer token automatically) ───────────────────────────

async function adminFetch(path, options = {}) {
  const token = await getAccessToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, email, password, onDismiss }) {
  const [copied, setCopied] = useState(false)

  function copyCredentials() {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl
                    bg-[#1e3a5f] text-white shadow-2xl border border-white/10 max-w-sm animate-slide-up">
      <Check size={16} className="mt-0.5 text-[#22c55e] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{message}</p>
        <p className="text-xs text-blue-200 truncate mt-0.5">{email}</p>
        {password && (
          <button
            onClick={copyCredentials}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#22c55e]
                       hover:text-green-300 transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy credentials'}
          </button>
        )}
      </div>
      <button onClick={onDismiss} className="text-white/50 hover:text-white transition-colors mt-0.5">
        <X size={14} />
      </button>
    </div>
  )
}

// ── Create User Modal ─────────────────────────────────────────────────────────

function CreateUserModal({ companies, onClose, onCreated }) {
  const [form, setForm]               = useState({ email: '', full_name: '', role: 'user', company_id: '', password: '' })
  const [showPw, setShowPw]           = useState(false)
  const [errors, setErrors]           = useState({})
  const [submitting, setSubmitting]   = useState(false)
  const [apiError, setApiError]       = useState(null)

  // Inline new-company form
  const [showNewCo, setShowNewCo]   = useState(false)
  const [newCo, setNewCo]           = useState({ name: '', contact_email: '', plan: 'trial' })
  const [coErrors, setCoErrors]     = useState({})
  const [creatingCo, setCreatingCo] = useState(false)

  function field(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  function validate() {
    const e = {}
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    const pwErr = validatePassword(form.password)
    if (pwErr) e.password = pwErr
    return e
  }

  async function createCompany() {
    const e = {}
    if (!newCo.name.trim()) e.name = 'Required'
    if (Object.keys(e).length) { setCoErrors(e); return }

    setCreatingCo(true)
    try {
      const slug = newCo.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const { data, error } = await supabase.from('companies').insert({
        name:          newCo.name.trim(),
        slug:          `${slug}-${Date.now()}`,
        contact_email: newCo.contact_email.trim() || null,
        plan:          newCo.plan,
      }).select('id, name').single()

      if (error) throw error
      // Auto-select the new company
      setForm(f => ({ ...f, company_id: data.id }))
      setShowNewCo(false)
      setNewCo({ name: '', contact_email: '', plan: 'trial' })
      setCoErrors({})
      // Signal parent to refresh companies list
      onCreated?.__addCompany?.(data)
    } catch (err) {
      setCoErrors({ _api: err.message })
    } finally {
      setCreatingCo(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setApiError(null)
    try {
      const result = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email:      form.email.trim().toLowerCase(),
          full_name:  form.full_name.trim() || null,
          role:       form.role,
          company_id: form.company_id || null,
          password:   form.password,
        }),
      })
      onCreated(result.user, form.password)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const INPUT = `w-full px-3.5 py-2.5 rounded-xl border text-slate-800 text-sm
    focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200
                      animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <Plus size={15} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-[#1e3a5f]">New User</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email" autoComplete="off"
              value={form.email} onChange={(e) => field('email', e.target.value)}
              className={`${INPUT} ${errors.email ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="contractor@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Full Name
            </label>
            <input
              type="text"
              value={form.full_name} onChange={(e) => field('full_name', e.target.value)}
              className={`${INPUT} border-slate-300`}
              placeholder="Jane Smith"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Role
            </label>
            <div className="relative">
              <select
                value={form.role} onChange={(e) => field('role', e.target.value)}
                className={`${INPUT} border-slate-300 appearance-none pr-10 cursor-pointer`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Company
            </label>
            <div className="relative">
              <select
                value={showNewCo ? '__new__' : form.company_id}
                onChange={(e) => {
                  if (e.target.value === '__new__') { setShowNewCo(true); field('company_id', '') }
                  else { setShowNewCo(false); field('company_id', e.target.value) }
                }}
                className={`${INPUT} border-slate-300 appearance-none pr-10 cursor-pointer`}
              >
                <option value="">— No company —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new__">+ Create new company</option>
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Inline new-company form */}
            {showNewCo && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Company</p>
                <div>
                  <input
                    type="text" placeholder="Company name *"
                    value={newCo.name} onChange={(e) => setNewCo(n => ({ ...n, name: e.target.value }))}
                    className={`${INPUT} ${coErrors.name ? 'border-red-400' : 'border-slate-300'} bg-white`}
                  />
                  {coErrors.name && <p className="text-xs text-red-500 mt-1">{coErrors.name}</p>}
                </div>
                <input
                  type="email" placeholder="Contact email"
                  value={newCo.contact_email} onChange={(e) => setNewCo(n => ({ ...n, contact_email: e.target.value }))}
                  className={`${INPUT} border-slate-300 bg-white`}
                />
                <div className="relative">
                  <select
                    value={newCo.plan} onChange={(e) => setNewCo(n => ({ ...n, plan: e.target.value }))}
                    className={`${INPUT} border-slate-300 appearance-none pr-10 cursor-pointer bg-white`}
                  >
                    <option value="trial">Trial</option>
                    <option value="starter">Starter ($99/mo)</option>
                    <option value="pro">Pro ($299/mo)</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {coErrors._api && <p className="text-xs text-red-500">{coErrors._api}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button" onClick={createCompany} disabled={creatingCo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                               bg-[#1e3a5f] text-white hover:bg-[#254d7a] transition-colors disabled:opacity-50"
                  >
                    {creatingCo ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Create & select
                  </button>
                  <button
                    type="button" onClick={() => { setShowNewCo(false); setCoErrors({}) }}
                    className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Temp Password <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  value={form.password} onChange={(e) => field('password', e.target.value)}
                  className={`${INPUT} pr-10 ${errors.password ? 'border-red-400' : 'border-slate-300'}`}
                  placeholder="Min 8 chars, at least one number"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { const pw = generatePassword(); field('password', pw); setShowPw(true) }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold
                           text-slate-600 hover:bg-slate-50 hover:border-[#1e3a5f] transition-colors whitespace-nowrap"
              >
                Generate
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {apiError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600
                         border border-slate-300 hover:border-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                         bg-[#1e3a5f] text-white hover:bg-[#254d7a] transition-colors disabled:opacity-50 shadow-md"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── User Table Row ─────────────────────────────────────────────────────────────

function UserRow({ user, onUpdate, onResetPassword }) {
  const [loading, setLoading] = useState(false)

  async function patch(payload) {
    setLoading(true)
    try { await onUpdate(user.id, payload) }
    finally { setLoading(false) }
  }

  const roleColor  = user.role === 'admin'
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{user.email}</p>
          {user.full_name && <p className="text-xs text-slate-400 mt-0.5">{user.full_name}</p>}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600">{user.companies?.name ?? '—'}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${roleColor}`}>
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border
          ${user.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(user.last_login_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {loading
            ? <Loader2 size={14} className="animate-spin text-slate-400" />
            : (
              <>
                {/* Toggle active */}
                <button
                  onClick={() => patch({ is_active: !user.is_active })}
                  title={user.is_active ? 'Deactivate' : 'Activate'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#1e3a5f] hover:bg-slate-100 transition-colors"
                >
                  {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                </button>

                {/* Toggle role */}
                <button
                  onClick={() => patch({ role: user.role === 'admin' ? 'user' : 'admin' })}
                  title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  {user.role === 'admin' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                </button>

                {/* Reset password */}
                <button
                  onClick={() => onResetPassword(user.id, user.email)}
                  title="Send password reset email"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
              </>
            )
          }
        </div>
      </td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter()

  // Auth guard
  const [checking,  setChecking]  = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  // Data
  const [users,     setUsers]     = useState([])
  const [companies, setCompanies] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError,   setDataError]   = useState(null)

  // UI state
  const [showModal, setShowModal] = useState(false)
  const [toast,     setToast]     = useState(null)
  const [filter,    setFilter]    = useState({ company: '', role: '', active: '' })

  // ── Admin check ────────────────────────────────────────────────────────────

  useEffect(() => {
    getSession().then(async (session) => {
      if (!session) { router.replace('/'); return }
      const { data: profile } = await supabase
        .from('users').select('id, role, email, full_name').eq('id', session.user.id).single()
      if (profile?.role !== 'admin') { router.replace('/'); return }
      setCurrentUser(profile)
      setChecking(false)
    })
  }, [router])

  // ── Data fetch ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    setDataError(null)
    try {
      const [usersRes, companiesRes] = await Promise.all([
        adminFetch('/api/admin/users'),
        supabase.from('companies').select('id, name').order('name'),
      ])
      setUsers(usersRes.users)
      setCompanies(companiesRes.data ?? [])
    } catch (err) {
      setDataError(err.message)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => { if (!checking) fetchData() }, [checking, fetchData])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function showToast(msg, email, password) {
    setToast({ msg, email, password })
    setTimeout(() => setToast(null), 8000)
  }

  function handleCreated(newUser, password) {
    setUsers(prev => [newUser, ...prev])
    setShowModal(false)
    showToast('User created', newUser.email, password)
  }

  // Allow inline company creation to surface the new company to the companies list
  handleCreated.__addCompany = (company) => {
    setCompanies(prev => [...prev, company].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function handleUpdate(id, payload) {
    const updated = await adminFetch(`/api/admin/users/${id}`, {
      method: 'PATCH', body: JSON.stringify(payload),
    })
    setUsers(prev => prev.map(u => u.id === id ? updated.user : u))
  }

  async function handleResetPassword(id, email) {
    try {
      await adminFetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' })
      showToast('Password reset email sent', email)
    } catch (err) {
      alert(`Reset failed: ${err.message}`)
    }
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    if (filter.company && u.company_id !== filter.company) return false
    if (filter.role    && u.role !== filter.role)          return false
    if (filter.active === 'active'   && !u.is_active)      return false
    if (filter.active === 'inactive' &&  u.is_active)      return false
    return true
  })

  // ── Loading / auth states ──────────────────────────────────────────────────

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={24} className="animate-spin text-[#1e3a5f]" />
      </div>
    )
  }

  const SELECT = `px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm
    appearance-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] transition-all cursor-pointer bg-white`

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#1e3a5f] flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-[#1e3a5f] font-bold text-lg tracking-tight">
              Permit<span className="text-[#22c55e]">Track</span>
            </span>
          </button>
          <span className="ml-2 text-slate-300">/</span>
          <span className="ml-2 text-sm font-semibold text-slate-500">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{currentUser?.email}</span>
          <button
            onClick={async () => { await signOut(); router.replace('/') }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="pt-14 px-6 pb-12 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mt-8 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
              <Users size={22} /> Users
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">{users.length} total</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white
                       text-sm font-semibold hover:bg-[#254d7a] active:scale-[0.98] transition-all shadow-md"
          >
            <Plus size={15} /> New User
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative">
            <select value={filter.company} onChange={(e) => setFilter(f => ({ ...f, company: e.target.value }))}
              className={`${SELECT} pr-8`}>
              <option value="">All companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filter.role} onChange={(e) => setFilter(f => ({ ...f, role: e.target.value }))}
              className={`${SELECT} pr-8`}>
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filter.active} onChange={(e) => setFilter(f => ({ ...f, active: e.target.value }))}
              className={`${SELECT} pr-8`}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {dataLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          )}
          {dataError && (
            <div className="px-6 py-8 text-center text-sm text-red-500">{dataError}</div>
          )}
          {!dataLoading && !dataError && (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Email / Name', 'Company', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                        No users match the current filters
                      </td>
                    </tr>
                  )
                  : filtered.map(u => (
                    <UserRow
                      key={u.id}
                      user={u}
                      onUpdate={handleUpdate}
                      onResetPassword={handleResetPassword}
                    />
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showModal && (
        <CreateUserModal
          companies={companies}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {toast && (
        <Toast
          message={toast.msg}
          email={toast.email}
          password={toast.password}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
