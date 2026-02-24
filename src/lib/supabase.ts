import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseKey;

if(!isConfigured) {
  console.warn('Supabase no está configurado correctamente. Verifica las variables de entorno.');
};

export const isSupabaseConfigured = () => !!isConfigured;

export const supabase = createClient (
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);