import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: 'never'
    }],
    ['json', { 
      outputFile: 'test-results/results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/results.xml' 
    }],
    ['list'],
    ['github']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Configurações MedSênior
    viewport: { width: 1280, height: 720 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Headers MedSênior
    extraHTTPHeaders: {
      'X-MedSenior-App': 'MILAPP',
      'X-MedSenior-Version': '2.0.0'
    }
  },

  projects: [
    // Desktop Chrome - Principal
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Configurações específicas MedSênior
        colorScheme: 'light',
        permissions: ['notifications', 'geolocation']
      },
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        colorScheme: 'light'
      },
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        colorScheme: 'light'
      },
    },

    // Mobile - iPhone
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Configurações mobile MedSênior
        hasTouch: true,
        isMobile: true
      },
    },

    // Mobile - Android
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true
      },
    },

    // Tablet
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro 11 landscape'],
        hasTouch: true
      },
    },

    // Acessibilidade - Alto contraste
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        // Simular usuário 49+
        viewport: { width: 1920, height: 1080 },
        locale: 'pt-BR'
      },
    }
  ],

  // Configurações de servidor
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe'
  },

  // Configurações de output
  outputDir: 'test-results/',
  
  // Configurações de timeout
  timeout: 30000,
  expect: {
    timeout: 10000
  },

  // Configurações de retry
  retries: 2,

  // Configurações de paralelismo
  workers: process.env.CI ? 2 : undefined,

  // Configurações de report
  reporter: [
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: 'never'
    }],
    ['json', { 
      outputFile: 'test-results/results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/results.xml' 
    }],
    ['list'],
    ['github']
  ],

  // Configurações globais
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  // Configurações de ambiente
  env: {
    MEDSENIOR_ENV: 'test',
    MEDSENIOR_APP: 'MILAPP',
    MEDSENIOR_VERSION: '2.0.0'
  },

  // Configurações de proxy (se necessário)
  // proxy: {
  //   server: 'http://proxy.company.com:3128',
  //   username: 'user',
  //   password: 'pass'
  // },

  // Configurações de screenshot
  screenshot: 'only-on-failure',

  // Configurações de video
  video: 'retain-on-failure',

  // Configurações de trace
  trace: 'on-first-retry',

  // Configurações de expect
  expect: {
    timeout: 10000,
    toMatchSnapshot: {
      maxDiffPixels: 10
    }
  },

  // Configurações de use
  use: {
    // Configurações base
    baseURL: 'http://localhost:3000',
    
    // Configurações de viewport
    viewport: { width: 1280, height: 720 },
    
    // Configurações de locale
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    
    // Configurações de cores
    colorScheme: 'light',
    
    // Configurações de permissões
    permissions: ['notifications', 'geolocation'],
    
    // Configurações de geolocalização
    geolocation: { longitude: -46.6388, latitude: -23.5489 }, // São Paulo
    
    // Configurações de user agent
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MILAPP-MedSenior/2.0.0',
    
    // Configurações de headers
    extraHTTPHeaders: {
      'X-MedSenior-App': 'MILAPP',
      'X-MedSenior-Version': '2.0.0',
      'X-MedSenior-Environment': 'test',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
    },
    
    // Configurações de screenshot
    screenshot: 'only-on-failure',
    
    // Configurações de video
    video: 'retain-on-failure',
    
    // Configurações de trace
    trace: 'on-first-retry',
    
    // Configurações de action timeout
    actionTimeout: 10000,
    
    // Configurações de navigation timeout
    navigationTimeout: 30000,
    
    // Configurações de expect timeout
    expect: {
      timeout: 10000
    }
  },

  // Configurações de projetos específicos
  projects: [
    // Testes críticos - Desktop
    {
      name: 'critical-desktop',
      testMatch: /.*critical.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Testes de performance
    {
      name: 'performance',
      testMatch: /.*performance.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    // Testes de acessibilidade
    {
      name: 'accessibility',
      testMatch: /.*accessibility.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Testes mobile
    {
      name: 'mobile',
      testMatch: /.*mobile.*\.spec\.ts/,
      use: { 
        ...devices['iPhone 12'],
        hasTouch: true,
        isMobile: true
      },
    },

    // Testes de integração
    {
      name: 'integration',
      testMatch: /.*integration.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    }
  ]
}) 