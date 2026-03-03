import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Modal, TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Check, X, Calendar } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

type Absence = {
    id: string; employe_id: string; nom_employe: string;
    type: string; date_debut: string; date_fin: string;
    is_half_day: boolean; commentaire: string; statut: 'pending' | 'approved' | 'rejected';
};

const TYPES = ['Congé annuel', 'Maladie', 'Formation', 'Mariage', 'Autre'];

const statusStyle = (s: string) => ({
    pending: { bg: '#FEF3C7', text: '#D97706', label: 'En attente' },
    approved: { bg: '#D1FAE5', text: '#059669', label: 'Validé' },
    rejected: { bg: '#FEE2E2', text: '#DC2626', label: 'Refusé' },
}[s] ?? { bg: '#F3F4F6', text: '#6B7280', label: s });

export default function SalonAbsencesScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [salonId, setSalonId] = useState<string | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [employees, setEmployees] = useState<{ id: string; nom_employe: string }[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        employe_id: '', type: 'Congé annuel',
        date_debut: '', date_fin: '', is_half_day: false, commentaire: '',
    });

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setProfileId(user.id);
            const { data: profile } = await supabase.from('profiles').select('salon_id, role').eq('id', user.id).maybeSingle();
            if (!profile?.salon_id) { setLoading(false); return; }
            setSalonId(profile.salon_id);
            setRole(profile.role);

            const [absRes, empRes] = await Promise.all([
                supabase.from('absences').select('*, employes(nom_employe)').eq('salon_id', profile.salon_id).order('date_debut'),
                supabase.from('employes').select('id, nom_employe').eq('salon_id', profile.salon_id),
            ]);
            if (absRes.data) setAbsences(absRes.data.map(a => ({ ...a, nom_employe: a.employes?.nom_employe || '?' })));
            if (empRes.data) setEmployees(empRes.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function openModal() {
        setForm({ employe_id: role === 'coiffeur' ? (profileId || '') : '', type: 'Congé annuel', date_debut: '', date_fin: '', is_half_day: false, commentaire: '' });
        setShowModal(true);
    }

    async function handleSubmit() {
        if (!salonId || !form.employe_id || !form.date_debut || !form.date_fin) {
            Alert.alert('Erreur', 'Remplissez tous les champs obligatoires'); return;
        }
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (new Date(form.date_debut) < today) { Alert.alert('Erreur', 'Impossible de poser un congé pour une date passée'); return; }
        setSaving(true);
        const { error } = await supabase.from('absences').insert({
            employe_id: form.employe_id, salon_id: salonId,
            type: form.type, date_debut: form.date_debut, date_fin: form.date_fin,
            is_half_day: form.is_half_day, commentaire: form.commentaire, statut: 'pending',
        });
        setSaving(false);
        if (error) { Alert.alert('Erreur', error.message); return; }
        setShowModal(false);
        fetchData();
    }

    async function updateStatus(id: string, statut: 'approved' | 'rejected') {
        Alert.alert(statut === 'approved' ? 'Valider' : 'Refuser', `${statut === 'approved' ? 'Valider' : 'Refuser'} cette absence ?`, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Confirmer', style: statut === 'rejected' ? 'destructive' : 'default', onPress: async () => {
                    await supabase.from('absences').update({ statut }).eq('id', id);
                    fetchData();
                }
            },
        ]);
    }

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color="#111" /></TouchableOpacity>
                <Text style={s.title}>Absences & Congés</Text>
                <TouchableOpacity style={s.addBtn} onPress={openModal}><Plus size={20} color="#fff" /></TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#111" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={absences}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.emptyBox}>
                            <Calendar size={40} color="#E5E7EB" />
                            <Text style={s.emptyTxt}>Aucune absence enregistrée</Text>
                        </View>
                    }
                    renderItem={({ item: abs }) => {
                        const st = statusStyle(abs.statut);
                        return (
                            <View style={s.card}>
                                <View style={s.cardTop}>
                                    <View style={s.avatar}><Text style={s.avatarTxt}>{abs.nom_employe[0]}</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.empName}>{abs.nom_employe}</Text>
                                        <Text style={s.absType}>{abs.type}{abs.is_half_day ? ' · demi-journée' : ''}</Text>
                                    </View>
                                    <View style={[s.badge, { backgroundColor: st.bg }]}>
                                        <Text style={[s.badgeTxt, { color: st.text }]}>{st.label}</Text>
                                    </View>
                                </View>

                                <View style={s.datesRow}>
                                    <View style={s.dateBox}>
                                        <Text style={s.dateLabel}>Du</Text>
                                        <Text style={s.dateVal}>{new Date(abs.date_debut).toLocaleDateString('fr-FR')}</Text>
                                    </View>
                                    <View style={s.dateBox}>
                                        <Text style={s.dateLabel}>Au</Text>
                                        <Text style={s.dateVal}>{new Date(abs.date_fin).toLocaleDateString('fr-FR')}</Text>
                                    </View>
                                </View>

                                {abs.commentaire ? <Text style={s.comment}>"{abs.commentaire}"</Text> : null}

                                {abs.statut === 'pending' && role === 'manager' && (
                                    <View style={s.actions}>
                                        <TouchableOpacity style={s.approveBtn} onPress={() => updateStatus(abs.id, 'approved')}>
                                            <Check size={16} color="#059669" /><Text style={s.approveTxt}>Valider</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={s.rejectBtn} onPress={() => updateStatus(abs.id, 'rejected')}>
                                            <X size={16} color="#DC2626" /><Text style={s.rejectTxt}>Refuser</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            )}

            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHead}>
                        <Text style={s.modalTitle}>Nouvelle Absence</Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}><X size={22} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    <View style={{ padding: 20 }}>
                        {/* Employé */}
                        {role !== 'coiffeur' && (
                            <>
                                <Text style={s.fieldLabel}>Collaborateur *</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
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
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            {TYPES.map(t => (
                                <TouchableOpacity key={t} onPress={() => setForm({ ...form, type: t })}
                                    style={[s.chip, form.type === t && s.chipOn]}>
                                    <Text style={[s.chipTxt, form.type === t && { color: '#fff' }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Dates */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Du (AAAA-MM-JJ) *</Text>
                                <TextInput style={s.input} placeholder="2025-07-01" value={form.date_debut} onChangeText={v => setForm({ ...form, date_debut: v })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Au *</Text>
                                <TextInput style={s.input} placeholder="2025-07-05" value={form.date_fin} onChangeText={v => setForm({ ...form, date_fin: v })} />
                            </View>
                        </View>

                        {/* Demi-journée */}
                        <View style={s.switchRow}>
                            <Switch value={form.is_half_day} onValueChange={v => setForm({ ...form, is_half_day: v })}
                                trackColor={{ false: '#E5E7EB', true: '#111' }} thumbColor="#fff" />
                            <Text style={s.switchLabel}>Demi-journée possible</Text>
                        </View>

                        {/* Commentaire */}
                        <Text style={s.fieldLabel}>Commentaire (optionnel)</Text>
                        <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} multiline
                            placeholder="Motif..." value={form.commentaire} onChangeText={v => setForm({ ...form, commentaire: v })} />

                        <TouchableOpacity style={[s.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnTxt}>Enregistrer la demande</Text>}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    title: { fontSize: 18, fontWeight: '900', color: '#111', flex: 1 },
    addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', padding: 60, gap: 12 },
    emptyTxt: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
    card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 20, fontWeight: '900', color: '#1152d4' },
    empName: { fontSize: 14, fontWeight: '800', color: '#111' },
    absType: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    datesRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    dateBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#F3F4F6' },
    dateLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3 },
    dateVal: { fontSize: 14, fontWeight: '700', color: '#111' },
    comment: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, marginBottom: 10 },
    actions: { flexDirection: 'row', gap: 10 },
    approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D1FAE5', borderRadius: 12, paddingVertical: 10 },
    approveTxt: { fontSize: 13, fontWeight: '700', color: '#059669' },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 10 },
    rejectTxt: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
    modal: { flex: 1, backgroundColor: '#fff' },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 16 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F3F4F6' },
    chipOn: { backgroundColor: '#111' },
    chipTxt: { fontSize: 13, fontWeight: '700', color: '#374151' },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 16 },
    switchLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
    submitBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    submitBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
