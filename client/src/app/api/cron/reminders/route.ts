import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';
import { NotificationService } from '@/services/notificationService';
import { ok, err } from '@/lib/api-response';

/**
 * Endpoint Cron pour envoyer les rappels J-1.
 * Sécurisé par Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '').trim();

    if (secret !== process.env.CRON_SECRET) {
        return err('Non autorisé', 401);
    }

    try {
        const tomorrow = addDays(new Date(), 1);
        const start = startOfDay(tomorrow).toISOString();
        const end = endOfDay(tomorrow).toISOString();

        const { data: appointments, error } = await supabaseAdmin
            .from('rendez_vous')
            .select(`
                id,
                heure_rdv,
                date_rdv,
                client:clients(telephone),
                salon:salons(nom_salon)
            `)
            .in('statut', ['confirmed'])
            .gte('date_rdv', start)
            .lte('date_rdv', end);

        if (error) throw error;

        let sentCount = 0;
        for (const app of appointments ?? []) {
            const telephone = (app.client as any)?.telephone;
            const nomSalon = (app.salon as any)?.nom_salon;

            if (!telephone || !nomSalon) continue;

            const dateFormatted = format(new Date(app.date_rdv), 'dd/MM/yyyy');
            const heureFormatted = typeof app.heure_rdv === 'string'
                ? app.heure_rdv.slice(0, 5)
                : format(new Date(app.heure_rdv), 'HH:mm');

            const success = await NotificationService.sendAppointmentReminder(
                telephone, nomSalon, dateFormatted, heureFormatted
            );

            if (success) {
                await supabaseAdmin
                    .from('rendez_vous')
                    .update({ statut: 'reminded' })
                    .eq('id', app.id);
                sentCount++;
            }
        }

        return ok({ processed: appointments?.length ?? 0, sent: sentCount });
    } catch (error: any) {
        console.error('[Cron Reminders] Error:', error);
        return err(error.message);
    }
}
