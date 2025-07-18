export type Environment = 'demo' | 'production';

export interface EnvironmentConfig {
  name: string;
  description: string;
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
}

export const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  demo: {
    name: 'Demonstração',
    description: 'Ambiente com dados de exemplo para testes e apresentações',
    features: {
      mockData: true,
      persistence: false,
      auditLog: false,
      realTimeUpdates: false,
      fullCRUD: true,
    },
    ui: {
      showEnvironmentBadge: true,
      environmentBadgeColor: 'warning',
      restrictedFeatures: [],
    },
  },
  production: {
    name: 'Produção',
    description: 'Ambiente limpo para uso corporativo real',
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
  },
};

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnvironment: Environment;

  private constructor() {
    this.currentEnvironment = this.getStoredEnvironment();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private getStoredEnvironment(): Environment {
    const stored = localStorage.getItem('milapp_environment');
    return (stored === 'production' || stored === 'demo') ? stored : 'demo';
  }

  public getCurrentEnvironment(): Environment {
    return this.currentEnvironment;
  }

  public setEnvironment(env: Environment): void {
    this.currentEnvironment = env;
    localStorage.setItem('milapp_environment', env);
    
    // Emitir evento personalizado para notificar componentes
    window.dispatchEvent(new CustomEvent('environmentChanged', { 
      detail: { environment: env } 
    }));
  }

  public getConfig(): EnvironmentConfig {
    return ENVIRONMENT_CONFIGS[this.currentEnvironment];
  }

  public isDemo(): boolean {
    return this.currentEnvironment === 'demo';
  }

  public isProduction(): boolean {
    return this.currentEnvironment === 'production';
  }

  public shouldUseMockData(): boolean {
    return this.getConfig().features.mockData;
  }

  public shouldPersistData(): boolean {
    return this.getConfig().features.persistence;
  }

  public shouldShowAuditLog(): boolean {
    return this.getConfig().features.auditLog;
  }

  public shouldShowEnvironmentBadge(): boolean {
    return this.getConfig().ui.showEnvironmentBadge;
  }

  public getEnvironmentBadgeColor(): string {
    return this.getConfig().ui.environmentBadgeColor;
  }

  // Método para limpar dados demo quando mudar para produção
  public async switchToProduction(): Promise<void> {
    if (this.currentEnvironment === 'demo') {
      // Limpar dados de sessão do demo
      sessionStorage.clear();
      
      // Atualizar ambiente
      this.setEnvironment('production');
      
      // Recarregar página para garantir estado limpo
      window.location.reload();
    }
  }

  // Método para voltar ao demo
  public switchToDemo(): void {
    this.setEnvironment('demo');
    window.location.reload();
  }
}

// Exportar instância singleton
export const environmentManager = EnvironmentManager.getInstance();

import { useState, useEffect } from "react";

// Hook React para usar o environment manager
export const useEnvironment = () => {
  const [environment, setEnvironment] = useState<Environment>(
    environmentManager.getCurrentEnvironment()
  );

  useEffect(() => {
    const handleEnvironmentChange = (event: CustomEvent) => {
      setEnvironment(event.detail.environment);
    };

    window.addEventListener('environmentChanged', handleEnvironmentChange as EventListener);
    
    return () => {
      window.removeEventListener('environmentChanged', handleEnvironmentChange as EventListener);
    };
  }, []);

  return {
    environment,
    config: ENVIRONMENT_CONFIGS[environment],
    manager: environmentManager,
    isDemo: environment === 'demo',
    isProduction: environment === 'production',
  };
};