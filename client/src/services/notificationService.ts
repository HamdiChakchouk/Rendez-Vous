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
        // ─── Persistance dans la table notifications (historique in-app) ─────────────
        try {
            // Lookup 1 : Chercher un profil par numéro de téléphone (utilisateurs connectés)
            let profileId: string | null = null;
            const { data: profileByPhone } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('telephone', to)
                .maybeSingle();

            if (profileByPhone) {
                profileId = profileByPhone.id;
            } else {
                // Lookup 2 : Fallback pour clients OTP — vérifier si ce client est lié à un compte auth
                // (Cas : le client a réservé via OTP puis s'est connecté mais n'a pas renseigné son tél dans le profil)
                const { data: clientData } = await supabaseAdmin
                    .from('clients')
                    .select('id')
                    .eq('telephone', to)
                    .maybeSingle();

                if (clientData) {
                    // L'id du client peut correspondre à l'id auth.users si l'utilisateur est connecté
                    const { data: profileByClientId } = await supabaseAdmin
                        .from('profiles')
                        .select('id')
                        .eq('id', clientData.id)
                        .maybeSingle();

                    if (profileByClientId) {
                        profileId = profileByClientId.id;
                    }
                }
            }

            if (profileId) {
                // Catégorisation automatique du titre
                let titre = 'Notification';
                if (message.includes('confirmé') || message.includes('✅')) {
                    titre = 'Rendez-vous confirmé';
                } else if (message.toLowerCase().includes('rappel')) {
                    titre = 'Rappel de rendez-vous';
                } else if (message.toLowerCase().includes('annulé') || message.toLowerCase().includes('annulation')) {
                    titre = 'Rendez-vous annulé';
                }

                // Nettoyer le préfixe "Reservy :"
                const contenu = message.replace(/^Reservy\s*:\s*/i, '');

                await supabaseAdmin
                    .from('notifications')
                    .insert({
                        user_id: profileId,
                        titre,
                        contenu,
                        is_read: false
                    });
                console.log(`[Notifications DB] Notification enregistrée pour user_id: ${profileId}`);
            } else {
                console.log(`[Notifications DB] Pas de profil trouvé pour ${to} — notification in-app ignorée, SMS/Push continueront.`);
            }
        } catch (dbErr) {
            console.error('Erreur lors de la persistance de la notification:', dbErr);
        }

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
                    return { sent: true };
                }
            }
        } catch (err) {
            console.warn("[Push DB Error] Erreur lors de la récupération du token", err);
        }

        // 2. Fallback SMS Standard (Si Push échoue ou pas de token)
        if (!client || !fromPhone) {
            console.log(`[SMS Simulation Fallback] To: ${to}\nMessage: ${message}`);
            return { sent: true };
        }

        try {
            await client.messages.create({
                body: message,
                from: fromPhone,
                to: to
            });
            console.log(`[Twilio SMS] Envoyé avec succès à ${to}`);
            return { sent: true };
        } catch (error: any) {
            console.error('[Twilio SMS Fallback Error]', error);
            return { sent: false, error: error.message || 'Twilio Error' };
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
