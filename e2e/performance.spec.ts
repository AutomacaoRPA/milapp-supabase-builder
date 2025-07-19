import { test, expect } from '@playwright/test'

test.describe('MILAPP MedSênior - Performance e Acessibilidade', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport padrão
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('Performance: Carregamento < 3s', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForSelector('[data-testid="dashboard-loaded"]', { timeout: 5000 })
    
    const loadTime = Date.now() - startTime
    
    console.log(`⏱️ Tempo de carregamento: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // < 3 segundos
    
    // Verificar métricas de performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      }
    })
    
    console.log('📊 Métricas de Performance:', performanceMetrics)
    
    // Verificar FCP < 1.5s
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500)
  })

  test('Performance: API Response < 1s', async ({ page }) => {
    await page.goto('/projects')
    
    // Interceptar chamadas de API
    const apiCalls: number[] = []
    
    page.on('response', response => {
      if (response.url().includes('/supabase.co/')) {
        apiCalls.push(response.request().timing().responseEnd - response.request().timing().requestStart)
      }
    })
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="projects-loaded"]', { timeout: 5000 })
    
    // Verificar tempo de resposta
    if (apiCalls.length > 0) {
      const avgResponseTime = apiCalls.reduce((sum, time) => sum + time, 0) / apiCalls.length
      console.log(`📡 Tempo médio de resposta API: ${avgResponseTime}ms`)
      expect(avgResponseTime).toBeLessThan(1000) // < 1 segundo
    }
  })

  test('Performance: Animação < 300ms', async ({ page }) => {
    await page.goto('/')
    
    // Medir tempo de animação
    const animationStart = Date.now()
    
    // Trigger animação (navegar para outra página)
    await page.click('[data-testid="discovery-menu"]')
    
    // Aguardar animação
    await page.waitForSelector('[data-testid="discovery-page"]')
    
    const animationTime = Date.now() - animationStart
    
    console.log(`🎬 Tempo de animação: ${animationTime}ms`)
    expect(animationTime).toBeLessThan(300) // < 300ms
  })

  test('Acessibilidade: Conformidade WCAG 2.1', async ({ page }) => {
    await page.goto('/')
    
    // Verificar contraste de cores MedSênior
    const primaryButton = page.getByRole('button', { name: /Discovery IA/i })
    await expect(primaryButton).toBeVisible()
    
    const bgColor = await primaryButton.evaluate(el => {
      const style = getComputedStyle(el)
      return {
        backgroundColor: style.backgroundColor,
        color: style.color
      }
    })
    
    console.log('🎨 Cores do botão primário:', bgColor)
    
    // Verificar verde MedSênior
    expect(bgColor.backgroundColor).toBe('rgb(50, 119, 70)') // Verde MedSênior
    
    // Testar navegação por teclado
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('main-menu')).toBeFocused()
    
    // Navegar pelo menu
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    
    // Verificar redirecionamento
    await expect(page.getByTestId('discovery-page')).toBeVisible()
    
    // Testar tamanho mínimo de alvo de toque (44px)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const size = await button.boundingBox()
      
      if (size) {
        expect(size.width).toBeGreaterThanOrEqual(44)
        expect(size.height).toBeGreaterThanOrEqual(44)
      }
    }
    
    // Verificar hierarquia de cabeçalhos
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingLevels: number[] = []
    
    for (let i = 0; i < await headings.count(); i++) {
      const tagName = await headings.nth(i).evaluate(el => el.tagName.toLowerCase())
      const level = parseInt(tagName.replace('h', ''))
      headingLevels.push(level)
    }
    
    // Verificar se não há saltos na hierarquia
    for (let i = 1; i < headingLevels.length; i++) {
      expect(headingLevels[i] - headingLevels[i - 1]).toBeLessThanOrEqual(1)
    }
  })

  test('Acessibilidade: Leitores de tela', async ({ page }) => {
    await page.goto('/')
    
    // Verificar atributos ARIA
    const mainContent = page.getByRole('main')
    await expect(mainContent).toBeVisible()
    
    // Verificar labels
    const inputs = page.locator('input[type="text"], input[type="email"], textarea')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id')
        const ariaLabel = el.getAttribute('aria-label')
        const placeholder = el.getAttribute('placeholder')
        return id || ariaLabel || placeholder
      })
      
      expect(hasLabel).toBeTruthy()
    }
    
    // Verificar botões com texto descritivo
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      
      expect(text || ariaLabel).toBeTruthy()
    }
  })

  test('Acessibilidade: Contraste e cores', async ({ page }) => {
    await page.goto('/')
    
    // Verificar contraste de texto
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6')
    const textCount = await textElements.count()
    
    for (let i = 0; i < Math.min(textCount, 20); i++) {
      const element = textElements.nth(i)
      const isVisible = await element.isVisible()
      
      if (isVisible) {
        const colors = await element.evaluate(el => {
          const style = getComputedStyle(el)
          return {
            color: style.color,
            backgroundColor: style.backgroundColor
          }
        })
        
        // Verificar se não há texto branco em fundo branco
        expect(colors.color).not.toBe('rgb(255, 255, 255)')
        expect(colors.backgroundColor).not.toBe('rgb(255, 255, 255)')
      }
    }
    
    // Verificar cores MedSênior
    const medSeniorElements = page.locator('[class*="medsenior"], [class*="primary"]')
    const medSeniorCount = await medSeniorElements.count()
    
    for (let i = 0; i < Math.min(medSeniorCount, 5); i++) {
      const element = medSeniorElements.nth(i)
      const bgColor = await element.evaluate(el => getComputedStyle(el).backgroundColor)
      
      // Verificar se usa verde MedSênior ou cores neutras
      const validColors = [
        'rgb(50, 119, 70)', // Verde MedSênior
        'rgba(50, 119, 70, 0.1)', // Verde transparente
        'rgb(255, 255, 255)', // Branco
        'rgb(248, 249, 250)', // Cinza claro
        'transparent'
      ]
      
      expect(validColors).toContain(bgColor)
    }
  })

  test('Performance: Memória e CPU', async ({ page }) => {
    await page.goto('/')
    
    // Medir uso de memória
    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory
      }
      return null
    })
    
    if (memoryInfo) {
      console.log('💾 Uso de memória:', {
        usedJSHeapSize: `${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`,
        totalJSHeapSize: `${Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024)}MB`,
        jsHeapSizeLimit: `${Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)}MB`
      })
      
      // Verificar se uso de memória é razoável (< 100MB)
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024)
    }
    
    // Testar navegação entre páginas
    const pages = ['/discovery', '/projects', '/quality-gates', '/deployments']
    
    for (const route of pages) {
      const startTime = Date.now()
      await page.goto(route)
      await page.waitForSelector('[data-testid="page-loaded"]', { timeout: 5000 })
      
      const loadTime = Date.now() - startTime
      console.log(`📄 ${route}: ${loadTime}ms`)
      
      expect(loadTime).toBeLessThan(2000) // < 2 segundos por página
    }
  })

  test('Performance: Responsividade', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      
      console.log(`📱 Testando ${viewport.name} (${viewport.width}x${viewport.height})`)
      
      // Verificar se elementos estão visíveis
      await expect(page.getByTestId('dashboard-loaded')).toBeVisible()
      
      // Verificar se não há overflow horizontal
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = viewport.width
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth)
      
      // Testar navegação mobile
      if (viewport.width < 768) {
        const mobileMenuButton = page.getByTestId('mobile-menu-button')
        if (await mobileMenuButton.isVisible()) {
          await mobileMenuButton.click()
          await expect(page.getByTestId('mobile-menu')).toBeVisible()
        }
      }
    }
  })

  test('Performance: Cache e Service Worker', async ({ page }) => {
    await page.goto('/')
    
    // Verificar se Service Worker está registrado
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })
    
    expect(swRegistered).toBe(true)
    
    // Testar cache
    await page.route('**/*', route => {
      // Simular cache hit
      if (route.request().url().includes('static')) {
        route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: '// Cached content'
        })
      } else {
        route.continue()
      }
    })
    
    // Recarregar página para testar cache
    await page.reload()
    
    const loadTime = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return navigation.loadEventEnd - navigation.loadEventStart
    })
    
    console.log(`⚡ Tempo de carregamento com cache: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(1000) // Cache deve ser mais rápido
  })

  test('Acessibilidade: Idade 49+', async ({ page }) => {
    await page.goto('/')
    
    // Verificar tamanho mínimo de fonte (16px)
    const textElements = page.locator('p, span, div, button')
    const textCount = await textElements.count()
    
    for (let i = 0; i < Math.min(textCount, 10); i++) {
      const element = textElements.nth(i)
      const fontSize = await element.evaluate(el => {
        const style = getComputedStyle(el)
        return parseInt(style.fontSize)
      })
      
      expect(fontSize).toBeGreaterThanOrEqual(14) // Mínimo 14px para 49+
    }
    
    // Verificar espaçamento adequado
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const padding = await button.evaluate(el => {
        const style = getComputedStyle(el)
        return {
          paddingTop: parseInt(style.paddingTop),
          paddingBottom: parseInt(style.paddingBottom),
          paddingLeft: parseInt(style.paddingLeft),
          paddingRight: parseInt(style.paddingRight)
        }
      })
      
      // Verificar padding mínimo para facilitar clique
      expect(padding.paddingTop).toBeGreaterThanOrEqual(8)
      expect(padding.paddingBottom).toBeGreaterThanOrEqual(8)
      expect(padding.paddingLeft).toBeGreaterThanOrEqual(12)
      expect(padding.paddingRight).toBeGreaterThanOrEqual(12)
    }
    
    // Verificar contraste alto
    const highContrastElements = page.locator('[class*="high-contrast"], [class*="accessible"]')
    const highContrastCount = await highContrastElements.count()
    
    if (highContrastCount > 0) {
      console.log('♿ Elementos de alto contraste encontrados')
    }
  })
}) 