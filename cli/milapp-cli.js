#!/usr/bin/env node

/**
 * MILAPP MedSênior CLI
 * Ferramenta para geração automática de esteiras Supabase
 * 
 * Uso: node milapp-cli.js create-pipeline --project="Nome do Projeto" --cedente="123" --envs="dev,hml,prod" --profiles="admin,gestor,analista"
 */

const { program } = require('commander')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const ora = require('ora')

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error(chalk.red('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não configurada'))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Templates de configuração
const PIPELINE_TEMPLATES = {
  basic: {
    name: 'Pipeline Básico',
    description: 'Pipeline padrão para projetos simples',
    stages: ['ideacao', 'planejamento', 'desenvolvimento', 'producao'],
    qualityGates: ['G1', 'G2', 'G3', 'G4']
  },
  advanced: {
    name: 'Pipeline Avançado',
    description: 'Pipeline completo com IA e analytics',
    stages: ['ideacao', 'planejamento', 'desenvolvimento', 'testes', 'producao', 'monitoramento'],
    qualityGates: ['G1', 'G2', 'G3', 'G4', 'G5']
  },
  enterprise: {
    name: 'Pipeline Enterprise',
    description: 'Pipeline para projetos críticos com compliance',
    stages: ['ideacao', 'planejamento', 'desenvolvimento', 'testes', 'seguranca', 'producao', 'monitoramento'],
    qualityGates: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']
  }
}

const ROLE_TEMPLATES = {
  admin: {
    name: 'Administrador',
    permissions: ['*'],
    description: 'Acesso total ao projeto'
  },
  gestor: {
    name: 'Gestor de Projeto',
    permissions: ['projects.*', 'tasks.*', 'quality_gates.*', 'analytics.read'],
    description: 'Gerencia projeto e equipe'
  },
  analista: {
    name: 'Analista',
    permissions: ['projects.read', 'projects.update', 'tasks.*', 'quality_gates.read'],
    description: 'Trabalha com tarefas e análise'
  },
  ia: {
    name: 'Especialista IA',
    permissions: ['projects.read', 'analytics.*', 'ai.*'],
    description: 'Acesso a funcionalidades de IA'
  },
  readonly: {
    name: 'Apenas Leitura',
    permissions: ['projects.read', 'tasks.read', 'quality_gates.read'],
    description: 'Visualização apenas'
  }
}

class MilappCLI {
  constructor() {
    this.spinner = null
  }

  async init() {
    console.log(chalk.blue.bold('🚀 MILAPP MedSênior CLI'))
    console.log(chalk.gray('Ferramenta para geração de esteiras Supabase\n'))
  }

  async createPipeline(options) {
    try {
      this.spinner = ora('Criando pipeline...').start()

      // Validar parâmetros
      const projectName = options.project || await this.promptProjectName()
      const cedenteId = options.cedente || await this.promptCedenteId()
      const environments = options.envs ? options.envs.split(',') : await this.promptEnvironments()
      const profiles = options.profiles ? options.profiles.split(',') : await this.promptProfiles()
      const template = options.template || await this.promptTemplate()

      // Criar projeto
      const project = await this.createProject(projectName, cedenteId, template)
      
      // Criar ambientes
      const envs = await this.createEnvironments(project.id, environments)
      
      // Criar pipeline
      const pipeline = await this.createPipelineConfig(project.id, template)
      
      // Criar roles e políticas
      const roles = await this.createRoles(project.id, profiles)
      
      // Gerar configuração
      const config = await this.generateConfig(project, envs, pipeline, roles)
      
      this.spinner.succeed(chalk.green('✅ Pipeline criado com sucesso!'))
      
      // Salvar configuração
      await this.saveConfig(config, projectName)
      
      // Retornar dados
      console.log(chalk.blue('\n📋 Dados do Pipeline:'))
      console.log(JSON.stringify(config, null, 2))
      
      return config
      
    } catch (error) {
      this.spinner?.fail(chalk.red('❌ Erro ao criar pipeline'))
      console.error(chalk.red(error.message))
      throw error
    }
  }

