import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ok, err } from '@/lib/api-response'

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll() { },
                }
            }
        )
        const { data: { user: caller } } = await supabase.auth.getUser()
        if (!caller || caller.app_metadata?.role !== 'manager') {
            return err('Accès refusé', 403)
        }

        const { prenom, nom, telephone, email } = await req.json()

        if (!nom || !prenom) {
            return err('Nom et prénom obligatoires', 400)
        }

        const { data: managerProfile } = await supabaseAdmin
            .from('profiles')
            .select('salon_id')
            .eq('id', caller.id)
            .single()

        if (!managerProfile?.salon_id) {
            return err('Salon du manager introuvable', 400)
        }

        const salon_id = managerProfile.salon_id

        if (email) {
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                data: { nom, prenom, salon_id },
                redirectTo: `${process.env.APP_URL}/reset-password`,
            })

            if (inviteError) {
                return err(`Erreur invitation: ${inviteError.message}`, 500)
            }

            const newUserId = inviteData.user.id

            await supabaseAdmin.auth.admin.updateUserById(newUserId, {
                app_metadata: { role: 'coiffeur' },
            })

            await supabaseAdmin.from('profiles').upsert({
                id: newUserId,
                role: 'coiffeur',
                salon_id,
                nom,
                prenom,
                telephone: telephone || null,
                onboarding_completed: true,
            })

            await supabaseAdmin.from('employes').insert({
                salon_id,
                nom_employe: `${prenom} ${nom}`,
                user_id: newUserId,
            })

            return ok({
                message: `Coiffeur ajouté et email d'activation envoyé à ${email} !`,
            })
        }

        const { error: employeError } = await supabaseAdmin.from('employes').insert({
            salon_id,
            nom_employe: `${prenom} ${nom}`,
        })

        if (employeError) {
            return err(`Erreur création employé: ${employeError.message}`, 500)
        }

        return ok({
            message: 'Coiffeur ajouté à l\'équipe !',
        })

    } catch (error: any) {
        console.error('[create-coiffeur] Unexpected error:', error)
        return err(error.message || 'Erreur serveur')
    }
}
