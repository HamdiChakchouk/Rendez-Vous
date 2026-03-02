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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen({ navigation, route }: any) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isPro = route?.params?.role === 'pro';

    async function handleAuth() {
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigation.replace('MainTabs');
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                navigation.navigate('ClientProfile', { email });
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
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
                    {/* Back */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft size={22} color="#111" />
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>RESERVY</Text>
                        {isPro && (
                            <View style={styles.proBadge}>
                                <Text style={styles.proBadgeText}>Professionnel</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.title}>
                        {isLogin ? 'Content de vous revoir' : 'Créez votre compte'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isLogin
                            ? 'Connectez-vous pour accéder à vos rendez-vous'
                            : 'Rejoignez des milliers de clients satisfaits'}
                    </Text>

                    {/* Error */}
                    {!!error && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputRow}>
                                <Mail size={18} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="votre@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mot de passe</Text>
                            <View style={styles.inputRow}>
                                <Lock size={18} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {isLogin && (
                            <TouchableOpacity style={styles.forgotBtn}>
                                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                            onPress={handleAuth}
                            disabled={loading}>
                            <Text style={styles.submitBtnText}>
                                {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>ou</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.toggleBtn}
                            onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.toggleBtnText}>
                                {isLogin ? "Pas encore de compte ? " : 'Déjà un compte ? '}
                                <Text style={styles.toggleBtnLink}>
                                    {isLogin ? "S'inscrire" : 'Se connecter'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backBtn: {
        padding: 20,
        paddingBottom: 0,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    logo: {
        fontSize: 26,
        fontWeight: '900',
        color: '#111',
        letterSpacing: 3,
    },
    proBadge: {
        backgroundColor: '#111',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    proBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#111',
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        paddingHorizontal: 24,
        marginBottom: 24,
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
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#111',
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotText: {
        fontSize: 13,
        color: '#1152d4',
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#111',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        color: '#9CA3AF',
        fontSize: 13,
    },
    toggleBtn: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    toggleBtnText: {
        fontSize: 14,
        color: '#6B7280',
    },
    toggleBtnLink: {
        color: '#111',
        fontWeight: '700',
    },
});
