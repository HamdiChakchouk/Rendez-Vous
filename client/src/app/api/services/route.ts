import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ok, err } from '@/lib/api-response';

export async function GET() {
    try {
        const { data: services, error } = await supabaseAdmin
            .from('services')
            .select('*, salon:salons(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return ok({ services: services ?? [] });
    } catch (error: any) {
        console.error('[services] Error:', error);
        return err(error.message);
    }
}
