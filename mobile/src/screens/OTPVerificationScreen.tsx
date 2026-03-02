import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { verifyOTP } from '../lib/otpService';

export default function OTPVerificationScreen({ navigation, route }: any) {
    const { phone, bookingData, serviceDetails } = route.params;
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<TextInput>(null);

    async function handleVerify() {
        if (otp.length < 4) { setError('Le code doit comporter 4 chiffres'); return; }
        setIsLoading(true);
        setError('');

        const result = await verifyOTP(phone, otp, bookingData);
        setIsLoading(false);

        if (result.success) {
            navigation.replace('Confirmation', { phone, bookingData, serviceDetails });
        } else {
            setError(result.message);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.logo}>RESERVY</Text>
                <View style={{ width: 22 }} />
            </View>

            <View style={styles.body}>
                <View style={styles.iconCircle}>
                    <ShieldCheck size={36} color="#1152d4" />
                </View>

                <Text style={styles.title}>Vérification</Text>
                <Text style={styles.subtitle}>
                    Veuillez entrer le code envoyé au{'\n'}
                    <Text style={styles.phoneHighlight}>{phone}</Text>
                </Text>

                <TouchableOpacity style={styles.otpBox} onPress={() => inputRef.current?.focus()}>
                    <TextInput
                        ref={inputRef}
                        style={styles.otpInput}
                        value={otp}
                        onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 4))}
                        keyboardType="numeric"
                        maxLength={4}
                        placeholder="0000"
                        placeholderTextColor="#D1D5DB"
                        autoFocus
                    />
                </TouchableOpacity>

                {!!error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.verifyBtn, isLoading && { opacity: 0.6 }]}
                    onPress={handleVerify}
                    disabled={isLoading}>
                    {isLoading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.verifyBtnText}>Vérifier le code</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={14} color="#9CA3AF" />
                    <Text style={styles.backLinkText}>Changer de numéro</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    logo: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: 3 },
    body: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 26, fontWeight: '900', color: '#111', marginBottom: 12 },
    subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    phoneHighlight: { fontWeight: '800', color: '#111' },
    otpBox: { width: '100%', marginBottom: 16 },
    otpInput: { width: '100%', textAlign: 'center', fontSize: 36, letterSpacing: 12, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB', color: '#111' },
    errorBanner: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 16, width: '100%' },
    errorText: { color: '#B91C1C', fontSize: 13, textAlign: 'center', fontWeight: '600' },
    verifyBtn: { backgroundColor: '#111', paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 20 },
    verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    backLinkText: { color: '#9CA3AF', fontSize: 14 },
});
