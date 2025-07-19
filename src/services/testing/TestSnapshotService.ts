import { createClient } from '@supabase/supabase-js'

interface TestSnapshot {
  id: string
  original_project_id: string
  snapshot_project_id: string
  name: string
  description: string
  status: 'creating' | 'ready' | 'expired' | 'deleted'
  expires_at: string
  created_at: string
  metadata: {
    tables: string[]
    record_counts: Record<string, number>
    original_name: string
    created_by: string
  }
}

interface SnapshotOptions {
  includeData?: boolean
  includePolicies?: boolean
  includeRoles?: boolean
  ttlHours?: number
  description?: string
}

export class TestSnapshotService {
  private supabase: any
  private static instance: TestSnapshotService

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  static getInstance(): TestSnapshotService {
    if (!TestSnapshotService.instance) {
      TestSnapshotService.instance = new TestSnapshotService()
    }
    return TestSnapshotService.instance
  }

  /**
   * Cria um snapshot de um projeto para testes isolados
   */
  async createTestSnapshot(
    projectId: string,
    options: SnapshotOptions = {}
  ): Promise<TestSnapshot> {
    const {
      includeData = true,
      includePolicies = true,
      includeRoles = true,
      ttlHours = 1,
      description = 'Snapshot para testes'
    } = options

    try {
      // 1. Obter dados do projeto original
      const { data: originalProject, error: projectError } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw new Error(`Erro ao obter projeto: ${projectError.message}`)

      // 2. Criar projeto snapshot
      const snapshotProjectId = await this.createSnapshotProject(originalProject, description)

      // 3. Registrar snapshot
      const snapshot: Omit<TestSnapshot, 'id' | 'created_at'> = {
        original_project_id: projectId,
        snapshot_project_id: snapshotProjectId,
        name: `test_${originalProject.name}_${Date.now()}`,
        description,
        status: 'creating',
        expires_at: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
        metadata: {
          tables: [],
          record_counts: {},
          original_name: originalProject.name,
          created_by: 'test-system'
        }
      }

      const { data: createdSnapshot, error: snapshotError } = await this.supabase
        .from('test_snapshots')
        .insert(snapshot)
        .select()
        .single()

      if (snapshotError) throw new Error(`Erro ao criar snapshot: ${snapshotError.message}`)

      // 4. Copiar dados (assíncrono)
      this.copyProjectData(projectId, snapshotProjectId, createdSnapshot.id, {
        includeData,
        includePolicies,
        includeRoles
      })

      return createdSnapshot

    } catch (error) {
      console.error('❌ Erro ao criar snapshot:', error)
      throw error
    }
  }

  /**
   * Cria projeto snapshot com dados modificados
   */
  private async createSnapshotProject(originalProject: any, description: string): Promise<string> {
    const snapshotProject = {
      ...originalProject,
      id: undefined, // Deixar Supabase gerar novo ID
      name: `[TEST] ${originalProject.name}`,
      description: `${originalProject.description}\n\n${description}`,
      status: 'ideacao',
      tags: [...(originalProject.tags || []), 'test-snapshot'],
      metadata: {
        ...originalProject.metadata,
        is_test_snapshot: true,
        original_project_id: originalProject.id,
        created_at: new Date().toISOString()
      }
    }

    const { data, error } = await this.supabase
      .from('projects')
      .insert(snapshotProject)
      .select('id')
      .single()

    if (error) throw new Error(`Erro ao criar projeto snapshot: ${error.message}`)
    return data.id
  }

