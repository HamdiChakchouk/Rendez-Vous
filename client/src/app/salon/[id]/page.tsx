import { supabase } from '@/lib/supabase'
import { Scissors, MapPin, Phone, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function SalonPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch Salon Data
    const { data: salon } = await supabase
        .from('salons')
        .select(`
            *,
            services (*)
        `)
        .eq('id', id)
        .single()

    if (!salon) {
        return notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="relative h-64 bg-primary text-white flex flex-col justify-end p-6 pb-12 rounded-b-[3rem] shadow-xl">
                <h1 className="text-3xl font-bold mb-2 tracking-tighter uppercase italic">{salon.nom_salon}</h1>
                <div className="flex items-center gap-2 text-sm opacity-90 font-medium">
                    <MapPin size={16} />
                    <span>{salon.adresse}</span>
                </div>
            </div>

            {/* Info Cards */}
            <div className="px-6 -mt-6 grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <Clock size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ouvert</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">09:00 - 19:00</p>
                </div>
                <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100/50 backdrop-blur-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <Phone size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Contact</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{salon.telephone}</p>
                </div>
            </div>

            {/* Description */}
            {salon.description && (
                <div className="p-6">
                    <p className="text-slate-500 leading-relaxed italic font-medium">
                        "{salon.description}"
                    </p>
                </div>
            )}

            {/* Services List */}
            <div className="p-6 pb-32">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 tracking-tighter uppercase italic text-slate-800">
                    <Scissors size={20} className="text-primary" />
                    Nos Services
                </h2>
                <div className="space-y-4">
                    {salon.services?.length === 0 && (
                        <div className="text-center p-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold text-sm">Aucun service disponible.</p>
                        </div>
                    )}
                    {salon.services?.map((service: any) => (
                        <Link key={service.id} href={`/book/${service.id}`} className="block group mt-4">
                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex justify-between items-center group overflow-hidden">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors leading-tight">{service.nom_service}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{service.duree_minutes} min</span>
                                        <div className="flex gap-1">
                                            {service.genre_cible?.map((g: string) => (
                                                <span key={g} className="px-1.5 py-0.5 bg-primary/5 text-primary text-[8px] font-black rounded-lg border border-primary/5 uppercase tracking-tighter">{g}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-primary text-lg">{service.prix} DT</span>
                                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom Nav / Booking CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 rounded-t-[2.5rem] z-30">
                <Link href="/book" className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center">
                    Prendre Rendez-Vous
                </Link>
            </div>
        </div>
    )
}
