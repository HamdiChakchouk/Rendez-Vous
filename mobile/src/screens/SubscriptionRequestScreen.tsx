import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Building2, Mail, Phone, User, MapPin, ChevronDown, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const TYPES = [
    { value: 'coiffure_homme', label: '✂️ Coiffure Homme' },
    { value: 'coiffure_femme', label: '💇 Coiffure Femme' },
    { value: 'mixte', label: '🔄 Mixte' },
    { value: 'esthetique', label: '💅 Esthétique' },
    { value: 'autre', label: '✨ Autre' },
];

export default function SubscriptionRequestScreen({ navigation, route }: any) {
    const prefillEmail = route?.params?.email || '';
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [form, setForm] = useState({
        nom_prenom: '',
        email: prefillEmail,
        telephone: '',
        nom_salon: '',
        ville: '',
        type_salon: 'mixte',
        message: '',
    });

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setIsLoggedIn(true);
                setForm(f => ({ ...f, email: user.email || f.email }));
            }
        });
    }, []);

    function validate(): string | null {
        if (!form.nom_prenom.trim()) return 'Votre nom complet est obligatoire.';
        if (!form.email.trim() || !form.email.includes('@')) return 'Email valide obligatoire.';
        if (!form.nom_salon.trim()) return 'Le nom du salon est obligatoire.';
        return null;
    }

    async function handleSubmit() {
        const err = validate();
        if (err) { Alert.alert('Validation', err); return; }

        setLoading(true);
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/subscription-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess(true);
        } catch (e: any) {
            Alert.alert('Erreur', e.message || 'Envoi impossible');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <SafeAreaView style={s.container}>
                <View style={s.successBox}>
                    <View style={s.successIcon}>
                        <Check size={40} color="#059669" />
                    </View>
                    <Text style={s.successTitle}>Demande envoyée !</Text>
                    <Text style={s.successSub}>
                        Notre équipe examinera votre demande et vous contactera dans les <Text style={{ fontWeight: '800' }}>24h</Text> à {form.email}.
                    </Text>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.popToTop()}>
                        <Text style={s.backBtnTxt}>Retour à l'accueil</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#111" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Demande d'abonnement</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
                keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* Info box */}
                {!isLoggedIn && (
                    <View style={s.infoBox}>
                        <Text style={s.infoTxt}>
                            💡 Vous avez déjà un compte Reservy ?{' '}
                            <Text style={s.infoLink} onPress={() => navigation.navigate('Auth')}>
                                Connectez-vous d'abord
                            </Text>{' '}
                            pour lier votre demande à votre compte.
                        </Text>
                    </View>
                )}

                {/* Nom complet */}
                <Text style={s.label}>Nom complet *</Text>
                <View style={s.inputWrap}>
                    <User size={16} color="#9CA3AF" />
                    <TextInput style={s.input} placeholder="Hamdi Chakchouk" placeholderTextColor="#9CA3AF"
                        value={form.nom_prenom} onChangeText={v => setForm({ ...form, nom_prenom: v })} />
                </View>

                {/* Email */}
                <Text style={s.label}>Email *</Text>
                <View style={s.inputWrap}>
                    <Mail size={16} color="#9CA3AF" />
                    <TextInput style={s.input} placeholder="vous@salon.tn" placeholderTextColor="#9CA3AF"
                        keyboardType="email-address" autoCapitalize="none"
                        value={form.email} onChangeText={v => setForm({ ...form, email: v })} />
                </View>

                {/* Téléphone */}
                <Text style={s.label}>Téléphone</Text>
                <View style={s.inputWrap}>
                    <Phone size={16} color="#9CA3AF" />
                    <TextInput style={s.input} placeholder="+216 -- --- ---" placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        value={form.telephone} onChangeText={v => setForm({ ...form, telephone: v })} />
                </View>

                {/* Nom salon */}
                <Text style={s.label}>Nom du Salon *</Text>
                <View style={s.inputWrap}>
                    <Building2 size={16} color="#9CA3AF" />
                    <TextInput style={s.input} placeholder="Ex: Élégance Carthage" placeholderTextColor="#9CA3AF"
                        value={form.nom_salon} onChangeText={v => setForm({ ...form, nom_salon: v })} />
                </View>

                {/* Ville */}
                <Text style={s.label}>Ville</Text>
                <View style={s.inputWrap}>
                    <MapPin size={16} color="#9CA3AF" />
                    <TextInput style={s.input} placeholder="Tunis, Sfax, Sousse..." placeholderTextColor="#9CA3AF"
                        value={form.ville} onChangeText={v => setForm({ ...form, ville: v })} />
                </View>

                {/* Type salon */}
                <Text style={s.label}>Type de salon</Text>
                <View style={s.chipWrap}>
                    {TYPES.map(t => (
                        <TouchableOpacity key={t.value}
                            onPress={() => setForm({ ...form, type_salon: t.value })}
                            style={[s.chip, form.type_salon === t.value && s.chipActive]}>
                            <Text style={[s.chipTxt, form.type_salon === t.value && { color: '#fff' }]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Message */}
                <Text style={s.label}>Message (optionnel)</Text>
                <TextInput style={[s.inputWrap, { height: 90, alignItems: 'flex-start', paddingVertical: 12 }]}
                    placeholder="Parlez-nous de votre salon..." placeholderTextColor="#9CA3AF"
                    multiline textAlignVertical="top" value={form.message}
                    onChangeText={v => setForm({ ...form, message: v })} />

                {/* Submit */}
                <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]}
                    onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.submitTxt}>Envoyer ma demande →</Text>
                    }
                </TouchableOpacity>

                <Text style={s.disclaimer}>
                    Notre équipe examinera votre demande et créera votre espace pro dans les 24h.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTitle: { fontSize: 17, fontWeight: '900', color: '#111' },
    infoBox: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 14, padding: 14, marginBottom: 20 },
    infoTxt: { fontSize: 13, color: '#92400E', lineHeight: 18 },
    infoLink: { color: '#D97706', fontWeight: '700', textDecorationLine: 'underline' },
    label: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E5E7EB' },
    input: { flex: 1, fontSize: 14, color: '#111', fontWeight: '600', paddingVertical: 13 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    chipActive: { backgroundColor: '#111', borderColor: '#111' },
    chipTxt: { fontSize: 13, fontWeight: '700', color: '#374151' },
    submitBtn: { backgroundColor: '#111', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 28 },
    submitTxt: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
    disclaimer: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 16, lineHeight: 18 },
    successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
    successIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
    successTitle: { fontSize: 28, fontWeight: '900', color: '#111' },
    successSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
    backBtn: { marginTop: 12, backgroundColor: '#111', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
    backBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
