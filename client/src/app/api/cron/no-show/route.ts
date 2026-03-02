import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { RiskService } from '@/services/riskService';
import { subHours, startOfDay } from 'date-fns';
import { ok, err } from '@/lib/api-response';

/**
 * Endpoint Cron pour détecter les no-shows.
 * Sécurisé par Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '').trim();

    if (secret !== process.env.CRON_SECRET) {
        return err('Non autorisé', 401);
    }

    try {
        const now = new Date();
        const twoHoursAgo = subHours(now, 2).toISOString();
        const yesterday = startOfDay(subHours(now, 24)).toISOString();

        const { data: appointments, error } = await supabaseAdmin
            .from('rendez_vous')
            .select('id, date_rdv, heure_rdv, statut, client_id')
            .in('statut', ['confirmed', 'reminded'])
            .gte('date_rdv', yesterday)
            .lte('date_rdv', twoHoursAgo);

        if (error) throw error;

        let count = 0;
        for (const app of appointments ?? []) {
            const dateStr = typeof app.date_rdv === 'string'
                ? app.date_rdv.split('T')[0]
                : new Date(app.date_rdv).toISOString().split('T')[0];
            const timeStr = typeof app.heure_rdv === 'string'
                ? app.heure_rdv.slice(0, 5)
                : '00:00';
            const rdvDateTime = new Date(`${dateStr}T${timeStr}:00`);
            const rdvEndEstimate = new Date(rdvDateTime.getTime() + 60 * 60 * 1000);

            if (rdvEndEstimate > now) continue;

            await RiskService.recordNoShow(app.id);
            count++;
        }

        return ok({ detectedNoShows: count });
    } catch (error: any) {
        console.error('[Cron No-Show] Error:', error);
        return err(error.message);
    }
}
