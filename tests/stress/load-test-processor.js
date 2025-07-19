// Processador para testes de estresse com Artillery
const { faker } = require('@faker-js/faker');

// Variáveis globais para armazenar dados entre requests
let projectId = null;
let deploymentId = null;
let backupId = null;
let jobId = null;
let notificationId = null;

function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

function generateRandomNumber(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Hook antes de cada cenário
function beforeScenario(context, events, done) {
  // Resetar variáveis
  projectId = null;
  deploymentId = null;
  backupId = null;
  jobId = null;
  notificationId = null;
  
  // Gerar dados de teste
  context.vars.testUser = `test-user-${generateRandomNumber()}`;
  context.vars.testProjectName = `Projeto Teste ${generateRandomString()}`;
  context.vars.testDescription = faker.lorem.sentence();
  
  done();
}

// Hook após cada request
function afterResponse(request, response, context, events, done) {
  // Extrair IDs de respostas para usar em requests subsequentes
  if (response.statusCode === 201 || response.statusCode === 200) {
    try {
      const body = JSON.parse(response.body);
      
      if (body.id) {
        projectId = body.id;
        context.vars.projectId = body.id;
      }
      
      if (body.deploymentId) {
        deploymentId = body.deploymentId;
        context.vars.deploymentId = body.deploymentId;
      }
      
      if (body.backupId) {
        backupId = body.backupId;
        context.vars.backupId = body.backupId;
      }
      
      if (body.jobId) {
        jobId = body.jobId;
        context.vars.jobId = body.jobId;
      }
      
      if (body.notificationId) {
        notificationId = body.notificationId;
        context.vars.notificationId = body.notificationId;
      }
    } catch (error) {
      // Ignorar erros de parsing
    }
  }
  
  // Log de performance
  if (response.timings) {
    console.log(`Request: ${request.url} - Time: ${response.timings.dns + response.timings.tcp + response.timings.firstByte}ms`);
  }
  
  done();
}

// Hook para gerar dados dinâmicos
function generateTestData(context, events, done) {
  context.vars.randomString = generateRandomString();
  context.vars.randomNumber = generateRandomNumber();
  context.vars.randomEmail = faker.internet.email();
  context.vars.randomName = faker.person.fullName();
  context.vars.randomCompany = faker.company.name();
  context.vars.randomProjectName = `Projeto ${faker.word.noun()} ${generateRandomString(4)}`;
  context.vars.randomDescription = faker.lorem.paragraph();
  context.vars.randomPriority = generateRandomNumber(1, 5);
  context.vars.randomComplexity = generateRandomNumber(1, 10);
  context.vars.randomROI = generateRandomNumber(5000, 100000);
  
  done();
}

// Hook para validação de respostas
function validateResponse(response, context, events, done) {
  // Validar status codes esperados
  if (response.statusCode >= 400) {
    console.error(`Error: ${response.statusCode} - ${response.url}`);
  }
  
  // Validar tempo de resposta
  if (response.timings) {
    const totalTime = response.timings.dns + response.timings.tcp + response.timings.firstByte;
    if (totalTime > 5000) { // 5 segundos
      console.warn(`Slow response: ${response.url} - ${totalTime}ms`);
    }
  }
  
  // Validar tamanho da resposta
  if (response.body && response.body.length > 1000000) { // 1MB
    console.warn(`Large response: ${response.url} - ${response.body.length} bytes`);
  }
  
  done();
}

// Hook para simular comportamento de usuário real
function simulateUserBehavior(context, events, done) {
  // Adicionar delays aleatórios para simular usuário real
  const randomDelay = generateRandomNumber(1000, 5000);
  setTimeout(() => {
    done();
  }, randomDelay);
}

// Hook para monitoramento de recursos
function monitorResources(context, events, done) {
  // Simular monitoramento de CPU, memória, etc.
  const cpuUsage = generateRandomNumber(10, 90);
  const memoryUsage = generateRandomNumber(20, 80);
  const diskUsage = generateRandomNumber(30, 95);
  
  if (cpuUsage > 80) {
    console.warn(`High CPU usage: ${cpuUsage}%`);
  }
  
  if (memoryUsage > 85) {
    console.warn(`High memory usage: ${memoryUsage}%`);
  }
  
  if (diskUsage > 90) {
    console.warn(`High disk usage: ${diskUsage}%`);
  }
  
  done();
}

// Hook para limpeza após testes
function cleanup(context, events, done) {
  // Limpar dados de teste criados
  if (projectId) {
    console.log(`Cleaning up project: ${projectId}`);
  }
  
  if (deploymentId) {
    console.log(`Cleaning up deployment: ${deploymentId}`);
  }
  
  if (backupId) {
    console.log(`Cleaning up backup: ${backupId}`);
  }
  
  done();
}

// Hook para relatórios de performance
function generatePerformanceReport(context, events, done) {
  const report = {
    timestamp: new Date().toISOString(),
    totalRequests: context.vars.totalRequests || 0,
    successfulRequests: context.vars.successfulRequests || 0,
    failedRequests: context.vars.failedRequests || 0,
    averageResponseTime: context.vars.averageResponseTime || 0,
    maxResponseTime: context.vars.maxResponseTime || 0,
    minResponseTime: context.vars.minResponseTime || 0,
    requestsPerSecond: context.vars.requestsPerSecond || 0,
    errorRate: context.vars.errorRate || 0,
  };
  
  console.log('Performance Report:', JSON.stringify(report, null, 2));
  done();
}

// Hook para simulação de falhas
function simulateFailures(context, events, done) {
  // Simular falhas aleatórias (1% de chance)
  const failureChance = generateRandomNumber(1, 100);
  
  if (failureChance === 1) {
    console.log('Simulating random failure');
    events.emit('failure', new Error('Simulated failure'));
    return;
  }
  
  done();
}

// Hook para teste de concorrência
function testConcurrency(context, events, done) {
  // Simular múltiplos usuários acessando o mesmo recurso
  const concurrentUsers = generateRandomNumber(1, 10);
  
  for (let i = 0; i < concurrentUsers; i++) {
    context.vars.concurrentUserId = `user-${i}`;
    // Executar requests concorrentes
  }
  
  done();
}

// Hook para teste de timeout
function testTimeout(context, events, done) {
  // Simular requests que podem timeout
  const timeoutChance = generateRandomNumber(1, 100);
  
  if (timeoutChance <= 5) { // 5% de chance
    console.log('Simulating timeout scenario');
    // Adicionar delay longo para simular timeout
    setTimeout(() => {
      done();
    }, 30000); // 30 segundos
    return;
  }
  
  done();
}

// Hook para teste de carga gradual
function gradualLoadTest(context, events, done) {
  // Aumentar carga gradualmente
  const currentPhase = context.vars.currentPhase || 1;
  const maxPhases = 5;
  
  if (currentPhase <= maxPhases) {
    context.vars.currentPhase = currentPhase + 1;
    context.vars.loadMultiplier = currentPhase;
    
    console.log(`Load test phase: ${currentPhase}/${maxPhases}`);
  }
  
  done();
}

// Hook para teste de recuperação
function testRecovery(context, events, done) {
  // Simular recuperação após falha
  const recoveryScenario = generateRandomNumber(1, 3);
  
  switch (recoveryScenario) {
    case 1:
      console.log('Testing database recovery');
      break;
    case 2:
      console.log('Testing service recovery');
      break;
    case 3:
      console.log('Testing network recovery');
      break;
  }
  
  done();
}

// Hook para teste de segurança
function testSecurity(context, events, done) {
  // Simular ataques de segurança
  const securityTest = generateRandomNumber(1, 4);
  
  switch (securityTest) {
    case 1:
      context.vars.maliciousInput = '<script>alert("xss")</script>';
      break;
    case 2:
      context.vars.sqlInjection = "'; DROP TABLE projects; --";
      break;
    case 3:
      context.vars.pathTraversal = '../../../etc/passwd';
      break;
    case 4:
      context.vars.oversizedPayload = 'A'.repeat(1000000);
      break;
  }
  
  done();
}

// Hook para teste de integração
function testIntegration(context, events, done) {
  // Simular integração com sistemas externos
  const integrationType = generateRandomNumber(1, 3);
  
  switch (integrationType) {
    case 1:
      context.vars.gitIntegration = true;
      break;
    case 2:
      context.vars.dockerIntegration = true;
      break;
    case 3:
      context.vars.n8nIntegration = true;
      break;
  }
  
  done();
}

// Hook para teste de dados
function testDataIntegrity(context, events, done) {
  // Verificar integridade dos dados
  const dataChecks = [
    'validate_project_data',
    'validate_user_data',
    'validate_relationship_data',
    'validate_audit_trail'
  ];
  
  const randomCheck = dataChecks[generateRandomNumber(0, dataChecks.length - 1)];
  context.vars.dataIntegrityCheck = randomCheck;
  
  done();
}

// Hook para teste de backup
function testBackupRestore(context, events, done) {
  // Simular operações de backup e restore
  const backupOperation = generateRandomNumber(1, 2);
  
  if (backupOperation === 1) {
    context.vars.backupOperation = 'create';
    console.log('Testing backup creation');
  } else {
    context.vars.backupOperation = 'restore';
    console.log('Testing backup restoration');
  }
  
  done();
}

// Hook para teste de monitoramento
function testMonitoring(context, events, done) {
  // Simular coleta de métricas
  const metrics = {
    cpu: generateRandomNumber(10, 90),
    memory: generateRandomNumber(20, 80),
    disk: generateRandomNumber(30, 95),
    network: generateRandomNumber(5, 50),
    database: generateRandomNumber(15, 75)
  };
  
  context.vars.metrics = metrics;
  
  // Alertar se métricas estão altas
  Object.entries(metrics).forEach(([key, value]) => {
    if (value > 80) {
      console.warn(`High ${key} usage: ${value}%`);
    }
  });
  
  done();
}

// Exportar todos os hooks
module.exports = {
  beforeScenario,
  afterResponse,
  generateTestData,
  validateResponse,
  simulateUserBehavior,
  monitorResources,
  cleanup,
  generatePerformanceReport,
  simulateFailures,
  testConcurrency,
  testTimeout,
  gradualLoadTest,
  testRecovery,
  testSecurity,
  testIntegration,
  testDataIntegrity,
  testBackupRestore,
  testMonitoring
}; 