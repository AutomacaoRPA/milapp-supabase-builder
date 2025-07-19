const CACHE_NAME = 'milapp-medsenior-v2.0.0'
const STATIC_CACHE = 'milapp-static-v2.0.0'
const DYNAMIC_CACHE = 'milapp-dynamic-v2.0.0'

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/medsenior-logo.svg',
  '/assets/medsenior-icon-192.png',
  '/assets/medsenior-icon-512.png'
]

const apiCache = [
  '/api/v1/projects',
  '/api/v1/analytics',
  '/api/v1/quality-gates'
]

// Install - bem cachear
self.addEventListener('install', (event) => {
  console.log('🏥 MedSênior Service Worker - Instalando...')
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('🏥 MedSênior cache bem configurado')
          return cache.addAll(urlsToCache)
        }),
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('📦 Cache estático MedSênior configurado')
          return cache.addAll(apiCache)
        })
    ])
  )
  
  self.skipWaiting()
})

// Activate - bem limpar
self.addEventListener('activate', (event) => {
  console.log('🔄 MedSênior Service Worker - Ativando...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Limpando cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  self.clients.claim()
})

// Fetch - bem servir
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Estratégia de cache para diferentes tipos de recursos
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API - Network First com fallback para cache
      event.respondWith(handleApiRequest(request))
    } else if (url.pathname.startsWith('/assets/') || 
               url.pathname.includes('.js') || 
               url.pathname.includes('.css')) {
      // Assets estáticos - Cache First
      event.respondWith(handleStaticRequest(request))
    } else {
      // Páginas - Network First
      event.respondWith(handlePageRequest(request))
    }
  }
})

async function handleApiRequest(request) {
  try {
    // Tenta buscar da rede primeiro
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache a resposta para uso offline
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Fallback para cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('📦 Servindo API do cache:', request.url)
      return cachedResponse
    }
    
    // Resposta offline padrão
    return new Response(
      JSON.stringify({ 
        error: 'Offline - Dados não disponíveis',
        message: 'Bem conectar para acessar dados atualizados',
        company: 'MedSênior'
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    console.log('📦 Servindo asset do cache:', request.url)
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    return new Response('Asset não disponível offline', { status: 404 })
  }
}

async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback para página offline
    return caches.match('/offline.html')
  }
}

// Push notifications - bem notificar
self.addEventListener('push', (event) => {
  console.log('🔔 MedSênior - Recebendo notificação push')
  
  let notificationData = {
    title: 'MILAPP MedSênior',
    body: 'Nova atualização disponível - bem envelhecer bem',
    icon: '/assets/medsenior-icon-192.png',
    badge: '/assets/medsenior-badge.png',
    tag: 'medsenior-notification',
    data: {
      url: '/',
      company: 'MedSênior',
      timestamp: new Date().toISOString()
    }
  }
  
  // Parse dados da notificação se disponíveis
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      notificationData.body = event.data.text()
    }
  }
  
  const options = {
    ...notificationData,
    actions: [
      {
        action: 'open',
        title: 'Abrir MILAPP',
        icon: '/assets/open-icon.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/assets/close-icon.png'
      }
    ],
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  )
})

// Notification click - bem interagir
self.addEventListener('notificationclick', (event) => {
  console.log('👆 MedSênior - Notificação clicada:', event.action)
  
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Verifica se já existe uma janela aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Abre nova janela se não existir
        if (clients.openWindow) {
          const url = event.notification.data?.url || '/'
          return clients.openWindow(url)
        }
      })
    )
  }
  
  if (event.action === 'close') {
    event.notification.close()
  }
})

// Background sync - bem sincronizar
self.addEventListener('sync', (event) => {
  console.log('🔄 MedSênior - Sincronização em background:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  try {
    // Sincroniza dados offline quando conexão retorna
    const cache = await caches.open(DYNAMIC_CACHE)
    const requests = await cache.keys()
    
    for (const request of requests) {
      if (request.url.includes('/api/')) {
        try {
          await fetch(request)
          console.log('✅ Dados sincronizados:', request.url)
        } catch (error) {
          console.log('❌ Erro na sincronização:', request.url)
        }
      }
    }
  } catch (error) {
    console.error('Erro na sincronização em background:', error)
  }
}

// Message handling - bem comunicar
self.addEventListener('message', (event) => {
  console.log('💬 MedSênior - Mensagem recebida:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    event.ports[0].postMessage({ type: 'CACHE_UPDATED' })
  }
}) 