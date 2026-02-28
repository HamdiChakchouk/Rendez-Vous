import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function checkConstraints() {
    const client = await pool.connect()
    try {
        const res = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as def 
      FROM pg_constraint 
      WHERE conrelid = 'rendez_vous'::regclass
    `)
        console.table(res.rows)
    } finally {
        client.release()
        await pool.end()
    }
}

checkConstraints()
