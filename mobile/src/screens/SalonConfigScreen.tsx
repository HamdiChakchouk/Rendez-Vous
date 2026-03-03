import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Save, Scissors, Users, Clock, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const DAYS: Record<string, string> = {
    monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
    thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};
const DURATIONS = ['15', '30', '45', '60', '90', '120'];
const GENRES = ['Homme', 'Femme', 'Unisexe', 'Enfant'];

export default function SalonConfigScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [salonId, setSalonId] = useState<string | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [hours, setHours] = useState<any>({
        monday: { isOpen: true, open: '09:00', close: '19:00' },
        tuesday: { isOpen: true, open: '09:00', close: '19:00' },
        wednesday: { isOpen: true, open: '09:00', close: '19:00' },
        thursday: { isOpen: true, open: '09:00', close: '19:00' },
        friday: { isOpen: true, open: '09:00', close: '19:00' },
        saturday: { isOpen: true, open: '09:00', close: '19:00' },
        sunday: { isOpen: false, open: '09:00', close: '19:00' },
    });
    const [savingHours, setSavingHours] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [newSvc, setNewSvc] = useState({ nom_service: '', prix: '', duree_minutes: '30', genre_cible: ['Unisexe'] });
    const [savingService, setSavingService] = useState(false);
    const [showEmpModal, setShowEmpModal] = useState(false);
    const [newEmpName, setNewEmpName] = useState('');
    const [savingEmp, setSavingEmp] = useState(false);

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from('profiles').select('salon_id').eq('id', user.id).maybeSingle();
            if (!profile?.salon_id) { setLoading(false); return; }
            const sid = profile.salon_id;
            setSalonId(sid);
            const [salonRes, svcsRes, empsRes] = await Promise.all([
                supabase.from('salons').select('horaires_ouverture').eq('id', sid).single(),
                supabase.from('services').select('*').eq('salon_id', sid).order('nom_service'),
                supabase.from('employes').select('*').eq('salon_id', sid).order('nom_employe'),
            ]);
            if (salonRes.data?.horaires_ouverture) setHours(salonRes.data.horaires_ouverture);
            if (svcsRes.data) setServices(svcsRes.data);
            if (empsRes.data) setEmployees(empsRes.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function saveHours() {
        if (!salonId) return;
        setSavingHours(true);
        const { error } = await supabase.from('salons').update({ horaires_ouverture: hours }).eq('id', salonId);
        setSavingHours(false);
        if (error) Alert.alert('Erreur', error.message);
        else Alert.alert('Succès', 'Horaires enregistrés !');
    }

    async function addService() {
        if (!salonId || !newSvc.nom_service || !newSvc.prix) { Alert.alert('Erreur', 'Remplissez nom et prix'); return; }
        setSavingService(true);
        const { error } = await supabase.from('services').insert({
            salon_id: salonId, nom_service: newSvc.nom_service,
            prix: parseFloat(newSvc.prix), duree_minutes: parseInt(newSvc.duree_minutes),
            genre_cible: newSvc.genre_cible,
        });
        setSavingService(false);
        if (error) { Alert.alert('Erreur', error.message); return; }
        setShowServiceModal(false);
        setNewSvc({ nom_service: '', prix: '', duree_minutes: '30', genre_cible: ['Unisexe'] });
        fetchData();
    }

    async function deleteService(id: string) {
        Alert.alert('Supprimer', 'Supprimer ce service ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    await supabase.from('services').delete().eq('id', id); fetchData();
                }
            },
        ]);
    }

    async function addEmployee() {
        if (!salonId || !newEmpName.trim()) { Alert.alert('Erreur', 'Entrez un nom'); return; }
        setSavingEmp(true);
        const { error } = await supabase.from('employes').insert({ salon_id: salonId, nom_employe: newEmpName.trim() });
        setSavingEmp(false);
        if (error) { Alert.alert('Erreur', error.message); return; }
        setShowEmpModal(false);
        setNewEmpName('');
        fetchData();
    }

    async function deleteEmployee(id: string) {
        Alert.alert('Supprimer', 'Supprimer ce collaborateur ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    await supabase.from('employes').delete().eq('id', id); fetchData();
                }
            },
        ]);
    }

    if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#111" style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color="#111" /></TouchableOpacity>
                <Text style={s.title}>Configuration</Text>
                <TouchableOpacity style={[s.saveBtn, savingHours && { opacity: 0.5 }]} onPress={saveHours} disabled={savingHours}>
                    <Save size={14} color="#fff" />
                    <Text style={s.saveBtnText}>{savingHours ? '...' : 'Horaires'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }}>
                {/* Services */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Scissors size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Services</Text>
                        <TouchableOpacity style={s.addCircle} onPress={() => setShowServiceModal(true)}><Plus size={16} color="#1152d4" /></TouchableOpacity>
                    </View>
                    {services.length === 0 && <Text style={s.emptyTxt}>Aucun service encore</Text>}
                    {services.map(svc => (
                        <View key={svc.id} style={s.itemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.itemName}>{svc.nom_service}</Text>
                                <Text style={s.itemSub}>{svc.duree_minutes} min · {svc.prix} DT</Text>
                            </View>
                            <TouchableOpacity onPress={() => deleteService(svc.id)}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Employés */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Users size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Collaborateurs</Text>
                        <TouchableOpacity style={s.addCircle} onPress={() => setShowEmpModal(true)}><Plus size={16} color="#1152d4" /></TouchableOpacity>
                    </View>
                    {employees.length === 0 && <Text style={s.emptyTxt}>Aucun collaborateur</Text>}
                    <View style={s.empGrid}>
                        {employees.map(emp => (
                            <View key={emp.id} style={s.empCard}>
                                <Text style={s.empInitial}>{emp.nom_employe[0]}</Text>
                                <Text style={s.empName}>{emp.nom_employe}</Text>
                                <TouchableOpacity style={s.empDel} onPress={() => deleteEmployee(emp.id)}><X size={11} color="#9CA3AF" /></TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Horaires */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Clock size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Horaires d'ouverture</Text>
                    </View>
                    {Object.keys(DAYS).map(day => (
                        <View key={day} style={s.dayRow}>
                            <Switch value={hours[day]?.isOpen ?? false}
                                onValueChange={v => setHours((p: any) => ({ ...p, [day]: { ...p[day], isOpen: v } }))}
                                trackColor={{ false: '#E5E7EB', true: '#111' }} thumbColor="#fff" />
                            <Text style={[s.dayLabel, !hours[day]?.isOpen && { color: '#D1D5DB' }]}>{DAYS[day]}</Text>
                            {hours[day]?.isOpen ? (
                                <View style={s.timeRow}>
                                    <TextInput style={s.timeInput} value={hours[day]?.open || ''} maxLength={5} placeholder="09:00"
                                        keyboardType="numbers-and-punctuation"
                                        onChangeText={v => setHours((p: any) => ({ ...p, [day]: { ...p[day], open: v } }))} />
                                    <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>—</Text>
                                    <TextInput style={s.timeInput} value={hours[day]?.close || ''} maxLength={5} placeholder="19:00"
                                        keyboardType="numbers-and-punctuation"
                                        onChangeText={v => setHours((p: any) => ({ ...p, [day]: { ...p[day], close: v } }))} />
                                </View>
                            ) : <Text style={s.fermeTxt}>Fermé</Text>}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Modal Service */}
            <Modal visible={showServiceModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowServiceModal(false)}>
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHead}>
                        <Text style={s.modalTitle}>Nouveau Service</Text>
                        <TouchableOpacity onPress={() => setShowServiceModal(false)}><X size={22} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                        <Text style={s.fieldLabel}>Nom *</Text>
                        <TextInput style={s.input} placeholder="Coupe Homme" value={newSvc.nom_service} onChangeText={v => setNewSvc({ ...newSvc, nom_service: v })} />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Prix (DT) *</Text>
                                <TextInput style={s.input} placeholder="25" keyboardType="numeric" value={newSvc.prix} onChangeText={v => setNewSvc({ ...newSvc, prix: v })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Durée</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                    {DURATIONS.map(d => (
                                        <TouchableOpacity key={d} onPress={() => setNewSvc({ ...newSvc, duree_minutes: d })}
                                            style={[s.chip, newSvc.duree_minutes === d && s.chipOn]}>
                                            <Text style={[s.chipTxt, newSvc.duree_minutes === d && { color: '#fff' }]}>{d}m</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                        <Text style={s.fieldLabel}>Genre cible</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {GENRES.map(g => (
                                <TouchableOpacity key={g} onPress={() => setNewSvc(p => ({ ...p, genre_cible: p.genre_cible.includes(g) ? p.genre_cible.filter(x => x !== g) : [...p.genre_cible, g] }))}
                                    style={[s.chip, newSvc.genre_cible.includes(g) && s.chipOn]}>
                                    <Text style={[s.chipTxt, newSvc.genre_cible.includes(g) && { color: '#fff' }]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={[s.actionBtn, savingService && { opacity: 0.6 }]} onPress={addService} disabled={savingService}>
                            {savingService ? <ActivityIndicator color="#fff" /> : <Text style={s.actionBtnTxt}>Ajouter le service</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Modal Employé */}
            <Modal visible={showEmpModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEmpModal(false)}>
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHead}>
                        <Text style={s.modalTitle}>Nouveau Collaborateur</Text>
                        <TouchableOpacity onPress={() => setShowEmpModal(false)}><X size={22} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    <View style={{ padding: 20 }}>
                        <Text style={s.fieldLabel}>Nom complet *</Text>
                        <TextInput style={s.input} placeholder="Prénom Nom" value={newEmpName} onChangeText={setNewEmpName} />
                        <TouchableOpacity style={[s.actionBtn, savingEmp && { opacity: 0.6 }]} onPress={addEmployee} disabled={savingEmp}>
                            {savingEmp ? <ActivityIndicator color="#fff" /> : <Text style={s.actionBtnTxt}>Ajouter au salon</Text>}
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
    saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    saveBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    section: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    secTitle: { fontSize: 15, fontWeight: '800', color: '#111', flex: 1 },
    addCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8 },
    itemName: { fontSize: 14, fontWeight: '700', color: '#111' },
    itemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    emptyTxt: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
    empGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    empCard: { width: '47%', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F3F4F6' },
    empInitial: { fontSize: 20, fontWeight: '900', color: '#374151' },
    empName: { fontSize: 12, fontWeight: '700', color: '#111', textAlign: 'center' },
    empDel: { position: 'absolute', top: 6, right: 6 },
    dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    dayLabel: { fontSize: 14, fontWeight: '700', color: '#374151', flex: 1 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timeInput: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, fontWeight: '700', width: 56, textAlign: 'center', color: '#111' },
    fermeTxt: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
    modal: { flex: 1, backgroundColor: '#fff' },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 16 },
    chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6', marginBottom: 4 },
    chipOn: { backgroundColor: '#111' },
    chipTxt: { fontSize: 12, fontWeight: '700', color: '#374151' },
    actionBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
    actionBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
