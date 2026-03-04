import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ok, err } from '@/lib/api-response'

// POST — Créer une demande d'abonnement
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() { } } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        const body = await req.json()
        const { email, nom_prenom, telephone, nom_salon, ville, type_salon, message } = body

        if (!email || !nom_prenom || !nom_salon) {
            return err('Email, nom et nom du salon sont obligatoires', 400)
        }

        // Vérifier si une demande pending existe déjà pour cet email
        const { data: existing } = await supabaseAdmin
            .from('subscription_requests')
            .select('id, statut')
            .eq('email', email)
            .eq('statut', 'pending')
            .maybeSingle()

        if (existing) {
            return err('Une demande est déjà en cours pour cet email. Notre équipe vous contactera bientôt.', 409)
        }

        const { error } = await supabaseAdmin.from('subscription_requests').insert({
            user_id: user?.id || null,
            email,
            nom_prenom,
            telephone: telephone || null,
            nom_salon,
            ville: ville || null,
            type_salon: type_salon || 'mixte',
            message: message || null,
            statut: 'pending',
        })

        if (error) throw error

        return ok({ message: 'Votre demande a bien été envoyée ! Notre équipe vous contactera dans les 24h.' })

    } catch (error: any) {
        console.error('[subscription-requests POST]', error)
        return err(error.message || 'Erreur serveur')
    }
}

// GET — Lister toutes les demandes (super_admin uniquement)
export async function GET() {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() { } } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return err('Non authentifié', 401)

        const { data: profile } = await supabaseAdmin
            .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'super_admin') return err('Accès refusé', 403)

        const { data, error } = await supabaseAdmin
            .from('subscription_requests')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return ok({ requests: data })

    } catch (error: any) {
        return err(error.message || 'Erreur serveur')
    }
}
