import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Save, Scissors, Clock, X, Info, Globe, MapPin, Instagram, Facebook, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const DAYS: Record<string, string> = {
    monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
    thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};
const DURATIONS = ['15', '30', '45', '60', '90', '120'];
const GENRES = ['Homme', 'Femme', 'Unisexe', 'Enfant'];
const QUARTIERS = [
    'Ariana', 'La Marsa', 'Gammarth', 'Sidi Bou Said', 'Carthage',
    'El Menzah', 'Ennasr', 'Le Bardo', 'Centre Ville', 'Les Berges du Lac',
    'La Soukra', 'Manar', "L'Aouina", 'Ain Zaghouan',
];

export default function SalonConfigScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [salonId, setSalonId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Global Salon Info Form
    const [form, setForm] = useState({
        nom_salon: '',  adresse: '', telephone: '', description: '',  logo_url: '',
        social_networks: { instagram: '', facebook: '', tiktok: '' },
        service_area: [] as string[],
        other_area: '',
    });

    const [services, setServices] = useState<any[]>([]);
    const [hours, setHours] = useState<any>({});
    
    // Services Modal State
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [newSvc, setNewSvc] = useState({ nom_service: '', prix: '', duree_minutes: '30', genre_cible: ['Unisexe'] });
    const [savingService, setSavingService] = useState(false);

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
            
            const [salonRes, svcsRes] = await Promise.all([
                supabase.from('salons').select('*').eq('id', sid).single(),
                supabase.from('services').select('*').eq('salon_id', sid).order('nom_service'),
            ]);
            
            if (salonRes.data) {
                const s = salonRes.data;
                setForm({
                    nom_salon: s.nom_salon || '', adresse: s.adresse || '', telephone: s.telephone || '',
                    description: s.description || '', logo_url: s.logo_url || '',
                    social_networks: {
                        instagram: s.social_networks?.instagram || '',
                        facebook: s.social_networks?.facebook || '',
                        tiktok: s.social_networks?.tiktok || '',
                    },
                    service_area: s.service_area || [],
                    other_area: '',
                });
                
                if (s.horaires_ouverture) {
                    setHours(s.horaires_ouverture);
                } else {
                    // default init
                    const defaultH = Object.keys(DAYS).reduce((acc: any, d) => {
                        acc[d] = { isOpen: d !== 'sunday', open: '09:00', close: '19:00' };
                        return acc;
                    }, {});
                    setHours(defaultH);
                }
            }
            if (svcsRes.data) setServices(svcsRes.data);
            
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function handleSaveGlobal() {
        if (!salonId) return;
        setSaving(true);
        setMessage(null);
        try {
            const serviceArea = form.other_area.trim() ? [...form.service_area, form.other_area.trim()] : form.service_area;
            const { error } = await supabase.from('salons').update({
                nom_salon: form.nom_salon,
                adresse: form.adresse,
                telephone: form.telephone,
                description: form.description,
                logo_url: form.logo_url,
                social_networks: form.social_networks,
                service_area: serviceArea,
                horaires_ouverture: hours,
                updated_at: new Date().toISOString(),
            }).eq('id', salonId);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès !' });
            setTimeout(() => setMessage(null), 3000);
        } catch (e: any) {
            setMessage({ type: 'error', text: 'Erreur : ' + e.message });
        } finally { setSaving(false); }
    }

    function toggleQuartier(area: string) {
        setForm(p => ({ ...p, service_area: p.service_area.includes(area) ? p.service_area.filter(a => a !== area) : [...p.service_area, area] }));
    }

    // Services Management
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
            { text: 'Supprimer', style: 'destructive', onPress: async () => { await supabase.from('services').delete().eq('id', id); fetchData(); } },
        ]);
    }

    if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#111" style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color="#111" /></TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.title}>Paramètres Globaux</Text>
                    <Text style={s.subtitle}>Édition Profil Public & Horaires</Text>
                </View>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSaveGlobal} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                        <>
                            <Save size={14} color="#fff" />
                            <Text style={s.saveBtnText}>Enregistrer</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

                {message && (
                    <View style={[s.messageBanner, message.type === 'success' ? s.successBanner : s.errorBanner]}>
                        {message.type === 'success' ? <CheckCircle size={18} color="#059669" />  : <XCircle size={18} color="#DC2626" />}
                        <Text style={[s.messageText, { color: message.type === 'success' ? '#059669' : '#DC2626' }]}>{message.text}</Text>
                    </View>
                )}

                {/* ── Infos Générales ──────────────────────── */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Info size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Informations de l'Établissement</Text>
                    </View>
                    <Text style={s.label}>Nom du Salon *</Text>
                    <TextInput style={s.input} placeholder="Ex: Élégance Carthage" value={form.nom_salon} onChangeText={v => setForm({ ...form, nom_salon: v })} maxLength={60} />
                    <Text style={s.label}>Adresse Complète</Text>
                    <TextInput style={[s.input, s.multiline]} placeholder="N°, Rue, Ville..." multiline numberOfLines={2} value={form.adresse} onChangeText={v => setForm({ ...form, adresse: v })} />
                    <Text style={s.label}>Téléphone Principal</Text>
                    <TextInput style={s.input} placeholder="+216 -- --- ---" keyboardType="phone-pad" value={form.telephone} onChangeText={v => setForm({ ...form, telephone: v })} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={s.label}>Description</Text>
                        <Text style={s.charCount}>{form.description.length}/300</Text>
                    </View>
                    <TextInput style={[s.input, s.multiline, { height: 90 }]} placeholder="Décrivez votre salon..." multiline numberOfLines={4} maxLength={300} value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
                </View>

                {/* ── Identité Visuelle & Réseaux Sociaux ─────────────────────── */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Globe size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Marque & Web</Text>
                    </View>
                    <Text style={s.label}>URL du Logo</Text>
                    <TextInput style={s.input} placeholder="https://..." value={form.logo_url} onChangeText={v => setForm({ ...form, logo_url: v })} keyboardType="url" autoCapitalize="none" />
                    
                    <Text style={[s.label, { marginTop: 12}]}>Réseaux Sociaux</Text>
                    <View style={s.socialRow}>
                        <View style={[s.socialIcon, { backgroundColor: '#FCE7F3' }]}><Instagram size={18} color="#E1306C" /></View>
                        <TextInput style={s.socialInput} placeholder="Lien Instagram" value={form.social_networks?.instagram || ''} onChangeText={v => setForm({ ...form, social_networks: { ...form.social_networks, instagram: v } })} autoCapitalize="none" keyboardType="url" />
                    </View>
                    <View style={s.socialRow}>
                        <View style={[s.socialIcon, { backgroundColor: '#EFF6FF' }]}><Facebook size={18} color="#1877F2" /></View>
                        <TextInput style={s.socialInput} placeholder="Lien Facebook" value={form.social_networks?.facebook || ''} onChangeText={v => setForm({ ...form, social_networks: { ...form.social_networks, facebook: v } })} autoCapitalize="none" keyboardType="url" />
                    </View>
                </View>

                {/* ── Zones Desservies ──────────────────────── */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <MapPin size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Zones Desservies</Text>
                    </View>
                    <View style={s.chipWrap}>
                        {QUARTIERS.map(area => (
                            <TouchableOpacity key={area} onPress={() => toggleQuartier(area)} style={[s.chip, form.service_area.includes(area) && s.chipOn]}>
                                <Text style={[s.chipTxt, form.service_area.includes(area) && { color: '#fff' }]}>{area}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[s.label, { marginTop: 12 }]}>Autre quartier</Text>
                    <TextInput style={s.input} placeholder="Saisir un autre quartier..." value={form.other_area} onChangeText={v => setForm({ ...form, other_area: v })} />
                </View>

                 {/* ── Horaires d'ouverture ──────────────────────── */}
                 <View style={s.section}>
                    <View style={s.secHead}>
                        <Clock size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Horaires d'ouverture</Text>
                    </View>
                    {Object.keys(DAYS).map(day => (
                        <View key={day} style={s.dayRow}>
                            <Switch value={hours[day]?.isOpen ?? false} onValueChange={v => setHours((p: any) => ({ ...p, [day]: { ...p[day], isOpen: v } }))} trackColor={{ false: '#E5E7EB', true: '#111' }} thumbColor="#fff" />
                            <Text style={[s.dayLabel, !hours[day]?.isOpen && { color: '#D1D5DB' }]}>{DAYS[day]}</Text>
                            {hours[day]?.isOpen ? (
                                <View style={s.timeRow}>
                                    <TextInput style={s.timeInput} value={hours[day]?.open || ''} maxLength={5} placeholder="09:00" keyboardType="numbers-and-punctuation" onChangeText={v => setHours((p: any) => ({ ...p, [day]: { ...p[day], open: v } }))} />
                                    <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>—</Text>
                                    <TextInput style={s.timeInput} value={hours[day]?.close || ''} maxLength={5} placeholder="19:00" keyboardType="numbers-and-punctuation" onChangeText={v => setHours((p: any) => ({ ...p, [day]: { ...p[day], close: v } }))} />
                                </View>
                            ) : <Text style={s.fermeTxt}>Fermé</Text>}
                        </View>
                    ))}
                </View>

                {/* ── Prestations / Services ──────────────────────── */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Scissors size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Prestations</Text>
                        <TouchableOpacity style={s.addCircle} onPress={() => setShowServiceModal(true)}><Plus size={16} color="#1152d4" /></TouchableOpacity>
                    </View>
                    <Text style={s.descTxt}>Gérez ci-dessous tous les services réservables par les clients. Les modifications sont immédiates (pas besoin du grand bouton Enregistrer).</Text>
                    {services.length === 0 && <Text style={s.emptyTxt}>Aucun service encore créé</Text>}
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
                        <TextInput style={s.input} placeholder="Ex: Coupe Homme ou Brushing" value={newSvc.nom_service} onChangeText={v => setNewSvc({ ...newSvc, nom_service: v })} />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Prix (DT) *</Text>
                                <TextInput style={s.input} placeholder="25" keyboardType="numeric" value={newSvc.prix} onChangeText={v => setNewSvc({ ...newSvc, prix: v })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLabel}>Durée estimée</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                    {DURATIONS.map(d => (
                                        <TouchableOpacity key={d} onPress={() => setNewSvc({ ...newSvc, duree_minutes: d })} style={[s.chip, newSvc.duree_minutes === d && s.chipOn]}>
                                            <Text style={[s.chipTxt, newSvc.duree_minutes === d && { color: '#fff' }]}>{d}m</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                        <Text style={s.fieldLabel}>Cible</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {GENRES.map(g => (
                                <TouchableOpacity key={g} onPress={() => setNewSvc(p => ({ ...p, genre_cible: p.genre_cible.includes(g) ? p.genre_cible.filter(x => x !== g) : [...p.genre_cible, g] }))} style={[s.chip, newSvc.genre_cible.includes(g) && s.chipOn]}>
                                    <Text style={[s.chipTxt, newSvc.genre_cible.includes(g) && { color: '#fff' }]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={[s.actionBtn, savingService && { opacity: 0.6 }]} onPress={addService} disabled={savingService}>
                            {savingService ? <ActivityIndicator color="#fff" /> : <Text style={s.actionBtnTxt}>Créer le service</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    title: { fontSize: 16, fontWeight: '900', color: '#111' },
    subtitle: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
    saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    messageBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
    successBanner: { backgroundColor: '#D1FAE5' },
    errorBanner: { backgroundColor: '#FEE2E2' },
    messageText: { fontSize: 14, fontWeight: '700', flex: 1 },
    section: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    secTitle: { fontSize: 15, fontWeight: '800', color: '#111', flex: 1},
    descTxt: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginBottom: 12, lineHeight: 18 },
    label: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    charCount: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 14 },
    multiline: { textAlignVertical: 'top', height: 70 },
    socialRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
    socialIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    socialInput: { flex: 1, fontSize: 14, color: '#111', fontWeight: '600' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F3F4F6' },
    chipOn: { backgroundColor: '#111' },
    chipTxt: { fontSize: 13, fontWeight: '700', color: '#374151' },
    dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    dayLabel: { fontSize: 14, fontWeight: '700', color: '#374151', flex: 1 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timeInput: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, fontWeight: '700', width: 56, textAlign: 'center', color: '#111' },
    fermeTxt: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
    addCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8 },
    itemName: { fontSize: 14, fontWeight: '700', color: '#111' },
    itemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    emptyTxt: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
    modal: { flex: 1, backgroundColor: '#fff' },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    actionBtn: { backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
    actionBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
