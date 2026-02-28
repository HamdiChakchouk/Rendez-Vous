import Link from 'next/link'
import { CalendarDays, LayoutDashboard, Settings2, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="w-full max-w-2xl text-center space-y-12">
        {/* Logo & Headline */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm mb-4">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">MVP Rendez-Vous.tn</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight italic">
            RDV<span className="text-primary">.TN</span>
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

        {/* Footer simple */}
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">
          Design Premium • Ready for Production
        </p>
      </div>
    </div>
  )
}
