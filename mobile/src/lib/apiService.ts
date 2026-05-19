/**
 * apiService.ts
 *
 * Couche de communication entre l'application mobile et le backend Vercel.
 * Toute la logique Twilio est exécutée côté serveur — aucune clé secrète n'est
 * stockée dans l'APK.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base du backend (toujours la version de production Vercel)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rendez-vous-one.vercel.app';

export interface BookingData {
    salonId: string;
    serviceId: string;
    employeeId: string;
    date: string;   // YYYY-MM-DD
    time: string;   // HH:MM
}

export interface ApiResult {
    success: boolean;
    message: string;
}

/** Appelle POST /api/otp/send via le backend Vercel */
export async function sendOTPViaBackend(phone: string): Promise<ApiResult> {
    try {
        const res = await fetch(`${BASE_URL}/api/otp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });

        const data = await res.json();

        if (res.ok) {
            return { success: true, message: data.message || 'OTP envoyé' };
        } else {
            return { success: false, message: data.error || "Erreur d'envoi SMS" };
        }
    } catch (err: any) {
        console.error('[sendOTPViaBackend] Erreur réseau:', err);
        return { success: false, message: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
    }
}

/** Appelle POST /api/otp/verify via le backend Vercel */
export async function verifyOTPViaBackend(
    phone: string,
    code: string,
    bookingData: BookingData
): Promise<ApiResult> {
    try {
        // Formater la date pour le backend (YYYY-MM-DD)
        const dateFormatted = new Date(bookingData.date).toISOString().split('T')[0];

        const res = await fetch(`${BASE_URL}/api/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone,
                code,
                bookingData: {
                    ...bookingData,
                    date: dateFormatted,
                },
            }),
        });

        const data = await res.json();

        if (res.ok) {
            // Mémoriser le téléphone vérifié pour éviter l'OTP la prochaine fois
            await AsyncStorage.setItem('verified_phone', phone);
            return { success: true, message: data.message || 'Validé' };
        } else {
            return { success: false, message: data.error || 'Code invalide ou expiré' };
        }
    } catch (err: any) {
        console.error('[verifyOTPViaBackend] Erreur réseau:', err);
        return { success: false, message: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
    }
}
