import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    try {
        // 1. Verify caller is manager
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
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }

        const { prenom, nom, telephone, email } = await req.json()

        if (!nom || !prenom) {
            return NextResponse.json({ error: 'Nom et prénom obligatoires' }, { status: 400 })
        }

        // 2. Get manager's salon_id from profiles
        const { data: managerProfile } = await supabaseAdmin
            .from('profiles')
            .select('salon_id')
            .eq('id', caller.id)
            .single()

        if (!managerProfile?.salon_id) {
            return NextResponse.json({ error: 'Salon du manager introuvable' }, { status: 400 })
        }

        const salon_id = managerProfile.salon_id

        // 3a. If email provided → create auth account + send invite
        if (email) {
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                data: { nom, prenom, salon_id },
                redirectTo: `${process.env.APP_URL}/reset-password`,
            })

            if (inviteError) {
                return NextResponse.json({ error: `Erreur invitation: ${inviteError.message}` }, { status: 500 })
            }

            const newUserId = inviteData.user.id

            // Set role in app_metadata
            await supabaseAdmin.auth.admin.updateUserById(newUserId, {
                app_metadata: { role: 'coiffeur' },
            })

            // Upsert profile
            await supabaseAdmin.from('profiles').upsert({
                id: newUserId,
                role: 'coiffeur',
                salon_id,
                nom,
                prenom,
                telephone: telephone || null,
                onboarding_completed: true,
            })

            // Also add to employes table for scheduling compatibility
            await supabaseAdmin.from('employes').insert({
                salon_id,
                nom_employe: `${prenom} ${nom}`,
            })

            return NextResponse.json({
                success: true,
                message: `Coiffeur ajouté et email d'activation envoyé à ${email} !`,
            })
        }

        // 3b. No email → employe sans compte auth
        const { error: employeError } = await supabaseAdmin.from('employes').insert({
            salon_id,
            nom_employe: `${prenom} ${nom}`,
        })

        if (employeError) {
            return NextResponse.json({ error: `Erreur création employé: ${employeError.message}` }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Coiffeur ajouté à l\'équipe !',
        })

    } catch (error: any) {
        console.error('[create-coiffeur] Unexpected error:', error)
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
    }
}
