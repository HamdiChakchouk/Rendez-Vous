import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ salonId: string }> }
) {
    try {
        const { salonId } = await params;
        const employes = await prisma.employe.findMany({
            where: { salon_id: salonId }
        });

        return NextResponse.json({ success: true, employes });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
