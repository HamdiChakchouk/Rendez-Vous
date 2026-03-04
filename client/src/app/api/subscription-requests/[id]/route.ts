import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ok, err } from '@/lib/api-response'

// PATCH — Approuver ou refuser une demande
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() { } } }
        )

        const { data: { user: admin } } = await supabase.auth.getUser()
        if (!admin) return err('Non authentifié', 401)

        const { data: adminProfile } = await supabaseAdmin
            .from('profiles').select('role').eq('id', admin.id).single()
        if (adminProfile?.role !== 'super_admin') return err('Accès refusé', 403)

        const { action, motif_refus } = await req.json()

        // Récupérer la demande
        const { data: request, error: fetchErr } = await supabaseAdmin
            .from('subscription_requests').select('*').eq('id', id).single()
        if (fetchErr || !request) return err('Demande introuvable', 404)
        if (request.statut !== 'pending') return err('Cette demande a déjà été traitée', 409)

        if (action === 'reject') {
            await supabaseAdmin.from('subscription_requests').update({
                statut: 'rejected',
                motif_refus: motif_refus || null,
                processed_at: new Date().toISOString(),
                processed_by: admin.id,
            }).eq('id', id)
            return ok({ message: 'Demande refusée.' })
        }

        if (action === 'approve') {
            // 1. Vérifier/trouver l'utilisateur Supabase Auth par email
            const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
            const existingAuthUser = authUsers.find(u => u.email === request.email)

            let userId: string

            if (existingAuthUser) {
                // L'utilisateur existe → on le passe en manager
                userId = existingAuthUser.id
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    app_metadata: { role: 'manager' },
                })
            } else {
                // Pas de compte → on l'invite (il recevra un email de création de mot de passe)
                const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
                    request.email,
                    {
                        data: { nom_prenom: request.nom_prenom },
                        redirectTo: `${process.env.APP_URL}/dashboard`,
                    }
                )
                if (inviteErr) return err(`Erreur invitation: ${inviteErr.message}`, 500)
                userId = inviteData.user.id

                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    app_metadata: { role: 'manager' },
                })
            }

            // 2. Créer le salon
            const { data: salon, error: salonErr } = await supabaseAdmin.from('salons').insert({
                nom_salon: request.nom_salon,
                adresse: request.ville || '',
                telephone: request.telephone || '',
            }).select().single()
            if (salonErr) return err(`Erreur création salon: ${salonErr.message}`, 500)

            // 3. Créer/mettre à jour le profil manager
            const [prenom, ...nomParts] = (request.nom_prenom || '').split(' ')
            const nom = nomParts.join(' ') || prenom
            await supabaseAdmin.from('profiles').upsert({
                id: userId,
                role: 'manager',
                salon_id: salon.id,
                prenom: prenom || request.nom_prenom,
                nom,
                telephone: request.telephone || null,
                onboarding_completed: true,
            })

            // 4. Marquer la demande comme approuvée
            await supabaseAdmin.from('subscription_requests').update({
                statut: 'approved',
                processed_at: new Date().toISOString(),
                processed_by: admin.id,
            }).eq('id', id)

            return ok({
                message: `✅ Accès accordé à ${request.email}. Salon "${request.nom_salon}" créé.`,
            })
        }

        return err('Action invalide. Utilisez "approve" ou "reject"', 400)

    } catch (error: any) {
        console.error('[subscription-requests PATCH]', error)
        return err(error.message || 'Erreur serveur')
    }
}
