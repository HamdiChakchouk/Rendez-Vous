import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Modal, TextInput, ActivityIndicator, Alert, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import {
    ArrowLeft, Plus, Check, X, Calendar as CalendarIcon,
    Clock, AlertCircle, ChevronDown, MessageSquare,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Absence = {
    id: string;
    employe_id: string;
    nom_employe: string;
    type: string;
    date_debut: string;
    date_fin: string;
    is_half_day: boolean;
    heure_debut: string | null;
    heure_fin: string | null;
    commentaire: string;
    motif_refus: string | null;
    statut: 'pending' | 'approved' | 'rejected';
    created_at: string;
};

const TYPES = ['Congé annuel', 'Maladie', 'Formation', 'Mariage', 'Autre'] as const;

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    pending: { bg: '#FEF3C7', text: '#D97706', label: 'En attente', icon: '⏳' },
    approved: { bg: '#D1FAE5', text: '#059669', label: 'Validé', icon: '✅' },
    rejected: { bg: '#FEE2E2', text: '#DC2626', label: 'Refusé', icon: '❌' },
};

// ─── Time Picker ──────────────────────────────────────────────────────────────
function TimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    const [visible, setVisible] = useState(false);
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];
    const [hh, mm] = value ? value.split(':') : ['09', '00'];

    return (
        <>
            <TouchableOpacity style={s.timePickerBtn} onPress={() => setVisible(true)}>
                <Clock size={16} color="#6B7280" />
                <Text style={[s.timePickerText, !value && { color: '#9CA3AF' }]}>
                    {value || label}
                </Text>
                <ChevronDown size={14} color="#9CA3AF" />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade">
                <TouchableOpacity style={s.timeOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
                    <View style={s.timeModal}>
                        <Text style={s.timeTitle}>{label}</Text>
                        <View style={s.timeRow}>
                            {/* Heures */}
                            <View style={{ flex: 1 }}>
                                <Text style={s.timeColLabel}>Heure</Text>
                                <ScrollView style={{ height: 160 }} showsVerticalScrollIndicator={false}>
                                    {hours.map(h => (
                                        <TouchableOpacity key={h} onPress={() => onChange(`${h}:${mm}`)}
                                            style={[s.timeOption, hh === h && s.timeOptionActive]}>
                                            <Text style={[s.timeOptionText, hh === h && { color: '#fff' }]}>{h}h</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111', alignSelf: 'center' }}>:</Text>
                            {/* Minutes */}
                            <View style={{ flex: 1 }}>
                                <Text style={s.timeColLabel}>Min</Text>
                                <ScrollView style={{ height: 160 }} showsVerticalScrollIndicator={false}>
                                    {minutes.map(m => (
                                        <TouchableOpacity key={m} onPress={() => onChange(`${hh}:${m}`)}
                                            style={[s.timeOption, mm === m && s.timeOptionActive]}>
                                            <Text style={[s.timeOptionText, mm === m && { color: '#fff' }]}>{m}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                        <TouchableOpacity style={s.timeConfirm} onPress={() => setVisible(false)}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Confirmer</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SalonAbsencesScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [salonId, setSalonId] = useState<string | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [openingHours, setOpeningHours] = useState<any>(null);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [employees, setEmployees] = useState<{ id: string; nom_employe: string }[]>([]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState<'debut' | 'fin' | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Form
    const [form, setForm] = useState({
        employe_id: '',
        type: 'Congé annuel' as string,
        date_debut: '',
        date_fin: '',
        is_half_day: false,
        heure_debut: '',
        heure_fin: '',
        commentaire: '',
    });

    useEffect(() => { fetchData(); }, []);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    async function fetchData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setProfileId(user.id);

            const { data: profile } = await supabase
                .from('profiles').select('salon_id, role').eq('id', user.id).maybeSingle();
            if (!profile?.salon_id) { setLoading(false); return; }

            setSalonId(profile.salon_id);
            setRole(profile.role);

            const [salonRes, absRes, empRes] = await Promise.all([
                supabase.from('salons').select('horaires_ouverture').eq('id', profile.salon_id).single(),
                supabase.from('absences')
                    .select('*, employes(nom_employe)')
                    .eq('salon_id', profile.salon_id)
                    .order('created_at', { ascending: false }),
                supabase.from('employes').select('id, nom_employe').eq('salon_id', profile.salon_id),
            ]);

            if (salonRes.data?.horaires_ouverture) setOpeningHours(salonRes.data.horaires_ouverture);

            if (absRes.data) {
                setAbsences(absRes.data.map((a: any) => ({
                    ...a, nom_employe: a.employes?.nom_employe || '?',
                })));
            }
            if (empRes.data) setEmployees(empRes.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    // ── Open Add Modal ─────────────────────────────────────────────────────────
    function openAdd() {
        setForm({
            employe_id: role === 'coiffeur' ? (profileId || '') : '',
            type: 'Congé annuel', date_debut: '', date_fin: '',
            is_half_day: false, heure_debut: '', heure_fin: '', commentaire: '',
        });
        setShowAddModal(true);
    }

    // ── Validations ────────────────────────────────────────────────────────────
    function validate(): string | null {
        if (!form.employe_id) return 'Sélectionnez un collaborateur.';
        if (!form.date_debut) return 'Sélectionnez la date de début.';
        if (!form.date_fin) return 'Sélectionnez la date de fin.';

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const start = new Date(form.date_debut);
        const end = new Date(form.date_fin);

        if (start < today) return 'Impossible de poser un congé pour une date passée.';
        if (end < start) return 'La date de fin doit être après la date de début.';

        // Vérif horaires salon
        if (openingHours) {
            const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            let hasOpenDay = false;
            const cur = new Date(start);
            while (cur <= end) {
                if (openingHours[DAY_NAMES[cur.getDay()]]?.isOpen) { hasOpenDay = true; break; }
                cur.setDate(cur.getDate() + 1);
            }
            if (!hasOpenDay) return 'Le salon est déjà fermé pendant toute cette période.';
        }

        // Validations pour petite absence
        if (form.is_half_day) {
            if (!form.heure_debut) return 'Indiquez l\'heure de début d\'absence.';
            if (!form.heure_fin) return 'Indiquez l\'heure de reprise.';
            if (form.heure_fin <= form.heure_debut)
                return 'L\'heure de reprise doit être après l\'heure de début.';
        }

        return null;
    }

    // ── Submit Absence ─────────────────────────────────────────────────────────
    async function handleSubmit() {
        const err = validate();
        if (err) { Alert.alert('Validation', err); return; }

        setSaving(true);
        try {
            const { error } = await supabase.from('absences').insert({
                employe_id: form.employe_id,
                salon_id: salonId,
                type: form.type,
                date_debut: form.date_debut,
                date_fin: form.date_fin,
                is_half_day: form.is_half_day,
                heure_debut: form.is_half_day ? form.heure_debut || null : null,
                heure_fin: form.is_half_day ? form.heure_fin || null : null,
                commentaire: form.commentaire,
                statut: 'pending',
            });
            if (error) throw error;
            setShowAddModal(false);
            await fetchData();
        } catch (e: any) {
            Alert.alert('Erreur', e.message || 'Envoi impossible');
        } finally { setSaving(false); }
    }

    // ── Approve ────────────────────────────────────────────────────────────────
    async function approveAbsence(id: string) {
        Alert.alert('Valider', 'Confirmer la validation de cette absence ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Valider ✅', onPress: async () => {
                    await supabase.from('absences').update({ statut: 'approved', updated_at: new Date().toISOString() }).eq('id', id);
                    fetchData();
                }
            },
        ]);
    }

    // ── Reject ─────────────────────────────────────────────────────────────────
    function openReject(id: string) {
        setRejectingId(id);
        setRejectReason('');
        setShowRejectModal(true);
    }

    async function confirmReject() {
        if (!rejectingId) return;
        await supabase.from('absences').update({
            statut: 'rejected',
            motif_refus: rejectReason.trim(),
            updated_at: new Date().toISOString(),
        }).eq('id', rejectingId);
        setShowRejectModal(false);
        setRejectingId(null);
        fetchData();
    }

    // ── Calendar Date Selection ────────────────────────────────────────────────
    function handleDateSelect(day: any) {
        const dateStr = day.dateString; // "YYYY-MM-DD"
        if (showDatePicker === 'debut') {
            setForm(p => ({ ...p, date_debut: dateStr, date_fin: p.date_fin && p.date_fin >= dateStr ? p.date_fin : dateStr }));
        } else {
            if (form.date_debut && dateStr < form.date_debut) {
                Alert.alert('Erreur', 'La date de fin doit être après la date de début.');
                return;
            }
            setForm(p => ({ ...p, date_fin: dateStr }));
        }
        setShowDatePicker(null);
    }

    // ── Calendar marked dates ──────────────────────────────────────────────────
    function getMarkedDates() {
        const marked: any = {};
        if (form.date_debut) marked[form.date_debut] = { startingDay: true, color: '#111', textColor: '#fff' };
        if (form.date_fin && form.date_fin !== form.date_debut) {
            // Fill range
            const start = new Date(form.date_debut);
            const end = new Date(form.date_fin);
            const cur = new Date(start);
            cur.setDate(cur.getDate() + 1);
            while (cur < end) {
                marked[cur.toISOString().split('T')[0]] = { color: '#D1D5DB', textColor: '#111' };
                cur.setDate(cur.getDate() + 1);
            }
            marked[form.date_fin] = { endingDay: true, color: '#111', textColor: '#fff' };
        }
        return marked;
    }

    const today = new Date().toISOString().split('T')[0];

    // ── Render Card ────────────────────────────────────────────────────────────
    function renderAbsence({ item: abs }: { item: Absence }) {
        const st = STATUS_CONFIG[abs.statut] || STATUS_CONFIG.pending;
        const isSingleDay = abs.date_debut === abs.date_fin;
        const isPartial = abs.is_half_day && abs.heure_debut && abs.heure_fin;

        return (
            <View style={s.card}>
                {/* Header */}
                <View style={s.cardTop}>
                    <View style={s.avatar}>
                        <Text style={s.avatarTxt}>{abs.nom_employe[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.empName}>{abs.nom_employe}</Text>
                        <View style={s.typeRow}>
                            <Text style={s.absType}>{abs.type}</Text>
                            {isPartial && <Text style={s.partialBadge}>Partielle</Text>}
                        </View>
                    </View>
                    <View style={[s.badge, { backgroundColor: st.bg }]}>
                        <Text style={[s.badgeTxt, { color: st.text }]}>{st.icon} {st.label}</Text>
                    </View>
                </View>

                {/* Dates */}
                <View style={s.datesRow}>
                    <View style={s.dateBox}>
                        <Text style={s.dateLabel}>Du</Text>
                        <Text style={s.dateVal}>{new Date(abs.date_debut).toLocaleDateString('fr-FR')}</Text>
                        {isPartial && <Text style={s.timeVal}>à {abs.heure_debut}</Text>}
                    </View>
                    <View style={s.dateSep}><Text style={s.dateSepLine}>→</Text></View>
                    <View style={s.dateBox}>
                        <Text style={s.dateLabel}>Au</Text>
                        <Text style={s.dateVal}>{new Date(abs.date_fin).toLocaleDateString('fr-FR')}</Text>
                        {isPartial && <Text style={s.timeVal}>reprise {abs.heure_fin}</Text>}
                    </View>
                </View>

                {/* Commentaire */}
                {abs.commentaire ? (
                    <Text style={s.comment}>💬 "{abs.commentaire}"</Text>
                ) : null}

                {/* Motif refus */}
                {abs.statut === 'rejected' && abs.motif_refus ? (
                    <View style={s.refusBox}>
                        <AlertCircle size={14} color="#DC2626" />
                        <Text style={s.refusTxt}>Motif : {abs.motif_refus}</Text>
                    </View>
                ) : null}

                {/* Actions Manager */}
                {abs.statut === 'pending' && role === 'manager' && (
                    <View style={s.actions}>
                        <TouchableOpacity style={s.approveBtn} onPress={() => approveAbsence(abs.id)}>
                            <Check size={16} color="#059669" />
                            <Text style={s.approveTxt}>Valider</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.rejectBtn} onPress={() => openReject(abs.id)}>
                            <X size={16} color="#DC2626" />
                            <Text style={s.rejectTxt}>Refuser</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#111" />
                </TouchableOpacity>
                <Text style={s.title}>Absences & Congés</Text>
                <TouchableOpacity style={s.addBtn} onPress={openAdd}>
                    <Plus size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#111" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={absences}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.emptyBox}>
                            <CalendarIcon size={40} color="#E5E7EB" />
                            <Text style={s.emptyTxt}>Aucune absence enregistrée</Text>
                            <TouchableOpacity style={s.emptyAddBtn} onPress={openAdd}>
                                <Text style={s.emptyAddTxt}>+ Ajouter une absence</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    renderItem={renderAbsence}
                />
            )}

            {/* ── Modal Ajout Absence ─────────────────────────────────────────── */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet"
                onRequestClose={() => setShowAddModal(false)}>
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHead}>
                        <Text style={s.modalTitle}>Nouvelle Absence</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(false)}>
                            <X size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        {/* Collaborateur */}
                        {role !== 'coiffeur' && (
                            <>
                                <Text style={s.fieldLabel}>Collaborateur *</Text>
                                <View style={s.chipWrap}>
                                    {employees.map(e => (
                                        <TouchableOpacity key={e.id} onPress={() => setForm({ ...form, employe_id: e.id })}
                                            style={[s.chip, form.employe_id === e.id && s.chipOn]}>
                                            <Text style={[s.chipTxt, form.employe_id === e.id && { color: '#fff' }]}>{e.nom_employe}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Type */}
                        <Text style={s.fieldLabel}>Type d'absence</Text>
                        <View style={[s.chipWrap, { marginBottom: 20 }]}>
                            {TYPES.map(t => (
                                <TouchableOpacity key={t} onPress={() => setForm({ ...form, type: t })}
                                    style={[s.chip, form.type === t && s.chipOn]}>
                                    <Text style={[s.chipTxt, form.type === t && { color: '#fff' }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Dates */}
                        <Text style={s.fieldLabel}>Période *</Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                            <TouchableOpacity style={s.dateTrigger} onPress={() => setShowDatePicker('debut')}>
                                <CalendarIcon size={15} color="#6B7280" />
                                <Text style={[s.dateTriggerTxt, !form.date_debut && { color: '#9CA3AF' }]}>
                                    {form.date_debut ? new Date(form.date_debut).toLocaleDateString('fr-FR') : 'Date début'}
                                </Text>
                            </TouchableOpacity>
                            <Text style={{ alignSelf: 'center', color: '#9CA3AF', fontWeight: '700' }}>→</Text>
                            <TouchableOpacity style={s.dateTrigger} onPress={() => setShowDatePicker('fin')}>
                                <CalendarIcon size={15} color="#6B7280" />
                                <Text style={[s.dateTriggerTxt, !form.date_fin && { color: '#9CA3AF' }]}>
                                    {form.date_fin ? new Date(form.date_fin).toLocaleDateString('fr-FR') : 'Date fin'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Petite absence (is_half_day) */}
                        <View style={s.switchRow}>
                            <Switch value={form.is_half_day}
                                onValueChange={v => setForm({ ...form, is_half_day: v, heure_debut: '', heure_fin: '' })}
                                trackColor={{ false: '#E5E7EB', true: '#111' }} thumbColor="#fff" />
                            <View>
                                <Text style={s.switchLabel}>Petite absence (partielle)</Text>
                                <Text style={s.switchSub}>Ex: retard, sortie anticipée, RDV médical</Text>
                            </View>
                        </View>

                        {form.is_half_day && (
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.fieldLabel}>Heure de début *</Text>
                                    <TimePicker value={form.heure_debut} onChange={v => setForm({ ...form, heure_debut: v })} label="Choisir" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.fieldLabel}>Heure de reprise *</Text>
                                    <TimePicker value={form.heure_fin} onChange={v => setForm({ ...form, heure_fin: v })} label="Choisir" />
                                </View>
                            </View>
                        )}

                        {/* Commentaire */}
                        <Text style={s.fieldLabel}>Commentaire (optionnel)</Text>
                        <TextInput style={[s.input, { height: 80, textAlignVertical: 'top', marginBottom: 32 }]}
                            multiline placeholder="Motif complémentaire..."
                            value={form.commentaire} onChangeText={v => setForm({ ...form, commentaire: v })} />

                        <TouchableOpacity style={[s.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnTxt}>Soumettre la demande</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* ── Calendar Modal ──────────────────────────────────────────────── */}
            <Modal visible={!!showDatePicker} transparent animationType="fade">
                <TouchableOpacity style={s.calOverlay} activeOpacity={1} onPress={() => setShowDatePicker(null)}>
                    <View style={s.calModal}>
                        <Text style={s.calTitle}>
                            {showDatePicker === 'debut' ? 'Date de début' : 'Date de fin'}
                        </Text>
                        <Calendar
                            minDate={showDatePicker === 'fin' ? (form.date_debut || today) : today}
                            onDayPress={handleDateSelect}
                            markedDates={getMarkedDates()}
                            markingType="period"
                            theme={{
                                selectedDayBackgroundColor: '#111',
                                todayTextColor: '#1152d4',
                                arrowColor: '#111',
                                textDayFontWeight: '600',
                                textMonthFontWeight: '800',
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Modal Refus ─────────────────────────────────────────────────── */}
            <Modal visible={showRejectModal} transparent animationType="slide">
                <View style={s.rejectOverlay}>
                    <View style={s.rejectModal}>
                        <View style={s.modalHead}>
                            <Text style={s.modalTitle}>Motif de refus</Text>
                            <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                                <X size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[s.fieldLabel, { marginTop: 16, marginHorizontal: 4 }]}>
                            Le collaborateur sera informé du motif de refus.
                        </Text>
                        <TextInput
                            style={[s.input, { height: 100, textAlignVertical: 'top', margin: 16 }]}
                            multiline autoFocus
                            placeholder="Ex: Planning complet sur cette période..."
                            value={rejectReason}
                            onChangeText={setRejectReason}
                        />
                        <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
                            <TouchableOpacity style={[s.rejectBtn, { flex: 1, justifyContent: 'center', paddingVertical: 14 }]}
                                onPress={() => setShowRejectModal(false)}>
                                <Text style={s.rejectTxt}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.submitBtn, { flex: 1, marginTop: 0 }]} onPress={confirmReject}>
                                <Text style={s.submitBtnTxt}>Confirmer le refus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    title: { fontSize: 18, fontWeight: '900', color: '#111', flex: 1 },
    addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', padding: 60, gap: 12 },
    emptyTxt: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
    emptyAddBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#111' },
    emptyAddTxt: { fontSize: 14, fontWeight: '700', color: '#111' },

    // Card
    card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 20, fontWeight: '900', color: '#1152d4' },
    empName: { fontSize: 14, fontWeight: '800', color: '#111' },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    absType: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    partialBadge: { fontSize: 10, fontWeight: '700', color: '#7C3AED', backgroundColor: '#F5F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeTxt: { fontSize: 11, fontWeight: '700' },
    datesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    dateBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#F3F4F6' },
    dateSep: { padding: 8 },
    dateSepLine: { fontSize: 18, color: '#9CA3AF', fontWeight: '700' },
    dateLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3 },
    dateVal: { fontSize: 14, fontWeight: '700', color: '#111' },
    timeVal: { fontSize: 11, color: '#7C3AED', fontWeight: '600', marginTop: 2 },
    comment: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, marginBottom: 10 },
    refusBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 10 },
    refusTxt: { fontSize: 12, color: '#DC2626', fontWeight: '600', flex: 1 },
    actions: { flexDirection: 'row', gap: 10 },
    approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D1FAE5', borderRadius: 12, paddingVertical: 10 },
    approveTxt: { fontSize: 13, fontWeight: '700', color: '#059669' },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 10 },
    rejectTxt: { fontSize: 13, fontWeight: '700', color: '#DC2626' },

    // Modal
    modal: { flex: 1, backgroundColor: '#fff' },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 16 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6' },
    chipOn: { backgroundColor: '#111' },
    chipTxt: { fontSize: 13, fontWeight: '700', color: '#374151' },
    dateTrigger: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12 },
    dateTriggerTxt: { fontSize: 13, fontWeight: '700', color: '#111', flex: 1 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    switchLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
    switchSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    submitBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    submitBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Calendar Modal
    calOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    calModal: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
    calTitle: { fontSize: 16, fontWeight: '800', color: '#111', textAlign: 'center', padding: 18 },

    // Time Picker
    timePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12 },
    timePickerText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111' },
    timeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    timeModal: { backgroundColor: '#fff', borderRadius: 24, padding: 20 },
    timeTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 16, textAlign: 'center' },
    timeRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
    timeColLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 },
    timeOption: { padding: 10, borderRadius: 10, alignItems: 'center', marginBottom: 4 },
    timeOptionActive: { backgroundColor: '#111' },
    timeOptionText: { fontSize: 16, fontWeight: '700', color: '#374151' },
    timeConfirm: { backgroundColor: '#111', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },

    // Reject Modal
    rejectOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    rejectModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
});
