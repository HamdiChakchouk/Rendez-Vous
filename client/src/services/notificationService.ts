import twilio from 'twilio';
import { supabaseAdmin } from '../lib/supabase-admin';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export class NotificationService {
    // ─── Envoi Push Notification via Expo ─────────────────────────────
    static async sendPushNotification(pushToken: string, message: string): Promise<boolean> {
        try {
            const res = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: pushToken,
                    sound: 'default',
                    title: 'Reservy',
                    body: message,
                    priority: 'high', // Pour s'assurer du "son fort" et de la bannière sur Android
                }),
            });
            const data = await res.json();
            if (data?.data?.status === 'ok') {
                return true;
            } else {
                console.warn('[Expo Push] Erreur:', data);
                return false;
            }
        } catch (err) {
            console.error('[Expo Push Network Error]', err);
            return false;
        }
    }

    // ─── Stratégie de Cascade : Push -> Meta WhatsApp -> Twilio SMS ────────────────
    static async sendHybridNotification(to: string, message: string): Promise<boolean> {
        // 1. Tenter la Notification Push en priorité (Gratuit et natif)
        try {
            // Chercher si ce numéro de téléphone possède un Push Token enregistré
            const { data: clientData } = await supabaseAdmin
                .from('clients')
                .select('expo_push_token')
                .eq('telephone', to)
                .maybeSingle();

            if (clientData?.expo_push_token) {
                const pushSuccess = await this.sendPushNotification(clientData.expo_push_token, message);
                if (pushSuccess) {
                    console.log(`[Push Notification] Envoyée avec succès à ${to}`);
                    // Si on veut une sécurité absolue, on pourrait continuer la cascade pour les annulations.
                    // Mais en général, le Push suffit.
                    return true;
                }
            }
        } catch (err) {
            console.warn("[Push DB Error] Erreur lors de la récupération du token", err);
        }

        // 2. Fallback SMS Standard (Si Push échoue ou pas de token)
        if (!client || !fromPhone) {

            console.log(`[SMS Simulation Fallback] To: ${to}\nMessage: ${message}`);
            return true;
        }

        try {
            await client.messages.create({
                body: message,
                from: fromPhone,
                to: to
            });
            console.log(`[Twilio SMS] Envoyé avec succès à ${to}`);
            return true;
        } catch (error) {
            console.error('[Twilio SMS Fallback Error]', error);
            return false;
        }
    }

    static async sendAppointmentReminder(to: string, salonName: string, date: string, time: string): Promise<boolean> {
        const message = `Reservy: Rappel — votre RDV chez ${salonName} est prévu le ${date} à ${time}. À bientôt !`;
        return this.sendHybridNotification(to, message);
    }

    static async sendAppointmentConfirmation(to: string, salonName: string, date: string, time: string): Promise<boolean> {
        const message = `Reservy: Votre RDV chez ${salonName} le ${date} à ${time} est confirmé ✅`;
        return this.sendHybridNotification(to, message);
    }
}
