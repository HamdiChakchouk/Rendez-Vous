"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
    Building2, Users, CheckCircle, Upload, Phone, Mail, User,
    ChevronRight, ChevronLeft, Loader2, Plus, Trash2, Scissors
} from 'lucide-react'

type Step = 1 | 2 | 3

interface CoiffeurEntry {
    prenom: string
    nom: string
    telephone: string
    email: string
}

export default function OnboardingPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [step, setStep] = useState<Step>(1)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<string | null>(null)

    // Step 1 state — Salon info
    const [salon, setSalon] = useState({
        nom_salon: '',
        adresse: '',
        telephone: '',
        logo_url: '',
    })
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    // Step 2 state — Coiffeurs
    const [coiffeurs, setCoiffeurs] = useState<CoiffeurEntry[]>([
        { prenom: '', nom: '', telephone: '', email: '' }
    ])
    const [coiffeursAdded, setCoiffeursAdded] = useState<string[]>([])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }
        if (!authLoading && profile?.onboarding_completed) {
            router.push('/dashboard')
            return
        }
        // Pre-fill salon name if available
        if (profile?.salon_id) {
            supabase.from('salons').select('nom_salon, adresse, telephone').eq('id', profile.salon_id).single()
                .then(({ data }) => {
                    if (data) setSalon(s => ({
                        ...s,
                        nom_salon: data.nom_salon || '',
                        adresse: data.adresse || '',
                        telephone: data.telephone || '',
                    }))
                })
        }
    }, [user, profile, authLoading])

    function showToast(msg: string) {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
    }

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.salon_id) return
        setSaving(true)
        try {
            let logo_url = salon.logo_url

            // Upload logo if selected
            if (logoFile) {
                const ext = logoFile.name.split('.').pop()
                const path = `salons/${profile.salon_id}/logo.${ext}`
                const { error: uploadErr } = await supabase.storage
                    .from('salon-assets')
                    .upload(path, logoFile, { upsert: true })
                if (!uploadErr) {
                    const { data: urlData } = supabase.storage.from('salon-assets').getPublicUrl(path)
                    logo_url = urlData.publicUrl
                }
            }

            const { error } = await supabase
                .from('salons')
                .update({
                    nom_salon: salon.nom_salon,
                    adresse: salon.adresse || null,
                    telephone: salon.telephone || null,
                    logo_url: logo_url || null,
                })
                .eq('id', profile.salon_id)

            if (error) throw error
            setStep(2)
        } catch (err: any) {
            showToast(`Erreur: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    const handleAddCoiffeur = async (c: CoiffeurEntry, index: number) => {
        if (!c.nom || !c.prenom) {
            showToast('Nom et prénom obligatoires')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/manager/create-coiffeur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(c),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setCoiffeursAdded(prev => [...prev, `${c.prenom} ${c.nom}`])
            showToast(`✓ ${c.prenom} ${c.nom} ajouté !`)
            // Remove from list after successful add
            setCoiffeurs(prev => prev.filter((_, i) => i !== index))
        } catch (err: any) {
            showToast(`Erreur: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    const handleFinish = async () => {
        if (!user) return
        setSaving(true)
        try {
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id)
            setStep(3)
        } catch (err: any) {
            showToast(`Erreur: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    const steps = [
        { num: 1, label: 'Mon Salon', icon: Building2 },
        { num: 2, label: 'Mon Équipe', icon: Users },
        { num: 3, label: 'C\'est parti !', icon: CheckCircle },
    ]

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    {toast}
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white">
                        <Scissors size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">VibeRdv</p>
                        <p className="font-black text-slate-800 text-sm">Configuration du salon</p>
                    </div>
                </div>
                <p className="text-xs text-slate-400 font-medium">Étape {step}/3</p>
            </header>

            {/* Progress */}
            <div className="bg-white px-6 pb-6">
                <div className="flex items-center gap-2 max-w-lg mx-auto">
                    {steps.map((s, i) => (
                        <div key={s.num} className="flex items-center flex-1">
                            <div className={`flex flex-col items-center gap-1 ${step >= s.num ? 'text-primary' : 'text-slate-300'}`}>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${step > s.num ? 'bg-primary text-white' :
                                        step === s.num ? 'bg-primary/10 text-primary border-2 border-primary' :
                                            'bg-slate-100 text-slate-300'
                                    }`}>
                                    {step > s.num ? <CheckCircle size={20} /> : <s.icon size={18} />}
                                </div>
                                <span className="text-[10px] font-black tracking-tighter">{s.label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all ${step > s.num ? 'bg-primary' : 'bg-slate-100'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 max-w-lg mx-auto w-full">

                {/* STEP 1 — Salon Info */}
                {step === 1 && (
                    <form onSubmit={handleStep1Submit} className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Configurez votre salon</h2>
                            <p className="text-slate-500 text-sm mt-1">Ces informations apparaîtront sur votre page publique.</p>
                        </div>

                        {/* Logo Upload */}
                        <div className="flex flex-col items-center">
                            <label className="cursor-pointer group">
                                <div className={`w-24 h-24 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all
                                    ${logoPreview ? 'border-primary' : 'border-slate-200 hover:border-primary/50'}`}
                                    style={logoPreview ? {
                                        backgroundImage: `url(${logoPreview})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    } : {}}
                                >
                                    {!logoPreview && (
                                        <>
                                            <Upload size={24} className="text-slate-300 group-hover:text-primary transition-colors" />
                                            <span className="text-[10px] text-slate-400 mt-1">Logo</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            </label>
                            <p className="text-xs text-slate-400 mt-2">Cliquer pour ajouter un logo (optionnel)</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Nom du salon *</label>
                                <input
                                    type="text" required
                                    value={salon.nom_salon}
                                    onChange={e => setSalon({ ...salon, nom_salon: e.target.value })}
                                    placeholder="Ex: Élégance Carthage"
                                    className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Adresse</label>
                                <input
                                    type="text"
                                    value={salon.adresse}
                                    onChange={e => setSalon({ ...salon, adresse: e.target.value })}
                                    placeholder="Ex: 12 Rue de Carthage, Tunis"
                                    className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Téléphone du salon</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={salon.telephone}
                                        onChange={e => setSalon({ ...salon, telephone: e.target.value })}
                                        placeholder="+216 XX XXX XXX"
                                        className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit" disabled={saving}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <>Suivant <ChevronRight size={20} /></>}
                        </button>
                    </form>
                )}

                {/* STEP 2 — Team */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Votre équipe</h2>
                            <p className="text-slate-500 text-sm mt-1">Ajoutez vos coiffeurs. Vous pouvez en ajouter d'autres plus tard.</p>
                        </div>

                        {/* Added coiffeurs */}
                        {coiffeursAdded.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">✓ Ajoutés</p>
                                {coiffeursAdded.map(name => (
                                    <div key={name} className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                        <CheckCircle size={18} className="text-emerald-500" />
                                        <span className="font-bold text-sm text-emerald-800">{name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Forms for pending coiffeurs */}
                        {coiffeurs.map((c, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="font-black text-sm uppercase tracking-tighter text-slate-700">Coiffeur {coiffeursAdded.length + i + 1}</p>
                                    {coiffeurs.length > 1 && (
                                        <button onClick={() => setCoiffeurs(prev => prev.filter((_, idx) => idx !== i))}
                                            className="text-slate-300 hover:text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Prénom *</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text" placeholder="Prénom" value={c.prenom}
                                                onChange={e => setCoiffeurs(prev => prev.map((x, idx) => idx === i ? { ...x, prenom: e.target.value } : x))}
                                                className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-3 text-sm font-bold shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Nom *</label>
                                        <input type="text" placeholder="Nom" value={c.nom}
                                            onChange={e => setCoiffeurs(prev => prev.map((x, idx) => idx === i ? { ...x, nom: e.target.value } : x))}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Téléphone</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="tel" placeholder="+216 XX XXX XXX" value={c.telephone}
                                            onChange={e => setCoiffeurs(prev => prev.map((x, idx) => idx === i ? { ...x, telephone: e.target.value } : x))}
                                            className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-3 text-sm font-bold shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Email (optionnel — pour accès dashboard)</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="email" placeholder="email@coiffeur.tn" value={c.email}
                                            onChange={e => setCoiffeurs(prev => prev.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x))}
                                            className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-3 text-sm font-bold shadow-inner"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddCoiffeur(c, i)}
                                    disabled={saving || !c.prenom || !c.nom}
                                    className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} />Ajouter ce coiffeur</>}
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={() => setCoiffeurs(prev => [...prev, { prenom: '', nom: '', telephone: '', email: '' }])}
                            className="w-full border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Ajouter un autre coiffeur
                        </button>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-800 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleFinish}
                                disabled={saving}
                                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={20} className="animate-spin" /> : <>Terminer la configuration <ChevronRight size={20} /></>}
                            </button>
                        </div>
                        {coiffeursAdded.length === 0 && (
                            <p className="text-center text-xs text-slate-400">Vous pouvez passer cette étape et ajouter des coiffeurs plus tard depuis votre dashboard.</p>
                        )}
                    </div>
                )}

                {/* STEP 3 — Welcome */}
                {step === 3 && (
                    <div className="flex flex-col items-center justify-center text-center space-y-8 py-10">
                        <div className="relative">
                            <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center">
                                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/40">
                                    <CheckCircle size={40} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-slate-800 italic">Votre salon est prêt !</h2>
                            <p className="text-slate-500 leading-relaxed max-w-sm">
                                Bienvenue sur <strong>VibeRdv</strong> ! Votre espace est configuré.
                                Commencez à gérer vos rendez-vous dès maintenant.
                            </p>
                        </div>
                        <div className="w-full bg-slate-50 rounded-3xl p-6 space-y-3 text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ce qui vous attend</p>
                            {['Gestion des RDV en temps réel', 'Planning de votre équipe', 'Notifications automatiques clients', 'Statistiques de votre activité'].map(item => (
                                <div key={item} className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                                        <CheckCircle size={12} className="text-primary" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{item}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                        >
                            Accéder à mon dashboard <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
