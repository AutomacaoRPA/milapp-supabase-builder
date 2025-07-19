import OpenAI from 'openai'

// Configuração do OpenAI (em produção, usar variáveis de ambiente)
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || 'your-api-key-here',
  dangerouslyAllowBrowser: true
})

export interface AnalysisResult {
  opportunities: string[]
  recommendations: string[]
  estimatedROI: number
  complexity: 'low' | 'medium' | 'high'
  timeline: string
  tools: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export class AIService {
  static async analyzeProcess(description: string): Promise<AnalysisResult> {
    try {
      const prompt = `
        Analise o seguinte processo e identifique oportunidades de automação:
        
        Processo: ${description}
        
        Forneça uma análise estruturada incluindo:
        1. Oportunidades de automação identificadas
        2. Recomendações específicas
        3. ROI estimado
        4. Complexidade (baixa, média, alta)
        5. Timeline estimado
        6. Ferramentas RPA recomendadas
        
        Responda em formato JSON.
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        opportunities: result.opportunities || [],
        recommendations: result.recommendations || [],
        estimatedROI: result.estimatedROI || 0,
        complexity: result.complexity || 'medium',
        timeline: result.timeline || '4-6 semanas',
        tools: result.tools || []
      }
    } catch (error) {
      console.error('Erro na análise IA:', error)
      
      // Fallback para demonstração
      return {
        opportunities: [
          'Automação de entrada de dados',
          'Validação automática de documentos',
          'Geração de relatórios'
        ],
        recommendations: [
          'Implementar OCR para processamento de documentos',
          'Criar workflows automatizados',
          'Integrar com sistemas existentes'
        ],
        estimatedROI: 250,
        complexity: 'medium',
        timeline: '4-6 semanas',
        tools: ['UiPath', 'Power Automate', 'Blue Prism']
      }
    }
  }

  static async processFile(file: File): Promise<AnalysisResult> {
    try {
      // Simular processamento de arquivo
      const fileContent = await this.readFileContent(file)
      
      return await this.analyzeProcess(fileContent)
    } catch (error) {
      console.error('Erro no processamento de arquivo:', error)
      throw error
    }
  }

  static async chatCompletion(messages: ChatMessage[]): Promise<string> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em automação RPA da MedSênior. Ajude a identificar oportunidades de automação e forneça recomendações práticas.'
          },
          ...formattedMessages
        ],
        temperature: 0.7,
        max_tokens: 500
      })

      return response.choices[0].message.content || 'Desculpe, não consegui processar sua mensagem.'
    } catch (error) {
      console.error('Erro no chat:', error)
      return 'Desculpe, estou enfrentando dificuldades técnicas. Tente novamente em alguns instantes.'
    }
  }

  private static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }
      
      reader.onerror = reject
      
      if (file.type.startsWith('text/')) {
        reader.readAsText(file)
      } else {
        // Para outros tipos de arquivo, retornar nome e tipo
        resolve(`Arquivo: ${file.name} (${file.type})`)
      }
    })
  }

  static async generateRequirements(analysis: AnalysisResult): Promise<string[]> {
    try {
      const prompt = `
        Com base na seguinte análise de automação, gere requisitos técnicos detalhados:
        
        Oportunidades: ${analysis.opportunities.join(', ')}
        Recomendações: ${analysis.recommendations.join(', ')}
        Complexidade: ${analysis.complexity}
        Ferramentas: ${analysis.tools.join(', ')}
        
        Gere uma lista de requisitos técnicos específicos para implementação.
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 800
      })

      const content = response.choices[0].message.content || ''
      return content.split('\n').filter(line => line.trim().length > 0)
    } catch (error) {
      console.error('Erro na geração de requisitos:', error)
      
      // Fallback
      return [
        'Implementar sistema de OCR para processamento de documentos',
        'Criar workflows automatizados com validação de dados',
        'Desenvolver integração com sistemas legados',
        'Implementar monitoramento e logging de processos',
        'Criar interface de usuário para configuração de regras'
      ]
    }
  }
} 