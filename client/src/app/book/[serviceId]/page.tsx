"use client"

import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function BookingPage({ params }: { params: Promise<{ serviceId: string }> }) {
    const { serviceId } = React.use(params)
    const [step, setStep] = useState(1)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [salonId, setSalonId] = useState<string | null>(null)
    const [employees, setEmployees] = useState<{ id: string, nom_employe: string }[]>([])
    const [openingHours, setOpeningHours] = useState<any>(null)
    const [absences, setAbsences] = useState<any[]>([])
    const [dateError, setDateError] = useState<string | null>(null)

    useEffect(() => {
        console.log('BOOKING: Fetching service', serviceId)
        fetch(`/api/services/${serviceId}`)
            .then(res => {
                console.log('BOOKING: Service Response Status:', res.status)
                return res.json()
            })
            .then(data => {
                console.log('BOOKING: Service Data:', data)
                if (data.success) {
                    const sid = data.service.salon_id
                    setSalonId(sid)
                    setOpeningHours(data.service.salon.horaires_ouverture)
                    setAbsences(data.service.salon.absences || [])
                    console.log('BOOKING: Fetching employees for salon', sid)
                    // Fetch employees for this salon
                    fetch(`/api/salons/${sid}/employees`)
                        .then(r => {
                            console.log('BOOKING: Employees Response Status:', r.status)
                            return r.json()
                        })
                        .then(empData => {
                            console.log('BOOKING: Employees Data:', empData)
                            if (empData.success) {
                                setEmployees(empData.employes)
                                console.log('BOOKING: Set employees count:', empData.employes.length)
                            } else {
                                console.error('BOOKING: Fetching employees failed', empData.error)
                            }
                        })
                        .catch(err => console.error('BOOKING: Employees fetch error', err))
                } else {
                    console.error('BOOKING: Service fetch failed', data.error)
                    alert("Erreur: Service non trouvé")
                }
            })
            .catch(err => {
                console.error('BOOKING: Critical fetch error', err)
                // alert("Erreur de connexion au serveur")
            })
    }, [serviceId])

    const handleSendOTP = async () => {
        if (!phone) return alert("Veuillez entrer votre numéro")
        if (!selectedDate || !selectedTime) return alert("Veuillez choisir une date et une heure")
        if (!salonId) return alert("Chargement des informations du salon en cours... Réessayez dans un instant.")

        setIsLoading(true)
        try {
            const formattedPhone = `+216${phone}`
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formattedPhone })
            })
            const data = await res.json()
            if (data.success) {
                const query = new URLSearchParams({
                    phone: formattedPhone,
                    serviceId: serviceId,
                    salonId: salonId,
                    employeeId: selectedEmployee || '',
                    date: selectedDate.toISOString(),
                    time: selectedTime
                }).toString()
                window.location.href = `/confirmation?${query}`
            } else {
                alert("Erreur: " + data.error)
            }
        } catch (error) {
            alert("Erreur réseau")
        } finally {
            setIsLoading(false)
        }
    }

    const timeSlots = ["09:00", "10:00", "11:30", "14:00", "15:30", "17:00"]

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold mt-4 mb-8">Votre Réservation</h1>

                {/* Progress Dots */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-slate-200'} transition-all`}
                        />
                    ))}
                </div>

                {/* Step 1: Employee */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <User size={20} className="text-primary" />
                            Choisissez un employé
                        </h2>

                        {/* Option: Any */}
                        <button
                            onClick={() => { setSelectedEmployee('any'); setStep(2); }}
                            className={`w-full p-6 bg-white rounded-3xl border ${selectedEmployee === 'any' ? 'border-primary ring-1 ring-primary' : 'border-slate-100'} text-left transition-all shadow-sm active:scale-95`}
                        >
                            <span className="font-bold text-slate-400">N'importe qui (Premier disponible)</span>
                        </button>

                        {employees.map((emp) => (
                            <button
                                key={emp.id}
                                onClick={() => { setSelectedEmployee(emp.id); setStep(2); }}
                                className={`w-full p-6 bg-white rounded-3xl border ${selectedEmployee === emp.id ? 'border-primary ring-1 ring-primary' : 'border-slate-100'} text-left transition-all shadow-sm active:scale-95`}
                            >
                                <span className="font-bold">{emp.nom_employe}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 2: Date & Time */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <CalendarIcon size={20} className="text-primary" />
                                Date du rendez-vous
                            </h2>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full p-4 rounded-2xl border-slate-100 shadow-sm focus:ring-primary focus:border-primary border"
                                onChange={(e) => {
                                    const dateVal = e.target.value
                                    if (!dateVal) return

                                    const d = new Date(dateVal)
                                    setSelectedDate(d);
                                    setSelectedTime(null);
                                    setDateError(null);

                                    // Validate Salon Hours
                                    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                                    const dayName = daysOfWeek[d.getDay()]

                                    if (openingHours && !openingHours[dayName]?.isOpen) {
                                        setDateError("Le salon est fermé ce jour-là.")
                                        return
                                    }

                                    // Validate Employee Absence
                                    if (selectedEmployee && selectedEmployee !== 'any') {
                                        const isAbsent = absences.some(abs => {
                                            const start = new Date(abs.date_debut)
                                            const end = new Date(abs.date_fin)
                                            // Set to midnight for date-only comparison
                                            const checkDate = new Date(d)
                                            checkDate.setHours(0, 0, 0, 0)
                                            start.setHours(0, 0, 0, 0)
                                            end.setHours(0, 0, 0, 0)

                                            return abs.employe_id === selectedEmployee && checkDate >= start && checkDate <= end
                                        })
                                        if (isAbsent) {
                                            setDateError("Ce collaborateur est en congé à cette date.")
                                        }
                                    }
                                }}
                            />
                            {dateError && (
                                <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                                    <AlertCircle size={14} /> {dateError}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Clock size={20} className="text-primary" />
                                Créneaux disponibles
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {timeSlots
                                    .filter(time => {
                                        if (!selectedDate || dateError) return false;

                                        // Filter by Salon Hours
                                        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                                        const dayName = daysOfWeek[selectedDate.getDay()]
                                        if (openingHours && openingHours[dayName]) {
                                            const { open, close } = openingHours[dayName]
                                            if (time < open || time > close) return false
                                        }

                                        const now = new Date();
                                        const todayStr = now.toISOString().split('T')[0];
                                        const selectedDateStr = selectedDate.toISOString().split('T')[0];

                                        if (selectedDateStr === todayStr) {
                                            const [hours, minutes] = time.split(':').map(Number);
                                            const slotTime = new Date();
                                            slotTime.setHours(hours, minutes, 0, 0);
                                            return slotTime > now;
                                        }
                                        return true;
                                    })
                                    .map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => { setSelectedTime(time); setStep(3); }}
                                            className={`p-3 rounded-xl border text-sm font-bold transition-all ${selectedTime === time ? 'bg-primary text-white border-primary' : 'bg-white border-slate-100'}`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                            </div>
                            {selectedDate && timeSlots.filter(time => {
                                const now = new Date();
                                const todayStr = now.toISOString().split('T')[0];
                                const selectedDateStr = selectedDate.toISOString().split('T')[0];
                                if (selectedDateStr === todayStr) {
                                    const [hours, minutes] = time.split(':').map(Number);
                                    const slotTime = new Date();
                                    slotTime.setHours(hours, minutes, 0, 0);
                                    return slotTime > now;
                                }
                                return true;
                            }).length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-4">
                                        Plus de créneaux disponibles pour aujourd'hui.
                                    </p>
                                )}
                        </div>

                        <button onClick={() => setStep(1)} className="text-slate-400 text-sm font-medium w-full text-center">
                            Retour
                        </button>
                    </div>
                )}

                {/* Step 3: Confirmation / Phone Identification */}
                {step === 3 && (
                    <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Presque fini !</h2>
                            <p className="text-slate-500 mb-8">Entrez votre numéro pour recevoir le code de confirmation.</p>

                            <div className="flex gap-2 mb-6">
                                <div className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-400 border border-slate-100">+216</div>
                                <input
                                    type="tel"
                                    placeholder="Numéro de téléphone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="flex-1 p-4 rounded-2xl border-slate-100 shadow-inner bg-slate-50 focus:ring-primary focus:border-primary border"
                                />
                            </div>

                            <button
                                onClick={handleSendOTP}
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isLoading ? "Envoi en cours..." : "Envoyer le code OTP"}
                            </button>
                        </div>

                        <button onClick={() => setStep(2)} className="text-slate-400 text-sm font-medium">
                            Changer l'heure
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
