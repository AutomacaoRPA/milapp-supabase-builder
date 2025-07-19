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

export interface AIRecommendation {
  id: string
  title: string
  description: string
  category: 'Automação' | 'Otimização' | 'Integração' | 'Monitoramento'
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica'
  estimatedImpact: number
  implementationTime: string
  tools: string[]
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  attachments?: File[]
  analysis?: ProcessAnalysis
}

export interface FileAnalysis {
  fileName: string
  fileType: string
  content: string
  insights: string[]
  recommendations: string[]
}

export interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: string
  complexity: 'Baixa' | 'Média' | 'Alta'
  estimatedROI: number
  tools: string[]
  steps: string[]
  prerequisites: string[]
}

export interface AIAnalysisResult {
  success: boolean
  data?: ProcessAnalysis
  error?: string
  recommendations?: AIRecommendation[]
  templates?: AutomationTemplate[]
} 