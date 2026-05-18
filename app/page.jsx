'use client'

import { useState, useCallback } from 'react'
import NavBar from '../components/NavBar'
import SearchScreen from '../components/SearchScreen'
import ResultsScreen from '../components/ResultsScreen'
import { ChecklistFlow } from '../components/Checklist'
import { searchPermit } from '../lib/supabase'

export default function Page() {
  // ── Shared UI state ──────────────────────────────────────────────────────
  const [screen,      setScreen]      = useState('search')   // 'search' | 'results' | 'checklist'
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
  }, [query, cityId])

  const handleBack = useCallback(() => {
    setScreen('search')
    setSidebarOpen(false)
    setError(null)
  }, [])

  const handleChecklist = useCallback(() => {
    setScreen('checklist')
    setSidebarOpen(false)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        onLogoClick={handleBack}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
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
    </div>
  )
}
