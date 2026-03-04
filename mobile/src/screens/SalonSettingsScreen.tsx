import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Globe, Instagram, Facebook, MapPin, Info, CheckCircle, XCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const QUARTIERS = [
    'Ariana', 'La Marsa', 'Gammarth', 'Sidi Bou Said', 'Carthage',
    'El Menzah', 'Ennasr', 'Le Bardo', 'Centre Ville', 'Les Berges du Lac',
    'La Soukra', 'Manar', "L'Aouina", 'Ain Zaghouan',
];

export default function SalonSettingsScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [salonId, setSalonId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [form, setForm] = useState({
        nom_salon: '',
        adresse: '',
        telephone: '',
        description: '',
        logo_url: '',
        social_networks: { instagram: '', facebook: '', tiktok: '' },
        service_area: [] as string[],
        other_area: '',
    });

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from('profiles').select('salon_id').eq('id', user.id).maybeSingle();
            if (!profile?.salon_id) { setLoading(false); return; }
            setSalonId(profile.salon_id);

            const { data: salon } = await supabase.from('salons').select('*').eq('id', profile.salon_id).single();
            if (salon) {
                setForm({
                    nom_salon: salon.nom_salon || '',
                    adresse: salon.adresse || '',
                    telephone: salon.telephone || '',
                    description: salon.description || '',
                    logo_url: salon.logo_url || '',
                    social_networks: {
                        instagram: salon.social_networks?.instagram || '',
                        facebook: salon.social_networks?.facebook || '',
                        tiktok: salon.social_networks?.tiktok || '',
                    },
                    service_area: salon.service_area || [],
                    other_area: '',
                });
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function handleSave() {
        if (!salonId) return;
        setSaving(true);
        setMessage(null);
        try {
            const serviceArea = form.other_area.trim()
                ? [...form.service_area, form.other_area.trim()]
                : form.service_area;

            const { error } = await supabase.from('salons').update({
                nom_salon: form.nom_salon,
                adresse: form.adresse,
                telephone: form.telephone,
                description: form.description,
                logo_url: form.logo_url,
                social_networks: form.social_networks,
                service_area: serviceArea,
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
        setForm(p => ({
            ...p,
            service_area: p.service_area.includes(area)
                ? p.service_area.filter(a => a !== area)
                : [...p.service_area, area],
        }));
    }

    if (loading) return (
        <SafeAreaView style={s.container}>
            <ActivityIndicator size="large" color="#111" style={{ flex: 1 }} />
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#111" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.title}>Profil du Salon</Text>
                    <Text style={s.subtitle}>Édition Profil Public</Text>
                </View>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                        <>
                            <Save size={14} color="#fff" />
                            <Text style={s.saveBtnText}>Enregistrer</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

                {/* Success/Error message */}
                {message && (
                    <View style={[s.messageBanner, message.type === 'success' ? s.successBanner : s.errorBanner]}>
                        {message.type === 'success'
                            ? <CheckCircle size={18} color="#059669" />
                            : <XCircle size={18} color="#DC2626" />}
                        <Text style={[s.messageText, { color: message.type === 'success' ? '#059669' : '#DC2626' }]}>
                            {message.text}
                        </Text>
                    </View>
                )}

                {/* ── Infos Générales ──────────────────────── */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Info size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Informations Générales</Text>
                    </View>

                    <Text style={s.label}>Nom du Salon *</Text>
                    <TextInput style={s.input} placeholder="Ex: Élégance Carthage" value={form.nom_salon}
                        onChangeText={v => setForm({ ...form, nom_salon: v })} maxLength={60} />

                    <Text style={s.label}>Adresse Complète</Text>
                    <TextInput style={[s.input, s.multiline]} placeholder="N°, Rue, Ville..." multiline numberOfLines={2}
                        value={form.adresse} onChangeText={v => setForm({ ...form, adresse: v })} />

                    <Text style={s.label}>Téléphone Principal</Text>
                    <TextInput style={s.input} placeholder="+216 -- --- ---" keyboardType="phone-pad"
                        value={form.telephone} onChangeText={v => setForm({ ...form, telephone: v })} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={s.label}>Description</Text>
                        <Text style={s.charCount}>{form.description.length}/300</Text>
                    </View>
                    <TextInput style={[s.input, s.multiline, { height: 90 }]} placeholder="Décrivez votre salon..."
                        multiline numberOfLines={4} maxLength={300}
                        value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
                </View>

                {/* ── Identité Visuelle ─────────────────────── */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Globe size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Logo & Identité Visuelle</Text>
                    </View>
                    <Text style={s.label}>URL du Logo</Text>
                    <TextInput style={s.input} placeholder="https://..." value={form.logo_url}
                        onChangeText={v => setForm({ ...form, logo_url: v })} keyboardType="url" autoCapitalize="none" />
                    <Text style={s.hint}>💡 Hébergez votre logo sur Imgur, Cloudinary ou tout service d'image public</Text>
                </View>

                {/* ── Réseaux Sociaux ───────────────────────── */}
                <View style={s.section}>
                    <View style={s.secHead}>
                        <Globe size={15} color="#1152d4" />
                        <Text style={s.secTitle}>Réseaux Sociaux</Text>
                    </View>

                    <View style={s.socialRow}>
                        <View style={[s.socialIcon, { backgroundColor: '#FCE7F3' }]}>
                            <Instagram size={18} color="#E1306C" />
                        </View>
                        <TextInput style={s.socialInput} placeholder="Lien Instagram" value={form.social_networks.instagram}
                            onChangeText={v => setForm({ ...form, social_networks: { ...form.social_networks, instagram: v } })}
                            autoCapitalize="none" keyboardType="url" />
                    </View>

                    <View style={s.socialRow}>
                        <View style={[s.socialIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Facebook size={18} color="#1877F2" />
                        </View>
                        <TextInput style={s.socialInput} placeholder="Lien Facebook" value={form.social_networks.facebook}
                            onChangeText={v => setForm({ ...form, social_networks: { ...form.social_networks, facebook: v } })}
                            autoCapitalize="none" keyboardType="url" />
                    </View>

                    <View style={s.socialRow}>
                        <View style={[s.socialIcon, { backgroundColor: '#F3F4F6' }]}>
                            <Text style={{ fontSize: 12, fontWeight: '900', color: '#111' }}>TT</Text>
                        </View>
                        <TextInput style={s.socialInput} placeholder="Lien TikTok" value={form.social_networks.tiktok}
                            onChangeText={v => setForm({ ...form, social_networks: { ...form.social_networks, tiktok: v } })}
                            autoCapitalize="none" keyboardType="url" />
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
                            <TouchableOpacity key={area} onPress={() => toggleQuartier(area)}
                                style={[s.chip, form.service_area.includes(area) && s.chipOn]}>
                                <Text style={[s.chipTxt, form.service_area.includes(area) && { color: '#fff' }]}>{area}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[s.label, { marginTop: 12 }]}>Autre quartier</Text>
                    <TextInput style={s.input} placeholder="Saisir un autre quartier..."
                        value={form.other_area} onChangeText={v => setForm({ ...form, other_area: v })} />
                </View>
            </ScrollView>
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
    secTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
    label: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    charCount: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    hint: { fontSize: 12, color: '#9CA3AF', marginTop: 6, marginBottom: 4 },
    input: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111', fontWeight: '600', marginBottom: 14 },
    multiline: { textAlignVertical: 'top', height: 70 },
    socialRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
    socialIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    socialInput: { flex: 1, fontSize: 14, color: '#111', fontWeight: '600' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F3F4F6' },
    chipOn: { backgroundColor: '#111' },
    chipTxt: { fontSize: 13, fontWeight: '700', color: '#374151' },
});
