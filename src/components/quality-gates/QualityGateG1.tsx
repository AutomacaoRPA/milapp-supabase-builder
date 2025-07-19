import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  AlertCircle,
  Timer,
  UserCheck,
  Mail,
  Bell,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';

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

interface CriterioG1 {
  id: string;
  nome: string;
  descricao: string;
  peso: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise';
  aprovador: string;
  comentarios: string[];
  deadline: Date;
  score: number; // 0-100
}

interface AprovadorG1 {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  peso: number;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  comentarios: string[];
  data_aprovacao?: Date;
  sla_horas: number;
}

interface QualityGateG1Props {
  pdd: PDDDocument;
  onAprovacao: (aprovado: boolean, comentarios: string[]) => void;
}

export const QualityGateG1: React.FC<QualityGateG1Props> = ({
  pdd,
  onAprovacao
}) => {
  const [criterios, setCriterios] = useState<CriterioG1[]>([]);
  const [aprovadores, setAprovadores] = useState<AprovadorG1[]>([]);
  const [status, setStatus] = useState<'pendente' | 'em_aprovacao' | 'aprovado' | 'rejeitado'>('pendente');
  const [slaDeadline, setSlaDeadline] = useState<Date>(new Date());
  const [tempoRestante, setTempoRestante] = useState<string>('');
  const [scoreGeral, setScoreGeral] = useState<number>(0);

  useEffect(() => {
    // Inicializar critérios G1
    const criteriosIniciais: CriterioG1[] = [
      {
        id: 'c1',
        nome: 'PDD Completo e Aprovado',
        descricao: 'Documento PDD completo com objetivos claros, escopo bem delimitado e stakeholders identificados',
        peso: 25,
        status: 'pendente',
        aprovador: 'Product Owner',
        comentarios: [],
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 horas
        score: 0
      },
      {
        id: 'c2',
        nome: 'Viabilidade Técnica',
        descricao: 'Arquitetura factível, integrações possíveis e recursos técnicos disponíveis',
        peso: 25,
        status: 'pendente',
        aprovador: 'Tech Lead',
        comentarios: [],
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        score: 0
      },
      {
        id: 'c3',
        nome: 'Viabilidade de Negócio',
        descricao: 'ROI positivo demonstrado, benefícios quantificados e alinhamento estratégico',
        peso: 25,
        status: 'pendente',
        aprovador: 'Sponsor',
        comentarios: [],
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 horas
        score: 0
      },
      {
        id: 'c4',
        nome: 'Recursos e Cronograma',
        descricao: 'Equipe alocada, timeline realística e orçamento aprovado',
        peso: 25,
        status: 'pendente',
        aprovador: 'PMO',
        comentarios: [],
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        score: 0
      }
    ];

    // Inicializar aprovadores
    const aprovadoresIniciais: AprovadorG1[] = [
      {
        id: 'sponsor',
        nome: pdd.stakeholders.sponsor,
        cargo: 'Sponsor',
        email: 'sponsor@empresa.com',
        peso: 40,
        status: 'pendente',
        comentarios: [],
        sla_horas: 48
      },
      {
        id: 'tech_lead',
        nome: 'João Santos',
        cargo: 'Tech Lead',
        email: 'tech.lead@empresa.com',
        peso: 30,
        status: 'pendente',
        comentarios: [],
        sla_horas: 24
      },
      {
        id: 'pmo',
        nome: 'Maria Costa',
        cargo: 'PMO',
        email: 'pmo@empresa.com',
        peso: 20,
        status: 'pendente',
        comentarios: [],
        sla_horas: 24
      },
      {
        id: 'security',
        nome: 'Pedro Silva',
        cargo: 'Security Officer',
        email: 'security@empresa.com',
        peso: 10,
        status: 'pendente',
        comentarios: [],
        sla_horas: 24
      }
    ];

    setCriterios(criteriosIniciais);
    setAprovadores(aprovadoresIniciais);
    setSlaDeadline(new Date(Date.now() + 48 * 60 * 60 * 1000)); // 48 horas SLA
    setStatus('em_aprovacao');

    // Simular notificações automáticas
    setTimeout(() => {
      notificarAprovadores(aprovadoresIniciais);
    }, 1000);
  }, [pdd]);

  useEffect(() => {
    // Atualizar tempo restante
    const timer = setInterval(() => {
      const agora = new Date();
      const restante = slaDeadline.getTime() - agora.getTime();
      
      if (restante > 0) {
        const horas = Math.floor(restante / (1000 * 60 * 60));
        const minutos = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
        setTempoRestante(`${horas}h ${minutos}m`);
      } else {
        setTempoRestante('SLA Vencido');
        // Escalar automaticamente
        escalarAprovacao();
      }
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(timer);
  }, [slaDeadline]);

  useEffect(() => {
    // Calcular score geral
    const scoreTotal = criterios.reduce((total, criterio) => {
      return total + (criterio.score * criterio.peso / 100);
    }, 0);
    setScoreGeral(scoreTotal);

    // Verificar aprovação automática
    if (scoreTotal >= 80 && criterios.every(c => c.status === 'aprovado')) {
      aprovarAutomaticamente();
    }
  }, [criterios]);

  const notificarAprovadores = (aprovadores: AprovadorG1[]) => {
    console.log('Notificando aprovadores G1...');
    aprovadores.forEach(aprovador => {
      // Simular envio de email/Teams
      console.log(`Notificação enviada para ${aprovador.nome} (${aprovador.email})`);
    });
  };

  const escalarAprovacao = () => {
    console.log('SLA vencido - escalando aprovação...');
    // Notificar gestores superiores
    setStatus('pendente');
  };

  const aprovarAutomaticamente = () => {
    setStatus('aprovado');
    onAprovacao(true, ['Aprovação automática - score >= 80%']);
  };

  const simularAprovacao = (aprovadorId: string, aprovado: boolean) => {
    setAprovadores(prev => prev.map(aprovador => {
      if (aprovador.id === aprovadorId) {
        return {
          ...aprovador,
          status: aprovado ? 'aprovado' : 'rejeitado',
          data_aprovacao: new Date(),
          comentarios: aprovado 
            ? ['Aprovado conforme critérios estabelecidos']
            : ['Rejeitado - necessita ajustes']
        };
      }
      return aprovador;
    }));

    // Atualizar critérios correspondentes
    setCriterios(prev => prev.map(criterio => {
      if (criterio.aprovador.toLowerCase().includes(aprovadorId)) {
        return {
          ...criterio,
          status: aprovado ? 'aprovado' : 'rejeitado',
          score: aprovado ? 100 : 0,
          comentarios: aprovado 
            ? ['Critério aprovado pelo aprovador responsável']
            : ['Critério rejeitado - necessita correções']
        };
      }
      return criterio;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'em_analise': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado': return <CheckCircle className="h-4 w-4" />;
      case 'rejeitado': return <AlertCircle className="h-4 w-4" />;
      case 'em_analise': return <Clock className="h-4 w-4" />;
      default: return <Timer className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quality Gate G1 - Aprovação de Conceito
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {pdd.projeto.id} - {pdd.projeto.nome}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)}>
              {getStatusIcon(status)}
              <span className="ml-1">{status.toUpperCase()}</span>
            </Badge>
            <div className="text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              {tempoRestante}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score Geral G1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Progresso da Aprovação</span>
                <span className="font-bold text-lg">{Math.round(scoreGeral)}%</span>
              </div>
              <Progress value={scoreGeral} className="w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {criterios.filter(c => c.status === 'aprovado').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Aprovados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {criterios.filter(c => c.status === 'rejeitado').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Rejeitados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {criterios.filter(c => c.status === 'pendente').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pendentes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {aprovadores.filter(a => a.status === 'aprovado').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Aprovadores</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critérios de Aprovação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Critérios de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criterios.map((criterio) => (
                <div key={criterio.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{criterio.nome}</h4>
                      <p className="text-sm text-muted-foreground">{criterio.descricao}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(criterio.status)}>
                        {criterio.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">Peso: {criterio.peso}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Aprovador: {criterio.aprovador}</span>
                      <span>Score: {criterio.score}/100</span>
                    </div>
                    <Progress value={criterio.score} className="w-full" />
                    {criterio.comentarios.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Comentários:</strong>
                        <ul className="mt-1 space-y-1">
                          {criterio.comentarios.map((comentario, index) => (
                            <li key={index}>• {comentario}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aprovadores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aprovadores G1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aprovadores.map((aprovador) => (
                <div key={aprovador.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{aprovador.nome}</h4>
                      <p className="text-sm text-muted-foreground">{aprovador.cargo}</p>
                      <p className="text-sm text-muted-foreground">{aprovador.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(aprovador.status)}>
                        {getStatusIcon(aprovador.status)}
                        <span className="ml-1">{aprovador.status.toUpperCase()}</span>
                      </Badge>
                      <span className="text-sm font-medium">Peso: {aprovador.peso}%</span>
                    </div>
                  </div>
                  
                  {aprovador.status === 'pendente' && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        onClick={() => simularAprovacao(aprovador.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => simularAprovacao(aprovador.id, false)}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}

                  {aprovador.comentarios.length > 0 && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <strong>Comentários:</strong>
                      <ul className="mt-1 space-y-1">
                        {aprovador.comentarios.map((comentario, index) => (
                          <li key={index}>• {comentario}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aprovador.data_aprovacao && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {aprovador.data_aprovacao.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumo do PDD */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo do PDD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Informações do Projeto</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>ID:</strong> {pdd.projeto.id}</div>
                  <div><strong>Nome:</strong> {pdd.projeto.nome}</div>
                  <div><strong>Solicitante:</strong> {pdd.projeto.solicitante}</div>
                  <div><strong>Data:</strong> {pdd.projeto.data}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Estimativas</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Desenvolvimento:</strong> {pdd.estimativas.desenvolvimento}h</div>
                  <div><strong>Testes:</strong> {pdd.estimativas.testes}h</div>
                  <div><strong>Deploy:</strong> {pdd.estimativas.deploy}h</div>
                  <div><strong>Total:</strong> {pdd.estimativas.total}h</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">ROI</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Economia:</strong> {pdd.roi.economia}</div>
                  <div><strong>Investimento:</strong> {pdd.roi.investimento}</div>
                  <div><strong>Payback:</strong> {pdd.roi.payback}</div>
                  <div><strong>ROI:</strong> {pdd.roi.percentual}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Notificações */}
        {status === 'em_aprovacao' && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Status:</strong> Aguardando aprovação dos stakeholders. 
              SLA de 48 horas ativo. Notificações automáticas enviadas para todos os aprovadores.
            </AlertDescription>
          </Alert>
        )}

        {scoreGeral >= 80 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Pronto para aprovação automática!</strong> Score geral de {Math.round(scoreGeral)}% 
              atende aos critérios mínimos (80%). Aguardando confirmação final.
            </AlertDescription>
          </Alert>
        )}

        {tempoRestante === 'SLA Vencido' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>SLA Vencido!</strong> Aprovação escalada automaticamente para gestores superiores.
            </AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Reenviar Notificações
          </Button>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Escalar Aprovação
          </Button>
          {status === 'aprovado' && (
            <Button onClick={() => {
              // Aqui seria a chamada para iniciar planejamento ágil
              console.log('Iniciando planejamento ágil...');
            }}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Iniciar Planejamento Ágil
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 