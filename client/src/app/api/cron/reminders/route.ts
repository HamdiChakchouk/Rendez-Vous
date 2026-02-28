import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/services/notificationService';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';

/**
 * Endpoint Cron pour envoyer les rappels J-1.
 * Sécurisé par une clé secrète en en-tête.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const tomorrow = addDays(new Date(), 1);
        const startOfTomorrow = startOfDay(tomorrow);
        const endOfTomorrow = endOfDay(tomorrow);

        // Trouver les RDV confirmés pour demain qui n'ont pas encore été rappelés
        const upcomingAppointments = await prisma.rendezVous.findMany({
            where: {
                date_rdv: {
                    gte: startOfTomorrow,
                    lte: endOfTomorrow,
                },
                statut: 'confirmed',
            },
            include: {
                client: true,
                salon: true,
            },
        });

        let sentCount = 0;
        for (const app of upcomingAppointments) {
            if (app.client?.telephone) {
                const success = await NotificationService.sendAppointmentReminder(
                    app.client.telephone,
                    app.salon.nom_salon,
                    format(app.date_rdv, 'dd/MM/yyyy'),
                    format(app.heure_rdv, 'HH:mm')
                );

                if (success) {
                    await prisma.rendezVous.update({
                        where: { id: app.id },
                        data: { statut: 'reminded' },
                    });
                    sentCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: upcomingAppointments.length,
            sent: sentCount,
        });
    } catch (error: any) {
        console.error('[Cron Error]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
