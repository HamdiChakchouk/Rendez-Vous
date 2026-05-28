import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen({ navigation }: any) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleUpdatePassword() {
        setError('');

        if (!password || !confirmPassword) {
            setError('Veuillez remplir les deux champs.');
            return;
        }
        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <CheckCircle size={80} color="#22C55E" />
                    <Text style={styles.successTitle}>Mot de passe mis à jour !</Text>
                    <Text style={styles.successSubtitle}>
                        Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
                    </Text>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => navigation.replace('Auth')}>
                        <Text style={styles.btnText}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}>
                <View style={styles.header}>
                    <Text style={styles.logo}>RESERVY</Text>
                    <Text style={styles.title}>Nouveau mot de passe</Text>
                    <Text style={styles.subtitle}>
                        Choisissez un nouveau mot de passe pour votre compte.
                    </Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Champ nouveau mot de passe */}
                <View style={styles.inputWrapper}>
                    <Lock size={18} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Nouveau mot de passe"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword
                            ? <EyeOff size={18} color="#6B7280" />
                            : <Eye size={18} color="#6B7280" />}
                    </TouchableOpacity>
                </View>

                {/* Champ confirmation */}
                <View style={styles.inputWrapper}>
                    <Lock size={18} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirmer le mot de passe"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirm}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                        {showConfirm
                            ? <EyeOff size={18} color="#6B7280" />
                            : <Eye size={18} color="#6B7280" />}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleUpdatePassword}
                    disabled={loading}>
                    <Text style={styles.btnText}>
                        {loading ? 'Mise à jour...' : 'Confirmer le nouveau mot de passe'}
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
    header: { marginBottom: 32, alignItems: 'center' },
    logo: { fontSize: 22, fontWeight: '900', letterSpacing: 4, color: '#111', marginBottom: 24 },
    title: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
    errorText: {
        color: '#DC2626',
        fontSize: 13,
        marginBottom: 12,
        textAlign: 'center',
        backgroundColor: '#FEF2F2',
        padding: 10,
        borderRadius: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 14,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#111' },
    btn: {
        backgroundColor: '#111',
        paddingVertical: 17,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    btnDisabled: { backgroundColor: '#6B7280' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 16,
    },
    successTitle: { fontSize: 26, fontWeight: '900', color: '#111', textAlign: 'center' },
    successSubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
