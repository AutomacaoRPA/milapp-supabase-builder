import { useState, useEffect, useCallback } from 'react'
import { MedSeniorNotificationService } from '../services/notifications/NotificationService'

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isInitialized, setIsInitialized] = useState(false)
  const [notificationService] = useState(() => MedSeniorNotificationService.getInstance())

  useEffect(() => {
    initializeNotifications()
  }, [])

  const initializeNotifications = async () => {
    try {
      setIsSupported(notificationService.isSupported())
      
      if (notificationService.isSupported()) {
        await notificationService.initialize()
        setPermission(await notificationService.getNotificationPermission())
        setIsInitialized(true)
        console.log('🔔 Notificações MedSênior inicializadas')
      }
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error)
    }
  }

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestNotificationPermission()
      setPermission(await notificationService.getNotificationPermission())
      return granted
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }, [notificationService])

  const showNotification = useCallback(async (
    title: string, 
    options?: NotificationOptions & { medseniorData?: any }
  ) => {
    if (!isInitialized) {
      console.warn('Notificações não inicializadas')
      return
    }

    await notificationService.showNotification(title, options || {})
  }, [notificationService, isInitialized])

  const notifyQualityGateApproval = useCallback(async (
    projectName: string, 
    gate: string
  ) => {
    await notificationService.notifyQualityGateApproval(projectName, gate)
  }, [notificationService])

  const notifyQualityGateRejection = useCallback(async (
    projectName: string, 
    gate: string, 
    reason: string
  ) => {
    await notificationService.notifyQualityGateRejection(projectName, gate, reason)
  }, [notificationService])

  const notifyAutomationDeployed = useCallback(async (
    automationName: string, 
    environment: string
  ) => {
    await notificationService.notifyAutomationDeployed(automationName, environment)
  }, [notificationService])

  const notifyROIUpdate = useCallback(async (
    newROI: number, 
    previousROI: number
  ) => {
    await notificationService.notifyROIUpdate(newROI, previousROI)
  }, [notificationService])

  const notifyProjectCreated = useCallback(async (
    projectName: string, 
    creator: string
  ) => {
    await notificationService.notifyProjectCreated(projectName, creator)
  }, [notificationService])

  const notifyAutomationCompleted = useCallback(async (
    automationName: string, 
    duration: string
  ) => {
    await notificationService.notifyAutomationCompleted(automationName, duration)
  }, [notificationService])

  const notifySystemMaintenance = useCallback(async (
    scheduledTime: string
  ) => {
    await notificationService.notifySystemMaintenance(scheduledTime)
  }, [notificationService])

  const notifyDiscoveryCompleted = useCallback(async (
    processName: string, 
    insights: number
  ) => {
    await notificationService.notifyDiscoveryCompleted(processName, insights)
  }, [notificationService])

  const notifyError = useCallback(async (
    error: string, 
    context: string
  ) => {
    await notificationService.notifyError(error, context)
  }, [notificationService])

  const clearNotifications = useCallback(async (tag?: string) => {
    await notificationService.clearNotifications(tag)
  }, [notificationService])

  return {
    // Estado
    isSupported,
    permission,
    isInitialized,
    
    // Métodos
    requestPermission,
    showNotification,
    notifyQualityGateApproval,
    notifyQualityGateRejection,
    notifyAutomationDeployed,
    notifyROIUpdate,
    notifyProjectCreated,
    notifyAutomationCompleted,
    notifySystemMaintenance,
    notifyDiscoveryCompleted,
    notifyError,
    clearNotifications
  }
} 