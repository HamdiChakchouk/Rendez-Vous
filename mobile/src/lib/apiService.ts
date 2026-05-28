/**
 * apiService.ts
 *
 * Couche de communication entre l'application mobile et le backend Vercel.
 * Toute la logique Twilio est exécutée côté serveur — aucune clé secrète n'est
 * stockée dans l'APK.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base du backend (toujours la version de production Vercel)
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://reservy-one.vercel.app';


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

/**
 * Wrapper for fetch with a timeout using AbortController
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            reject(new Error('Timeout: Le serveur met trop de temps à répondre.'));
        }, timeoutMs);

        fetch(url, options)
            .then(response => {
                clearTimeout(id);
                resolve(response);
            })
            .catch(error => {
                clearTimeout(id);
                reject(error);
            });
    });
}

/** Appelle POST /api/otp/send via le backend Vercel */
export async function sendOTPViaBackend(phone: string): Promise<ApiResult> {
    try {
        const res = await fetchWithTimeout(`${BASE_URL}/api/otp/send`, {
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

        const res = await fetchWithTimeout(`${BASE_URL}/api/otp/verify`, {
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

            // Enregistrer le push token en DB pour les notifications futures
            const pushToken = await AsyncStorage.getItem('expo_push_token');
            if (pushToken) {
                // Non bloquant, avec timeout court de 5s
                fetchWithTimeout(`${BASE_URL}/api/clients/register-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, pushToken }),
                }, 5000).catch(() => {});
            }

            return { success: true, message: data.message || 'Validé' };
        } else {
            return { success: false, message: data.error || 'Code invalide ou expiré' };
        }
    } catch (err: any) {
        console.error('[verifyOTPViaBackend] Erreur réseau:', err);
        return { success: false, message: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
    }
}

/** Appelle POST /api/bookings via le backend Vercel (contourne l'OTP si numéro déjà vérifié) */
export async function createBookingDirectly(
    phone: string,
    bookingData: BookingData
): Promise<ApiResult> {
    try {
        const dateFormatted = new Date(bookingData.date).toISOString().split('T')[0];

        const res = await fetchWithTimeout(`${BASE_URL}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone,
                bookingData: {
                    ...bookingData,
                    date: dateFormatted,
                },
            }),
        });

        const data = await res.json();

        if (res.ok) {
            return { success: true, message: data.message || 'Validé' };
        } else {
            return { success: false, message: data.error || 'Erreur lors de la réservation' };
        }
    } catch (err: any) {
        console.error('[createBookingDirectly] Erreur réseau:', err);
        return { success: false, message: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
    }
}

/**
 * Enregistre le push token Expo dans la base de données Supabase via le backend.
 * Appelé au lancement de l'app dès qu'un numéro vérifié est connu.
 */
export async function registerPushToken(phone: string, pushToken: string): Promise<void> {
    try {
        await fetchWithTimeout(`${BASE_URL}/api/clients/register-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, pushToken }),
        });
        console.log('[registerPushToken] Token envoyé au backend pour', phone);
    } catch (err) {
        // Non bloquant — si ça échoue, l'app continue quand même
        console.warn('[registerPushToken] Échec silencieux:', err);
    }
}
