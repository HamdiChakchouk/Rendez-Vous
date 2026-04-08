import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ok, err } from '@/lib/api-response'

export async function POST(req: Request) {
    try {
        let callerUser = null
        const authHeader = req.headers.get('authorization')
        
        // --- 1. Authentification ---
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const { data: { user } } = await supabaseAdmin.auth.getUser(token)
            callerUser = user
        } else {
            const cookieStore = await cookies()
            const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
                cookies: { getAll() { return cookieStore.getAll() }, setAll() { } }
            })
            const { data: { user } } = await supabase.auth.getUser()
            callerUser = user
        }

        if (!callerUser) return err('Accès refusé: Aucun utilisateur identifié.', 403)

        // --- 2. Vérification Super Admin ---
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single()

        if (callerUser.app_metadata?.role !== 'super_admin' && callerProfile?.role !== 'super_admin') {
            return err('Accès refusé : Rôle super_admin requis.', 403)
        }

        // --- 3. Parsing de la requête ---
        const { request_id } = await req.json()
        if (!request_id) return err('request_id obligatoire', 400)

        const { data: subReq } = await supabaseAdmin
            .from('subscription_requests')
            .select('*')
            .eq('id', request_id)
            .single()

        if (!subReq) return err('Demande d abonnement introuvable', 404)
        if (subReq.statut === 'approved') return err('Cette demande a déjà été approuvée', 400)

        // --- 4. Création du Salon ---
        // Génération d'horaires par défaut
        const defaultHours = {
            "lundi": { "ouvert": true, "ouverture": "09:00", "fermeture": "19:00" },
            "mardi": { "ouvert": true, "ouverture": "09:00", "fermeture": "19:00" },
            "mercredi": { "ouvert": true, "ouverture": "09:00", "fermeture": "19:00" },
            "jeudi": { "ouvert": true, "ouverture": "09:00", "fermeture": "19:00" },
            "vendredi": { "ouvert": true, "ouverture": "09:00", "fermeture": "19:00" },
            "samedi": { "ouvert": true, "ouverture": "09:00", "fermeture": "19:00" },
            "dimanche": { "ouvert": false, "ouverture": "09:00", "fermeture": "13:00" }
        }

        const { data: newSalon, error: salonErr } = await supabaseAdmin
            .from('salons')
            .insert({
                nom_salon: subReq.nom_salon,
                adresse: subReq.ville || 'À renseigner',
                telephone: subReq.telephone || '',
                horaires_ouverture: defaultHours
            })
            .select()
            .single()

        if (salonErr || !newSalon) {
            return err('Erreur lors de la création du salon: ' + salonErr?.message, 500)
        }

        // --- 5. Création / Invitation de l'Utilisateur Manager (Propriétaire) ---
        let targetUserId = subReq.user_id;

        // Si l'utilisateur n'avait pas de compte (on l'invite)
        if (!targetUserId) {
            const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
                subReq.email,
                { data: { role: 'manager' } }
            );

            if (inviteErr) {
                // S'il existe déjà avec cet e-mail mais pas listé dans user_id
                console.error('[approve-sub] invite error:', inviteErr)
            } else if (inviteData.user) {
                targetUserId = inviteData.user.id;
            }
        } else {
            // S'il avait déjà un compte (on met à jour ses métadonnées)
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                app_metadata: { role: 'manager' }
            });
        }

        // --- 6. Mise à jour de son Profil (Manager) ---
        if (targetUserId) {
            // Extract Nom/Prenom from nom_prenom
            const names = (subReq.nom_prenom || '').split(' ');
            const nom = names.pop() || '';
            const prenom = names.join(' ') || 'Gérant';

            await supabaseAdmin.from('profiles').upsert({
                id: targetUserId,
                salon_id: newSalon.id,
                role: 'manager',
                nom: nom,
                prenom: prenom,
                telephone: subReq.telephone
            });
        }

        // --- 7. Validation de la demande ---
        await supabaseAdmin.from('subscription_requests')
            .update({
                statut: 'approved',
                processed_at: new Date().toISOString(),
                processed_by: callerUser.id
            })
            .eq('id', request_id)

        return ok({ message: 'Salon créé et gérant invité avec succès !' })

    } catch (error: any) {
        console.error('[approve-subscription] Error:', error)
        return err(error.message || 'Erreur serveur')
    }
}
