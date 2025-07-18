import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { environmentManager, ENVIRONMENT_CONFIGS } from "@/lib/environment";
import { TestTube, Shield, RefreshCw } from "lucide-react";

export const EnvironmentSwitcher = () => {
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [targetEnvironment, setTargetEnvironment] = useState<'demo' | 'production'>('demo');
  
  const currentEnv = environmentManager.getCurrentEnvironment();
  const currentConfig = environmentManager.getConfig();

  const handleEnvironmentSwitch = (newEnv: 'demo' | 'production') => {
    if (newEnv === currentEnv) return;
    
    setTargetEnvironment(newEnv);
    setShowSwitchDialog(true);
  };

  const confirmSwitch = () => {
    if (targetEnvironment === 'production') {
      environmentManager.switchToProduction();
    } else {
      environmentManager.switchToDemo();
    }
    setShowSwitchDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {currentEnv === 'demo' ? (
              <TestTube className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{currentConfig.name}</span>
            <RefreshCw className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">Ambiente Atual</p>
            <p className="text-xs text-muted-foreground">{currentConfig.description}</p>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => handleEnvironmentSwitch('demo')}
            disabled={currentEnv === 'demo'}
            className="gap-2"
          >
            <TestTube className="h-4 w-4" />
            <div className="flex flex-col">
              <span>{ENVIRONMENT_CONFIGS.demo.name}</span>
              <span className="text-xs text-muted-foreground">
                {ENVIRONMENT_CONFIGS.demo.description}
              </span>
            </div>
            {currentEnv === 'demo' && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Atual
              </Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleEnvironmentSwitch('production')}
            disabled={currentEnv === 'production'}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            <div className="flex flex-col">
              <span>{ENVIRONMENT_CONFIGS.production.name}</span>
              <span className="text-xs text-muted-foreground">
                {ENVIRONMENT_CONFIGS.production.description}
              </span>
            </div>
            {currentEnv === 'production' && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Atual
              </Badge>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Alternar para {ENVIRONMENT_CONFIGS[targetEnvironment].name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {targetEnvironment === 'production' ? (
                <>
                  Você está prestes a alternar para o ambiente de produção. 
                  <br /><br />
                  <strong>Atenção:</strong>
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>Todos os dados de demonstração serão limpos</li>
                    <li>Você começará com uma base de dados vazia</li>
                    <li>Todas as ações serão persistidas no banco de dados</li>
                    <li>A página será recarregada automaticamente</li>
                  </ul>
                </>
              ) : (
                <>
                  Você está prestes a alternar para o ambiente de demonstração.
                  <br /><br />
                  <strong>Características do ambiente demo:</strong>
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>Dados de exemplo pré-carregados</li>
                    <li>Alterações não são persistidas</li>
                    <li>Ideal para testes e apresentações</li>
                    <li>A página será recarregada automaticamente</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch}>
              Confirmar Alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EnvironmentSwitcher;