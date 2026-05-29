'use client'

import {
  Search, CheckCircle2, ChevronRight,
  FileText, Calendar, MapPin, LayoutDashboard, FolderOpen,
  Globe, Settings,
} from 'lucide-react'
import { getCityName } from '../lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtShort(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  })
}

function statusStyle(status) {
  const s = (status ?? '').toLowerCase()
  if (s.includes('final') || s.includes('complet') || s.includes('approv'))
    return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' }
  if (s.includes('issued'))
    return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' }
  if (s.includes('review') || s.includes('check') || s.includes('process'))
    return { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' }
  if (s.includes('expire') || s.includes('void') || s.includes('cancel') || s.includes('denied'))
    return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' }
  return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoField({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed top-14 left-0 bottom-0 w-56
                      bg-[#1e3a5f] border-r border-[#162d4a] z-40">
      <div className="flex-1 py-6 px-3">
        <p className="text-[10px] font-bold text-blue-300/60 uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {[
          { icon: LayoutDashboard, label: 'Dashboard' },
          { icon: Search,          label: 'Search',  active: true },
          { icon: FolderOpen,      label: 'My Permits' },
          { icon: Globe,           label: 'Cities' },
          { icon: Settings,        label: 'Settings' },
        ].map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors
              ${active ? 'bg-white/15 text-white' : 'text-blue-200/70 hover:bg-white/8 hover:text-white'}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-blue-300/50 text-center">PermitTrack v2.0</p>
      </div>
    </aside>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ResultsScreen({ permit, onBack }) {
  const cityName = getCityName(permit.municipality_id)
  const ss = statusStyle(permit.status)

  return (
    <div className="animate-fade-in">
      <Sidebar />

      <div className="lg:ml-56 pt-14">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 animate-slide-up">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e3a5f]
                         hover:text-[#254d7a] transition-colors"
            >
              <Search size={14} />
              New Search
            </button>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-sm text-slate-500 font-medium">Permit Results</span>
          </div>

          {/* ── Permit card ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-5 animate-slide-up">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1e3a5f]/8">
                  <FileText size={18} className="text-[#1e3a5f]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Permit Number
                  </p>
                  <p className="text-xl font-bold text-[#1e3a5f] tracking-tight">
                    {permit.permit_number}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                               ${ss.bg} border ${ss.border} ${ss.text} font-bold text-sm`}>
                <CheckCircle2 size={14} strokeWidth={2.5} />
                {permit.status ?? 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <InfoField icon={MapPin}   label="Address"      value={permit.address} />
              <InfoField icon={Globe}    label="City"         value={cityName} />
              <InfoField icon={Calendar} label="Date Applied" value={fmtShort(permit.applied_date)} />
              <InfoField icon={Calendar} label="Date Issued"  value={fmtShort(permit.issued_date)} />
              {permit.finalized_date && (
                <InfoField icon={Calendar} label="Date Finaled" value={fmtShort(permit.finalized_date)} />
              )}
            </div>

            {permit.description && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{permit.description}</p>
              </div>
            )}
          </div>

          <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200">
            Powered by{' '}
            <span className="font-semibold text-[#1e3a5f]">Permit</span>
            <span className="font-semibold text-[#22c55e]">Track</span>
          </footer>
        </div>
      </div>
    </div>
  )
}
