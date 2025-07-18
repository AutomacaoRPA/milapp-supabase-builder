export type Environment = 'demo' | 'production';

export interface EnvironmentConfig {
  name: string;
  description: string;
  supabase: {
    url: string;
    anonKey: string;
  };
  features: {
    mockData: boolean;
    persistence: boolean;
    auditLog: boolean;
    realTimeUpdates: boolean;
    fullCRUD: boolean;
  };
  ui: {
    showEnvironmentBadge: boolean;
    environmentBadgeColor: string;
    restrictedFeatures: string[];
  };
  deployment: {
    branch: string;
    buildCommand: string;
    outputDir: string;
  };
}

export const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  demo: {
    name: 'Demo/Homologação',
    description: 'Ambiente de demonstração e homologação para testes',
    supabase: {
      url: 'https://DEMO_PROJECT_ID.supabase.co', // Será configurado depois
      anonKey: 'DEMO_ANON_KEY', // Será configurado depois
    },
    features: {
      mockData: true,
      persistence: true,
      auditLog: true,
      realTimeUpdates: true,
      fullCRUD: true,
    },
    ui: {
      showEnvironmentBadge: true,
      environmentBadgeColor: 'warning',
      restrictedFeatures: [],
    },
    deployment: {
      branch: 'demo',
      buildCommand: 'npm run build:demo',
      outputDir: 'dist-demo',
    },
  },
  production: {
    name: 'Produção',
    description: 'Ambiente de produção para uso corporativo real',
    supabase: {
      url: 'https://ktuvnllzmpsdgstsgbib.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dXZubGx6bXBzZGdzdHNnYmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDc0ODcsImV4cCI6MjA2NzQ4MzQ4N30.j2HUJeQ9nX0stgWTDeGLNf2eWW0s6KO-KRsYg50YicI',
    },
    features: {
      mockData: false,
      persistence: true,
      auditLog: true,
      realTimeUpdates: true,
      fullCRUD: true,
    },
    ui: {
      showEnvironmentBadge: false,
      environmentBadgeColor: 'success',
      restrictedFeatures: [],
    },
    deployment: {
      branch: 'main',
      buildCommand: 'npm run build:prod',
      outputDir: 'dist-prod',
    },
  },
};

// Detecta ambiente baseado na branch do Git ou variável de ambiente
export const getCurrentEnvironment = (): Environment => {
  // Em ambiente de desenvolvimento, usar localStorage para alternar
  if (import.meta.env.DEV) {
    const stored = localStorage.getItem('milapp_environment');
    return (stored === 'production' || stored === 'demo') ? stored : 'demo';
  }
  
  // Em produção, detectar baseado na URL ou variável de ambiente
  const hostname = window.location.hostname;
  
  if (hostname.includes('demo') || hostname.includes('homolog')) {
    return 'demo';
  }
  
  return 'production';
};

export const getEnvironmentConfig = (env?: Environment): EnvironmentConfig => {
  const environment = env || getCurrentEnvironment();
  return ENVIRONMENT_CONFIGS[environment];
};