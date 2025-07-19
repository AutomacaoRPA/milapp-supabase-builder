import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  Users, 
  Target,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';

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

interface IdeiaInicial {
  titulo: string;
  descricao: string;
  solicitante: {
    nome: string;
    email: string;
    departamento: string;
    cargo: string;
  };
  prioridade_negocio: 'baixa' | 'media' | 'alta' | 'critica';
  prazo_desejado: Date;
  beneficio_estimado: string;
}

interface PDDDocument {
  id: string;
  projeto: {
    nome: string;
    id: string;
    solicitante: string;
    data: string;
  };
  objetivo: string[];
  escopo: {
    incluido: string[];
    excluido: string[];
  };
  stakeholders: {
    sponsor: string;
    product_owner: string;
    usuarios_finais: string;
    aprovadores: string;
  };
  requisitos_funcionais: string[];
  requisitos_nao_funcionais: string[];
  estimativas: {
    desenvolvimento: number;
    testes: number;
    deploy: number;
    total: number;
  };
  roi: {
    economia: string;
    investimento: string;
    payback: string;
    percentual: number;
  };
  cronograma: {
    inicio: string;
    fim: string;
    marcos: string[];
  };
}

interface PDDGeneratorProps {
  analise: AnaliseIA;
  ideia: IdeiaInicial;
  onPDDGenerated: (pdd: PDDDocument) => void;
}

