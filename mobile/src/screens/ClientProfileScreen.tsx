import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Camera } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function ClientProfileScreen({ navigation, route }: any) {
    const [form, setForm] = useState({
        prenom: '',
        nom: '',
        telephone: '',
        email: route?.params?.email || '',
        dateNaissance: '',
        ville: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const update = (key: string, value: string) =>
        setForm(prev => ({ ...prev, [key]: value }));

    async function handleSave() {
        setLoading(true);
        setError('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non connecté');

            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                prenom: form.prenom,
                nom: form.nom,
                phone: form.telephone,
                email: form.email,
                date_naissance: form.dateNaissance || null,
                ville: form.ville,
                role: 'client',
                updated_at: new Date().toISOString(),
            });

            if (error) throw error;
            navigation.replace('MainTabs');
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <ArrowLeft size={22} color="#111" />
                        </TouchableOpacity>
                        <Text style={styles.logo}>RESERVY</Text>
                        <View style={{ width: 22 }} />
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarBtn}>
                            <User size={40} color="#9CA3AF" />
                            <View style={styles.cameraIcon}>
                                <Camera size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarHint}>Ajouter une photo</Text>
                    </View>

                    <Text style={styles.title}>Mon profil client</Text>
                    <Text style={styles.subtitle}>
                        Complétez votre profil pour une expérience personnalisée
                    </Text>

                    {!!error && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.form}>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, styles.flex1]}>
                                <Text style={styles.label}>Prénom *</Text>
                                <View style={styles.inputBox}>
                                    <User size={16} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Hamdi"
                                        placeholderTextColor="#9CA3AF"
                                        value={form.prenom}
                                        onChangeText={v => update('prenom', v)}
                                    />
                                </View>
                            </View>
                            <View style={[styles.inputGroup, styles.flex1]}>
                                <Text style={styles.label}>Nom *</Text>
                                <View style={styles.inputBox}>
                                    <User size={16} color="#9CA3AF" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Chakchouk"
                                        placeholderTextColor="#9CA3AF"
                                        value={form.nom}
                                        onChangeText={v => update('nom', v)}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Téléphone *</Text>
                            <View style={styles.inputBox}>
                                <Phone size={16} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="+216 XX XXX XXX"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.telephone}
                                    onChangeText={v => update('telephone', v)}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email *</Text>
                            <View style={styles.inputBox}>
                                <Mail size={16} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="votre@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.email}
                                    onChangeText={v => update('email', v)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date de naissance</Text>
                            <View style={styles.inputBox}>
                                <Calendar size={16} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="JJ/MM/AAAA"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.dateNaissance}
                                    onChangeText={v => update('dateNaissance', v)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ville</Text>
                            <View style={styles.inputBox}>
                                <MapPin size={16} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tunis, Sousse, Sfax..."
                                    placeholderTextColor="#9CA3AF"
                                    value={form.ville}
                                    onChangeText={v => update('ville', v)}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={loading}>
                            <Text style={styles.saveBtnText}>
                                {loading ? 'Enregistrement...' : 'Enregistrer mon profil'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.skipBtn}
                            onPress={() => navigation.replace('MainTabs')}>
                            <Text style={styles.skipBtnText}>Passer pour l'instant</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    flex1: { flex: 1 },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    logo: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111',
        letterSpacing: 3,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 16,
    },
    avatarBtn: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#111',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarHint: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111',
        paddingHorizontal: 24,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    errorBanner: {
        marginHorizontal: 24,
        backgroundColor: '#FEE2E2',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 13,
    },
    form: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#111',
    },
    saveBtn: {
        backgroundColor: '#111',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    skipBtn: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    skipBtnText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
});
