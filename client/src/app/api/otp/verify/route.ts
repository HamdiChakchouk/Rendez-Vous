import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { phone, code, bookingData } = await req.json()
        console.log(`[OTP Verify] Attempt for ${phone} with code ${code}`, bookingData)

        // Find the most recent non-expired OTP for this phone
        const otpRecord = await prisma.otpCustom.findFirst({
            where: {
                telephone: phone,
                code_otp: code,
                date_expiration: { gte: new Date() },
                verified: false
            },
            orderBy: { created_at: 'desc' }
        })

        if (!otpRecord) {
            console.log(`[OTP Verify] No valid OTP found for ${phone} or code ${code} mismatch/expired/already verified`)
            return NextResponse.json({ success: false, message: "Code invalide ou expiré" }, { status: 400 })
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Find or create client
                let client = await tx.client.findUnique({
                    where: { telephone: phone }
                })

                if (!client) {
                    client = await tx.client.create({
                        data: { telephone: phone, nom_client: "Client Web" }
                    })
                    console.log(`[OTP Verify] New client created: ${client.id}`)
                }

                // 2. Create Appointment if bookingData is present
                if (bookingData && bookingData.salonId && bookingData.serviceId && bookingData.date && bookingData.time) {
                    const rdvDateTime = new Date(bookingData.date);
                    const [hours, minutes] = bookingData.time.split(':').map(Number);
                    rdvDateTime.setHours(hours, minutes, 0, 0);

                    // Server-side validation: No past bookings
                    if (rdvDateTime < new Date()) {
                        throw new Error("La date et l'heure du rendez-vous ne peuvent pas être dans le passé.")
                    }

                    const rdv = await tx.rendezVous.create({
                        data: {
                            salon_id: bookingData.salonId,
                            client_id: client.id,
                            service_id: bookingData.serviceId,
                            employe_id: (bookingData.employeeId && bookingData.employeeId !== 'any') ? bookingData.employeeId : null,
                            date_rdv: new Date(bookingData.date),
                            heure_rdv: rdvDateTime,
                            statut: 'confirmed',
                            confirmed_at: new Date()
                        }
                    })
                    console.log(`[OTP Verify] Appointment created: ${rdv.id}`)
                } else {
                    console.warn("[OTP Verify] Appointment NOT created: missing fields in bookingData", bookingData)
                }

                // 3. Mark OTP as verified
                await tx.otpCustom.update({
                    where: { id: otpRecord.id },
                    data: { verified: true }
                })

                return { success: true }
            })

            return NextResponse.json({ success: true, message: "Validé et RDV créé" })
        } catch (txError: any) {
            console.error("[OTP Verify] Transaction failed:", txError)
            return NextResponse.json({ success: false, error: txError.message }, { status: 500 })
        }
    } catch (error: any) {
        console.error("[OTP Verify] Global error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
