import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé service_role.
 * ⚠️ À utiliser UNIQUEMENT dans les API routes (serveur) — jamais côté client.
 */
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)
