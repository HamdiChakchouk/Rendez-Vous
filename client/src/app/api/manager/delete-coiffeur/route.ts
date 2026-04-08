import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ok, err } from '@/lib/api-response'

export async function POST(req: Request) {
    try {
        let callerUser = null
        const authHeader = req.headers.get('authorization')
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
            if (error) {
                console.error('[delete-coiffeur] Token error:', error)
            } else {
                callerUser = user
            }
        } else {
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
            const { data: { user } } = await supabase.auth.getUser()
            callerUser = user
        }

        if (!callerUser) {
            return err('Accès refusé: Aucun utilisateur identifié. Token expiré ou invalide.', 403)
        }

        const { data: managerProfile } = await supabaseAdmin
            .from('profiles')
            .select('salon_id, role')
            .eq('id', callerUser.id)
            .single()

        if (callerUser.app_metadata?.role !== 'manager' && managerProfile?.role !== 'manager') {
            return err(`Accès refusé: Vous n'avez pas le rôle manager. Rôle détecté: ${callerUser.app_metadata?.role || managerProfile?.role || 'Aucun'}`, 403)
        }

        if (!managerProfile?.salon_id) {
            return err('Salon du manager introuvable', 400)
        }

        const { employe_id } = await req.json()

        if (!employe_id) {
            return err('Identifiant de l employé (employe_id) obligatoire', 400)
        }

        // 1. Vérifier que l'employé appartient bien au salon du manager
        const { data: employe } = await supabaseAdmin
            .from('employes')
            .select('*')
            .eq('id', employe_id)
            .eq('salon_id', managerProfile.salon_id)
            .single()

        if (!employe) {
            return err('L employé n existe pas ou n appartient pas à votre salon', 404)
        }

        // 2. S'il a un user_id (collaborateur avec accès), on le supprime de la base d'authentification complète
        if (employe.user_id) {
            // Delete user entirely from Auth. This implicitly cascades and cleans up `profiles`.
            const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(employe.user_id)
            if (deleteUserError) {
                console.error('[delete-coiffeur] Error deleting auth user:', deleteUserError)
                return err(`Erreur de désactivation du compte utilisateur: ${deleteUserError.message}`, 500)
            }
        }

        // 3. Qu'il soit "Simple" ou "Avec accès", on supprime sa présence du planning
        const { error: deleteEmpError } = await supabaseAdmin
            .from('employes')
            .delete()
            .eq('id', employe_id)

        if (deleteEmpError) {
             return err(`Erreur de suppression du planning: ${deleteEmpError.message}`, 500)
        }

        return ok({
            message: 'Collaborateur retiré de l équipe et accès révoqué avec succès.',
        })

    } catch (error: any) {
        console.error('[delete-coiffeur] Unexpected error:', error)
        return err(error.message || 'Erreur serveur')
    }
}
