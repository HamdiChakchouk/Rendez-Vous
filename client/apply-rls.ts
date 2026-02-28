import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        console.log('Applying RLS policies...');

        await client.query(`
            -- Enable RLS
            ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
            ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

            -- Policies for Clients (Shared across salons)
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage clients') THEN
                    CREATE POLICY "Authenticated users can manage clients" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
                END IF;
            END $$;

            -- Policies for Rendez-Vous
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Professionals can manage their salon appointments') THEN
                    CREATE POLICY "Professionals can manage their salon appointments" ON rendez_vous FOR ALL TO authenticated USING (true) WITH CHECK (true);
                END IF;
            END $$;

            -- Policies for Services
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view services') THEN
                    CREATE POLICY "Authenticated users can view services" ON services FOR SELECT TO authenticated USING (true);
                END IF;
            END $$;

            -- Policies for Employees (Visibility)
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view all employees') THEN
                    CREATE POLICY "Authenticated users can view all employees" ON employes FOR SELECT TO authenticated USING (true);
                END IF;
            END $$;

            -- Policies for Salons
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view salons') THEN
                    CREATE POLICY "Authenticated users can view salons" ON salons FOR SELECT TO authenticated USING (true);
                END IF;
            END $$;

            -- Existing Admin/Employee policies
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own admin profile') THEN
                    CREATE POLICY "Users can view their own admin profile" ON admins FOR SELECT TO authenticated USING (auth.uid() = user_id);
                END IF;
            END $$;
        `);

        console.log('RLS Policies checked/applied successfully');
    } catch (err) {
        console.error('Error applying policies:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
