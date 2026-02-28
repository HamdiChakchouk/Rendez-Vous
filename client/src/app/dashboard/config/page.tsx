"use client"

import { ChevronLeft, Plus, Trash2, Save, Scissors, UserCheck, Image as ImageIcon, X, Clock, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConfigPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [services, setServices] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [salonId, setSalonId] = useState<string | null>(null)
    const [openingHours, setOpeningHours] = useState<any>({
        monday: { isOpen: true, open: '09:00', close: '19:00' },
        tuesday: { isOpen: true, open: '09:00', close: '19:00' },
        wednesday: { isOpen: true, open: '09:00', close: '19:00' },
        thursday: { isOpen: true, open: '09:00', close: '19:00' },
        friday: { isOpen: true, open: '09:00', close: '19:00' },
        saturday: { isOpen: true, open: '09:00', close: '19:00' },
        sunday: { isOpen: false, open: '09:00', close: '19:00' }
    })

    // New Service Modal State
    const [showAddService, setShowAddService] = useState(false)
    const [newService, setNewService] = useState({
        nom_service: '',
        prix: '',
        duree_minutes: '30',
        genre_cible: ['Unisexe'],
        photos_exemples: [] as string[]
    })

    // New Employee Modal State
    const [showAddEmployee, setShowAddEmployee] = useState(false)
    const [newEmployee, setNewEmployee] = useState({ prenom: '', nom: '', telephone: '', email: '' })
    const [employeeSaving, setEmployeeSaving] = useState(false)
    const [employeeMsg, setEmployeeMsg] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            // Get Salon ID and Hours
            const { data: salonData } = await supabase.from('salons').select('id, horaires_ouverture').single()
            if (salonData) {
                setSalonId(salonData.id)
                if (salonData.horaires_ouverture) {
                    setOpeningHours(salonData.horaires_ouverture)
                }
            }

            const { data: servs } = await supabase.from('services').select('*').order('created_at', { ascending: false })
            if (servs) setServices(servs)

            const { data: emps } = await supabase.from('employes').select('*').order('created_at', { ascending: false })
            if (emps) setEmployees(emps)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddService(e: React.FormEvent) {
        e.preventDefault()
        if (!salonId) return alert('Erreur: Salon non identifié')
        setSaving(true)
        try {
            const { error } = await supabase.from('services').insert({
                nom_service: newService.nom_service,
                prix: parseFloat(newService.prix),
                duree_minutes: parseInt(newService.duree_minutes),
                genre_cible: newService.genre_cible,
                photos_exemples: newService.photos_exemples,
                salon_id: salonId
            })

            if (error) throw error
            setShowAddService(false)
            setNewService({ nom_service: '', prix: '', duree_minutes: '30', genre_cible: ['Unisexe'], photos_exemples: [] })
            fetchData()
        } catch (err: any) {
            console.error("Détails de l'erreur:", err)
            const errorMsg = err.message || err.details || JSON.stringify(err)
            alert(`Erreur lors de l'ajout: ${errorMsg}`)
        } finally {
            setSaving(false)
        }
    }

    async function deleteService(id: string) {
        if (!confirm('Supprimer ce service ?')) return
        try {
            await supabase.from('services').delete().match({ id })
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    async function handleAddEmployee(e: React.FormEvent) {
        e.preventDefault()
        if (!newEmployee.prenom || !newEmployee.nom) return

        setEmployeeSaving(true)
        setEmployeeMsg(null)
        try {
            const res = await fetch('/api/manager/create-coiffeur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployee),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setEmployeeMsg(data.message)
            setNewEmployee({ prenom: '', nom: '', telephone: '', email: '' })
            fetchData()
            setTimeout(() => { setShowAddEmployee(false); setEmployeeMsg(null) }, 2000)
        } catch (err: any) {
            alert('Erreur: ' + (err.message || JSON.stringify(err)))
        } finally {
            setEmployeeSaving(false)
        }
    }

    async function deleteEmployee(id: string) {
        if (!confirm('Supprimer ce collaborateur ?')) return
        try {
            const { error } = await supabase.from('employes').delete().match({ id })
            if (error) throw error
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    const toggleGenre = (genre: string) => {
        setNewService(prev => ({
            ...prev,
            genre_cible: prev.genre_cible.includes(genre)
                ? prev.genre_cible.filter(g => g !== genre)
                : [...prev.genre_cible, genre]
        }))
    }

    async function handleSaveHours() {
        if (!salonId) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('salons')
                .update({ horaires_ouverture: openingHours })
                .match({ id: salonId })

            if (error) throw error
            alert('Planning mis à jour avec succès !')
        } catch (err) {
            console.error(err)
            alert('Erreur lors de la sauvegarde du planning')
        } finally {
            setSaving(false)
        }
    }

    const toggleDay = (day: string) => {
        setOpeningHours((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], isOpen: !prev[day].isOpen }
        }))
    }

    const updateTime = (day: string, type: 'open' | 'close', value: string) => {
        setOpeningHours((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], [type]: value }
        }))
    }

    const daysMap: Record<string, string> = {
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
        sunday: 'Dimanche'
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <ChevronLeft size={24} className="text-slate-600" />
                    </Link>
                    <h1 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Configuration</h1>
                </div>
                <button
                    onClick={handleSaveHours}
                    disabled={saving}
                    className="bg-emerald-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    <Save size={18} /> {saving ? '...' : 'Enregistrer'}
                </button>
            </header>

            <div className="p-4 space-y-8 max-w-2xl mx-auto">
                {/* Services Section */}
                <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Scissors size={18} className="text-primary" /> Vos Services
                        </h2>
                        <button
                            onClick={() => setShowAddService(true)}
                            className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary hover:text-white transition-all"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {services.map((s) => (
                            <div key={s.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800">{s.nom_service}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">{s.duree_minutes} min • {s.prix} DT</p>
                                        <div className="flex gap-1">
                                            {s.genre_cible?.map((g: string) => (
                                                <span key={g} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-bold rounded uppercase tracking-tighter border border-primary/10">{g}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteService(s.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Employees Section */}
                <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <UserCheck size={18} className="text-primary" /> Collaborateurs
                        </h2>
                        <button
                            onClick={() => setShowAddEmployee(true)}
                            className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary hover:text-white transition-all"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {employees.map((emp) => (
                            <div key={emp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2 group relative">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-lg font-black text-slate-300 group-hover:text-primary transition-colors">
                                    {emp.nom_employe[0]}
                                </div>
                                <h3 className="text-xs font-bold text-slate-800">{emp.nom_employe}</h3>
                                <button
                                    onClick={() => deleteEmployee(emp.id)}
                                    className="absolute top-2 right-2 text-slate-200 hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Planning Section */}
                <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} className="text-primary" /> Planning & Horaires
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {Object.keys(daysMap).map((day) => (
                            <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleDay(day)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${openingHours[day].isOpen ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-200 text-slate-400'}`}
                                    >
                                        <Clock size={14} />
                                    </button>
                                    <div>
                                        <span className="font-bold text-slate-800">{daysMap[day]}</span>
                                        <p className="text-[10px] uppercase font-black text-slate-400">
                                            {openingHours[day].isOpen ? 'Ouvert' : 'Fermé'}
                                        </p>
                                    </div>
                                </div>

                                {openingHours[day].isOpen && (
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                                        <input
                                            type="time"
                                            value={openingHours[day].open}
                                            onChange={(e) => updateTime(day, 'open', e.target.value)}
                                            className="text-xs font-bold border-none bg-transparent p-0 focus:ring-0 w-16"
                                        />
                                        <span className="text-slate-300 font-bold">-</span>
                                        <input
                                            type="time"
                                            value={openingHours[day].close}
                                            onChange={(e) => updateTime(day, 'close', e.target.value)}
                                            className="text-xs font-bold border-none bg-transparent p-0 focus:ring-0 w-16"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Modal Nouveau Service */}
            {showAddService && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 space-y-6 animate-in slide-in-from-bottom-full duration-300 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Nouveau Service</h2>
                            <button onClick={() => setShowAddService(false)} className="p-2 bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddService} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nom du service *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner"
                                        placeholder="Ex: Coupe Dégradée"
                                        value={newService.nom_service}
                                        onChange={e => setNewService({ ...newService, nom_service: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Prix (DT)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner"
                                            value={newService.prix}
                                            onChange={e => setNewService({ ...newService, prix: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Durée (Min)</label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner"
                                            value={newService.duree_minutes}
                                            onChange={e => setNewService({ ...newService, duree_minutes: e.target.value })}
                                        >
                                            <option value="15">15 min</option>
                                            <option value="30">30 min</option>
                                            <option value="45">45 min</option>
                                            <option value="60">1h 00</option>
                                            <option value="90">1h 30</option>
                                            <option value="120">2h 00</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Genre Cible</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Homme', 'Femme', 'Unisexe', 'Enfant'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => toggleGenre(g)}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${newService.genre_cible.includes(g)
                                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Photos exemple (Optionnel)</label>
                                    <button
                                        type="button"
                                        className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/20 transition-all"
                                    >
                                        <ImageIcon size={32} />
                                        <span className="text-[10px] font-black uppercase mt-2">Ajouter des photos</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary text-white rounded-3xl py-5 font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? "Création..." : "Ajouter le service"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Nouveau Collaborateur */}
            {showAddEmployee && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 space-y-5 animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-800">Nouveau Coiffeur</h2>
                            <button onClick={() => { setShowAddEmployee(false); setEmployeeMsg(null) }} className="p-2 bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {employeeMsg && (
                            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                                <CheckCircle size={16} /> {employeeMsg}
                            </div>
                        )}

                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Prénom *</label>
                                    <input type="text" required placeholder="Prénom"
                                        value={newEmployee.prenom}
                                        onChange={e => setNewEmployee({ ...newEmployee, prenom: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nom *</label>
                                    <input type="text" required placeholder="Nom"
                                        value={newEmployee.nom}
                                        onChange={e => setNewEmployee({ ...newEmployee, nom: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold shadow-inner"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Téléphone</label>
                                <input type="tel" placeholder="+216 XX XXX XXX"
                                    value={newEmployee.telephone}
                                    onChange={e => setNewEmployee({ ...newEmployee, telephone: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email (optionnel — accès dashboard)</label>
                                <input type="email" placeholder="email@coiffeur.tn"
                                    value={newEmployee.email}
                                    onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold shadow-inner"
                                />
                                {newEmployee.email && <p className="text-[10px] text-slate-400 mt-1 ml-2">Un email d'activation sera envoyé à cette adresse.</p>}
                            </div>
                            <button type="submit" disabled={employeeSaving}
                                className="w-full bg-primary text-white rounded-3xl py-4 font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {employeeSaving ? <Loader2 size={20} className="animate-spin" /> : 'Ajouter au salon'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
