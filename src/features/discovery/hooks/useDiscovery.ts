import { useState, useCallback } from 'react'
import { AIService, AnalysisResult, ChatMessage } from '../services/aiService'

export function useDiscovery() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou seu assistente para descobrir oportunidades de automação. Conte-me sobre os processos que você gostaria de automatizar ou envie documentos para análise.',
      timestamp: new Date()
    }
  ])

  const analyzeProcess = useCallback(async (description: string) => {
    setIsAnalyzing(true)
    try {
      const result = await AIService.analyzeProcess(description)
      setAnalysisResult(result)
      return result
    } catch (error) {
      console.error('Erro na análise:', error)
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const processFile = useCallback(async (file: File) => {
    setIsAnalyzing(true)
    try {
      const result = await AIService.processFile(file)
      setAnalysisResult(result)
      return result
    } catch (error) {
      console.error('Erro no processamento de arquivo:', error)
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const sendChatMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])

    try {
      const response = await AIService.chatCompletion([...chatMessages, userMessage])
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro no chat:', error)
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Desculpe, estou enfrentando dificuldades técnicas. Tente novamente em alguns instantes.',
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, errorMessage])
    }
  }, [chatMessages])

  const generateRequirements = useCallback(async () => {
    if (!analysisResult) return []

    try {
      const requirements = await AIService.generateRequirements(analysisResult)
      return requirements
    } catch (error) {
      console.error('Erro na geração de requisitos:', error)
      return []
    }
  }, [analysisResult])

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null)
  }, [])

  const clearChat = useCallback(() => {
    setChatMessages([
      {
        role: 'assistant',
        content: 'Olá! Sou seu assistente para descobrir oportunidades de automação. Conte-me sobre os processos que você gostaria de automatizar ou envie documentos para análise.',
        timestamp: new Date()
      }
    ])
  }, [])

  return {
    isAnalyzing,
    analysisResult,
    chatMessages,
    analyzeProcess,
    processFile,
    sendChatMessage,
    generateRequirements,
    clearAnalysis,
    clearChat
  }
} 