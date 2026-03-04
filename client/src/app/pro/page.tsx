"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    Calendar, Users, BarChart3, Clock, Scissors, Star,
    CheckCircle, ArrowRight, Zap, Shield, Globe, ChevronDown
} from 'lucide-react'

const FEATURES = [
    {
        icon: Calendar,
        title: 'Agenda en temps réel',
        desc: 'Visualisez et gérez tous vos rendez-vous sur mobile comme sur le web.',
        color: '#6366F1',
    },
    {
        icon: Users,
        title: 'Gestion de l\'équipe',
        desc: 'Créez des comptes coiffeurs, gérez les plannings et les absences.',
        color: '#10B981',
    },
    {
        icon: BarChart3,
        title: 'Statistiques & CA',
        desc: 'Suivez votre chiffre d\'affaires journalier et vos KPIs en un coup d\'œil.',
        color: '#F59E0B',
    },
    {
        icon: Clock,
        title: 'Congés & Absences',
        desc: 'Gérez les demandes de congés avec un workflow de validation complet.',
        color: '#EC4899',
    },
    {
        icon: Shield,
        title: 'Zéro no-show',
        desc: 'Confirmation automatique par SMS et détection des clients à risque.',
        color: '#3B82F6',
    },
    {
        icon: Globe,
        title: 'Visibilité en ligne',
        desc: 'Votre salon référencé sur Reservy pour attirer de nouveaux clients.',
        color: '#8B5CF6',
    },
]

const TESTIMONIALS = [
    { name: 'Haifa B.', role: 'Gérante, Salon Élégance Carthage', text: 'Depuis Reservy, mes réservations ont augmenté de 40% et je ne perds plus de temps au téléphone.' },
    { name: 'Mehdi T.', role: 'Barbershop La Marsa', text: 'L\'application mobile est tellement intuitive. Mes coiffeurs gèrent leurs plannings eux-mêmes.' },
]

const TYPES = [
    { value: 'coiffure_homme', label: '✂️ Coiffure Homme' },
    { value: 'coiffure_femme', label: '💇 Coiffure Femme' },
    { value: 'mixte', label: '🔄 Mixte' },
    { value: 'esthetique', label: '💅 Esthétique' },
    { value: 'autre', label: '✨ Autre' },
]

