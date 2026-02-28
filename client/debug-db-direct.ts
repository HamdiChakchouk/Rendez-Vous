import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function checkDbDirect() {
    const client = await pool.connect()
    try {
        console.log('--- ADMINS (Direct) ---')
        const admins = await client.query('SELECT * FROM admins')
        console.table(admins.rows)

        console.log('\n--- EMPLOYEES (Direct) ---')
        const employees = await client.query('SELECT * FROM employes')
        console.table(employees.rows)

        console.log('\n--- SALONS (Direct) ---')
        const salons = await client.query('SELECT * FROM salons')
        console.table(salons.rows)

    } finally {
        client.release()
        await pool.end()
    }
}

checkDbDirect()
