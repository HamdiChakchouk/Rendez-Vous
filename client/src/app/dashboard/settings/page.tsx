"use client"

import { ChevronLeft, Save, Upload, Instagram, Facebook, Globe, X, Plus, Image as ImageIcon, Check } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const TUNIS_QUARTIERS = [
    "Ariana", "La Marsa", "Gammarth", "Sidi Bou Said", "Carthage",
    "El Menzah", "Ennasr", "Le Bardo", "Centre Ville", "Les Berges du Lac",
    "La Soukra", "Manar", "L'Aouina", "Ain Zaghouan"
]

export default function SalonSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState({
        nom_salon: '',
        adresse: '',
        telephone: '',
        description: '',
        logo_url: '',
        photos: [] as string[],
        social_networks: {
            instagram: '',
            facebook: '',
            tiktok: '',
            other: ''
        },
        service_area: [] as string[],
        other_area: ''
    })

    useEffect(() => {
        fetchSalonData()
    }, [])

    async function fetchSalonData() {
        try {
            // For MVP, we fetch the first salon or a specific ID if we had session
            const { data, error } = await supabase.from('salons').select('*').single()
            if (data) {
                setFormData({
                    nom_salon: data.nom_salon || '',
                    adresse: data.adresse || '',
                    telephone: data.telephone || '',
                    description: data.description || '',
                    logo_url: data.logo_url || '',
                    photos: data.photos || [],
                    social_networks: {
                        instagram: data.social_networks?.instagram || '',
                        facebook: data.social_networks?.facebook || '',
                        tiktok: data.social_networks?.tiktok || '',
                        other: data.social_networks?.other || ''
                    },
                    service_area: data.service_area || [],
                    other_area: ''
                })
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        setMessage(null)
        try {
            const { error } = await supabase
                .from('salons')
                .update({
                    nom_salon: formData.nom_salon,
                    adresse: formData.adresse,
                    telephone: formData.telephone,
                    description: formData.description,
                    logo_url: formData.logo_url,
                    photos: formData.photos,
                    social_networks: formData.social_networks,
                    service_area: formData.other_area
                        ? [...formData.service_area, formData.other_area]
                        : formData.service_area,
                    updated_at: new Date().toISOString()
                })
                .match({ nom_salon: formData.nom_salon }) // Using name for now as identifier in MVP

            if (error) throw error
            setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès !' })
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement : ' + err.message })
        } finally {
            setSaving(false)
        }
    }

    const toggleArea = (area: string) => {
        setFormData(prev => ({
            ...prev,
            service_area: prev.service_area.includes(area)
                ? prev.service_area.filter(a => a !== area)
                : [...prev.service_area, area]
        }))
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <ChevronLeft size={24} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Paramètres du salon</h1>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Édition Profil Public</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? '...' : <><Save size={18} /> Enregistrer</>}
                </button>
            </div>

            <div className="p-4 max-w-2xl mx-auto space-y-6 mt-2">
                {message && (
                    <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                )}

                {/* Section Informations de Base */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={16} className="text-primary" /> Infos Générales
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block ml-1">Nom du Salon *</label>
                            <input
                                type="text"
                                maxLength={60}
                                value={formData.nom_salon}
                                onChange={e => setFormData({ ...formData, nom_salon: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 transition-all shadow-inner"
                                placeholder="Ex: Élégance Carthage"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block ml-1">Adresse Complète</label>
                            <textarea
                                rows={2}
                                value={formData.adresse}
                                onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 transition-all shadow-inner resize-none"
                                placeholder="N°, Rue, Ville..."
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block ml-1">Téléphone Principal</label>
                            <input
                                type="tel"
                                value={formData.telephone}
                                onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 transition-all shadow-inner"
                                placeholder="+216 -- --- ---"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block ml-1 flex justify-between">
                                Description Courte
                                <span className="text-[10px] opacity-60">{formData.description.length}/300</span>
                            </label>
                            <textarea
                                rows={3}
                                maxLength={300}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 transition-all shadow-inner resize-none"
                                placeholder="Décrivez votre salon pour vos clients..."
                            />
                        </div>
                    </div>
                </div>

                {/* Section Identité visuelle */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={16} className="text-primary" /> Identité Visuelle
                    </h2>

                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
                                {formData.logo_url ? (
                                    <img src={formData.logo_url} className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="text-slate-300" size={32} />
                                )}
                            </div>
                            <button className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white hover:scale-110 transition-all">
                                <Plus size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Logo (Carré 512x512)</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-slate-500 block ml-1">Photos Galerie (Max 6)</label>
                        <div className="grid grid-cols-3 gap-3">
                            {formData.photos.map((photo, i) => (
                                <div key={i} className="aspect-square bg-slate-50 rounded-2xl relative overflow-hidden group border border-slate-100">
                                    <img src={photo} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setFormData({ ...formData, photos: formData.photos.filter((_, idx) => idx !== i) })}
                                        className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {formData.photos.length < 6 && (
                                <button className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:text-primary hover:border-primary/30 transition-all hover:bg-primary/5">
                                    <Plus size={24} />
                                    <span className="text-[9px] font-black uppercase mt-1">Ajouter</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section Réseaux Sociaux */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={16} className="text-primary" /> Réseaux Sociaux
                    </h2>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl shadow-inner group focus-within:ring-2 ring-primary/20 transition-all">
                            <div className="p-2.5 bg-white rounded-xl text-pink-500 shadow-sm group-focus-within:bg-pink-500 group-focus-within:text-white transition-colors">
                                <Instagram size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Lien Instagram"
                                value={formData.social_networks.instagram}
                                onChange={e => setFormData({ ...formData, social_networks: { ...formData.social_networks, instagram: e.target.value } })}
                                className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 p-1"
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl shadow-inner group focus-within:ring-2 ring-primary/20 transition-all">
                            <div className="p-2.5 bg-white rounded-xl text-blue-600 shadow-sm group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">
                                <Facebook size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Lien Facebook"
                                value={formData.social_networks.facebook}
                                onChange={e => setFormData({ ...formData, social_networks: { ...formData.social_networks, facebook: e.target.value } })}
                                className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 p-1"
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl shadow-inner group focus-within:ring-2 ring-primary/20 transition-all">
                            <div className="p-2.5 bg-white rounded-xl text-black shadow-sm group-focus-within:bg-black group-focus-within:text-white transition-colors text-xs font-black">
                                TT
                            </div>
                            <input
                                type="text"
                                placeholder="Lien TikTok"
                                value={formData.social_networks.tiktok}
                                onChange={e => setFormData({ ...formData, social_networks: { ...formData.social_networks, tiktok: e.target.value } })}
                                className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 p-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Section Zones Desservies */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Check size={16} className="text-primary" /> Zones Desservies
                    </h2>

                    <div className="flex flex-wrap gap-2">
                        {TUNIS_QUARTIERS.map(area => (
                            <button
                                key={area}
                                onClick={() => toggleArea(area)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${formData.service_area.includes(area)
                                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                                    }`}
                            >
                                {area}
                            </button>
                        ))}
                    </div>

                    <div className="pt-2">
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block ml-1">Autre quartier</label>
                        <input
                            type="text"
                            value={formData.other_area}
                            onChange={e => setFormData({ ...formData, other_area: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 transition-all shadow-inner"
                            placeholder="Entrez un autre quartier..."
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
