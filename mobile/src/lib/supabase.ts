import { createClient } from '@supabase/supabase-js';
import { supabaseStorage } from './storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://klwnfdcmxsnnddqojcyk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_z_t4xEKuKELA4lXQ6xgE3w_niYo5kAI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: supabaseStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
    },
});

