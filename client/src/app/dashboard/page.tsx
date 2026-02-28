"use client"

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, Users, Scissors, Settings, Bell, Search, CheckCircle, XCircle, User, LogOut, Loader2, Plus, Phone, Clock as ClockIcon } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function SalonDashboard() {
    const { profile, role, loading: authLoading, signOut } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState([
        { label: "RDV Aujourd'hui", value: "0", color: "bg-blue-500" },
        { label: "Nouveaux Clients", value: "0", color: "bg-emerald-500" },
        { label: "Total CA (Jour)", value: "0 DT", color: "bg-purple-500" }
    ])

    const [appointments, setAppointments] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [salonId, setSalonId] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        if (!authLoading && !profile) {
            router.push('/login')
            return
        }
        if (profile) {
            fetchDashboardData().catch(() => setLoading(false))
        } else if (!authLoading) {
            setLoading(false)
        }
    }, [profile, authLoading])

    async function fetchDashboardData() {
        if (!profile || !profile.salon_id) {
            setLoading(false)
            return
        }
        setLoading(true)
        const currentSalonId = profile.salon_id
        setSalonId(currentSalonId)

        try {

            // 2. Get Services & Employees
            const [servicesRes, employeesRes] = await Promise.all([
                supabase.from('services').select('*').eq('salon_id', currentSalonId).order('nom_service'),
                supabase.from('employes').select('*').eq('salon_id', currentSalonId).order('nom_employe')
            ])

            if (servicesRes.data) setServices(servicesRes.data)
            if (employeesRes.data) setEmployees(employeesRes.data)

            // 3. Get Today's Appointments
            const today = new Date().toISOString().split('T')[0]
            const { data: appointmentsData } = await supabase
                .from('rendez_vous')
                .select(`
                    *,
                    client:clients(nom_client),
                    service:services(nom_service),
                    employe:employes(nom_employe)
                `)
                .eq('salon_id', currentSalonId)
                .eq('date_rdv', today)
                .order('heure_rdv', { ascending: true })

            if (appointmentsData) {
                const formatted = appointmentsData.map(apt => ({
                    id: apt.id,
                    time: apt.heure_rdv.substring(0, 5),
                    client: apt.client?.nom_client || 'Client Anonyme',
                    service: apt.service?.nom_service || 'Service inconnu',
                    employee: apt.employe?.nom_employe || 'Non assigné',
                    status: apt.statut
                }))
                setAppointments(formatted)

                // Update Stats
                const totalCA = appointmentsData
                    .filter(a => a.statut !== 'cancelled')
                    .reduce((acc, curr) => acc + Number(curr.service?.prix || 0), 0)

                setStats([
                    { label: "RDV Aujourd'hui", value: appointmentsData.length.toString(), color: "bg-blue-500" },
                    { label: "Nouveaux Clients", value: "+0", color: "bg-emerald-500" },
                    { label: "Total CA (Jour)", value: `${totalCA} DT`, color: "bg-purple-500" }
                ])
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const [newApt, setNewApt] = useState({
        nom_client: '',
        telephone: '',
        service_id: '',
        employe_id: '',
        heure_rdv: ''
    })
    const [saving, setSaving] = useState(false)

    async function handleQuickAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!salonId) return alert('Erreur: Salon non identifié')
        setSaving(true)

        try {
            console.log('Starting handleQuickAdd', { newApt, salonId })
            // 1. Check/Create Client
            let clientId: string

            const { data: existingClient, error: findError } = await supabase
                .from('clients')
                .select('id')
                .eq('telephone', newApt.telephone)
                .single()

            console.log('Find client result:', { existingClient, findError })

            if (existingClient) {
                clientId = existingClient.id
            } else {
                console.log('Creating new client...')
                const { data: newClient, error: clientErr } = await supabase
                    .from('clients')
                    .insert({
                        telephone: newApt.telephone,
                        nom_client: newApt.nom_client
                    })
                    .select()
                    .single()

                if (clientErr) {
                    console.error('Client creation error:', clientErr)
                    throw clientErr
                }
                clientId = newClient.id
                console.log('New client created:', clientId)
            }

            // 2. Insert Appointment
            const today = new Date().toISOString().split('T')[0]
            const fullTime = `${newApt.heure_rdv}:00`

            console.log('Inserting appointment:', { salonId, clientId, date: today, time: fullTime })

            const { error: aptErr } = await supabase
                .from('rendez_vous')
                .insert({
                    salon_id: salonId,
                    client_id: clientId,
                    service_id: newApt.service_id,
                    employe_id: newApt.employe_id || null,
                    date_rdv: today,
                    heure_rdv: fullTime,
                    statut: 'pending'
                })

            if (aptErr) {
                console.error('Appointment insert error:', aptErr)
                throw aptErr
            }

            console.log('Appointment added successfully')
            // 3. Cleanup & Refresh
            setShowAddModal(false)
            setNewApt({
                nom_client: '',
                telephone: '',
                service_id: '',
                employe_id: '',
                heure_rdv: ''
            })
            fetchDashboardData()
        } catch (error: any) {
            console.error('Full catch error:', JSON.stringify(error, null, 2))
            alert(`Erreur: ${error.message || 'Ajout impossible'}`)
        } finally {
            setSaving(false)
        }
    }

    async function cancelAppointment(id: string) {
        if (!confirm('Annuler ce rendez-vous ?')) return
        try {
            const { error } = await supabase
                .from('rendez_vous')
                .update({ statut: 'cancelled_salon', cancelled_by: 'professional' })
                .eq('id', id)

            if (error) throw error
            fetchDashboardData()
        } catch (error: any) {
            console.error('Error cancelling appointment:', error)
            alert(`Erreur: ${error.message || 'Annulation impossible'}`)
        }
    }

    async function confirmAppointment(id: string) {
        try {
            const { error } = await supabase
                .from('rendez_vous')
                .update({ statut: 'confirmed', confirmed_at: new Date().toISOString() })
                .eq('id', id)

            if (error) throw error
            fetchDashboardData()
        } catch (error) {
            console.error('Error confirming appointment:', error)
        }
    }

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    const isManager = role === 'manager'
    const userName = isManager ? profile?.nom_admin : profile?.nom_employe

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white p-6 flex justify-between items-center shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-8">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 italic uppercase tracking-tighter">
                            {isManager ? "Élégance Carthage" : userName}
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {isManager ? "Dashboard Manager" : "Espace Collaborateur"}
                        </p>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                        <Link href="/dashboard" className="px-4 py-2 bg-white shadow-sm rounded-xl text-xs font-bold text-primary flex items-center gap-2">
                            <Calendar size={14} /> Agenda
                        </Link>
                        <Link href="/dashboard/absences" className="px-4 py-2 hover:bg-white/50 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-2 transition-all">
                            <Scissors size={14} className="rotate-90" /> Congés
                        </Link>
                        {isManager && (
                            <>
                                <Link href="/dashboard/config" className="px-4 py-2 hover:bg-white/50 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-2 transition-all">
                                    <Settings size={14} /> Configuration
                                </Link>
                                <Link href="/dashboard/settings" className="px-4 py-2 hover:bg-white/50 rounded-xl text-xs font-bold text-slate-500 flex items-center gap-2 transition-all">
                                    <User size={14} /> Profil Salon
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSignOut}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Déconnexion"
                    >
                        <LogOut size={20} />
                    </button>
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 uppercase">
                        {userName?.substring(0, 2) || "Pro"}
                    </div>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="p-6 flex-1 bg-white mx-6 rounded-t-[2.5rem] shadow-xl shadow-slate-200">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-slate-800">Prochains Rendez-vous</h2>
                    <div className="flex gap-2">
                        <button className="p-2 border border-slate-100 rounded-xl">
                            <Calendar size={18} className="text-slate-400" />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Plus size={18} /> Nouveau RDV
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {appointments.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-slate-50 rounded-[2.5rem] space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                <Calendar size={32} />
                            </div>
                            <p className="text-slate-400 font-medium italic">Aucun rendez-vous aujourd'hui</p>
                        </div>
                    ) : appointments.map((apt) => (
                        <div key={apt.id} className={`p-4 rounded-2xl border ${apt.status.startsWith('cancelled') ? 'bg-slate-50/30 border-slate-100 opacity-60' : 'bg-slate-50/50 border-slate-50'} flex items-center justify-between`}>
                            <div className="flex items-center gap-4">
                                <div className="bg-white w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Heure</span>
                                    <span className="font-bold text-slate-800">{apt.time}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{apt.client}</h3>
                                    <p className="text-xs text-slate-500">{apt.service} • {apt.employee}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {apt.status === 'pending' || apt.status === 'confirmed' ? (
                                    <>
                                        {apt.status === 'pending' && (
                                            <button
                                                onClick={() => confirmAppointment(apt.id)}
                                                className="p-2 bg-white rounded-xl text-emerald-500 border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-colors"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => cancelAppointment(apt.id)}
                                            className="p-2 bg-white rounded-xl text-red-500 border border-red-100 shadow-sm hover:bg-red-50 transition-colors"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-[10px] font-black px-3 py-1 bg-red-100 text-red-600 rounded-lg uppercase tracking-wider font-mono">Annulé</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 space-y-6 animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter">Nouveau Rendez-vous</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-100 rounded-full">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Client *</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nom..."
                                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner"
                                            value={newApt.nom_client}
                                            onChange={e => setNewApt({ ...newApt, nom_client: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Téléphone *</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            required
                                            placeholder="Numéro..."
                                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner"
                                            value={newApt.telephone}
                                            onChange={e => setNewApt({ ...newApt, telephone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Service *</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold appearance-none shadow-inner"
                                    value={newApt.service_id}
                                    onChange={e => setNewApt({ ...newApt, service_id: e.target.value })}
                                >
                                    <option value="">Sélectionner une prestation...</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.nom_service} - {Number(s.prix)}DT</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Coiffeur (Optionnel)</label>
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold appearance-none shadow-inner"
                                        value={newApt.employe_id}
                                        onChange={e => setNewApt({ ...newApt, employe_id: e.target.value })}
                                    >
                                        <option value="">Tous</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.nom_employe}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Heure *</label>
                                    <div className="relative">
                                        <ClockIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="time"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-inner"
                                            value={newApt.heure_rdv}
                                            onChange={e => setNewApt({ ...newApt, heure_rdv: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary text-white rounded-2xl py-4 font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? "Enregistrement..." : "Bloquer le créneau"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Persistent Bottom Nav (Mobile) */}
            <footer className="bg-white border-t border-slate-100 p-4 flex justify-around items-center rounded-t-3xl md:hidden sticky bottom-0">
                <Link href="/dashboard" className="text-primary flex flex-col items-center gap-1">
                    <Calendar size={20} />
                    <span className="text-[10px] font-bold tracking-tighter">Agenda</span>
                </Link>
                <Link href="/dashboard/absences" className="text-slate-300 flex flex-col items-center gap-1">
                    <Scissors size={20} className="rotate-90" />
                    <span className="text-[10px] font-bold tracking-tighter">Congés</span>
                </Link>
                <Link href="/dashboard/config" className="text-slate-300 flex flex-col items-center gap-1">
                    <Settings size={20} />
                    <span className="text-[10px] font-bold tracking-tighter">Config</span>
                </Link>
                <Link href="/dashboard/settings" className="text-slate-300 flex flex-col items-center gap-1">
                    <User size={20} />
                    <span className="text-[10px] font-bold tracking-tighter">Profil</span>
                </Link>
            </footer>
        </div>
    )
}
