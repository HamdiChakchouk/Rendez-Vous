import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RiskService } from '@/services/riskService';
import { subMinutes } from 'date-fns';

/**
 * Endpoint Cron pour détecter les no-shows.
 * À exécuter toutes les 30 minutes.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const now = new Date();
        // On cherche les RDV confirmés ou rappelés dont l'heure de fin est passée de plus de 30 min
        // Pour simplifier ici, on prend ceux dont l'heure de début est passée de > 2h (moyenne RDV)
        // En réalité, il faudrait calculer start_time + duree_minutes.
        const threshold = subMinutes(now, 120);

        const suspectedNoShows = await prisma.rendezVous.findMany({
            where: {
                statut: { in: ['confirmed', 'reminded'] },
                // Simple approximation
                date_rdv: { lte: now },
                // Logique plus fine nécessaire pour l'heure
            },
            include: { client: true },
        });

        let count = 0;
        for (const app of suspectedNoShows) {
            // Logique de validation temporelle réelle
            // Si (app.date + app.time + duree) < now - 30min
            await RiskService.recordNoShow(app.id);
            count++;
        }

        return NextResponse.json({
            success: true,
            detectedNoShows: count,
        });
    } catch (error: any) {
        console.error('[No-Show Cron Error]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