  /**
   * Copia dados do projeto original para o snapshot
   */
  private async copyProjectData(
    originalProjectId: string,
    snapshotProjectId: string,
    snapshotId: string,
    options: {
      includeData: boolean
      includePolicies: boolean
      includeRoles: boolean
    }
  ) {
    try {
      const tablesToCopy = [
        'tasks',
        'quality_gates',
        'project_roles',
        'project_policies',
        'environments',
        'pipelines',
        'ai_contexts',
        'memory_vectors',
        'ai_conversations'
      ]

      const recordCounts: Record<string, number> = {}

      for (const table of tablesToCopy) {
        if (!this.shouldCopyTable(table, options)) continue

        const { data: records, error } = await this.supabase
          .from(table)
          .select('*')
          .eq('project_id', originalProjectId)

        if (error) {
          console.warn(`⚠️ Erro ao copiar ${table}:`, error.message)
          continue
        }

        if (records && records.length > 0) {
          const copiedRecords = records.map(record => ({
            ...record,
            id: undefined, // Deixar Supabase gerar novos IDs
            project_id: snapshotProjectId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))

          const { error: insertError } = await this.supabase
            .from(table)
            .insert(copiedRecords)

          if (insertError) {
            console.warn(`⚠️ Erro ao inserir ${table}:`, insertError.message)
          } else {
            recordCounts[table] = copiedRecords.length
          }
        }
      }

      // Atualizar metadata do snapshot
      await this.supabase
        .from('test_snapshots')
        .update({
          status: 'ready',
          metadata: {
            tables: Object.keys(recordCounts),
            record_counts: recordCounts,
            original_name: 'Original Project',
            created_by: 'test-system'
          }
        })
        .eq('id', snapshotId)

    } catch (error) {
      console.error('❌ Erro ao copiar dados:', error)
      
      // Marcar snapshot como falha
      await this.supabase
        .from('test_snapshots')
        .update({ status: 'failed' })
        .eq('id', snapshotId)
    }
  }

  /**
   * Verifica se deve copiar uma tabela baseado nas opções
   */
  private shouldCopyTable(table: string, options: {
    includeData: boolean
    includePolicies: boolean
    includeRoles: boolean
  }): boolean {
    const dataTables = ['tasks', 'quality_gates', 'environments', 'pipelines']
    const policyTables = ['project_policies']
    const roleTables = ['project_roles']

    if (dataTables.includes(table)) return options.includeData
    if (policyTables.includes(table)) return options.includePolicies
    if (roleTables.includes(table)) return options.includeRoles

    return true // Tabelas de IA sempre copiadas
  }

  /**
   * Lista snapshots disponíveis
   */
  async listSnapshots(): Promise<TestSnapshot[]> {
    try {
      const { data, error } = await this.supabase
        .from('test_snapshots')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Erro ao listar snapshots: ${error.message}`)
      return data || []
    } catch (error) {
      console.error('❌ Erro ao listar snapshots:', error)
      throw error
    }
  }

  /**
   * Obtém detalhes de um snapshot
   */
  async getSnapshot(snapshotId: string): Promise<TestSnapshot | null> {
    try {
      const { data, error } = await this.supabase
        .from('test_snapshots')
        .select('*')
        .eq('id', snapshotId)
        .single()

      if (error) throw new Error(`Erro ao obter snapshot: ${error.message}`)
      return data
    } catch (error) {
      console.error('❌ Erro ao obter snapshot:', error)
      throw error
    }
  }

  /**
   * Deleta um snapshot e seus dados
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      // 1. Obter snapshot
      const snapshot = await this.getSnapshot(snapshotId)
      if (!snapshot) throw new Error('Snapshot não encontrado')

      // 2. Deletar projeto snapshot
      const { error: projectError } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', snapshot.snapshot_project_id)

      if (projectError) {
        console.warn('⚠️ Erro ao deletar projeto snapshot:', projectError.message)
      }

      // 3. Marcar snapshot como deletado
      await this.supabase
        .from('test_snapshots')
        .update({ status: 'deleted' })
        .eq('id', snapshotId)

    } catch (error) {
      console.error('❌ Erro ao deletar snapshot:', error)
      throw error
    }
  }

  /**
   * Limpa snapshots expirados
   */
  async cleanupExpiredSnapshots(): Promise<number> {
    try {
      const { data: expiredSnapshots, error } = await this.supabase
        .from('test_snapshots')
        .select('id')
        .lt('expires_at', new Date().toISOString())
        .neq('status', 'deleted')

      if (error) throw new Error(`Erro ao buscar snapshots expirados: ${error.message}`)

      let deletedCount = 0
      for (const snapshot of expiredSnapshots || []) {
        try {
          await this.deleteSnapshot(snapshot.id)
          deletedCount++
        } catch (deleteError) {
          console.warn(`⚠️ Erro ao deletar snapshot ${snapshot.id}:`, deleteError)
        }
      }

      return deletedCount
    } catch (error) {
      console.error('❌ Erro ao limpar snapshots expirados:', error)
      throw error
    }
  }

  /**
   * Executa testes em um snapshot
   */
  async runTestsInSnapshot(snapshotId: string, testScript: string): Promise<any> {
    try {
      const snapshot = await this.getSnapshot(snapshotId)
      if (!snapshot) throw new Error('Snapshot não encontrado')
      if (snapshot.status !== 'ready') throw new Error('Snapshot não está pronto')

      // Configurar ambiente de teste
      const testConfig = {
        projectId: snapshot.snapshot_project_id,
        originalProjectId: snapshot.original_project_id,
        snapshotId: snapshot.id,
        testScript
      }

      // Executar testes (simulado)
      const testResults = await this.executeTestScript(testConfig)

      // Registrar resultados
      await this.supabase
        .from('test_results')
        .insert({
          snapshot_id: snapshotId,
          test_script: testScript,
          results: testResults,
          status: testResults.success ? 'passed' : 'failed',
          created_at: new Date().toISOString()
        })

      return testResults

    } catch (error) {
      console.error('❌ Erro ao executar testes:', error)
      throw error
    }
  }

  /**
   * Executa script de teste (simulado)
   */
  private async executeTestScript(config: any): Promise<any> {
    // Simular execução de testes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.2, // 80% de sucesso
          tests: [
            { name: 'Teste de criação de projeto', status: 'passed' },
            { name: 'Teste de permissões', status: 'passed' },
            { name: 'Teste de qualidade', status: Math.random() > 0.5 ? 'passed' : 'failed' }
          ],
          duration: Math.random() * 5000 + 1000,
          timestamp: new Date().toISOString()
        })
      }, 1000)
    })
  }

  /**
   * Compara resultados entre snapshot e projeto original
   */
  async compareWithOriginal(snapshotId: string): Promise<any> {
    try {
      const snapshot = await this.getSnapshot(snapshotId)
      if (!snapshot) throw new Error('Snapshot não encontrado')

      const comparison = {
        snapshot_id: snapshotId,
        original_project_id: snapshot.original_project_id,
        snapshot_project_id: snapshot.snapshot_project_id,
        differences: {},
        summary: {
          total_differences: 0,
          tables_compared: 0,
          records_compared: 0
        }
      }

      // Comparar tabelas principais
      const tablesToCompare = ['tasks', 'quality_gates', 'project_roles']
      
      for (const table of tablesToCompare) {
        const [originalData, snapshotData] = await Promise.all([
          this.supabase.from(table).select('*').eq('project_id', snapshot.original_project_id),
          this.supabase.from(table).select('*').eq('project_id', snapshot.snapshot_project_id)
        ])

        if (originalData.data && snapshotData.data) {
          comparison.differences[table] = {
            original_count: originalData.data.length,
            snapshot_count: snapshotData.data.length,
            count_difference: Math.abs(originalData.data.length - snapshotData.data.length)
          }
          comparison.summary.total_differences += comparison.differences[table].count_difference
          comparison.summary.tables_compared++
          comparison.summary.records_compared += originalData.data.length + snapshotData.data.length
        }
      }

      return comparison

    } catch (error) {
      console.error('❌ Erro ao comparar com original:', error)
      throw error
    }
  }

  /**
   * Gera relatório de snapshot
   */
  async generateSnapshotReport(snapshotId: string): Promise<any> {
    try {
      const snapshot = await this.getSnapshot(snapshotId)
      if (!snapshot) throw new Error('Snapshot não encontrado')

      const comparison = await this.compareWithOriginal(snapshotId)
      const testResults = await this.getTestResults(snapshotId)

      return {
        snapshot,
        comparison,
        test_results: testResults,
        report_generated_at: new Date().toISOString(),
        summary: {
          snapshot_age_hours: Math.floor((Date.now() - new Date(snapshot.created_at).getTime()) / (1000 * 60 * 60)),
          total_records: Object.values(snapshot.metadata.record_counts).reduce((a: number, b: number) => a + b, 0),
          test_coverage: testResults.length > 0 ? testResults.filter((r: any) => r.status === 'passed').length / testResults.length : 0
        }
      }

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error)
      throw error
    }
  }

  /**
   * Obtém resultados de testes de um snapshot
   */
  private async getTestResults(snapshotId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('test_results')
        .select('*')
        .eq('snapshot_id', snapshotId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Erro ao obter resultados de teste: ${error.message}`)
      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter resultados de teste:', error)
      return []
    }
  }
}

// Exportar instância singleton
export const testSnapshotService = TestSnapshotService.getInstance() 