import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ok, err } from '@/lib/api-response';

/**
 * POST /api/clients/register-token
 * Enregistre ou met à jour le push token Expo d'un client identifié par son numéro de téléphone.
 * Appelé au lancement de l'application si un numéro vérifié est déjà connu.
 */
export async function POST(req: Request) {
    try {
        const { phone, pushToken } = await req.json();

        if (!phone || !pushToken) {
            return err('phone et pushToken sont requis', 400);
        }

        // Vérifier si le client existe déjà
        const { data: existing } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('telephone', phone)
            .maybeSingle();

        if (existing) {
            // Mettre à jour le push token
            await supabaseAdmin
                .from('clients')
                .update({ expo_push_token: pushToken })
                .eq('telephone', phone);
        } else {
            // Créer le client avec le token
            await supabaseAdmin
                .from('clients')
                .insert({
                    telephone: phone,
                    nom_client: 'Client Mobile',
                    expo_push_token: pushToken,
                });
        }

        console.log(`[RegisterToken] Token enregistré pour ${phone}`);
        return ok({ message: 'Token enregistré' });

    } catch (error: any) {
        console.error('[RegisterToken] Error:', error);
        return err(error.message);
    }
}
