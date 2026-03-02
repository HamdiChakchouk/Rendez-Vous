import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NotificationService } from '@/services/notificationService';
import { createHash } from 'crypto';
import { ok, err } from '@/lib/api-response';

/** Hash un code OTP avec SHA-256 (Node.js natif, sans dépendance) */
function hashOtp(code: string): string {
    return createHash('sha256').update(code).digest('hex');
}

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();

        if (!phone) return err('Numéro de téléphone requis', 400);

        // ✅ Anti-spam : max 1 OTP par numéro par 60 secondes
        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { data: recentOtp } = await supabaseAdmin
            .from('otp_custom')
            .select('id')
            .eq('telephone', phone)
            .gte('created_at', sixtySecondsAgo)
            .limit(1)
            .single();

        if (recentOtp) {
            return err('Veuillez attendre 60 secondes avant de renvoyer un code.', 429);
        }

        // Générer l'OTP en clair (pour l'SMS) puis stocker le hash
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpHash = hashOtp(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { error: insertError } = await supabaseAdmin
            .from('otp_custom')
            .insert({
                telephone: phone,
                code_otp: otpHash,          // ✅ Stockage du hash, jamais du code brut
                date_expiration: expiresAt,
                verified: false,
            });

        if (insertError) throw insertError;

        // Envoyer le code brut par SMS (jamais le hash)
        const success = await NotificationService.sendSMS(
            phone,
            `Votre code de validation Rendez-Vous.tn: ${otp}`
        );

        if (success) {
            console.log(`[OTP] Hash stored, code sent to ${phone}`);
            return ok({ message: 'OTP Envoyé' });
        } else {
            // ✅ Rollback : supprimer l'OTP de la DB si le SMS a échoué
            await supabaseAdmin.from('otp_custom').delete().eq('telephone', phone).gte('created_at', new Date(Date.now() - 5000).toISOString());
            return err("Erreur d'envoi SMS. Veuillez réessayer.", 500);
        }
    } catch (error: any) {
        console.error('[OTP Send] Error:', error);
        return err(error.message);
    }
}
