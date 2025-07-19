import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Lightbulb, 
  Users, 
  Clock, 
  Target,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface IdeiaInicial {
  titulo: string;
  descricao: string;
  solicitante: {
    nome: string;
    email: string;
    departamento: string;
    cargo: string;
  };
  anexos: File[];
  prioridade_negocio: 'baixa' | 'media' | 'alta' | 'critica';
  prazo_desejado: Date;
  beneficio_estimado: string;
}

interface AnaliseIA {
  requisitos_extraidos: {
    funcionais: string[];
    nao_funcionais: string[];
    regras_negocio: string[];
    excecoes: string[];
  };
  sistemas_envolvidos: string[];
  stakeholders_identificados: string[];
  complexidade_estimada: 'baixa' | 'media' | 'alta' | 'muito_alta';
  ferramentas_recomendadas: string[];
  tempo_estimado: {
    desenvolvimento: number;
    testes: number;
    deploy: number;
  };
  riscos_identificados: string[];
  dependencias: string[];
}

interface DiscoveryIAWorkflowProps {
  onAnaliseCompleta: (analise: AnaliseIA) => void;
}

export const DiscoveryIAWorkflow: React.FC<DiscoveryIAWorkflowProps> = ({
  onAnaliseCompleta
}) => {
  const [ideia, setIdeia] = useState<IdeiaInicial>({
    titulo: '',
    descricao: '',
    solicitante: {
      nome: '',
      email: '',
      departamento: '',
      cargo: ''
    },
    anexos: [],
    prioridade_negocio: 'media',
    prazo_desejado: new Date(),
    beneficio_estimado: ''
  });

  const [analise, setAnalise] = useState<AnaliseIA | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'results'>('input');

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setIdeia(prev => ({
        ...prev,
        anexos: [...prev.anexos, ...fileArray]
      }));
    }
  }, []);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setIdeia(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof IdeiaInicial],
          [child]: value
        }
      }));
    } else {
      setIdeia(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const processDiscoveryIA = async () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    
    // Simular processamento com progresso
    const steps = [
      'Analisando descrição...',
      'Processando anexos...',
      'Extraindo requisitos...',
      'Identificando stakeholders...',
      'Calculando complexidade...',
      'Gerando estimativas...',
      'Finalizando análise...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }

    // Gerar análise simulada baseada na entrada
    const analiseGerada: AnaliseIA = {
      requisitos_extraidos: {
        funcionais: [
          'Sistema deve permitir solicitação de automação',
          'Sistema deve validar dados de entrada',
          'Sistema deve gerar documentação automática',
          'Sistema deve estimar tempo de desenvolvimento'
        ],
        nao_funcionais: [
          'Disponibilidade 99.5%',
          'Tempo resposta < 3 segundos',
          'Suporte a múltiplos formatos de arquivo',
          'Interface intuitiva e responsiva'
        ],
        regras_negocio: [
          'Prioridade crítica deve ter aprovação imediata',
          'Projetos > 100h precisam análise adicional',
          'Integrações externas requerem validação de segurança'
        ],
        excecoes: [
          'Sistemas legados podem ter limitações',
          'Dados sensíveis requerem tratamento especial',
          'Integrações com APIs externas podem falhar'
        ]
      },
      sistemas_envolvidos: [
        'Sistema atual (manual)',
        'Azure AD (autenticação)',
        'Sistema de notificações',
        'Banco de dados corporativo'
      ],
      stakeholders_identificados: [
        'Solicitante: ' + ideia.solicitante.nome,
        'Sponsor: Diretor do departamento',
        'Product Owner: Gerente de processos',
        'Usuários finais: Equipe operacional',
        'TI: Equipe de desenvolvimento'
      ],
      complexidade_estimada: ideia.prioridade_negocio === 'critica' ? 'alta' : 'media',
      ferramentas_recomendadas: [
        'Power Automate (Microsoft)',
        'UiPath (RPA)',
        'Zapier (Integrações)',
        'n8n (Workflow automation)'
      ],
      tempo_estimado: {
        desenvolvimento: ideia.prioridade_negocio === 'critica' ? 120 : 80,
        testes: ideia.prioridade_negocio === 'critica' ? 40 : 24,
        deploy: ideia.prioridade_negocio === 'critica' ? 16 : 8
      },
      riscos_identificados: [
        'Dependência de sistemas externos',
        'Resistência à mudança dos usuários',
        'Limitações técnicas de integração',
        'Custos de licenciamento de ferramentas'
      ],
      dependencias: [
        'Acesso aos sistemas existentes',
        'Aprovação de orçamento',
        'Disponibilidade da equipe de TI',
        'Treinamento dos usuários finais'
      ]
    };

    setAnalise(analiseGerada);
    setCurrentStep('results');
    setIsProcessing(false);
    onAnaliseCompleta(analiseGerada);
  };

  const getComplexidadeColor = (complexidade: string) => {
    switch (complexidade) {
      case 'baixa': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'muito_alta': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (currentStep === 'processing') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Discovery IA em Processamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progress} className="w-full" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Analisando sua ideia e gerando documentação automática...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(progress)}% completo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'results' && analise) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Análise Discovery IA Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
              <TabsTrigger value="estimativas">Estimativas</TabsTrigger>
              <TabsTrigger value="riscos">Riscos</TabsTrigger>
              <TabsTrigger value="ferramentas">Ferramentas</TabsTrigger>
              <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="text-sm font-medium">Complexidade</span>
                    </div>
                    <Badge className={`mt-2 ${getComplexidadeColor(analise.complexidade_estimada)}`}>
                      {analise.complexidade_estimada.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Tempo Total</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {analise.tempo_estimado.desenvolvimento + analise.tempo_estimado.testes + analise.tempo_estimado.deploy}h
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Stakeholders</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {analise.stakeholders_identificados.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Próximo passo:</strong> Esta análise será usada para gerar automaticamente o PDD (Project Definition Document) e iniciar o processo de Quality Gate G1.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="requisitos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Requisitos Funcionais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analise.requisitos_extraidos.funcionais.map((req, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Requisitos Não-Funcionais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analise.requisitos_extraidos.nao_funcionais.map((req, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Regras de Negócio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analise.requisitos_extraidos.regras_negocio.map((regra, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          {regra}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Exceções</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analise.requisitos_extraidos.excecoes.map((excecao, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-orange-600">•</span>
                          {excecao}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="estimativas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Desenvolvimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analise.tempo_estimado.desenvolvimento}h</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.ceil(analise.tempo_estimado.desenvolvimento / 8)} dias úteis
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Testes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analise.tempo_estimado.testes}h</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.ceil(analise.tempo_estimado.testes / 8)} dias úteis
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Deploy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analise.tempo_estimado.deploy}h</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.ceil(analise.tempo_estimado.deploy / 8)} dias úteis
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Timeline Estimada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Início do projeto</span>
                      <span>Hoje</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Desenvolvimento</span>
                      <span>+{Math.ceil(analise.tempo_estimado.desenvolvimento / 8)} dias</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Testes</span>
                      <span>+{Math.ceil((analise.tempo_estimado.desenvolvimento + analise.tempo_estimado.testes) / 8)} dias</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Deploy Produção</span>
                      <span>+{Math.ceil((analise.tempo_estimado.desenvolvimento + analise.tempo_estimado.testes + analise.tempo_estimado.deploy) / 8)} dias</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="riscos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      Riscos Identificados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analise.riscos_identificados.map((risco, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-red-600">⚠</span>
                          {risco}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Dependências
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analise.dependencias.map((dependencia, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600">🔗</span>
                          {dependencia}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ferramentas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ferramentas RPA Recomendadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analise.ferramentas_recomendadas.map((ferramenta, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">
                            {ferramenta.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{ferramenta}</p>
                          <p className="text-sm text-muted-foreground">
                            Recomendada para este tipo de automação
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stakeholders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Stakeholders Identificados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analise.stakeholders_identificados.map((stakeholder, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{stakeholder}</p>
                          <p className="text-sm text-muted-foreground">
                            Papel importante no projeto
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setCurrentStep('input')}>
              Voltar
            </Button>
            <Button onClick={() => {
              // Aqui seria a chamada para gerar PDD automático
              console.log('Gerando PDD automático...');
            }}>
              Gerar PDD Automático
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Discovery IA - Nova Ideia de Automação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da Automação *</Label>
            <Input
              id="titulo"
              value={ideia.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              placeholder="Ex: Automação de aprovação de férias"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade de Negócio *</Label>
            <select
              id="prioridade"
              value={ideia.prioridade_negocio}
              onChange={(e) => handleInputChange('prioridade_negocio', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição Detalhada *</Label>
          <Textarea
            id="descricao"
            value={ideia.descricao}
            onChange={(e) => handleInputChange('descricao', e.target.value)}
            placeholder="Descreva detalhadamente o processo que deseja automatizar, incluindo contexto, problemas atuais e benefícios esperados..."
            rows={6}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Solicitante *</Label>
            <Input
              id="nome"
              value={ideia.solicitante.nome}
              onChange={(e) => handleInputChange('solicitante.nome', e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={ideia.solicitante.email}
              onChange={(e) => handleInputChange('solicitante.email', e.target.value)}
              placeholder="seu.email@empresa.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento *</Label>
            <Input
              id="departamento"
              value={ideia.solicitante.departamento}
              onChange={(e) => handleInputChange('solicitante.departamento', e.target.value)}
              placeholder="Ex: Recursos Humanos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo *</Label>
            <Input
              id="cargo"
              value={ideia.solicitante.cargo}
              onChange={(e) => handleInputChange('solicitante.cargo', e.target.value)}
              placeholder="Ex: Gerente de RH"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prazo">Prazo Desejado</Label>
            <Input
              id="prazo"
              type="date"
              value={ideia.prazo_desejado.toISOString().split('T')[0]}
              onChange={(e) => handleInputChange('prazo_desejado', new Date(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficio">Benefício Estimado</Label>
            <Input
              id="beneficio"
              value={ideia.beneficio_estimado}
              onChange={(e) => handleInputChange('beneficio_estimado', e.target.value)}
              placeholder="Ex: Redução de 5 dias para 1 dia"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Anexos (Documentos, Screenshots, etc.)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Selecionar Arquivos
            </Button>
          </div>
          {ideia.anexos.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-2">Arquivos selecionados:</p>
              <div className="space-y-1">
                {ideia.anexos.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <strong>Dica:</strong> Quanto mais detalhada a descrição e mais documentos você anexar, 
            mais precisa será a análise da IA Discovery. Inclua screenshots, fluxogramas, 
            planilhas e qualquer documentação relevante do processo atual.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button 
            onClick={processDiscoveryIA}
            disabled={!ideia.titulo || !ideia.descricao || !ideia.solicitante.nome || !ideia.solicitante.email}
            className="w-full md:w-auto"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Iniciar Análise Discovery IA
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 