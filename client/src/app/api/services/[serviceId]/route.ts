import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ok, err } from '@/lib/api-response';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params;

        const { data: service, error } = await supabaseAdmin
            .from('services')
            .select(`
                *,
                salon:salons(
                    *,
                    absences(*)
                )
            `)
            .eq('id', serviceId)
            .eq('salon.absences.statut', 'approved')
            .single();

        if (error || !service) {
            return err('Service non trouvé', 404);
        }

        return ok({ service });
    } catch (error: any) {
        console.error('[service/:id] Error:', error);
        return err(error.message);
    }
}