export default function ProLandingPage() {
    const router = useRouter()
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [form, setForm] = useState({
        nom_prenom: '', email: '', telephone: '',
        nom_salon: '', ville: '', type_salon: 'mixte', message: '',
    })

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setIsLoggedIn(true)
                setForm(f => ({ ...f, email: user.email || '' }))
            }
        })
    }, [])

    async function handleCTA() {
        if (!isLoggedIn) {
            // Rediriger vers auth, puis revenir ici pour le formulaire
            router.push('/auth?redirect=/pro&action=subscribe')
            return
        }
        setShowForm(true)
        setTimeout(() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/subscription-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess(true)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* ── Navigation ──────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="/" className="text-2xl font-black tracking-tighter text-slate-900">
                        Reservy <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full not-italic">PRO</span>
                    </a>
                    <div className="flex items-center gap-4">
                        <a href="/book" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
                            Trouver un salon
                        </a>
                        <button onClick={handleCTA}
                            className="bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all">
                            Rejoindre Reservy
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#6366f1_0%,_transparent_60%)] opacity-30" />
                <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-36">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-8 backdrop-blur">
                            <Zap size={12} className="text-yellow-400" />
                            Réservé aux professionnels de la beauté
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-6">
                            Gérez votre<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
                                salon comme<br />un pro
                            </span>
                        </h1>
                        <p className="text-xl text-slate-300 mb-10 max-w-xl leading-relaxed">
                            Reservy est la plateforme tout-en-un pour les salons de coiffure et instituts de beauté en Tunisie. Réservations, équipe, absences, stats — tout dans votre poche.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleCTA}
                                className="group flex items-center justify-center gap-3 bg-white text-slate-900 font-black px-8 py-4 rounded-2xl text-lg hover:bg-slate-100 transition-all shadow-2xl shadow-black/30">
                                Rejoindre Reservy
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a href="#features" className="flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all">
                                Découvrir les fonctionnalités
                                <ChevronDown size={18} />
                            </a>
                        </div>
                        <div className="flex items-center gap-6 mt-12">
                            {['Aucun frais de démarrage', 'Accès mobile inclus', 'Support dédié'].map(t => (
                                <div key={t} className="flex items-center gap-2 text-sm text-slate-400">
                                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────────────── */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                            Tout ce dont vous avez besoin
                        </h2>
                        <p className="text-slate-500 mt-4 text-lg max-w-xl mx-auto">
                            Une suite complète d'outils pensée pour les professionnels tunisiens.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map(f => (
                            <div key={f.title}
                                className="group bg-white rounded-3xl p-8 border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                                    style={{ backgroundColor: f.color + '15' }}>
                                    <f.icon size={22} style={{ color: f.color }} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ─────────────────────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-center text-3xl font-black text-slate-900 mb-12 tracking-tighter">
                        Ils nous font confiance
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {TESTIMONIALS.map(t => (
                            <div key={t.name} className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                                <div className="flex mb-4">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                                </div>
                                <p className="text-slate-700 italic mb-6 leading-relaxed">"{t.text}"</p>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                                    <p className="text-slate-500 text-xs">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section / Form ────────────────────────────────────── */}
            <section id="request-form" className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div className="max-w-2xl mx-auto px-6">
                    {success ? (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} className="text-emerald-400" />
                            </div>
                            <h2 className="text-3xl font-black mb-4">Demande envoyée !</h2>
                            <p className="text-slate-300 text-lg mb-8">
                                Notre équipe examinera votre demande et vous contactera dans les <strong>24h</strong>.
                            </p>
                            <a href="/" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all">
                                Retour à l'accueil
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-12">
                                <h2 className="text-4xl font-black tracking-tighter mb-4">
                                    Rejoignez Reservy
                                </h2>
                                <p className="text-slate-300">
                                    Remplissez ce formulaire. Notre équipe validera votre accès et créera votre espace pro dans les 24h.
                                </p>
                            </div>

                            {!isLoggedIn && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
                                    <Zap size={20} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-300">Vous avez déjà un compte client ?</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            <button onClick={() => router.push('/auth?redirect=/pro')}
                                                className="text-amber-400 underline font-semibold">Connectez-vous d'abord</button> pour lier votre compte existant à votre demande.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-sm font-semibold">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 backdrop-blur rounded-3xl p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom complet *</label>
                                        <input required placeholder="Hamdi Chakchouk" value={form.nom_prenom}
                                            onChange={e => setForm({ ...form, nom_prenom: e.target.value })}
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-white/30 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Téléphone</label>
                                        <input type="tel" placeholder="+216 -- --- ---" value={form.telephone}
                                            onChange={e => setForm({ ...form, telephone: e.target.value })}
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-white/30 focus:outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email *</label>
                                    <input required type="email" placeholder="vous@salon.tn" value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-white/30 focus:outline-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom du Salon *</label>
                                        <input required placeholder="Ex: Élégance Carthage" value={form.nom_salon}
                                            onChange={e => setForm({ ...form, nom_salon: e.target.value })}
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-white/30 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Ville</label>
                                        <input placeholder="Tunis, Sfax..." value={form.ville}
                                            onChange={e => setForm({ ...form, ville: e.target.value })}
                                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-white/30 focus:outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Type de salon</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TYPES.map(t => (
                                            <button type="button" key={t.value}
                                                onClick={() => setForm({ ...form, type_salon: t.value })}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.type_salon === t.value
                                                    ? 'bg-white text-slate-900 border-white'
                                                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Message (optionnel)</label>
                                    <textarea rows={3} placeholder="Parlez-nous de votre salon..." value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-white/30 focus:outline-none resize-none" />
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl text-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50">
                                    {loading ? 'Envoi en cours...' : (<>Envoyer ma demande <ArrowRight size={20} /></>)}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer className="bg-slate-950 text-slate-500 py-8 text-center text-sm">
                <p>© 2025 Reservy · <a href="/book" className="hover:text-white transition-colors">Trouver un salon</a> · <a href="mailto:support@reservy.tn" className="hover:text-white transition-colors">Contact</a></p>
            </footer>
        </div>
    )
}
