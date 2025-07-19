// Service worker registration
export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('SW registered:', registration)
    } catch (error) {
      console.error('SW registration failed:', error)
    }
  }
}

// Performance monitoring
export const performanceMonitor = {
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
        console.log(`${name}: ${measure.duration.toFixed(2)}ms`)
      } catch (error) {
        console.error('Performance measure failed:', error)
      }
    }
  }
}

// Memory usage monitoring
export const memoryMonitor = {
  getMemoryInfo: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      }
    }
    return null
  },
  
  logMemoryUsage: () => {
    const memory = memoryMonitor.getMemoryInfo()
    if (memory) {
      console.log(`Memory: ${memory.used}MB / ${memory.total}MB (${memory.limit}MB limit)`)
    }
  }
} 