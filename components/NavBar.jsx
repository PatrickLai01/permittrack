'use client'

import { Building2, LayoutDashboard, FolderOpen, Globe, Settings, Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: FolderOpen,      label: 'My Permits' },
  { icon: Globe,           label: 'Cities' },
  { icon: Settings,        label: 'Settings' },
]

export default function NavBar({ onLogoClick, sidebarOpen, setSidebarOpen }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2"
          aria-label="Go to home"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#1e3a5f]">
            <Building2 size={16} className="text-white" />
          </div>
          <span className="text-[#1e3a5f] font-bold text-lg tracking-tight">
            Permit<span className="text-[#22c55e]">Track</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                         text-slate-600 hover:text-[#1e3a5f] hover:bg-slate-100 transition-colors"
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white animate-fade-in">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-3 w-full px-5 py-3 text-sm font-medium
                         text-slate-700 hover:bg-slate-50 border-b border-slate-100"
            >
              <Icon size={16} className="text-[#1e3a5f]" />
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
