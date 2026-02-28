"use client"

import Link from 'next/link'
import { Scissors, Sparkles, Clock, Star, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/services')
            .then(res => res.json())
            .then(data => {
                if (data.success) setServices(data.services)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24">
            <div className="max-w-md mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-slate-900 italic mb-2 tracking-tighter uppercase">Nos Services</h1>
                    <p className="text-slate-500 text-sm font-medium">Choisissez votre soin pour continuer</p>
                </header>

                <div className="space-y-4">
                    {services.length === 0 && !loading && (
                        <div className="text-center p-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">Aucun service disponible pour le moment.</p>
                        </div>
                    )}

                    {services.map((service) => (
                        <Link key={service.id} href={`/book/${service.id}`} className="block group">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                                        <Scissors size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{service.nom_service}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-xs text-slate-400 font-black uppercase">
                                                <Clock size={12} /> {service.duree_minutes} min
                                            </span>
                                            <span className="text-primary font-black text-sm uppercase">{service.prix} DT</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 p-8 bg-slate-900 rounded-[3rem] text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={48} />
                    </div>
                    <p className="text-[10px] font-black text-primary mb-2 uppercase tracking-[0.2em]">Offre Bienvenue</p>
                    <p className="text-sm font-bold text-slate-100 italic leading-relaxed">Profitez de -10% sur votre première réservation aujourd'hui !</p>
                </div>
            </div>
        </div>
    )
}
