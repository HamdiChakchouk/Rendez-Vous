import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params;
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: { salon: true }
        });

        if (!service) {
            return NextResponse.json({ success: false, error: 'Service non trouvé' }, { status: 404 });
        }

        // Fetch absences using Supabase to avoid Prisma client generation issues in dev
        const { data: absences } = await supabase
            .from('absences')
            .select('*')
            .eq('salon_id', service.salon_id)
            .eq('statut', 'approved');

        // Add absences to the salon object so the client code remains unchanged
        const serviceWithAbsences = {
            ...service,
            salon: {
                ...service.salon,
                absences: absences || []
            }
        };

        return NextResponse.json({ success: true, service: serviceWithAbsences });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
