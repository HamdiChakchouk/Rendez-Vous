import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ok, err } from '@/lib/api-response';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ salonId: string }> }
) {
    try {
        const { salonId } = await params;

        const { data: employes, error } = await supabaseAdmin
            .from('employes')
            .select('*')
            .eq('salon_id', salonId)
            .order('nom_employe', { ascending: true });

        if (error) throw error;

        return ok({ employes: employes ?? [] });
    } catch (error: any) {
        console.error('[employees] Error:', error);
        return err(error.message);
    }
}
