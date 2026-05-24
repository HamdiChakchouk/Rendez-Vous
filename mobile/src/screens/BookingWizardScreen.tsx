import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { ArrowLeft, User, Calendar as CalIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { sendOTPViaBackend, createBookingDirectly } from '../lib/apiService';
import { signInWithProvider } from '../lib/authService';
import { supabaseStorage } from '../lib/storage';

// ── French locale ──────────────────────────────────────────────
LocaleConfig.locales['fr'] = {
    monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    monthNamesShort: ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
    dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SLOT_STEP = 15; // Pas de 15 minutes pour coller au maximum au planning


function todayStr() {
    return new Date().toISOString().split('T')[0];
}

export default function BookingWizardScreen({ navigation, route }: any) {
    const { service } = route.params;
    const salon = service.salons;
    const openingHours = salon?.horaires_ouverture || {};

    const [step, setStep] = useState(1);
    const [employees, setEmployees] = useState<any[]>([]);
    const [absences, setAbsences] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    const [session, setSession] = useState<any>(null);
    const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
    // Créneaux déjà réservés pour la date sélectionnée
    const [bookedSlots, setBookedSlots] = useState<{ employe_id: string; heure_rdv: string; duree_minutes: number }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);


    useEffect(() => {
        supabase.from('employes').select('*').eq('salon_id', salon.id).then(({ data }) => {
            setEmployees(data || []);
            setLoadingEmployees(false);
        });
        supabase.from('absences').select('*').eq('salon_id', salon.id).then(({ data }) => {
            setAbsences(data || []);
        });

        // Load Session & Verified Phone
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const authListener = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));

        supabaseStorage.getItem('verified_phone').then(val => {
            if (val) {
                setVerifiedPhone(val);
                setPhone(val.replace('+216', ''));
            }
        });

        return () => {
            authListener.data.subscription.unsubscribe();
        };
    }, []);

    // ── Charger les créneaux réservés quand la date ou le coiffeur change ──
    useEffect(() => {
        if (!selectedDate) return;
        setLoadingSlots(true);
        setSelectedTime('');

        const query = supabase
            .from('public_booked_slots')
            .select('employe_id, heure_rdv, duree_minutes')
            .eq('salon_id', salon.id)
            .eq('date_rdv', selectedDate);

        query.then(({ data }) => {
            setBookedSlots(data || []);
            setLoadingSlots(false);
        });
    }, [selectedDate, selectedEmployee]);



    // ── Build disabled dates map for the calendar ────────────────
    const disabledDates = useMemo(() => {
        const result: Record<string, any> = {};
        const today = new Date();
        for (let i = 0; i < 90; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = DAYS[d.getDay()];
            const h = openingHours[dayName];
            const closed = !h || h.isOpen === false || h.open === 'closed';
            if (closed) {
                result[dateStr] = { disabled: true, disableTouchEvent: true, textColor: '#CBD5E1' };
            }
        }
        return result;
    }, [openingHours]);

    function isDateDisabledForEmployee(dateStr: string): boolean {
        if (!selectedEmployee || selectedEmployee === 'any') return false;
        return absences.some(abs => {
            if (abs.employe_id !== selectedEmployee) return false;
            const start = new Date(abs.date_debut); start.setHours(0, 0, 0, 0);
            const end = new Date(abs.date_fin); end.setHours(0, 0, 0, 0);
            const check = new Date(dateStr); check.setHours(0, 0, 0, 0);
            return check >= start && check <= end;
        });
    }

    function onDayPress(day: any) {
        setError('');
        setSelectedTime('');
        const dateStr: string = day.dateString;
        if (isDateDisabledForEmployee(dateStr)) {
            setError('Ce collaborateur est en congé à cette date.');
            return;
        }
        setSelectedDate(dateStr);
    }

    // ── Moteur de créneaux intelligents (pas de 15 min + gestion durée) ──
    function getAvailableSlots(): string[] {
        if (!selectedDate) return [];
        const d = new Date(selectedDate);
        const dayName = DAYS[d.getDay()];
        const h = openingHours[dayName];
        if (!h || h.isOpen === false || h.open === 'closed') return [];

        const serviceDuration = service.duree_minutes || 30;
        const now = new Date();
        const today = todayStr();

        // Convertit "HH:MM" en minutes depuis minuit
        const toMin = (t: string) => {
            const [hh, mm] = t.split(':').map(Number);
            return hh * 60 + mm;
        };
        // Convertit minutes depuis minuit en "HH:MM"
        const toStr = (m: number) => {
            const hh = Math.floor(m / 60).toString().padStart(2, '0');
            const mm = (m % 60).toString().padStart(2, '0');
            return `${hh}:${mm}`;
        };

        const openMin = toMin(h.open || '09:00');
        // Supporte la fermeture via "close_pm" (après pause midi) ou "close"
        const closeMin = toMin(h.close_pm || h.close || '19:00');

        // Récupérer les blocs occupés pour le coiffeur sélectionné
        const occupiedBlocks = bookedSlots
            .filter(b => !selectedEmployee || selectedEmployee === 'any' || b.employe_id === selectedEmployee)
            .map(b => ({
                start: toMin(b.heure_rdv.substring(0, 5)),  // "09:00:00" → "09:00"
                end: toMin(b.heure_rdv.substring(0, 5)) + b.duree_minutes,
            }));

        const result: string[] = [];
        // On balaye toute la journée par pas de 15 min
        for (let t = openMin; t + serviceDuration <= closeMin; t += SLOT_STEP) {
            const slotEnd = t + serviceDuration;

            // Vérifier que ce créneau ne chevauche aucun bloc occupé
            const hasConflict = occupiedBlocks.some(
                block => t < block.end && slotEnd > block.start
            );
            if (hasConflict) continue;

            // Si on est aujourd'hui, ignorer les créneaux passés
            if (selectedDate === today) {
                const slotTime = new Date();
                slotTime.setHours(Math.floor(t / 60), t % 60, 0, 0);
                if (slotTime <= now) continue;
            }

            result.push(toStr(t));
        }
        return result;
    }


    async function handleSSOLogin(provider: 'google' | 'facebook') {
        setIsLoading(true);
        setError('');
        try {
            await signInWithProvider(provider);
        } catch (err: any) {
            setError("Erreur de connexion. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleConfirmOrOTP() {
        if (!phone || phone.length < 8) { setError('Veuillez entrer un numéro valide (8 chiffres)'); return; }
        setIsLoading(true);
        setError('');
        
        const formattedPhone = `+216${phone}`;
        const bookingData = {
            salonId: salon.id,
            serviceId: service.id,
            employeeId: selectedEmployee || '',
            date: new Date(selectedDate).toISOString(),
            time: selectedTime,
        };
        const serviceDetails = {
            serviceName: service.nom_service || service.nom,
            salonName: salon.nom_salon,
            address: salon.adresse,
            employeeName: selectedEmployee === 'any' ? "N'importe qui" :
                employees.find(e => e.id === selectedEmployee)?.nom_employe || '',
        };

        // Si le téléphone est déjà vérifié, on passe directement à la création de réservation
        if (verifiedPhone === formattedPhone) {
            const result = await createBookingDirectly(formattedPhone, bookingData);
            setIsLoading(false);
            
            if (result.success) {
                navigation.replace('Confirmation', { phone: formattedPhone, bookingData, serviceDetails });
            } else {
                setError(result.message);
            }
            return;
        }

        // Sinon, flux classique OTP via le backend Vercel
        const result = await sendOTPViaBackend(formattedPhone);
        setIsLoading(false);
        
        if (result.success) {
            navigation.navigate('OTPVerification', {
                phone: formattedPhone,
                bookingData,
                serviceDetails,
            });
        } else {
            setError(result.message);
        }
    }

    const slots = getAvailableSlots();
    const progress = (step / 3) * 100;

    const markedDates = {
        ...disabledDates,
        ...(selectedDate ? {
            [selectedDate]: {
                selected: true,
                selectedColor: '#111',
                selectedTextColor: '#fff',
            },
        } : {}),
    };

    const isPhoneVerified = verifiedPhone === `+216${phone}`;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()}>
                    <ArrowLeft size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.logo}>RESERVY</Text>
                <View style={{ width: 22 }} />
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
                </View>
                <Text style={styles.progressText}>Étape {step} / 3</Text>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.pageTitle}>Votre Réservation</Text>
                <Text style={styles.serviceInfo}>
                    {service.nom_service || service.nom} — {service.prix} TND • {service.duree_minutes} min
                </Text>

                {/* ── STEP 1 — Employee ─────────────────────────── */}
                {step === 1 && (
                    <View style={styles.stepSection}>
                        <View style={styles.stepLabel}>
                            <User size={18} color="#1152d4" />
                            <Text style={styles.stepTitle}>Choisissez un employé</Text>
                        </View>
                        {loadingEmployees
                            ? <ActivityIndicator color="#111" style={{ marginTop: 20 }} />
                            : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.empCard, selectedEmployee === 'any' && styles.empCardActive]}
                                        onPress={() => { setSelectedEmployee('any'); setStep(2); }}>
                                        <Text style={[styles.empName, selectedEmployee === 'any' && styles.empNameActive]}>
                                            N'importe qui (Premier disponible)
                                        </Text>
                                    </TouchableOpacity>
                                    {employees.map(emp => (
                                        <TouchableOpacity
                                            key={emp.id}
                                            style={[styles.empCard, selectedEmployee === emp.id && styles.empCardActive]}
                                            onPress={() => { setSelectedEmployee(emp.id); setStep(2); }}>
                                            <Text style={[styles.empName, selectedEmployee === emp.id && styles.empNameActive]}>
                                                {emp.nom_employe}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}
                    </View>
                )}

                {/* ── STEP 2 — Calendar & Time ──────────────────── */}
                {step === 2 && (
                    <View style={styles.stepSection}>
                        <View style={styles.stepLabel}>
                            <CalIcon size={18} color="#1152d4" />
                            <Text style={styles.stepTitle}>Choisissez une date</Text>
                        </View>

                        <View style={styles.calendarWrapper}>
                            <Calendar
                                onDayPress={onDayPress}
                                markedDates={markedDates}
                                minDate={todayStr()}
                                maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                firstDay={1}
                                enableSwipeMonths
                                theme={{
                                    backgroundColor: '#fff',
                                    calendarBackground: '#fff',
                                    textSectionTitleColor: '#9CA3AF',
                                    selectedDayBackgroundColor: '#111',
                                    selectedDayTextColor: '#fff',
                                    todayTextColor: '#1152d4',
                                    dayTextColor: '#111',
                                    textDisabledColor: '#CBD5E1',
                                    arrowColor: '#111',
                                    monthTextColor: '#111',
                                    textDayFontWeight: '600',
                                    textMonthFontWeight: '800',
                                    textDayHeaderFontWeight: '700',
                                    textDayFontSize: 14,
                                    textMonthFontSize: 16,
                                }}
                            />
                        </View>

                        {!!error && (
                            <View style={styles.errorBox}>
                                <AlertCircle size={14} color="#B91C1C" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {selectedDate && !error && (
                            <>
                                <View style={[styles.stepLabel, { marginTop: 20 }]}>
                                    <Clock size={18} color="#1152d4" />
                                    <Text style={styles.stepTitle}>Créneaux disponibles</Text>
                                </View>
                                {loadingSlots
                                    ? <ActivityIndicator color="#111" style={{ marginTop: 10 }} />
                                    : (
                                        <View style={styles.slotsGrid}>
                                            {slots.length === 0
                                                ? <Text style={styles.noSlots}>Aucun créneau disponible pour cette journée.</Text>
                                                : slots.map(time => (
                                                    <TouchableOpacity
                                                        key={time}
                                                        style={[styles.slotBtn, selectedTime === time && styles.slotBtnActive]}
                                                        onPress={() => { setSelectedTime(time); setStep(3); }}>
                                                        <Text style={[styles.slotText, selectedTime === time && styles.slotTextActive]}>{time}</Text>
                                                    </TouchableOpacity>
                                                ))
                                            }
                                        </View>
                                    )
                                }
                            </>
                        )}
                    </View>
                )}

                {/* ── STEP 3 — Auth & Phone ──────────────────────── */}
                {step === 3 && (
                    <View style={styles.stepSection}>
                        <View style={styles.confirmCard}>
                            
                            {!session ? (
                                // --- ETAPE AUTHENTIFICATION SSO ---
                                <>
                                    <View style={styles.checkCircle}>
                                        <User size={32} color="#10B981" />
                                    </View>
                                    <Text style={styles.confirmTitle}>Identifiez-vous</Text>
                                    <Text style={styles.confirmSubtitle}>
                                        Connectez-vous rapidement pour finaliser votre réservation et gagner du temps la prochaine fois.
                                    </Text>
                                    
                                    {!!error && (
                                        <View style={styles.errorBox}>
                                            <AlertCircle size={14} color="#B91C1C" />
                                            <Text style={styles.errorText}>{error}</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity 
                                        style={[styles.ssoBtn, styles.googleBtn, isLoading && { opacity: 0.6 }]}
                                        onPress={() => handleSSOLogin('google')}
                                        disabled={isLoading}>
                                        <Text style={styles.googleBtnText}>Continuer avec Google</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={[styles.ssoBtn, styles.fbBtn, isLoading && { opacity: 0.6 }]}
                                        onPress={() => handleSSOLogin('facebook')}
                                        disabled={isLoading}>
                                        <Text style={styles.fbBtnText}>Continuer avec Facebook</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.skipBtn}
                                        onPress={() => setSession({ user: { id: 'guest' } })}>
                                        <Text style={styles.skipBtnText}>Continuer sans compte</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                // --- ETAPE TELEPHONE & CONFIRMATION ---
                                <>
                                    <View style={styles.checkCircle}>
                                        <CheckCircle2 size={32} color="#10B981" />
                                    </View>
                                    <Text style={styles.confirmTitle}>Presque fini !</Text>
                                    <Text style={styles.confirmSubtitle}>
                                        {isPhoneVerified 
                                            ? "Votre numéro est vérifié, confirmez simplement votre réservation." 
                                            : "Entrez votre numéro pour recevoir le code de confirmation."}
                                    </Text>
                                    <View style={styles.summaryBox}>
                                        <Text style={styles.summaryItem}>📅 {selectedDate} à {selectedTime}</Text>
                                        <Text style={styles.summaryItem}>
                                            👤 {selectedEmployee === 'any' ? "N'importe qui" : employees.find(e => e.id === selectedEmployee)?.nom_employe}
                                        </Text>
                                        <Text style={styles.summaryItem}>📍 {salon.nom_salon}</Text>
                                    </View>
                                    <View style={styles.phoneRow}>
                                        <View style={styles.countryCode}>
                                            <Text style={styles.countryCodeText}>+216</Text>
                                        </View>
                                        <TextInput
                                            style={styles.phoneInput}
                                            placeholder="Numéro de téléphone"
                                            placeholderTextColor="#9CA3AF"
                                            value={phone}
                                            onChangeText={setPhone}
                                            keyboardType="phone-pad"
                                            maxLength={8}
                                        />
                                    </View>
                                    {!!error && (
                                        <View style={styles.errorBox}>
                                            <AlertCircle size={14} color="#B91C1C" />
                                            <Text style={styles.errorText}>{error}</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
                                        onPress={handleConfirmOrOTP}
                                        disabled={isLoading}>
                                        {isLoading
                                            ? <ActivityIndicator color="#fff" />
                                            : <Text style={styles.submitBtnText}>
                                                {isPhoneVerified ? "Confirmer la réservation" : "Envoyer le code OTP"}
                                              </Text>
                                        }
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    logo: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 3 },
    progressContainer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    progressBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#111', borderRadius: 3 },
    progressText: { fontSize: 12, color: '#9CA3AF', marginTop: 6, fontWeight: '600' },
    body: { flex: 1, padding: 20 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 4 },
    serviceInfo: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
    stepSection: { marginBottom: 32 },
    stepLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    stepTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
    empCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
    empCardActive: { borderColor: '#111' },
    empName: { fontSize: 15, fontWeight: '700', color: '#374151' },
    empNameActive: { color: '#111' },
    calendarWrapper: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12 },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, marginBottom: 12 },
    errorText: { fontSize: 13, color: '#B91C1C', flex: 1 },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotBtn: { width: '30%', backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
    slotBtnActive: { backgroundColor: '#111', borderColor: '#111' },
    slotText: { fontSize: 14, fontWeight: '700', color: '#374151' },
    slotTextActive: { color: '#fff' },
    noSlots: { color: '#9CA3AF', fontSize: 14, padding: 10 },
    confirmCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 2 },
    checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    confirmTitle: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 8 },
    confirmSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
    summaryBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, width: '100%', marginBottom: 20, gap: 6 },
    summaryItem: { fontSize: 14, color: '#374151', fontWeight: '600' },
    phoneRow: { flexDirection: 'row', width: '100%', gap: 10, marginBottom: 16 },
    countryCode: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, justifyContent: 'center' },
    countryCodeText: { fontSize: 15, fontWeight: '700', color: '#374151' },
    phoneInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: '#111' },
    submitBtn: { backgroundColor: '#111', paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    ssoBtn: { paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12, borderWidth: 1 },
    googleBtn: { backgroundColor: '#fff', borderColor: '#D1D5DB' },
    googleBtnText: { color: '#374151', fontSize: 15, fontWeight: '700' },
    fbBtn: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
    fbBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    skipBtn: { padding: 12, marginTop: 4 },
    skipBtnText: { color: '#6B7280', fontSize: 14, textDecorationLine: 'underline' },
});
