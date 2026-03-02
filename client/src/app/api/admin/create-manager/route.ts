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
        if (!caller || caller.app_metadata?.role !== 'super_admin') {
            return err('Accès refusé', 403)
        }

        const { prenom, nom, email, telephone, nom_salon } = await req.json()

        if (!email || !nom_salon || !nom || !prenom) {
            return err('Champs obligatoires manquants', 400)
        }

        const { data: salon, error: salonError } = await supabaseAdmin
            .from('salons')
            .insert({ nom_salon, telephone: telephone || null })
            .select()
            .single()

        if (salonError) {
            console.error('[create-manager] Salon insert error:', salonError)
            return err(`Erreur création salon: ${salonError.message}`, 500)
        }

        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { nom, prenom, salon_id: salon.id },
            redirectTo: `${process.env.APP_URL}/reset-password`,
        })

        if (inviteError) {
            await supabaseAdmin.from('salons').delete().eq('id', salon.id)
            return err(`Erreur invitation email: ${inviteError.message}`, 500)
        }

        const newUserId = inviteData.user.id

        await supabaseAdmin.auth.admin.updateUserById(newUserId, {
            app_metadata: { role: 'manager' },
        })

        await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUserId,
                role: 'manager',
                salon_id: salon.id,
                nom,
                prenom,
                telephone: telephone || null,
                onboarding_completed: false,
            })

        await supabaseAdmin
            .from('salons')
            .update({ manager_id: newUserId })
            .eq('id', salon.id)

        return ok({
            message: `Manager créé et email d'activation envoyé à ${email} !`,
            salon_id: salon.id,
            user_id: newUserId,
        })

    } catch (error: any) {
        console.error('[create-manager] Unexpected error:', error)
        return err(error.message || 'Erreur serveur')
    }
}
