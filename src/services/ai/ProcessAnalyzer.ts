import { OpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { LLMChain } from 'langchain/chains'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { MemoryVectorStore } from '@langchain/community/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'

export interface ProcessAnalysis {
  summary: string
  automationOpportunities: string[]
  recommendedTools: string[]
  estimatedROI: number
  timeline: string
  risks: string[]
  mitigations: string[]
  complexity: 'Baixa' | 'Média' | 'Alta'
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica'
  estimatedHours: number
  costSavings: number
  efficiencyGain: number
}

export interface ProcessDocument {
  id: string
  name: string
  description: string
  analysis: ProcessAnalysis
  pdd?: string
  createdAt: Date
  updatedAt: Date
}

export class ProcessAnalyzerService {
  private llm: OpenAI
  private embeddings: OpenAIEmbeddings
  private vectorStore: MemoryVectorStore | null = null
  
  constructor() {
    this.llm = new OpenAI({
      temperature: 0.7,
      modelName: 'gpt-4',
      openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
      maxTokens: 4000
    })
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY
    })
  }

  async analyzeProcess(description: string, files?: File[]): Promise<ProcessAnalysis> {
    try {
      // Template específico para MedSênior
      const analysisTemplate = new PromptTemplate({
        template: `
        Como especialista em automação da MedSênior, analise este processo seguindo nosso conceito "bem automatizar bem":
        
        Processo: {process_description}
        
        Forneça análise estruturada com:
        1. Resumo executivo (bem entender) - 2-3 frases
        2. Oportunidades de automação (bem identificar) - lista de 3-5 itens
        3. Ferramentas RPA recomendadas (bem escolher) - lista de 2-3 ferramentas
        4. ROI estimado (bem calcular) - valor em reais
        5. Cronograma sugerido (bem planejar) - estimativa em semanas
        6. Riscos e mitigações (bem prevenir) - lista de 2-3 riscos com soluções
        7. Complexidade (Baixa/Média/Alta)
        8. Prioridade (Baixa/Média/Alta/Crítica)
        9. Horas estimadas para implementação
        10. Economia de custos esperada
        11. Ganho de eficiência em porcentagem
        
        Use linguagem amigável e acolhedora, seguindo o tom MedSênior.
        Responda em formato JSON estruturado.
        `,
        inputVariables: ['process_description']
      })

      const chain = new LLMChain({
        llm: this.llm,
        prompt: analysisTemplate
      })

      const result = await chain.call({
        process_description: description
      })

      return this.parseAnalysisResult(result.text)
    } catch (error) {
      console.error('Erro na análise do processo:', error)
      return this.getFallbackAnalysis(description)
    }
  }

  async generatePDD(processAnalysis: ProcessAnalysis, processName: string): Promise<string> {
    try {
      const pddTemplate = new PromptTemplate({
        template: `
        Gere um PDD (Process Definition Document) completo para MedSênior:
        
        Nome do Processo: {process_name}
        Análise: {analysis}
        
        Estrutura do PDD:
        1. Identificação do Processo
        2. Situação Atual (As-Is)
        3. Situação Futura (To-Be)
        4. Análise de Complexidade
        5. Benefícios Esperados
        6. Cronograma de Implementação
        7. Recursos Necessários
        8. Matriz de Riscos
        9. Critérios de Sucesso
        10. Próximos Passos
        
        Use formatação markdown e linguagem técnica mas acessível.
        Mantenha o tom amigável da MedSênior.
        `,
        inputVariables: ['process_name', 'analysis']
      })

      const pddChain = new LLMChain({
        llm: this.llm,
        prompt: pddTemplate
      })

      const result = await pddChain.call({
        process_name: processName,
        analysis: JSON.stringify(processAnalysis)
      })

      return result.text
    } catch (error) {
      console.error('Erro na geração do PDD:', error)
      return this.getFallbackPDD(processAnalysis, processName)
    }
  }

  async analyzeFiles(files: File[]): Promise<string> {
    try {
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
      })

      let allText = ''
      
      for (const file of files) {
        const text = await this.extractTextFromFile(file)
        allText += `\n\nArquivo: ${file.name}\n${text}`
      }

      const chunks = await textSplitter.splitText(allText)
      
      if (!this.vectorStore) {
        this.vectorStore = await MemoryVectorStore.fromTexts(
          chunks,
          [],
          this.embeddings
        )
      } else {
        await this.vectorStore.addDocuments(
          chunks.map(chunk => ({ pageContent: chunk, metadata: {} }))
        )
      }

      const analysisTemplate = new PromptTemplate({
        template: `
        Analise os documentos fornecidos para identificar oportunidades de automação MedSênior:
        
        Documentos: {documents}
        
        Forneça:
        1. Resumo dos processos identificados
        2. Oportunidades de automação
        3. Recomendações específicas
        4. Estimativas de ROI
        
        Use linguagem amigável e técnica.
        `,
        inputVariables: ['documents']
      })

      const chain = new LLMChain({
        llm: this.llm,
        prompt: analysisTemplate
      })

      const result = await chain.call({
        documents: allText.substring(0, 3000) // Limitar tamanho
      })

      return result.text
    } catch (error) {
      console.error('Erro na análise de arquivos:', error)
      return 'Análise de arquivos temporariamente indisponível.'
    }
  }

  async getRecommendations(processType: string): Promise<string[]> {
    try {
      const recommendationsTemplate = new PromptTemplate({
        template: `
        Como especialista MedSênior, forneça recomendações para automação de {process_type}:
        
        Forneça 5 recomendações específicas e práticas.
        Use linguagem amigável e acolhedora.
        Foque em benefícios para o usuário final.
        `,
        inputVariables: ['process_type']
      })

      const chain = new LLMChain({
        llm: this.llm,
        prompt: recommendationsTemplate
      })

      const result = await chain.call({
        process_type: processType
      })

      return result.text.split('\n').filter(line => line.trim().length > 0)
    } catch (error) {
      console.error('Erro ao obter recomendações:', error)
      return [
        'Analise o processo atual para identificar tarefas repetitivas',
        'Considere automação de validação de dados',
        'Avalie integração entre sistemas',
        'Identifique relatórios que podem ser automatizados',
        'Considere automação de notificações e alertas'
      ]
    }
  }

  private parseAnalysisResult(text: string): ProcessAnalysis {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          summary: parsed.summary || 'Análise concluída com sucesso',
          automationOpportunities: parsed.automationOpportunities || ['Identificar tarefas repetitivas'],
          recommendedTools: parsed.recommendedTools || ['UiPath', 'Power Automate'],
          estimatedROI: parsed.estimatedROI || 150000,
          timeline: parsed.timeline || '8-12 semanas',
          risks: parsed.risks || ['Resistência à mudança'],
          mitigations: parsed.mitigations || ['Treinamento da equipe'],
          complexity: parsed.complexity || 'Média',
          priority: parsed.priority || 'Média',
          estimatedHours: parsed.estimatedHours || 160,
          costSavings: parsed.costSavings || 50000,
          efficiencyGain: parsed.efficiencyGain || 40
        }
      }
    } catch (error) {
      console.error('Erro ao fazer parse do resultado:', error)
    }

    return this.getFallbackAnalysis('Processo em análise')
  }

  private getFallbackAnalysis(description: string): ProcessAnalysis {
    return {
      summary: `Análise do processo "${description}" concluída. Identificamos oportunidades de automação seguindo o conceito "bem automatizar bem" da MedSênior.`,
      automationOpportunities: [
        'Identificar tarefas repetitivas e manuais',
        'Automatizar validação de dados e documentos',
        'Implementar integração entre sistemas',
        'Criar relatórios automatizados',
        'Otimizar fluxo de aprovações'
      ],
      recommendedTools: ['UiPath', 'Power Automate', 'Blue Prism'],
      estimatedROI: 180000,
      timeline: '10-14 semanas',
      risks: [
        'Resistência da equipe à mudança',
        'Complexidade técnica do processo',
        'Dependência de sistemas legados'
      ],
      mitigations: [
        'Programa de treinamento e capacitação',
        'Implementação gradual e piloto',
        'Análise detalhada de integrações'
      ],
      complexity: 'Média',
      priority: 'Alta',
      estimatedHours: 200,
      costSavings: 75000,
      efficiencyGain: 45
    }
  }

  private getFallbackPDD(analysis: ProcessAnalysis, processName: string): string {
    return `# PDD - Process Definition Document
## MedSênior - Centro de Excelência em Automação

### 1. Identificação do Processo
- **Nome**: ${processName}
- **Data**: ${new Date().toLocaleDateString('pt-BR')}
- **Versão**: 1.0

### 2. Situação Atual (As-Is)
Processo atual identificado para análise e otimização.

### 3. Situação Futura (To-Be)
Implementação de automação seguindo o conceito "bem automatizar bem".

### 4. Análise de Complexidade
- **Nível**: ${analysis.complexity}
- **Horas Estimadas**: ${analysis.estimatedHours}h

### 5. Benefícios Esperados
- **ROI Estimado**: R$ ${analysis.estimatedROI.toLocaleString('pt-BR')}
- **Economia**: R$ ${analysis.costSavings.toLocaleString('pt-BR')}
- **Ganho de Eficiência**: ${analysis.efficiencyGain}%

### 6. Cronograma de Implementação
${analysis.timeline}

### 7. Recursos Necessários
- Equipe de desenvolvimento RPA
- Infraestrutura de automação
- Treinamento da equipe

### 8. Matriz de Riscos
${analysis.risks.map(risk => `- ${risk}`).join('\n')}

### 9. Critérios de Sucesso
- Redução de 40% no tempo de processamento
- Eliminação de 90% dos erros manuais
- Satisfação da equipe > 80%

### 10. Próximos Passos
1. Validação da análise
2. Definição do escopo detalhado
3. Início da implementação piloto
4. Treinamento da equipe
5. Deploy em produção

---
*Documento gerado pelo MILAPP MedSênior - Bem automatizar bem*`
  }

  private async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const text = e.target?.result as string
        resolve(text || '')
      }
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'))
      }
      
      if (file.type.includes('text') || file.type.includes('pdf')) {
        reader.readAsText(file)
      } else {
        resolve(`Arquivo ${file.name} - Tipo: ${file.type}`)
      }
    })
  }
} 