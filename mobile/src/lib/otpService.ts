/**
 * Mobile OTP Service — 100% autonome, sans serveur Next.js
 *
 * Reproduit exactement la logique de :
 *  - /api/otp/send   → génère + hash + stocke + envoie SMS
 *  - /api/otp/verify → vérifie + crée RDV + marque vérifié
 */

import { supabase } from './supabase';

// ─── Config Twilio (depuis .env) ─────────────────────────────
const TWILIO_ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE = process.env.EXPO_PUBLIC_TWILIO_PHONE || '';

// ─── SHA-256 pur JavaScript (0 dépendance native, Hermes/Expo Go OK) ─
function sha256Sync(str: string): string {
    function rr(x: number, n: number) { return (x >>> n) | (x << (32 - n)); }
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c < 0x80) bytes.push(c);
        else if (c < 0x800) { bytes.push(0xC0 | (c >> 6)); bytes.push(0x80 | (c & 0x3F)); }
        else { bytes.push(0xE0 | (c >> 12)); bytes.push(0x80 | ((c >> 6) & 0x3F)); bytes.push(0x80 | (c & 0x3F)); }
    }
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const bitLen = str.length * 8;
    bytes.push(0, 0, 0, 0, (bitLen >>> 24) & 0xFF, (bitLen >>> 16) & 0xFF, (bitLen >>> 8) & 0xFF, bitLen & 0xFF);
    for (let i = 0; i < bytes.length; i += 64) {
        const w: number[] = [];
        for (let j = 0; j < 16; j++) w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
        for (let j = 16; j < 64; j++) { const s0 = rr(w[j - 15], 7) ^ rr(w[j - 15], 18) ^ (w[j - 15] >>> 3); const s1 = rr(w[j - 2], 17) ^ rr(w[j - 2], 19) ^ (w[j - 2] >>> 10); w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0; }
        let [a, b, c, d, e, f, g, hh] = h;
        for (let j = 0; j < 64; j++) {
            const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25); const ch = (e & f) ^ (~e & g); const t1 = (hh + S1 + ch + K[j] + w[j]) >>> 0;
            const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22); const maj = (a & b) ^ (a & c) ^ (b & c); const t2 = (S0 + maj) >>> 0;
            hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(v => v >>> 0);
    }
    return h.map(v => v.toString(16).padStart(8, '0')).join('');
}
async function sha256(message: string): Promise<string> {
    return sha256Sync(message);
}

// ─── SMS via Twilio REST API ──────────────────────────────────
async function sendSMS(to: string, message: string): Promise<boolean> {
    // Sans config Twilio → simulation (logs uniquement)
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        console.log(`[SMS Simulation] To: ${to}\nMessage: ${message}`);
        return true;
    }

    try {
        const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const body = new URLSearchParams({
            From: TWILIO_PHONE,
            To: to,
            Body: message,
        });

        const res = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            }
        );

        const data = await res.json();
        if (!res.ok) {
            console.error('[Twilio Error]', data);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[SMS Error]', err);
        return false;
    }
}

// ─── Public Interface ─────────────────────────────────────────

export interface BookingData {
    salonId: string;
    serviceId: string;
    employeeId: string;
    date: string;       // ISO string
    time: string;       // "HH:MM"
}

export interface OTPResult {
    success: boolean;
    message: string;
}

/** Envoie un OTP au numéro de téléphone donné */
export async function sendOTP(phone: string): Promise<OTPResult> {
    try {
        // Anti-spam : max 1 OTP par 60 secondes
        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { data: recentOtp } = await supabase
            .from('otp_custom')
            .select('id')
            .eq('telephone', phone)
            .gte('created_at', sixtySecondsAgo)
            .limit(1)
            .maybeSingle();

        if (recentOtp) {
            return { success: false, message: 'Veuillez attendre 60 secondes avant de renvoyer un code.' };
        }

        // Générer OTP + hash
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpHash = await sha256(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Stocker le hash en base
        const { error: insertError } = await supabase
            .from('otp_custom')
            .insert({
                telephone: phone,
                code_otp: otpHash,
                date_expiration: expiresAt,
                verified: false,
            });

        if (insertError) throw insertError;

        // Envoyer le code brut par SMS (jamais le hash)
        const smsSent = await sendSMS(
            phone,
            `Votre code de validation Reservy: ${otp}`
        );

        if (!smsSent) {
            // Rollback
            await supabase
                .from('otp_custom')
                .delete()
                .eq('telephone', phone)
                .gte('created_at', new Date(Date.now() - 5000).toISOString());
            return { success: false, message: "Erreur d'envoi SMS. Veuillez réessayer." };
        }

        console.log(`[OTP] Code envoyé à ${phone}`);
        return { success: true, message: 'OTP envoyé' };
    } catch (err: any) {
        console.error('[sendOTP Error]', err);
        return { success: false, message: err.message || 'Erreur inconnue' };
    }
}

/** Vérifie le code OTP, crée le rendez-vous si valid, marque OTP comme vérifié */
export async function verifyOTP(
    phone: string,
    code: string,
    bookingData: BookingData
): Promise<OTPResult> {
    try {
        // 1. Hash le code reçu et chercher en DB
        const codeHash = await sha256(code);

        const { data: otpRecord, error: otpError } = await supabase
            .from('otp_custom')
            .select('id')
            .eq('telephone', phone)
            .eq('code_otp', codeHash)
            .eq('verified', false)
            .gte('date_expiration', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (otpError || !otpRecord) {
            return { success: false, message: 'Code invalide ou expiré' };
        }

        // 2. Validation du service
        const { data: service, error: serviceError } = await supabase
            .from('services')
            .select('id, salon_id, duree_minutes')
            .eq('id', bookingData.serviceId)
            .single();

        if (serviceError || !service) {
            return { success: false, message: 'Service introuvable' };
        }

        if (service.salon_id !== bookingData.salonId) {
            return { success: false, message: 'Données de réservation invalides' };
        }

        // 3. Validation : pas dans le passé
        const rdvDateTime = new Date(`${new Date(bookingData.date).toISOString().split('T')[0]}T${bookingData.time}:00`);
        if (rdvDateTime < new Date()) {
            return { success: false, message: "La date et l'heure du rendez-vous sont dans le passé." };
        }

        const heureRdv = `${bookingData.time}:00`;
        const employeId = (bookingData.employeeId && bookingData.employeeId !== 'any')
            ? bookingData.employeeId : null;

        // 4. Vérification conflits
        if (employeId) {
            const { data: conflict } = await supabase
                .from('rendez_vous')
                .select('id')
                .eq('date_rdv', new Date(bookingData.date).toISOString().split('T')[0])
                .eq('heure_rdv', heureRdv)
                .eq('employe_id', employeId)
                .in('statut', ['confirmed', 'reminded', 'pending'])
                .limit(1)
                .maybeSingle();

            if (conflict) {
                return { success: false, message: 'Ce créneau est déjà réservé pour ce coiffeur.' };
            }
        }

        // 5. Trouver ou créer le client
        let clientId: string;
        const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('telephone', phone)
            .maybeSingle();

        if (existingClient) {
            clientId = existingClient.id;
        } else {
            const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert({ telephone: phone, nom_client: 'Client App' })
                .select('id')
                .single();

            if (clientError || !newClient) {
                throw new Error(`Erreur création client: ${clientError?.message}`);
            }
            clientId = newClient.id;
        }

        // 6. Créer le rendez-vous
        const { error: rdvError } = await supabase
            .from('rendez_vous')
            .insert({
                salon_id: bookingData.salonId,
                client_id: clientId,
                service_id: bookingData.serviceId,
                employe_id: employeId,
                date_rdv: new Date(bookingData.date).toISOString().split('T')[0],
                heure_rdv: heureRdv,
                statut: 'confirmed',
                confirmed_at: new Date().toISOString(),
            });

        if (rdvError) throw new Error(`Erreur création RDV: ${rdvError.message}`);

        // 7. Marquer OTP comme vérifié
        await supabase
            .from('otp_custom')
            .update({ verified: true })
            .eq('id', otpRecord.id);

        console.log(`[OTP] RDV créé pour ${phone}`);
        return { success: true, message: 'Validé et RDV créé' };
    } catch (err: any) {
        console.error('[verifyOTP Error]', err);
        return { success: false, message: err.message || 'Erreur inconnue' };
    }
}
