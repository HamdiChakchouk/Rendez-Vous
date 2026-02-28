import prisma from './src/lib/prisma.ts';
import 'dotenv/config';

async function checkRLS() {
    console.log('--- Checking RLS Status ---');
    try {
        const results: any[] = await prisma.$queryRaw`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `;

        console.table(results);

        const missingRLS = results.filter(r => !r.rowsecurity);
        if (missingRLS.length > 0) {
            console.warn('\n⚠️ Tables missing RLS:');
            missingRLS.forEach(r => console.log(`- ${r.tablename}`));
        } else {
            console.log('\n✅ All public tables have RLS enabled.');
        }
    } catch (error) {
        console.error('Error checking RLS status:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRLS();
