'use client'

import { useState, useCallback, useEffect } from 'react'
import NavBar       from '../components/NavBar'
import SearchScreen from '../components/SearchScreen'
import ResultsScreen from '../components/ResultsScreen'
import AuthModal    from '../components/AuthModal'
import { ChecklistFlow } from '../components/Checklist'
import { searchPermit } from '../lib/supabase'
import { getSession, onAuthStateChange, signOut } from '../lib/auth'
import { logSearch } from '../lib/searchLog'

export default function Page() {
  // ── Shared UI state ──────────────────────────────────────────────────────
  const [screen,      setScreen]      = useState('search')   // 'search' | 'results' | 'checklist'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAuth,    setShowAuth]    = useState(false)

  // ── Auth state ───────────────────────────────────────────────────────────
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Hydrate from stored session on first load
    getSession().then((session) => setUser(session?.user ?? null))

    // Keep in sync with auth events (sign in, sign out, token refresh)
    const unsubscribe = onAuthStateChange((session) => {
      setUser(session?.user ?? null)
    })
    return unsubscribe
  }, [])

  // ── Search state ─────────────────────────────────────────────────────────
  const [query,   setQuery]   = useState('')
  const [cityId,  setCityId]  = useState('')
  const [permit,  setPermit]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setError(null)

    try {
      const result = await searchPermit(q, cityId || null)

      // Fire-and-forget search log — always runs regardless of result
      logSearch({
        query:          q,
        municipalityId: cityId || null,
        result,
        userId:         user?.id ?? null,
      })

      if (result) {
        setPermit(result)
        setScreen('results')
      } else {
        const cityHint = cityId ? '' : ' Try selecting a specific city to narrow your search.'
        setError(`No permit found matching "${q}".${cityHint}`)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Search failed — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [query, cityId, user])

  const handleBack = useCallback(() => {
    setScreen('search')
    setSidebarOpen(false)
    setError(null)
  }, [])

  const handleChecklist = useCallback(() => {
    setScreen('checklist')
    setSidebarOpen(false)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
    setUser(null)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        onLogoClick={handleBack}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onSignIn={() => setShowAuth(true)}
        onSignOut={handleSignOut}
      />

      {screen === 'search' && (
        <SearchScreen
          query={query}       setQuery={setQuery}
          cityId={cityId}     setCityId={setCityId}
          loading={loading}   error={error}
          onSearch={handleSearch}
          onChecklist={handleChecklist}
        />
      )}

      {screen === 'results' && permit && (
        <ResultsScreen permit={permit} onBack={handleBack} />
      )}

      {screen === 'checklist' && (
        <ChecklistFlow onBack={handleBack} />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(signedInUser) => {
            setUser(signedInUser)
            setShowAuth(false)
          }}
        />
      )}
    </div>
  )
}
