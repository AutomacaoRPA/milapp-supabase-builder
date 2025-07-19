import { useState, useCallback } from 'react'
import { ProcessAnalyzerService, ProcessAnalysis, AIRecommendation } from '../../../services/ai/ProcessAnalyzer'

export function useAdvancedAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<ProcessAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pdd, setPdd] = useState<string>('')

  const analyzer = new ProcessAnalyzerService()

  const analyzeProcess = useCallback(async (description: string) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const analysis = await analyzer.analyzeProcess(description)
      setCurrentAnalysis(analysis)
      return analysis
    } catch (err) {
      const errorMessage = 'Erro ao analisar o processo. Tente novamente.'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const generatePDD = useCallback(async (processName: string) => {
    if (!currentAnalysis) {
      throw new Error('Nenhuma análise disponível para gerar PDD')
    }

    try {
      const pddResult = await analyzer.generatePDD(currentAnalysis, processName)
      setPdd(pddResult)
      return pddResult
    } catch (err) {
      const errorMessage = 'Erro ao gerar PDD. Tente novamente.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [currentAnalysis])

  const getRecommendations = useCallback(async (processType: string) => {
    try {
      const recs = await analyzer.getRecommendations(processType)
      const recommendations: AIRecommendation[] = recs.map((rec, index) => ({
        id: `rec-${index}`,
        title: rec,
        description: rec,
        category: 'Automação',
        priority: 'Média',
        estimatedImpact: 70,
        implementationTime: '4-6 semanas',
        tools: ['UiPath', 'Power Automate']
      }))
      
      setRecommendations(recommendations)
      return recommendations
    } catch (err) {
      console.error('Erro ao obter recomendações:', err)
      return []
    }
  }, [])

  const analyzeFiles = useCallback(async (files: File[]) => {
    try {
      const result = await analyzer.analyzeFiles(files)
      return result
    } catch (err) {
      const errorMessage = 'Erro ao analisar arquivos. Tente novamente.'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null)
    setRecommendations([])
    setError(null)
    setPdd('')
  }, [])

  const exportAnalysis = useCallback(() => {
    if (!currentAnalysis) return null

    const exportData = {
      analysis: currentAnalysis,
      pdd: pdd,
      recommendations: recommendations,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analise-processo-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [currentAnalysis, pdd, recommendations])

  return {
    // State
    isAnalyzing,
    currentAnalysis,
    recommendations,
    error,
    pdd,

    // Actions
    analyzeProcess,
    generatePDD,
    getRecommendations,
    analyzeFiles,
    clearAnalysis,
    exportAnalysis
  }
} 