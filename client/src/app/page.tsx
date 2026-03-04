'use client'

import Link from 'next/link'
import { CalendarDays, LayoutDashboard, Settings2, Sparkles } from 'lucide-react'
import ProfileDropdown from '@/components/ProfileDropdown'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">

      {/* ── Top Bar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-black tracking-widest uppercase text-slate-800">Reservy</span>
          </div>
          <ProfileDropdown />
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="w-full max-w-2xl text-center space-y-12">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight italic">
              Reservy<span className="text-primary">.tn</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-sm mx-auto leading-relaxed">
              La plateforme de réservation beauté en Tunisie. Simplifiez vos rendez-vous.
            </p>
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 gap-4">
            <Link href="/book" className="group">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex items-center gap-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-500">
                  <CalendarDays size={28} />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-800">Espace Client</h3>
                  <p className="text-sm text-slate-500">Réservez votre prochain soin en 1 minute.</p>
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/dashboard" className="group">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 flex flex-col gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:text-primary transition-colors">
                    <LayoutDashboard size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">Espace Salon</h3>
                    <p className="text-xs text-slate-500">Gérez vos rendez-vous et votre équipe.</p>
                  </div>
                </div>
              </Link>

              <Link href="/admin" className="group">
                <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-lg hover:bg-slate-800 transition-all duration-300 flex flex-col gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white/50 group-hover:text-primary transition-colors">
                    <Settings2 size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white">Administration</h3>
                    <p className="text-xs text-slate-400">Gestion globale de la plateforme.</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Pro Link */}
          <div className="pt-4">
            <Link href="/pro" className="text-sm font-semibold text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2 group">
              Professionnel de la beauté ?
              <span className="text-slate-600 group-hover:text-primary underline decoration-slate-300 underline-offset-4">Rejoignez Reservy</span>
              <Sparkles size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          {/* Footer */}
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">
            Reservy • Design Premium
          </p>
        </div>
      </div>
    </div>
  )
}
