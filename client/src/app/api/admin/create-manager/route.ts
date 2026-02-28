import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    try {
        // 1. Verify caller is super_admin
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
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }

        const { prenom, nom, email, telephone, nom_salon } = await req.json()

        // 2. Validation
        if (!email || !nom_salon || !nom || !prenom) {
            return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
        }

        // 3. Create the salon first (adresse/telephone optional now)
        const { data: salon, error: salonError } = await supabaseAdmin
            .from('salons')
            .insert({ nom_salon, telephone: telephone || null })
            .select()
            .single()

        if (salonError) {
            console.error('[create-manager] Salon insert error:', salonError)
            return NextResponse.json({ error: `Erreur création salon: ${salonError.message}` }, { status: 500 })
        }

        // 4. Invite user via Supabase Auth (generates magic link automatically)
        // Role is set in app_metadata so middleware can read it from JWT
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                // user_metadata (accessible to trigger for profiles auto-insert)
                nom,
                prenom,
                salon_id: salon.id,
            },
            redirectTo: `${process.env.APP_URL}/reset-password`,
        })

        if (inviteError) {
            // Rollback: delete salon
            await supabaseAdmin.from('salons').delete().eq('id', salon.id)
            console.error('[create-manager] Invite error:', inviteError)
            return NextResponse.json({ error: `Erreur invitation email: ${inviteError.message}` }, { status: 500 })
        }

        const newUserId = inviteData.user.id

        // 5. Set role in app_metadata (for JWT/middleware)
        await supabaseAdmin.auth.admin.updateUserById(newUserId, {
            app_metadata: { role: 'manager' },
        })

        // 6. Upsert profile (the trigger may have already created it with a default role)
        const { error: profileError } = await supabaseAdmin
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

        if (profileError) {
            console.error('[create-manager] Profile upsert error:', profileError)
            // Non-blocking, continue anyway
        }

        // 7. Link salon to manager
        await supabaseAdmin
            .from('salons')
            .update({ manager_id: newUserId })
            .eq('id', salon.id)

        return NextResponse.json({
            success: true,
            message: `Manager créé et email d'activation envoyé à ${email} !`,
            salon_id: salon.id,
            user_id: newUserId,
        })

    } catch (error: any) {
        console.error('[create-manager] Unexpected error:', error)
        return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
    }
}
