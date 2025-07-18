import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Configuração do projeto Supabase para DEMO/HOMOLOGAÇÃO
const SUPABASE_URL = "https://DEMO_PROJECT_ID.supabase.co"; // Será atualizado com credenciais reais
const SUPABASE_ANON_KEY = "DEMO_ANON_KEY"; // Será atualizado com credenciais reais

export const supabaseDemo = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Exportar como client padrão para compatibilidade
export const supabase = supabaseDemo;