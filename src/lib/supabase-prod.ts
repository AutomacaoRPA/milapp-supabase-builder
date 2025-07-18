import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Configuração do projeto Supabase para PRODUÇÃO
const SUPABASE_URL = "https://ktuvnllzmpsdgstsgbib.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dXZubGx6bXBzZGdzdHNnYmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDc0ODcsImV4cCI6MjA2NzQ4MzQ4N30.j2HUJeQ9nX0stgWTDeGLNf2eWW0s6KO-KRsYg50YicI";

export const supabaseProd = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Exportar como client padrão para compatibilidade
export const supabase = supabaseProd;