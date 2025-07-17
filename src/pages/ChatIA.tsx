import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Bot, User, Paperclip, Send, Lightbulb, FileText, Image } from "lucide-react";

const ChatIA = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system",
      content: "Olá! Sou o assistente IA do MILAPP. Estou aqui para ajudar no levantamento de requisitos para automação RPA. Como posso ajudá-lo hoje?",
      timestamp: "10:00"
    },
    {
      id: 2,
      type: "user",
      content: "Preciso automatizar o processo de aprovação de notas fiscais",
      timestamp: "10:05"
    },
    {
      id: 3,
      type: "assistant",
      content: "Perfeito! Vou ajudá-lo a mapear esse processo. Algumas perguntas para entender melhor:\n\n1. Qual o volume médio de notas fiscais por dia?\n2. Quais são os critérios de aprovação atuais?\n3. Existe algum sistema específico onde essas notas são processadas?\n4. Quem são os aprovadores no processo atual?",
      timestamp: "10:06",
      suggestions: ["Volume alto (>100/dia)", "Critérios complexos", "SAP/ERP específico", "Múltiplos aprovadores"]
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simular resposta da IA
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "assistant",
        content: "Entendi! Baseado nas informações fornecidas, posso gerar um documento de requisitos inicial. Você gostaria que eu:\n\n✅ Crie um mapa do processo atual\n✅ Identifique pontos de automação\n✅ Sugira ferramentas RPA adequadas\n✅ Estime o ROI esperado",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        suggestions: ["Gerar mapa", "Análise de ROI", "Sugerir ferramentas", "Criar documento"]
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const quickActions = [
    { icon: FileText, label: "Analisar Processo", color: "text-primary" },
    { icon: Lightbulb, label: "Sugerir Automação", color: "text-accent" },
    { icon: Image, label: "Upload Fluxograma", color: "text-rpa" }
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
                      className="w-full justify-start gap-2 h-auto p-3"
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
                          
                          {msg.suggestions && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {msg.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs"
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
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Digite sua mensagem ou descreva o processo que deseja automatizar..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatIA;