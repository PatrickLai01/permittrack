'use client'

import { useState } from 'react'
import { Building2, X, Loader2, Eye, EyeOff } from 'lucide-react'
import { signIn } from '../lib/auth'

export default function AuthModal({ onClose, onSuccess }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { user } = await signIn(email.trim(), password)
      onSuccess(user)
    } catch (err) {
      setError(err.message ?? 'Sign-in failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 animate-slide-up">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#1e3a5f]">
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1e3a5f] leading-tight">Sign in</h2>
              <p className="text-xs text-slate-400 font-medium">PermitTrack</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-800
                         text-sm placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent
                         transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-3 pr-10 rounded-xl border border-slate-300 text-slate-800
                           text-sm placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent
                           transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                           hover:text-slate-600 transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 animate-fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide
                       bg-[#1e3a5f] text-white transition-all shadow-md
                       hover:bg-[#254d7a] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                       flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Signing in...</>
              : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
