// Error tracking
export const errorTracker = {
  capture: (error: Error, context?: any) => {
    console.error('Error captured:', error, context)
    
    // Send to error tracking service (e.g., Sentry)
    if (import.meta.env.VITE_SENTRY_DSN) {
      // Sentry.captureException(error, { extra: context })
    }
  },
  
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    console.log(`[${level.toUpperCase()}] ${message}`)
    
    if (import.meta.env.VITE_SENTRY_DSN) {
      // Sentry.captureMessage(message, level)
    }
  }
}

// Performance monitoring
export const performanceTracker = {
  mark: (name: string) => {
    if ('performance' in window) {
      performance.mark(name)
    }
  },
  
  measure: (name: string, startMark: string, endMark: string) => {
    if ('performance' in window) {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name)[0]
        
        // Log to analytics
        if (import.meta.env.VITE_ANALYTICS_ENABLED === 'true') {
          // analytics.track('performance', { name, duration: measure.duration })
        }
        
        return measure.duration
      } catch (error) {
        console.error('Performance measure failed:', error)
      }
    }
    return 0
  }
}

// User analytics
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    if (import.meta.env.VITE_ANALYTICS_ENABLED === 'true') {
      console.log('Analytics event:', event, properties)
      // Send to analytics service
    }
  },
  
  pageView: (page: string) => {
    analytics.track('page_view', { page })
  },
  
  userAction: (action: string, module: string) => {
    analytics.track('user_action', { action, module })
  }
}

// Health monitoring
export const healthMonitor = {
  check: async () => {
    try {
      const response = await fetch('/health')
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  },
  
  startPeriodicCheck: (intervalMs: number = 30000) => {
    setInterval(async () => {
      const isHealthy = await healthMonitor.check()
      if (!isHealthy) {
        errorTracker.captureMessage('Health check failed', 'warning')
      }
    }, intervalMs)
  }
} 