// Cliente Supabase dinâmico baseado no ambiente
import { getCurrentEnvironment } from '@/config/environments';

// Importar clientes específicos de cada ambiente
const getSupabaseClient = async () => {
  const environment = getCurrentEnvironment();
  
  if (environment === 'demo') {
    const { supabaseDemo } = await import('./supabase-demo');
    return supabaseDemo;
  } else {
    const { supabaseProd } = await import('./supabase-prod');
    return supabaseProd;
  }
};

// Cliente reativo que muda baseado no ambiente
class SupabaseProxy {
  private _client: any = null;
  private _currentEnv: string = '';

  async getClient() {
    const currentEnv = getCurrentEnvironment();
    
    // Recriar cliente se o ambiente mudou
    if (this._currentEnv !== currentEnv || !this._client) {
      this._client = await getSupabaseClient();
      this._currentEnv = currentEnv;
    }
    
    return this._client;
  }

  // Proxy methods para manter compatibilidade
  get auth() {
    return this.getClient().then(client => client.auth);
  }

  from(table: string) {
    return this.getClient().then(client => client.from(table));
  }

  storage() {
    return this.getClient().then(client => client.storage);
  }

  functions() {
    return this.getClient().then(client => client.functions);
  }
}

export const supabase = new SupabaseProxy();

// Para compatibilidade com código existente, exportar cliente síncrono
// Usa o ambiente atual no momento da importação
const environment = getCurrentEnvironment();
if (environment === 'demo') {
  import('./supabase-demo').then(({ supabaseDemo }) => {
    Object.assign(supabase, supabaseDemo);
  });
} else {
  import('./supabase-prod').then(({ supabaseProd }) => {
    Object.assign(supabase, supabaseProd);
  });
}