"use client"

import { ChevronLeft, Plus, Calendar as CalendarIcon, User, X, Check, Clock, AlertCircle, FileText, Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type Absence = {
    id: string
    employe_id: string
    nom_employe: string
    type: string
    date_debut: string
    date_fin: string
    is_half_day: boolean
    commentaire: string
    statut: 'pending' | 'approved' | 'rejected'
}

export default function AbsencesPage() {
    const { role, profile, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [absences, setAbsences] = useState<Absence[]>([])
    const [employees, setEmployees] = useState<{ id: string, nom_employe: string }[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [salonId, setSalonId] = useState<string | null>(null)
    const [openingHours, setOpeningHours] = useState<any>(null)

    // Form State
    const [newAbsence, setNewAbsence] = useState({
        employe_id: '',
        type: 'Congé annuel',
        date_debut: '',
        date_fin: '',
        is_half_day: false,
        commentaire: '',
        piece_jointe: null as File | null
    })

    useEffect(() => {
        fetchData()
    }, [])

    // Lock employee for collaborators
    useEffect(() => {
        if (role === 'coiffeur' && profile?.id) {
            setNewAbsence(prev => ({ ...prev, employe_id: profile.id }))
        }
    }, [role, profile, showAddModal])

    async function fetchData() {
        setLoading(true)
        try {
            // Get Salon ID and Hours
            const { data: salonData } = await supabase.from('salons').select('id, horaires_ouverture').single()
            if (salonData) {
                setSalonId(salonData.id)
                setOpeningHours(salonData.horaires_ouverture)
            }

            // Fetch absences
            const { data: absData, error: absError } = await supabase.from('absences').select(`
                *,
                employes (nom_employe)
            `).order('date_debut', { ascending: true })

            if (absData) {
                setAbsences(absData.map(a => ({
                    ...a,
                    nom_employe: a.employes?.nom_employe || 'Inconnu'
                })))
            }

            const { data: empData } = await supabase.from('employes').select('id, nom_employe')
            if (empData) setEmployees(empData)

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!salonId) return alert('Erreur: Salon non identifié')

        // 1. Date Validation: Past dates
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = new Date(newAbsence.date_debut)
        const end = new Date(newAbsence.date_fin)

        if (start < today) {
            return alert("Impossible de poser un congé pour une date passée.")
        }

        // 2. Simple Validation: Check if salon is open on these days
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

        // Loop through dates
        let hasOpenDay = false
        const current = new Date(start)
        while (current <= end) {
            const dayName = daysOfWeek[current.getDay()]
            if (openingHours && openingHours[dayName]?.isOpen) {
                hasOpenDay = true
                break
            }
            current.setDate(current.getDate() + 1)
        }

        if (!hasOpenDay && openingHours) {
            return alert("Le salon est déjà fermé pendant toute cette période. Inutile d'enregistrer un congé !")
        }

        setSaving(true)
        try {
            const { error } = await supabase.from('absences').insert({
                employe_id: role === 'coiffeur' ? (profile?.id ?? '') : newAbsence.employe_id,
                salon_id: salonId,
                type: newAbsence.type,
                date_debut: newAbsence.date_debut,
                date_fin: newAbsence.date_fin,
                is_half_day: newAbsence.is_half_day,
                commentaire: newAbsence.commentaire,
                statut: 'pending'
            })

            if (error) throw error

            setShowAddModal(false)
            setNewAbsence({
                employe_id: role === 'coiffeur' ? (profile?.id ?? '') : '',
                type: 'Congé annuel',
                date_debut: '',
                date_fin: '',
                is_half_day: false,
                commentaire: '',
                piece_jointe: null
            })
            fetchData()
        } catch (err) {
            console.error(err)
            alert('Erreur lors de l\'ajout')
        } finally {
            setSaving(false)
        }
    }

    async function updateStatus(id: string, status: 'approved' | 'rejected') {
        let comment = ''
        if (status === 'rejected') {
            comment = prompt('Commentaire obligatoire pour le refus :') || ''
            if (!comment) return
        }

        try {
            const { error } = await supabase
                .from('absences')
                .update({ statut: status, updated_at: new Date().toISOString() })
                .match({ id })

            if (error) throw error
            fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20'
            default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        }
    }

    if (loading || authLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-primary" size={32} />
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
                    <h1 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Absences & Congés</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={20} />
                </button>
            </header >

            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Clock className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {absences.length === 0 && (
                            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 text-center space-y-3">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <CalendarIcon className="text-slate-200" size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800">Aucune absence enregistrée</h3>
                                <p className="text-xs text-slate-400">Ajoutez les congés de votre équipe ici.</p>
                            </div>
                        )}

                        {absences.map((abs) => (
                            <div key={abs.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-primary text-lg">
                                            {abs.nom_employe[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{abs.nom_employe}</h3>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">{abs.type}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase border ${getStatusStyle(abs.statut)}`}>
                                        {abs.statut === 'pending' ? 'En attente' : abs.statut === 'approved' ? 'Validé' : 'Refusé'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-2">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Début</p>
                                        <p className="text-sm font-bold text-slate-700">{new Date(abs.date_debut).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fin</p>
                                        <p className="text-sm font-bold text-slate-700">{new Date(abs.date_fin).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {abs.commentaire && (
                                    <p className="text-xs text-slate-500 bg-slate-50/50 p-3 rounded-xl italic">"{abs.commentaire}"</p>
                                )}

                                {abs.statut === 'pending' && role === 'manager' && (
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => updateStatus(abs.id, 'approved')}
                                            className="flex-1 bg-emerald-500 text-white rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                            <Check size={16} /> Valider
                                        </button>
                                        <button
                                            onClick={() => updateStatus(abs.id, 'rejected')}
                                            className="flex-1 bg-white border border-red-100 text-red-500 rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 active:scale-95 transition-all"
                                        >
                                            <X size={16} /> Refuser
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Ajout */}
            {
                showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 space-y-6 animate-in slide-in-from-bottom-full duration-300">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black italic uppercase tracking-tighter">Nouvelle Absence</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Collaborateur *</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            required
                                            disabled={role === 'coiffeur'}
                                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold appearance-none shadow-inner disabled:opacity-70 disabled:bg-slate-100"
                                            value={newAbsence.employe_id}
                                            onChange={e => setNewAbsence({ ...newAbsence, employe_id: e.target.value })}
                                        >
                                            <option value="">Sélectionner...</option>
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.nom_employe}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Type d'absence</label>
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold appearance-none shadow-inner"
                                        value={newAbsence.type}
                                        onChange={e => setNewAbsence({ ...newAbsence, type: e.target.value })}
                                    >
                                        <option>Congé annuel</option>
                                        <option>Maladie</option>
                                        <option>Formation</option>
                                        <option>Mariage</option>
                                        <option>Autre</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Du</label>
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner"
                                            value={newAbsence.date_debut}
                                            onChange={e => setNewAbsence({ ...newAbsence, date_debut: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Au</label>
                                        <input
                                            type="date"
                                            required
                                            min={newAbsence.date_debut || new Date().toISOString().split('T')[0]}
                                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner"
                                            value={newAbsence.date_fin}
                                            onChange={e => setNewAbsence({ ...newAbsence, date_fin: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl shadow-inner">
                                    <input
                                        type="checkbox"
                                        id="halfday"
                                        className="w-5 h-5 rounded-lg border-none text-primary focus:ring-primary bg-white shadow-sm"
                                        checked={newAbsence.is_half_day}
                                        onChange={e => setNewAbsence({ ...newAbsence, is_half_day: e.target.checked })}
                                    />
                                    <label htmlFor="halfday" className="text-sm font-bold text-slate-600">Demi-journée possible ?</label>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Commentaire (Optionnel)</label>
                                    <textarea
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner resize-none"
                                        rows={2}
                                        value={newAbsence.commentaire}
                                        onChange={e => setNewAbsence({ ...newAbsence, commentaire: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-black uppercase italic tracking-tighter shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? "Envoi..." : "Enregistrer la demande"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    )
}
