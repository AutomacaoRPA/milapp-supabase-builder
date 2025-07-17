import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Bot, User, Paperclip, Send, Lightbulb, FileText, Image, Upload, Mic, Video, Download, Sparkles, Target, BarChart } from "lucide-react";

interface MessageAttachment {
  name: string;
  type: string;
  size: number;
}

interface MessageInsights {
  automationPotential: number;
  complexity: string;
  estimatedROI: string;
  timeToImplement: string;
}

interface ChatMessage {
  id: number;
  type: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
  attachments?: MessageAttachment[];
  suggestions?: string[];
  insights?: MessageInsights;
}

const ChatIA = () => {
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "system",
      content: "🤖 **MILAPP IA Discovery** iniciado!\n\nSou seu assistente especializado em automação RPA. Posso analisar:\n\n📄 **Documentos** (PDF, Word, Excel)\n🖼️ **Imagens** (fluxogramas, prints de tela)\n🎤 **Áudios** (gravações de reuniões)\n📹 **Vídeos** (demonstrações de processo)\n\nComo posso ajudá-lo hoje?",
      timestamp: "10:00",
      attachments: []
    },
    {
      id: 2,
      type: "user",
      content: "Preciso automatizar o processo de aprovação de notas fiscais. Temos muitos gargalos manuais.",
      timestamp: "10:05",
      attachments: []
    },
    {
      id: 3,
      type: "assistant",
      content: "🎯 **Análise Inicial: Aprovação de Notas Fiscais**\n\nIdentifiquei um processo crítico para automação! Vou fazer algumas perguntas estratégicas:\n\n**📊 Volume e Complexidade:**\n• Qual o volume diário/mensal de notas?\n• Existe sazonalidade no processo?\n\n**🔍 Critérios de Aprovação:**\n• Quais validações são feitas?\n• Há alçadas de aprovação?\n\n**💻 Sistemas Envolvidos:**\n• ERP utilizado (SAP, Oracle, TOTVS?)\n• Sistema de workflow atual?\n\n**👥 Stakeholders:**\n• Quem são os aprovadores?\n• Existe hierarquia de aprovação?",
      timestamp: "10:06",
      suggestions: [
        "Volume > 500 notas/mês",
        "Critérios complexos com múltiplas validações", 
        "Sistema SAP/ERP integrado",
        "Múltiplos níveis de aprovação",
        "Upload fluxograma do processo",
        "Agendar reunião de discovery"
      ],
      insights: {
        automationPotential: 85,
        complexity: "Média",
        estimatedROI: "R$ 25.000/mês",
        timeToImplement: "6-8 semanas"
      }
    }
  ]);

  const handleSendMessage = async () => {
    if (!message.trim() && uploadedFiles.length === 0) return;

    const newMessage: ChatMessage = {
      id: messages.length + 1,
      type: "user",
      content: message || "📎 Arquivos anexados",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      attachments: uploadedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }))
    };

    setMessages([...messages, newMessage]);
    setMessage("");
    setUploadedFiles([]);

    // Simular análise IA avançada
    setTimeout(() => {
      let aiContent = "";
      let insights = null;

      if (uploadedFiles.length > 0) {
        aiContent = `🔍 **Análise Multimodal Concluída**\n\nArquivos processados: ${uploadedFiles.length}\n\n`;
        
        uploadedFiles.forEach(file => {
          if (file.type.includes('image')) {
            aiContent += "📸 **Análise de Imagem:**\n• Fluxograma identificado com 8 etapas\n• 3 pontos de decisão manuais\n• 2 gargalos críticos detectados\n\n";
          } else if (file.type.includes('pdf')) {
            aiContent += "📄 **Análise de Documento:**\n• Processo mapeado em 12 páginas\n• 15 atividades identificadas\n• 60% passível de automação\n\n";
          } else if (file.type.includes('audio')) {
            aiContent += "🎤 **Transcrição de Áudio:**\n• Reunião de 45 minutos transcrita\n• 8 requisitos funcionais extraídos\n• 3 regras de negócio identificadas\n\n";
          }
        });

        aiContent += "✨ **Recomendações IA:**\n• Priorizar automação de validações\n• Implementar OCR para captura de dados\n• Criar dashboard de monitoramento\n• ROI estimado: R$ 35.000/mês";

        insights = {
          automationPotential: 92,
          complexity: "Alta",
          estimatedROI: "R$ 35.000/mês",
          timeToImplement: "10-12 semanas"
        };
      } else {
        aiContent = "💡 **Próximos Passos Sugeridos:**\n\n✅ Documentar processo AS-IS\n✅ Mapear sistemas envolvidos\n✅ Definir critérios de sucesso\n✅ Estimar benefícios quantitativos\n\n📋 **Gostaria que eu gere um documento de requisitos inicial?**";
        
        insights = {
          automationPotential: 78,
          complexity: "Média",
          estimatedROI: "R$ 28.000/mês",
          timeToImplement: "8-10 semanas"
        };
      }

      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        type: "assistant",
        content: aiContent,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        suggestions: [
          "Gerar documento PDD",
          "Criar mapa de processo",
          "Analisar ROI detalhado",
          "Sugerir ferramentas RPA",
          "Agendar workshop técnico"
        ],
        insights: insights
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 2000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    toast({
      title: "Arquivos carregados",
      description: `${files.length} arquivo(s) adicionado(s) para análise`,
    });
  };

  const handleRecording = () => {
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Gravação parada" : "Gravação iniciada",
      description: isRecording ? "Áudio salvo para análise" : "Gravando áudio...",
    });
  };

  const generateDocument = (type: string) => {
    toast({
      title: "Documento gerado",
      description: `${type} criado com base na conversa`,
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const quickActions = [
    { icon: FileText, label: "Gerar PDD", color: "text-primary", action: () => generateDocument("PDD") },
    { icon: BarChart, label: "Análise ROI", color: "text-accent", action: () => generateDocument("ROI") },
    { icon: Target, label: "Mapa Processo", color: "text-rpa", action: () => generateDocument("Mapa") },
    { icon: Sparkles, label: "Sugestões IA", color: "text-primary", action: () => generateDocument("Sugestões") }
  ];

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Chat IA Multimodal
          </h1>
          <p className="text-muted-foreground">
            Levantamento inteligente de requisitos para automação RPA
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Ações Rápidas */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-auto p-3 hover-scale"
                      onClick={action.action}
                    >
                      <Icon className={`h-4 w-4 ${action.color}`} />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline" className="w-full justify-center">
                  Processo Financeiro
                </Badge>
                <Badge variant="outline" className="w-full justify-center">
                  Aprovação de Documentos
                </Badge>
                <Badge variant="outline" className="w-full justify-center">
                  Integração de Sistemas
                </Badge>
                <Badge variant="outline" className="w-full justify-center">
                  Relatórios Automáticos
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Chat Principal */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Conversa com IA
                </CardTitle>
                <CardDescription>
                  Descreva seu processo e receba sugestões personalizadas
                </CardDescription>
              </CardHeader>

              {/* Área de Mensagens */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.type === "user" ? "justify-end" : ""}`}>
                      <div className={`flex gap-3 max-w-[80%] ${msg.type === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`p-2 rounded-full ${
                          msg.type === "user" ? "bg-primary" : msg.type === "assistant" ? "bg-accent" : "bg-muted"
                        }`}>
                          {msg.type === "user" ? (
                            <User className="h-4 w-4 text-primary-foreground" />
                          ) : (
                            <Bot className="h-4 w-4 text-accent-foreground" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className={`p-3 rounded-lg ${
                            msg.type === "user" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                          
                          {/* Anexos */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-2">
                              {msg.attachments.map((attachment: MessageAttachment, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                                  <Paperclip className="h-3 w-3" />
                                  <span>{attachment.name}</span>
                                  <Badge variant="secondary">{(attachment.size / 1024).toFixed(1)}KB</Badge>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Insights IA */}
                          {msg.insights && (
                            <div className="p-3 bg-gradient-primary/10 border border-primary/20 rounded-lg space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Insights IA
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Potencial:</span>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div 
                                        className="bg-primary h-2 rounded-full" 
                                        style={{ width: `${msg.insights.automationPotential}%` }}
                                      />
                                    </div>
                                    <span className="text-primary font-medium">{msg.insights.automationPotential}%</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">ROI Estimado:</span>
                                  <div className="font-medium text-accent">{msg.insights.estimatedROI}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Complexidade:</span>
                                  <Badge variant="outline" className="ml-1">{msg.insights.complexity}</Badge>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Prazo:</span>
                                  <div className="font-medium">{msg.insights.timeToImplement}</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {msg.suggestions && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {msg.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs hover-scale"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input de Mensagem */}
              <div className="border-t p-4">
                {/* Arquivos Selecionados */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="text-xs text-muted-foreground">Arquivos selecionados:</div>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                          <Paperclip className="h-3 w-3" />
                          <span>{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {/* Botão Upload */}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload de arquivos"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  
                  {/* Botão Gravação */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRecording}
                    className={isRecording ? "text-red-500" : ""}
                    title={isRecording ? "Parar gravação" : "Gravar áudio"}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>

                  <Input
                    placeholder="Digite sua mensagem ou descreva o processo que deseja automatizar..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon" className="hover-scale">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Input oculto para upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.mp3,.wav,.mp4"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatIA;