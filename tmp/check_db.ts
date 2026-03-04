import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../client/.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'employes' });
    if (error) {
        // If RPC doesn't exist, try a simple select
        console.log("RPC failed, trying select * limit 1");
        const { data, error: err2 } = await supabase.from('employes').select('*').limit(1);
        if (err2) console.error(err2);
        else console.log("Keys in employes:", Object.keys(data[0] || {}));
    } else {
        console.log("Columns in employes:", cols);
    }
}

check();
