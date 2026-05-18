'use client'

import { useState } from 'react'
import {
  ClipboardList, ChevronRight, CheckCircle2, Printer,
  RotateCcw, ChevronDown, LayoutDashboard, Search,
  FolderOpen, Globe, Settings,
} from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────────

const CHECKLIST_CITIES = ['Alameda', 'Los Gatos', 'San Jose', 'San Mateo', 'Santa Clara']

const PROJECT_TYPES = [
  'Residential HVAC — Gas to Heat Pump Conversion',
  'Residential HVAC — Straight Replacement (like for like)',
  'Residential HVAC — New Installation',
  'Commercial HVAC — Rooftop Unit Replacement',
  'Commercial HVAC — New Installation',
  'Commercial Kitchen Hood',
  'Ductwork Only',
]

const CITY_META = {
  'Alameda': {
    noteColor: 'blue',
    note: 'Alameda uses the CSS (Community Development — Permit Center) for permit applications. Online submissions available at alamedaca.gov.',
    submitVia: 'alamedaca.gov/permits',
  },
  'Los Gatos': {
    noteColor: 'amber',
    note: 'Los Gatos uses a third-party plan reviewer. Allow 2–3 weeks for plan check.',
    submitVia: 'aca-prod.accela.com/TLG',
  },
  'San Jose': {
    noteColor: 'green',
    note: 'San Jose permit portal is streamlined. Average processing time: 5–10 business days.',
    submitVia: 'sjpermits.org',
  },
  'San Mateo': {
    noteColor: 'slate',
    note: 'San Mateo uses the OpenGov portal for permit submissions.',
    submitVia: 'cityofsanmateo.gov/permits',
  },
  'Santa Clara': {
    noteColor: 'slate',
    note: 'Santa Clara uses the city online permit portal.',
    submitVia: 'santaclaraca.gov/permits',
  },
}

const SPECIFIC = {
  'Los Gatos|Residential HVAC — Gas to Heat Pump Conversion': [
    { label: 'Building Permit Application',               detail: 'Download from Los Gatos Building Division' },
    { label: 'Mechanical Permit (MEP) Application',       detail: 'Required for all HVAC work' },
    { label: 'Title 24 / CF-1R Energy Compliance Report', detail: 'Must be completed by certified HERS rater before submission' },
    { label: 'Equipment Specifications / Cut Sheets',     detail: 'Must show SEER2 ≥ 15.0 and HSPF2 ≥ 7.8' },
    { label: 'Proof of City of Los Gatos Business License', detail: 'Contractor must have current license on file' },
    { label: 'Gas Line Cap Documentation',                detail: 'Required since you are abandoning gas service' },
    { label: 'Site Plan / Property Diagram',              detail: 'Showing location of new equipment' },
  ],
  'San Jose|Residential HVAC — Gas to Heat Pump Conversion': [
    { label: 'Building Permit Application',               detail: 'Submit online via San Jose permit portal' },
    { label: 'Mechanical Permit Application',             detail: 'Required for all HVAC work' },
    { label: 'Title 24 / CF-1R Energy Compliance Report', detail: 'Required for heat pump installations' },
    { label: 'Equipment Specifications / Cut Sheets',     detail: 'Must meet California Title 20 minimums' },
    { label: 'Proof of San Jose Business License',        detail: 'Required for all contractors' },
    { label: 'Gas Line Cap Documentation',                detail: 'Required since you are abandoning gas service' },
  ],
}

const LICENSE = {
  'Alameda':     'Proof of City of Alameda Business License',
  'Los Gatos':   'Proof of City of Los Gatos Business License',
  'San Jose':    'Proof of San Jose Business License',
  'San Mateo':   'Proof of San Mateo Business License',
  'Santa Clara': 'Proof of Santa Clara Business License',
}

function getDefaultItems(city, type) {
  const meta    = CITY_META[city] ?? {}
  const portal  = meta.submitVia ?? 'city permit portal'
  const license = { label: LICENSE[city] ?? 'Proof of Contractor Business License', detail: 'Contractor must have current license on file' }

  switch (type) {
    case 'Residential HVAC — Straight Replacement (like for like)':
      return [
        { label: 'Building Permit Application',           detail: `Submit via ${portal}` },
        { label: 'Mechanical Permit (MEP) Application',   detail: 'Required for all HVAC work' },
        { label: 'Equipment Specifications / Cut Sheets', detail: 'Must show SEER2 ≥ 15.0 for cooling systems' },
        license,
      ]
    case 'Residential HVAC — New Installation':
      return [
        { label: 'Building Permit Application',               detail: `Submit via ${portal}` },
        { label: 'Mechanical Permit (MEP) Application',       detail: 'Required for all HVAC work' },
        { label: 'Title 24 / CF-1R Energy Compliance Report', detail: 'Required for all new HVAC installations in California' },
        { label: 'Equipment Specifications / Cut Sheets',     detail: 'Must show SEER2 ≥ 15.0 and HSPF2 ≥ 7.8' },
        { label: 'Site Plan / Property Diagram',              detail: 'Showing location and layout of new equipment' },
        { label: 'Load Calculation (Manual J)',               detail: 'Required for new system sizing' },
        license,
      ]
    case 'Commercial HVAC — Rooftop Unit Replacement':
      return [
        { label: 'Building Permit Application',             detail: `Submit via ${portal}` },
        { label: 'Mechanical Permit (MEP) Application',     detail: 'Required for all HVAC work' },
        { label: 'Equipment Specifications / Cut Sheets',   detail: 'Include IEER rating and full unit dimensions' },
        { label: 'Title 24 / NRCC-MCH Energy Compliance',  detail: 'Commercial mechanical energy compliance form' },
        { label: 'Structural Assessment for Roof Loading',  detail: 'Stamped by licensed structural engineer if unit weight changes' },
        license,
      ]
    case 'Commercial HVAC — New Installation':
      return [
        { label: 'Building Permit Application',            detail: `Submit via ${portal}` },
        { label: 'Mechanical Permit (MEP) Application',    detail: 'Required for all HVAC work' },
        { label: 'Title 24 / NRCC-MCH Energy Compliance', detail: 'Commercial mechanical compliance form required' },
        { label: 'Equipment Specifications / Cut Sheets',  detail: 'Full documentation for all proposed equipment' },
        { label: 'Mechanical Plans',                       detail: 'Stamped by licensed mechanical engineer' },
        { label: 'Structural Assessment for Roof Loading', detail: 'Required for all rooftop equipment' },
        { label: 'Load Calculation (Manual N)',            detail: 'Commercial load calculations required' },
        { label: 'Fire Life Safety Review',                detail: 'Required for all commercial occupancies' },
        license,
      ]
    case 'Commercial Kitchen Hood':
      return [
        { label: 'Building Permit Application',      detail: `Submit via ${portal}` },
        { label: 'Mechanical Permit (MEP) Application', detail: 'Required for all hood and exhaust work' },
        { label: 'Hood Specification Sheet',         detail: 'Must be UL Listed; include capture velocity data' },
        { label: 'Make-Up Air System Plans',         detail: 'Required to balance hood exhaust airflow' },
        { label: 'Fire Suppression System Permit',   detail: 'Separate permit required — coordinate with fire authority' },
        { label: 'Grease Duct Plans',                detail: 'Showing routing, clearances, and access panels' },
        { label: 'Health Department Notification',   detail: 'County Environmental Health must be notified before final inspection' },
        license,
      ]
    case 'Ductwork Only':
      return [
        { label: 'Building Permit Application',         detail: 'Required if replacing more than 50% of duct system' },
        { label: 'Mechanical Permit (MEP) Application', detail: 'Required for all duct work' },
        { label: 'Duct System Design / Layout Diagram', detail: 'Showing all duct runs, sizes, and connections' },
        { label: 'HERS Duct Leakage Test Results',      detail: 'Required if replacing more than 25 linear feet of duct' },
        license,
      ]
    default:
      return [
        { label: 'Building Permit Application',           detail: `Submit via ${portal}` },
        { label: 'Mechanical Permit (MEP) Application',   detail: 'Required for all HVAC work' },
        { label: 'Equipment Specifications / Cut Sheets', detail: 'Full documentation for proposed equipment' },
        license,
      ]
  }
}

const LOA = {
  label:  'Letter of Authorization',
  detail: 'Signed authorization from property owner permitting contractor to pull permits on their behalf',
}

function getChecklist(city, type) {
  const items = SPECIFIC[`${city}|${type}`] ?? getDefaultItems(city, type)
  return [...items, LOA]
}

// ── Shared sidebar ────────────────────────────────────────────────────────────

function ChecklistSidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed top-14 left-0 bottom-0 w-56
                      bg-[#1e3a5f] border-r border-[#162d4a] z-40">
      <div className="flex-1 py-6 px-3">
        <p className="text-[10px] font-bold text-blue-300/60 uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {[
          { icon: LayoutDashboard, label: 'Dashboard' },
          { icon: Search,          label: 'Search' },
          { icon: FolderOpen,      label: 'My Permits' },
          { icon: ClipboardList,   label: 'Checklist', active: true },
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

// ── ChecklistItem ─────────────────────────────────────────────────────────────

function ChecklistItem({ item, checked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 mb-2 last:mb-0
        ${checked
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-[#1e3a5f]/25 hover:border-[#1e3a5f]/60 hover:bg-slate-50 active:scale-[0.99]'}`}
    >
      <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
        ${checked ? 'bg-[#22c55e] border-[#22c55e]' : 'bg-white border-[#1e3a5f]'}`}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {item.label}
        </p>
        <p className={`text-xs mt-0.5 leading-relaxed ${checked ? 'text-slate-300 line-through' : 'text-slate-500'}`}>
          {item.detail}
        </p>
      </div>
    </button>
  )
}

function CityNote({ city }) {
  const meta = CITY_META[city]
  if (!meta) return null
  const palette = {
    amber: 'bg-amber-50 border-amber-300 text-amber-800',
    blue:  'bg-blue-50 border-blue-300 text-blue-800',
    green: 'bg-green-50 border-green-300 text-green-800',
    slate: 'bg-slate-100 border-slate-300 text-slate-600',
  }
  return (
    <div className={`rounded-xl border p-4 mt-5 ${palette[meta.noteColor]}`}>
      <p className="text-sm font-medium leading-relaxed">{meta.note}</p>
      <p className="text-xs mt-1.5 opacity-80">
        Submit via: <span className="font-mono font-semibold">{meta.submitVia}</span>
      </p>
    </div>
  )
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

function SelectionScreen({ onGetChecklist, onBack }) {
  const [city, setCity] = useState('')
  const [type, setType] = useState('')

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4
                     bg-gradient-to-br from-slate-50 to-slate-100 pt-14">
      <div className="w-full max-w-xl animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1e3a5f] mb-4 shadow-lg">
            <ClipboardList size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] tracking-tight mb-1">Pre-Application Checklist</h1>
          <p className="text-slate-500 text-sm font-medium">Know exactly what to submit before you apply</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-5">
            <button onClick={onBack} className="text-sm font-medium text-[#1e3a5f] hover:text-[#254d7a] transition-colors">
              Home
            </button>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-sm text-slate-500 font-medium">Document Checklist</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
            <div className="relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full appearance-none px-4 py-3.5 pr-10 rounded-xl border border-slate-300 bg-white
                           text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]
                           focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Select a city...</option>
                {CHECKLIST_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Type</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none px-4 py-3.5 pr-10 rounded-xl border border-slate-300 bg-white
                           text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]
                           focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">Select project type...</option>
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => city && type && onGetChecklist(city, type)}
            disabled={!city || !type}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150 shadow-md
              ${city && type
                ? 'bg-[#1e3a5f] hover:bg-[#254d7a] active:scale-[0.98] text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
          >
            Get Document Checklist
          </button>
        </div>
      </div>
    </main>
  )
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

function ChecklistResult({ city, type, onStartOver, onBack }) {
  const items = getChecklist(city, type)
  const [checked, setChecked] = useState(() => new Array(items.length).fill(false))

  const readyCount  = checked.filter(Boolean).length
  const totalCount  = items.length
  const pct         = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0
  const allDone     = readyCount === totalCount

  const toggle = (i) => setChecked((prev) => prev.map((v, idx) => idx === i ? !v : v))

  return (
    <div className="animate-fade-in">
      <ChecklistSidebar />
      <div className="lg:ml-56 pt-14" id="print-content">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">

          <div className="flex items-center gap-2 mb-6 flex-wrap animate-slide-up">
            <button onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e3a5f] hover:text-[#254d7a] transition-colors">
              <ClipboardList size={14} />Checklist
            </button>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-sm text-slate-500 font-medium">{city}</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-sm text-slate-500 font-medium">{type.split('—')[0].trim()}</span>
          </div>

          {/* Header + progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-5 animate-slide-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1e3a5f]/8">
                <ClipboardList size={18} className="text-[#1e3a5f]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Checklist</p>
                <h2 className="text-base font-bold text-[#1e3a5f] leading-tight">{city} — {type}</h2>
              </div>
            </div>

            <div className={`rounded-xl p-4 border ${allDone ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">{readyCount} of {totalCount} documents ready</span>
                <span className={`text-sm font-bold ${allDone ? 'text-[#22c55e]' : 'text-[#1e3a5f]'}`}>{pct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${allDone ? 'bg-[#22c55e]' : 'bg-[#1e3a5f]'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {allDone && (
                <p className="text-xs text-[#22c55e] font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  All documents accounted for — ready to submit!
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 mb-5 animate-slide-up-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Required Documents — {city}
            </h3>
            {items.map((item, i) => (
              <ChecklistItem key={i} item={item} checked={checked[i]} onToggle={() => toggle(i)} />
            ))}
            <CityNote city={city} />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8 animate-slide-up-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                         bg-[#1e3a5f] text-white text-sm font-semibold
                         hover:bg-[#254d7a] active:scale-[0.98] transition-all shadow-sm"
            >
              <Printer size={15} />
              Print Checklist
            </button>
            <button
              onClick={onStartOver}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                         border-2 border-slate-300 text-slate-600 text-sm font-semibold
                         hover:border-[#1e3a5f] hover:text-[#1e3a5f] active:scale-[0.98] transition-all"
            >
              <RotateCcw size={15} />
              Start Over
            </button>
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

// ── Exported flow ─────────────────────────────────────────────────────────────

export function ChecklistFlow({ onBack }) {
  const [step, setStep] = useState('select')
  const [city, setCity] = useState('')
  const [type, setType] = useState('')

  return step === 'select'
    ? <SelectionScreen onGetChecklist={(c, t) => { setCity(c); setType(t); setStep('results') }} onBack={onBack} />
    : <ChecklistResult city={city} type={type} onStartOver={() => setStep('select')} onBack={onBack} />
}