  async createProject(name, cedenteId, template) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        description: `Projeto gerado via CLI - ${template.name}`,
        status: 'ideacao',
        priority: 'media',
        complexity: 5,
        estimated_roi: 30,
        start_date: new Date().toISOString(),
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'cli-system',
        team_size: 3,
        budget: 50000,
        quality_gates_passed: 0,
        total_quality_gates: template.qualityGates.length,
        tags: ['cli-generated', template.name.toLowerCase()],
        ia_context: this.generateIAContext(template),
        metadata: {
          cedente_id: cedenteId,
          template: template.name,
          created_via: 'cli',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar projeto: ${error.message}`)
    return data
  }

  async createEnvironments(projectId, environments) {
    const envs = []
    
    for (const env of environments) {
      const { data, error } = await supabase
        .from('environments')
        .insert({
          project_id: projectId,
          name: env,
          status: env === 'prod' ? 'inactive' : 'active',
          config: this.getEnvironmentConfig(env),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar ambiente ${env}: ${error.message}`)
      envs.push(data)
    }
    
    return envs
  }

  async createPipelineConfig(projectId, template) {
    const { data, error } = await supabase
      .from('pipelines')
      .insert({
        project_id: projectId,
        name: `Pipeline ${template.name}`,
        description: template.description,
        stages: template.stages,
        quality_gates: template.qualityGates,
        config: {
          template: template.name,
          auto_approve: false,
          require_tests: true,
          require_reviews: true,
          max_parallel_deployments: 2
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar pipeline: ${error.message}`)
    return data
  }

  async createRoles(projectId, profiles) {
    const roles = []
    
    for (const profile of profiles) {
      const template = ROLE_TEMPLATES[profile]
      if (!template) continue

      const { data, error } = await supabase
        .from('project_roles')
        .insert({
          project_id: projectId,
          role_name: profile,
          display_name: template.name,
          permissions: template.permissions,
          description: template.description,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw new Error(`Erro ao criar role ${profile}: ${error.message}`)
      roles.push(data)
    }
    
    return roles
  }

  async generateConfig(project, environments, pipeline, roles) {
    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        created_at: project.created_at
      },
      environments: environments.map(env => ({
        id: env.id,
        name: env.name,
        status: env.status,
        config: env.config
      })),
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
        stages: pipeline.stages,
        quality_gates: pipeline.quality_gates
      },
      roles: roles.map(role => ({
        id: role.id,
        name: role.role_name,
        display_name: role.display_name,
        permissions: role.permissions
      })),
      metadata: {
        generated_at: new Date().toISOString(),
        version: '2.0.0',
        cli_version: '1.0.0'
      }
    }
  }

  async saveConfig(config, projectName) {
    const filename = `pipeline-${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`
    const filepath = path.join(process.cwd(), 'configs', filename)
    
    // Criar diretório se não existir
    await fs.mkdir(path.dirname(filepath), { recursive: true })
    
    await fs.writeFile(filepath, JSON.stringify(config, null, 2))
    console.log(chalk.green(`📁 Configuração salva em: ${filepath}`))
  }

  generateIAContext(template) {
    return [
      `Este projeto segue o template "${template.name}"`,
      `Estágios do pipeline: ${template.stages.join(', ')}`,
      `Quality Gates: ${template.qualityGates.join(', ')}`,
      'Respeitar políticas de segurança e compliance MedSênior',
      'Priorizar automação e eficiência operacional',
      'Manter documentação atualizada'
    ]
  }

  getEnvironmentConfig(env) {
    const configs = {
      dev: {
        auto_deploy: true,
        require_approval: false,
        retention_days: 30,
        backup_frequency: 'daily'
      },
      hml: {
        auto_deploy: false,
        require_approval: true,
        retention_days: 90,
        backup_frequency: 'daily'
      },
      prod: {
        auto_deploy: false,
        require_approval: true,
        retention_days: 365,
        backup_frequency: 'hourly',
        monitoring: true
      }
    }
    
    return configs[env] || configs.dev
  }

  // Prompts interativos
  async promptProjectName() {
    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Nome do projeto:',
        validate: input => input.length > 0 ? true : 'Nome é obrigatório'
      }
    ])
    return projectName
  }

  async promptCedenteId() {
    const { cedenteId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'cedenteId',
        message: 'ID do cedente:',
        validate: input => /^\d+$/.test(input) ? true : 'ID deve ser numérico'
      }
    ])
    return cedenteId
  }

  async promptEnvironments() {
    const { environments } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'environments',
        message: 'Selecione os ambientes:',
        choices: [
          { name: 'Desenvolvimento', value: 'dev', checked: true },
          { name: 'Homologação', value: 'hml', checked: true },
          { name: 'Produção', value: 'prod', checked: true }
        ]
      }
    ])
    return environments
  }

  async promptProfiles() {
    const { profiles } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'profiles',
        message: 'Selecione os perfis de acesso:',
        choices: [
          { name: 'Administrador', value: 'admin', checked: true },
          { name: 'Gestor', value: 'gestor', checked: true },
          { name: 'Analista', value: 'analista', checked: true },
          { name: 'Especialista IA', value: 'ia' },
          { name: 'Apenas Leitura', value: 'readonly' }
        ]
      }
    ])
    return profiles
  }

  async promptTemplate() {
    const { template } = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Selecione o template do pipeline:',
        choices: Object.entries(PIPELINE_TEMPLATES).map(([key, value]) => ({
          name: `${value.name} - ${value.description}`,
          value: key
        }))
      }
    ])
    return PIPELINE_TEMPLATES[template]
  }

  async listPipelines() {
    this.spinner = ora('Buscando pipelines...').start()
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          created_at,
          environments (name, status),
          pipelines (name, stages)
        `)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Erro ao buscar pipelines: ${error.message}`)
      
      this.spinner.succeed(chalk.green(`✅ Encontrados ${data.length} pipelines`))
      
      console.log(chalk.blue('\n📋 Pipelines disponíveis:'))
      data.forEach(project => {
        console.log(chalk.white(`\n🔹 ${project.name}`))
        console.log(chalk.gray(`   Status: ${project.status}`))
        console.log(chalk.gray(`   Criado: ${new Date(project.created_at).toLocaleDateString()}`))
        console.log(chalk.gray(`   Ambientes: ${project.environments?.map(e => e.name).join(', ') || 'Nenhum'}`))
        console.log(chalk.gray(`   Pipeline: ${project.pipelines?.[0]?.name || 'Nenhum'}`))
      })
      
      return data
      
    } catch (error) {
      this.spinner?.fail(chalk.red('❌ Erro ao buscar pipelines'))
      console.error(chalk.red(error.message))
      throw error
    }
  }

  async deletePipeline(projectId) {
    this.spinner = ora('Deletando pipeline...').start()
    
    try {
      // Deletar em cascata
      await supabase.from('project_roles').delete().eq('project_id', projectId)
      await supabase.from('pipelines').delete().eq('project_id', projectId)
      await supabase.from('environments').delete().eq('project_id', projectId)
      await supabase.from('projects').delete().eq('id', projectId)
      
      this.spinner.succeed(chalk.green('✅ Pipeline deletado com sucesso!'))
      
    } catch (error) {
      this.spinner?.fail(chalk.red('❌ Erro ao deletar pipeline'))
      console.error(chalk.red(error.message))
      throw error
    }
  }
}

// Configuração do CLI
async function main() {
  const cli = new MilappCLI()
  await cli.init()

  program
    .name('milapp-cli')
    .description('CLI para geração de esteiras Supabase MedSênior')
    .version('1.0.0')

  program
    .command('create-pipeline')
    .description('Criar nova esteira Supabase')
    .option('-p, --project <name>', 'Nome do projeto')
    .option('-c, --cedente <id>', 'ID do cedente')
    .option('-e, --envs <environments>', 'Ambientes (dev,hml,prod)')
    .option('-r, --profiles <profiles>', 'Perfis (admin,gestor,analista)')
    .option('-t, --template <template>', 'Template (basic,advanced,enterprise)')
    .action(async (options) => {
      try {
        await cli.createPipeline(options)
      } catch (error) {
        process.exit(1)
      }
    })

  program
    .command('list-pipelines')
    .description('Listar pipelines existentes')
    .action(async () => {
      try {
        await cli.listPipelines()
      } catch (error) {
        process.exit(1)
      }
    })

  program
    .command('delete-pipeline')
    .description('Deletar pipeline')
    .argument('<projectId>', 'ID do projeto')
    .action(async (projectId) => {
      try {
        await cli.deletePipeline(projectId)
      } catch (error) {
        process.exit(1)
      }
    })

  program.parse()
}

// Executar CLI
if (require.main === module) {
  main().catch(console.error)
}

module.exports = MilappCLI 