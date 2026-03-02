import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ok, err } from '@/lib/api-response'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) return err('Email requis', 400)

        // Re-invite the user — Supabase generates a fresh magic link
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${process.env.APP_URL}/reset-password`,
        })

        if (error) return err(error.message, 500)

        return ok({ message: 'Email d\'activation renvoyé !' })
    } catch (error: any) {
        return err(error.message)
    }
}
