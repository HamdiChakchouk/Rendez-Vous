"use client"

import { useState, useEffect, Suspense } from 'react'
import { CheckCircle2, Calendar, Clock, MapPin, User, ChevronLeft, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function ConfirmationContent() {
    const searchParams = useSearchParams()
    const phone = searchParams.get('phone')
    const serviceId = searchParams.get('serviceId')
    const salonId = searchParams.get('salonId')
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date')
    const time = searchParams.get('time')

    const [formattedDate, setFormattedDate] = useState("Date inconnue")
    const [otp, setOtp] = useState('')
    const [isVerified, setIsVerified] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [details, setDetails] = useState({
        salon: "Chargement...",
        service: "Chargement...",
        employee: "N'importe qui",
        address: "Chargement..."
    })

    useEffect(() => {
        if (date) {
            setFormattedDate(new Date(date).toLocaleDateString())
        }

        // Fetch details
        if (serviceId) {
            fetch(`/api/services/${serviceId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setDetails(prev => ({
                            ...prev,
                            service: data.service.nom_service,
                            salon: data.service.salon.nom_salon,
                            address: data.service.salon.adresse
                        }))
                    }
                })
        }

        if (employeeId && employeeId !== 'any') {
            fetch(`/api/salons/${salonId}/employees`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const emp = data.employes.find((e: any) => e.id === employeeId)
                        if (emp) setDetails(prev => ({ ...prev, employee: emp.nom_employe }))
                    }
                })
        }
    }, [date, serviceId, employeeId, salonId])

    const handleVerify = async () => {
        if (otp.length < 4) return setError("Le code doit comporter 4 chiffres")

        setIsLoading(true)
        setError('')
        try {
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    code: otp,
                    bookingData: {
                        salonId,
                        serviceId,
                        employeeId,
                        date,
                        time
                    }
                })
            })
            const data = await res.json()
            if (data.success) {
                setIsVerified(true)
            } else {
                setError(data.message || "Code invalide")
            }
        } catch (err) {
            setError("Erreur réseau")
        } finally {
            setIsLoading(false)
        }
    }

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Vérification</h1>
                    <p className="text-slate-500 mb-8">
                        Veuillez entrer le code envoyé au <br />
                        <span className="font-bold text-slate-900">{phone}</span>
                    </p>

                    <div className="mb-6">
                        <input
                            type="text"
                            maxLength={4}
                            placeholder="0000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center text-3xl tracking-[1rem] p-4 rounded-2xl border-slate-100 shadow-inner bg-slate-50 focus:ring-primary focus:border-primary border font-mono"
                        />
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isLoading}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isLoading ? "Vérification..." : "Vérifier le code"}
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 text-slate-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                        <ChevronLeft size={16} />
                        Changer de numéro
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white p-8 animate-in fade-in duration-700">
            <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={40} />
                </div>
            </div>

            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold mb-2">C'est confirmé !</h1>
                <p className="text-slate-500">Votre rendez-vous est enregistré. Vous recevrez un rappel 2h avant.</p>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-6 space-y-6 border border-slate-100">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-primary">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Date & Heure</p>
                        <p className="font-bold text-slate-800">{formattedDate} à {time || "Heure inconnue"}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-primary">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Service & Coiffeur</p>
                        <p className="font-bold text-slate-800">{details.service}</p>
                        <p className="text-sm text-slate-500">avec {details.employee}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-primary">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lieu</p>
                        <p className="font-bold text-slate-800">{details.salon}</p>
                        <p className="text-sm text-slate-500">{details.address}</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 space-y-4">
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <Calendar size={20} />
                    Ajouter au calendrier
                </button>

                <Link href="/" className="block w-full text-center py-4 text-slate-400 font-medium text-sm flex items-center justify-center gap-2">
                    <ChevronLeft size={16} />
                    Retour à l'accueil
                </Link>
            </div>
        </div>
    )
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