export const PDDGenerator: React.FC<PDDGeneratorProps> = ({
  analise,
  ideia,
  onPDDGenerated
}) => {
  const [pdd, setPdd] = useState<PDDDocument | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDD = async () => {
    setIsGenerating(true);

    // Simular geração do PDD
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pddGerado: PDDDocument = {
      id: `PDD-${Date.now()}`,
      projeto: {
        nome: ideia.titulo,
        id: `PROJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        solicitante: ideia.solicitante.nome,
        data: new Date().toISOString().split('T')[0]
      },
      objetivo: [
        `Automatizar o processo de ${ideia.titulo.toLowerCase()}`,
        `Reduzir tempo de processamento de ${ideia.beneficio_estimado || '5 dias para 1 dia'}`,
        'Eliminar retrabalho e erros manuais',
        'Melhorar experiência do usuário final',
        'Aumentar eficiência operacional'
      ],
      escopo: {
        incluido: [
          'Interface de usuário intuitiva',
          'Workflow de aprovação automatizado',
          'Integração com sistemas existentes',
          'Sistema de notificações',
          'Relatórios básicos de acompanhamento',
          'Auditoria e logs de atividades'
        ],
        excluido: [
          'Integração com sistemas financeiros externos',
          'Relatórios gerenciais avançados',
          'Módulo de business intelligence',
          'Integração com sistemas de terceiros não essenciais',
          'Funcionalidades de machine learning avançado'
        ]
      },
      stakeholders: {
        sponsor: `Diretor de ${ideia.solicitante.departamento}`,
        product_owner: ideia.solicitante.nome,
        usuarios_finais: 'Equipe operacional do departamento',
        aprovadores: 'Gestores e supervisores'
      },
      requisitos_funcionais: analise.requisitos_extraidos.funcionais,
      requisitos_nao_funcionais: analise.requisitos_extraidos.nao_funcionais,
      estimativas: {
        desenvolvimento: analise.tempo_estimado.desenvolvimento,
        testes: analise.tempo_estimado.testes,
        deploy: analise.tempo_estimado.deploy,
        total: analise.tempo_estimado.desenvolvimento + analise.tempo_estimado.testes + analise.tempo_estimado.deploy
      },
      roi: {
        economia: 'R$ 150.000/ano',
        investimento: 'R$ 45.000',
        payback: '4 meses',
        percentual: 233
      },
      cronograma: {
        inicio: new Date().toISOString().split('T')[0],
        fim: new Date(Date.now() + (analise.tempo_estimado.total * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        marcos: [
          'Quality Gate G1 - Aprovação de Conceito',
          'Quality Gate G2 - Aprovação de Desenvolvimento',
          'Quality Gate G3 - Aprovação para Produção',
          'Deploy em Produção',
          'Quality Gate G4 - Validação Operacional'
        ]
      }
    };

    setPdd(pddGerado);
    setIsGenerating(false);
    onPDDGenerated(pddGerado);
  };

  const downloadPDD = (format: 'pdf' | 'docx' | 'md') => {
    if (!pdd) return;

    const content = generateDocumentContent(pdd, format);
    const blob = new Blob([content], { 
      type: format === 'pdf' ? 'application/pdf' : format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/markdown'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdd.projeto.id}-PDD.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDocumentContent = (pdd: PDDDocument, format: string): string => {
    if (format === 'md') {
      return `# ${pdd.projeto.id} - Project Definition Document

## Informações do Projeto
- **Nome**: ${pdd.projeto.nome}
- **ID**: ${pdd.projeto.id}
- **Solicitante**: ${pdd.projeto.solicitante}
- **Data**: ${pdd.projeto.data}

## Objetivo
${pdd.objetivo.map(obj => `- ${obj}`).join('\n')}

## Escopo
### Incluído
${pdd.escopo.incluido.map(item => `- ${item}`).join('\n')}

### Excluído
${pdd.escopo.excluido.map(item => `- ${item}`).join('\n')}

## Stakeholders
- **Sponsor**: ${pdd.stakeholders.sponsor}
- **Product Owner**: ${pdd.stakeholders.product_owner}
- **Usuários Finais**: ${pdd.stakeholders.usuarios_finais}
- **Aprovadores**: ${pdd.stakeholders.aprovadores}

## Requisitos Funcionais
${pdd.requisitos_funcionais.map((req, index) => `RF${String(index + 1).padStart(3, '0')}: ${req}`).join('\n')}

## Requisitos Não-Funcionais
${pdd.requisitos_nao_funcionais.map((req, index) => `RNF${String(index + 1).padStart(3, '0')}: ${req}`).join('\n')}

## Estimativas
- **Desenvolvimento**: ${pdd.estimativas.desenvolvimento} horas
- **Testes**: ${pdd.estimativas.testes} horas
- **Deploy**: ${pdd.estimativas.deploy} horas
- **Total**: ${pdd.estimativas.total} horas

## ROI
- **Economia**: ${pdd.roi.economia}
- **Investimento**: ${pdd.roi.investimento}
- **Payback**: ${pdd.roi.payback}
- **ROI**: ${pdd.roi.percentual}%

## Cronograma
- **Início**: ${pdd.cronograma.inicio}
- **Fim**: ${pdd.cronograma.fim}

### Marcos Principais
${pdd.cronograma.marcos.map((marco, index) => `${index + 1}. ${marco}`).join('\n')}
`;
    }
    
    return JSON.stringify(pdd, null, 2);
  };

  if (isGenerating) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 animate-pulse" />
            Gerando PDD Automático
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Gerando Project Definition Document baseado na análise do Discovery IA...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!pdd) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Geração de PDD Automático
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Resumo da Análise Discovery IA</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Complexidade:</span>
                <Badge className="ml-2">{analise.complexidade_estimada.toUpperCase()}</Badge>
              </div>
              <div>
                <span className="font-medium">Tempo Total:</span>
                <span className="ml-2">{analise.tempo_estimado.desenvolvimento + analise.tempo_estimado.testes + analise.tempo_estimado.deploy}h</span>
              </div>
              <div>
                <span className="font-medium">Stakeholders:</span>
                <span className="ml-2">{analise.stakeholders_identificados.length}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">O que será gerado automaticamente:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Project Definition Document (PDD) estruturado
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Requisitos funcionais e não-funcionais detalhados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Estimativas de tempo e recursos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Análise de ROI e benefícios
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Cronograma com marcos principais
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Identificação de stakeholders
              </li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={generatePDD} className="w-full md:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDD Automático
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              PDD Gerado com Sucesso
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {pdd.projeto.id} - {pdd.projeto.nome}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadPDD('md')}>
              <Download className="h-4 w-4 mr-1" />
              Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPDD('docx')}>
              <Download className="h-4 w-4 mr-1" />
              Word
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPDD('pdf')}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="objetivo">Objetivo</TabsTrigger>
            <TabsTrigger value="escopo">Escopo</TabsTrigger>
            <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
            <TabsTrigger value="estimativas">Estimativas</TabsTrigger>
            <TabsTrigger value="roi">ROI</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Projeto</span>
                  </div>
                  <p className="text-lg font-bold mt-2">{pdd.projeto.id}</p>
                  <p className="text-sm text-muted-foreground">{pdd.projeto.nome}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Solicitante</span>
                  </div>
                  <p className="text-lg font-bold mt-2">{pdd.projeto.solicitante}</p>
                  <p className="text-sm text-muted-foreground">{ideia.solicitante.departamento}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Duração</span>
                  </div>
                  <p className="text-lg font-bold mt-2">{pdd.estimativas.total}h</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.ceil(pdd.estimativas.total / 8)} dias úteis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">ROI</span>
                  </div>
                  <p className="text-lg font-bold mt-2">{pdd.roi.percentual}%</p>
                  <p className="text-sm text-muted-foreground">Payback: {pdd.roi.payback}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cronograma do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Início</span>
                    <span className="text-sm font-medium">{pdd.cronograma.inicio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fim</span>
                    <span className="text-sm font-medium">{pdd.cronograma.fim}</span>
                  </div>
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">Marcos Principais:</h4>
                    <ul className="space-y-1">
                      {pdd.cronograma.marcos.map((marco, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          {marco}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objetivo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Objetivos do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pdd.objetivo.map((obj, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{obj}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stakeholders Identificados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Sponsor</h4>
                    <p className="text-sm text-muted-foreground">{pdd.stakeholders.sponsor}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Product Owner</h4>
                    <p className="text-sm text-muted-foreground">{pdd.stakeholders.product_owner}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Usuários Finais</h4>
                    <p className="text-sm text-muted-foreground">{pdd.stakeholders.usuarios_finais}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Aprovadores</h4>
                    <p className="text-sm text-muted-foreground">{pdd.stakeholders.aprovadores}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escopo" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Escopo Incluído
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pdd.escopo.incluido.map((item, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Escopo Excluído
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pdd.escopo.excluido.map((item, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-red-600">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requisitos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Requisitos Funcionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pdd.requisitos_funcionais.map((req, index) => (
                      <li key={index} className="text-sm">
                        <span className="font-medium text-blue-600">RF{String(index + 1).padStart(3, '0')}:</span> {req}
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
                    {pdd.requisitos_nao_funcionais.map((req, index) => (
                      <li key={index} className="text-sm">
                        <span className="font-medium text-green-600">RNF{String(index + 1).padStart(3, '0')}:</span> {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="estimativas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Desenvolvimento</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{pdd.estimativas.desenvolvimento}h</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.ceil(pdd.estimativas.desenvolvimento / 8)} dias úteis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Testes</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{pdd.estimativas.testes}h</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.ceil(pdd.estimativas.testes / 8)} dias úteis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Deploy</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{pdd.estimativas.deploy}h</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.ceil(pdd.estimativas.deploy / 8)} dias úteis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{pdd.estimativas.total}h</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.ceil(pdd.estimativas.total / 8)} dias úteis
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="roi" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Análise Financeira
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Economia Anual:</span>
                      <span className="font-medium text-green-600">{pdd.roi.economia}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Investimento:</span>
                      <span className="font-medium text-red-600">{pdd.roi.investimento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Payback:</span>
                      <span className="font-medium">{pdd.roi.payback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">ROI:</span>
                      <span className="font-medium text-green-600">{pdd.roi.percentual}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Benefícios Esperados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Redução significativa no tempo de processamento</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Eliminação de erros manuais</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Melhoria na experiência do usuário</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Aumento na eficiência operacional</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Retorno sobre investimento positivo</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline">
            Editar PDD
          </Button>
          <Button onClick={() => {
            // Aqui seria a chamada para iniciar Quality Gate G1
            console.log('Iniciando Quality Gate G1...');
          }}>
            Iniciar Quality Gate G1
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 