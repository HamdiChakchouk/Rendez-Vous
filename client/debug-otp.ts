import 'dotenv/config';
import prisma from './src/lib/prisma.ts';

async function main() {
    const otps = await prisma.otpCustom.findMany({
        orderBy: { created_at: 'desc' },
        take: 5
    });
    console.log("Last 5 OTPs:", JSON.stringify(otps, null, 2));
    console.log("Current Server Time:", new Date().toISOString());
}

main().catch(console.error).finally(() => prisma.$disconnect());
