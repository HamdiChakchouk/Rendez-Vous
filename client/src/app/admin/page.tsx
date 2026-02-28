"use client"

import {
    BarChart3, Building2, Users2, ShieldAlert, TrendingUp, Search,
    Menu, Loader2, Plus, Mail, Phone, User, X, CheckCircle, Clock
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Tab = 'dashboard' | 'salons' | 'users' | 'security' | 'add-manager'

interface ManagerForm {
    prenom: string
    nom: string
    email: string
    telephone: string
    nom_salon: string
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ salons: 0, rdv: 0, newUsers: 0, revenue: "0 DT" })
    const [salons, setSalons] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [managers, setManagers] = useState<any[]>([])

    // Add Manager form state
    const [form, setForm] = useState<ManagerForm>({ prenom: '', nom: '', email: '', telephone: '', nom_salon: '' })
    const [formLoading, setFormLoading] = useState(false)
    const [formSuccess, setFormSuccess] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: salonsData } = await supabase.from('salons').select('*').order('created_at', { ascending: false })
            setSalons(salonsData || [])

            const { data: clientsData } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
            setUsers(clientsData || [])

            const { data: managersData } = await supabase
                .from('profiles')
                .select('*, salons(nom_salon)')
                .eq('role', 'manager')
                .order('created_at', { ascending: false })
            setManagers(managersData || [])

            setStats({
                salons: (salonsData || []).length,
                rdv: 0,
                newUsers: (clientsData || []).length,
                revenue: "—",
            })
        } catch (error) {
            console.error('Error fetching admin data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateManager(e: React.FormEvent) {
        e.preventDefault()
        setFormLoading(true)
        setFormError(null)
        setFormSuccess(null)
        try {
            const res = await fetch('/api/admin/create-manager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setFormSuccess(data.message)
            setForm({ prenom: '', nom: '', email: '', telephone: '', nom_salon: '' })
            fetchData()
        } catch (err: any) {
            setFormError(err.message || 'Erreur lors de la création')
        } finally {
            setFormLoading(false)
        }
    }

    const renderDashboard = () => (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                <h2 className="text-2xl md:text-3xl font-bold italic">Plateforme Overview</h2>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Rechercher..." className="bg-slate-800 border-none rounded-2xl pl-10 pr-4 py-3 text-sm w-full sm:w-64 focus:ring-1 ring-primary transition-all" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-10">
                {[
                    { label: "Salons Actifs", value: stats.salons, icon: Building2 },
                    { label: "Managers", value: managers.length, icon: Users2 },
                    { label: "Clients Totaux", value: stats.newUsers, icon: Users2 },
                    { label: "Revenu Platform", value: stats.revenue, icon: BarChart3 },
                ].map((stat) => (
                    <div key={stat.label} className="bg-slate-800 p-5 rounded-2xl border border-slate-700/50 hover:border-primary/50 transition-all group shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div className="p-2.5 bg-slate-700/30 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors"><stat.icon size={18} /></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-700 font-bold bg-slate-800/50 flex justify-between items-center">
                    <span>Derniers Salons Inscrits</span>
                    <button onClick={() => setActiveTab('add-manager')} className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
                        <Plus size={16} /> Ajouter un Manager
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="text-[10px] uppercase text-slate-500 bg-slate-900/50 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Salon</th>
                                <th className="px-6 py-4">Manager</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {salons.slice(0, 8).map((salon) => {
                                const manager = managers.find(m => m.salon_id === salon.id)
                                return (
                                    <tr key={salon.id} className="hover:bg-slate-700/50 transition-colors group">
                                        <td className="px-6 py-5 font-bold text-sm">{salon.nom_salon}</td>
                                        <td className="px-6 py-5 text-slate-400 text-sm">{manager ? `${manager.prenom} ${manager.nom}` : '—'}</td>
                                        <td className="px-6 py-5 text-slate-400 text-xs">{new Date(salon.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${manager ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                {manager ? 'Actif' : 'En attente'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )

    const renderAddManager = () => (
        <div className="max-w-xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold italic">Ajouter un Manager</h2>
                <p className="text-slate-400 text-sm mt-1">Un email d'activation sera envoyé automatiquement au manager.</p>
            </div>

            {formSuccess && (
                <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3">
                    <CheckCircle size={20} />
                    <p className="font-bold text-sm">{formSuccess}</p>
                </div>
            )}
            {formError && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
                    <X size={20} />
                    <p className="font-bold text-sm">{formError}</p>
                </div>
            )}

            <form onSubmit={handleCreateManager} className="bg-slate-800 rounded-3xl border border-slate-700 p-6 space-y-5">
                {/* Nom / Prénom */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Prénom *</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input type="text" required placeholder="Hamdi"
                                value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nom *</label>
                        <input type="text" required placeholder="Chakchouk"
                            value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Email du Manager *</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="email" required placeholder="manager@salon.tn"
                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                {/* Téléphone */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Téléphone</label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="tel" placeholder="+216 XX XXX XXX"
                            value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                {/* Nom du salon */}
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nom du Salon *</label>
                    <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" required placeholder="Ex: Élégance Carthage"
                            value={form.nom_salon} onChange={e => setForm({ ...form, nom_salon: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-500 mb-4 flex items-start gap-2">
                        <Mail size={14} className="mt-0.5 shrink-0 text-primary" />
                        Un email d'activation avec un lien sécurisé sera envoyé à <strong className="text-slate-300">{form.email || 'l\'adresse fournie'}</strong> pour qu'il configure son mot de passe.
                    </p>
                    <button type="submit" disabled={formLoading}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {formLoading ? <Loader2 size={20} className="animate-spin" /> : <><Plus size={20} /> Créer le manager et envoyer l'email</>}
                    </button>
                </div>
            </form>

            {/* Existing managers list */}
            {managers.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Managers existants</h3>
                    <div className="space-y-3">
                        {managers.map(m => (
                            <div key={m.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">{m.prenom} {m.nom}</p>
                                    <p className="text-xs text-slate-500">{m.salons?.nom_salon || '—'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${m.onboarding_completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {m.onboarding_completed ? 'Actif' : 'En attente'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const renderSalons = () => (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold italic">Gestion des Salons</h2>
            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="text-[10px] uppercase text-slate-500 bg-slate-900/50 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Nom</th>
                                <th className="px-6 py-4">Adresse</th>
                                <th className="px-6 py-4">Téléphone</th>
                                <th className="px-6 py-4">Date Inscription</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {salons.map((salon) => (
                                <tr key={salon.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-5 font-bold text-sm">{salon.nom_salon}</td>
                                    <td className="px-6 py-5 text-slate-400 text-sm">{salon.adresse || '—'}</td>
                                    <td className="px-6 py-5 text-slate-400 text-sm">{salon.telephone || '—'}</td>
                                    <td className="px-6 py-5 text-slate-400 text-xs">{new Date(salon.created_at).toLocaleDateString('fr-FR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    const renderUsers = () => (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold italic">Gestion des Utilisateurs</h2>
            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="text-[10px] uppercase text-slate-500 bg-slate-900/50 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Nom</th>
                                <th className="px-6 py-4">Téléphone</th>
                                <th className="px-6 py-4">Risk Score</th>
                                <th className="px-6 py-4">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-5 font-bold text-sm">{user.nom_client || 'Anonyme'}</td>
                                    <td className="px-6 py-5 text-slate-400 text-sm">{user.telephone}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full ${user.risk_score > 5 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(user.risk_score * 10, 100)}%` }} />
                                            </div>
                                            <span className="text-xs font-bold">{user.risk_score}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${user.is_blocked ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {user.is_blocked ? 'BLOQUÉ' : 'ACTIF'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    const renderSecurity = () => (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold italic">Sécurité & Système</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 shadow-2xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users2 size={20} className="text-primary" /> Managers Système</h3>
                    <div className="space-y-4">
                        {managers.map((m) => (
                            <div key={m.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                                <div>
                                    <p className="font-bold text-sm">{m.prenom} {m.nom}</p>
                                    <p className="text-xs text-slate-500">{m.salons?.nom_salon}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20 uppercase">manager</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 shadow-2xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ShieldAlert size={20} className="text-amber-500" /> État du Système</h3>
                    <div className="space-y-4">
                        {['Base de données', 'Authentification', 'Service Email'].map(item => (
                            <div key={item} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                                <span className="text-sm">{item}</span>
                                <span className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> OPÉRATIONNEL
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    const navItems = [
        { tab: 'dashboard' as Tab, icon: BarChart3, label: 'Dashboard' },
        { tab: 'add-manager' as Tab, icon: Plus, label: 'Ajouter Manager' },
        { tab: 'salons' as Tab, icon: Building2, label: 'Salons' },
        { tab: 'users' as Tab, icon: Users2, label: 'Utilisateurs' },
        { tab: 'security' as Tab, icon: ShieldAlert, label: 'Sécurité' },
    ]

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row relative">
            <header className="md:hidden bg-slate-950 p-4 flex justify-between items-center border-b border-slate-800 sticky top-0 z-50">
                <h1 className="text-lg font-black tracking-tighter italic">VibeRdv <span className="text-primary text-[10px] not-italic">ADMIN</span></h1>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400"><Menu size={24} /></button>
            </header>

            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 p-6 flex flex-col border-r border-slate-800 transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <h1 className="hidden md:block text-xl font-black tracking-tighter text-white mb-12 italic">
                    VibeRdv <span className="text-primary text-xs not-italic">ADMIN</span>
                </h1>
                <nav className="space-y-2 flex-1">
                    {navItems.map(({ tab, icon: Icon, label }) => (
                        <button key={tab} onClick={() => { setActiveTab(tab); setSidebarOpen(false) }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab ? 'bg-primary/10 text-primary border-r-4 border-primary font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                        >
                            <Icon size={20} /> {label}
                        </button>
                    ))}
                </nav>
            </aside>

            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

            <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={40} className="text-primary animate-spin" />
                        <p className="text-slate-400 font-medium animate-pulse">Chargement...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'add-manager' && renderAddManager()}
                        {activeTab === 'salons' && renderSalons()}
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'security' && renderSecurity()}
                    </>
                )}
            </main>
        </div>
    )
}
