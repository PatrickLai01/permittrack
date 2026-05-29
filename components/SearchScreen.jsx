'use client'

import { useState, useEffect } from 'react'
import { Building2, Search, Loader2 } from 'lucide-react'

export default function SearchScreen({
  query, setQuery,
  loading, error,
  onSearch,
}) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4
                     bg-gradient-to-br from-slate-50 to-slate-100 pt-14">
      <div className="w-full max-w-xl animate-slide-up">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-[#1e3a5f] mb-5 shadow-lg">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#1e3a5f] tracking-tight mb-2">
            Permit<span className="text-[#22c55e]">Track</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">
            Permit intelligence for HVAC contractors
          </p>
        </div>

        {/* Search card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">

          {/* Permit / address input */}
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Permit Number or Address
          </label>
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && onSearch()}
              placeholder="Enter address or permit number"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 text-slate-800
                         placeholder-slate-400 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent
                         transition-all"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700
                            text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          {/* Primary CTA */}
          <button
            onClick={onSearch}
            disabled={loading || !query.trim()}
            className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
                       transition-all duration-150 shadow-md flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       bg-[#1e3a5f] hover:bg-[#254d7a] active:scale-[0.98] text-white"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={16} />
                Look Up Permit
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Live data — 50,263 permits across Bay Area cities
        </p>
      </div>
    </main>
  )
}
