import { supabase } from '../supabase/client'

export interface BackupConfig {
  enabled: boolean
  schedule: 'daily' | 'weekly' | 'monthly'
  time: string // HH:mm format
  retention: number // days
  tables: string[]
  includeData: boolean
  includeSchema: boolean
}

export interface BackupStatus {
  id: string
  timestamp: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  size?: number
  tables: string[]
  error?: string
  duration?: number
}

export class BackupService {
  private static instance: BackupService
  private config: BackupConfig
  private isRunning = false

  static getInstance(): BackupService {
    if (!this.instance) {
      this.instance = new BackupService()
    }
    return this.instance
  }

  constructor() {
    this.config = {
      enabled: true,
      schedule: 'daily',
      time: '02:00',
      retention: 30,
      tables: [
        'projects',
        'quality_gates',
        'automations',
        'discovery_analyses',
        'user_profiles',
        'audit_logs'
      ],
      includeData: true,
      includeSchema: true
    }
    
    this.loadConfig()
    this.scheduleBackup()
  }

  // Carregar configuração
  private loadConfig(): void {
    const savedConfig = localStorage.getItem('medsenior-backup-config')
    if (savedConfig) {
      this.config = { ...this.config, ...JSON.parse(savedConfig) }
    }
  }

  // Salvar configuração
  private saveConfig(): void {
    localStorage.setItem('medsenior-backup-config', JSON.stringify(this.config))
  }

  // Agendar backup automático
  private scheduleBackup(): void {
    if (!this.config.enabled) return

    const scheduleBackup = () => {
      const now = new Date()
      const [hours, minutes] = this.config.time.split(':').map(Number)
      const nextBackup = new Date()
      nextBackup.setHours(hours, minutes, 0, 0)

      // Se já passou do horário hoje, agendar para amanhã
      if (nextBackup <= now) {
        nextBackup.setDate(nextBackup.getDate() + 1)
      }

      const timeUntilBackup = nextBackup.getTime() - now.getTime()
      
      setTimeout(() => {
        this.performBackup()
        scheduleBackup() // Agendar próximo backup
      }, timeUntilBackup)

      console.log(`🔄 Backup MedSênior agendado para: ${nextBackup.toLocaleString('pt-BR')}`)
    }

    scheduleBackup()
  }

  // Executar backup
  async performBackup(): Promise<BackupStatus> {
    if (this.isRunning) {
      throw new Error('Backup já está em execução')
    }

    this.isRunning = true
    const startTime = Date.now()
    const backupId = `backup-${Date.now()}`

    try {
      console.log('🔄 Iniciando backup MedSênior...')

      const backupStatus: BackupStatus = {
        id: backupId,
        timestamp: new Date().toISOString(),
        status: 'running',
        tables: this.config.tables
      }

      // Salvar status inicial
      await this.saveBackupStatus(backupStatus)

      const backupData: any = {
        metadata: {
          timestamp: backupStatus.timestamp,
          version: '2.0.0',
          company: 'MedSênior',
          app: 'MILAPP',
          config: this.config
        },
        schema: {},
        data: {}
      }

      // Backup do schema
      if (this.config.includeSchema) {
        console.log('📋 Backup do schema...')
        backupData.schema = await this.backupSchema()
      }

      // Backup dos dados
      if (this.config.includeData) {
        console.log('📊 Backup dos dados...')
        backupData.data = await this.backupData()
      }

      // Calcular tamanho do backup
      const backupSize = new Blob([JSON.stringify(backupData)]).size
      const duration = Date.now() - startTime

      // Salvar backup
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medsenior-backups')
        .upload(`${backupId}.json`, JSON.stringify(backupData), {
          contentType: 'application/json',
          metadata: {
            timestamp: backupStatus.timestamp,
            size: backupSize.toString(),
            tables: this.config.tables.join(',')
          }
        })

      if (uploadError) {
        throw uploadError
      }

      // Atualizar status
      backupStatus.status = 'completed'
      backupStatus.size = backupSize
      backupStatus.duration = duration

      await this.saveBackupStatus(backupStatus)

      // Limpar backups antigos
      await this.cleanupOldBackups()

      console.log(`✅ Backup MedSênior concluído em ${duration}ms (${(backupSize / 1024 / 1024).toFixed(2)}MB)`)

      return backupStatus

    } catch (error) {
      console.error('❌ Erro no backup MedSênior:', error)
      
      const backupStatus: BackupStatus = {
        id: backupId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        tables: this.config.tables,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - startTime
      }

      await this.saveBackupStatus(backupStatus)
      throw error

    } finally {
      this.isRunning = false
    }
  }

  // Backup do schema
  private async backupSchema(): Promise<any> {
    const schema: any = {}

    for (const table of this.config.tables) {
      try {
        // Obter informações da tabela
        const { data: tableInfo, error } = await supabase
          .from('information_schema.columns')
          .select('*')
          .eq('table_name', table)

        if (!error && tableInfo) {
          schema[table] = {
            columns: tableInfo,
            constraints: await this.getTableConstraints(table)
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao backup schema da tabela ${table}:`, error)
      }
    }

    return schema
  }

  // Obter constraints da tabela
  private async getTableConstraints(tableName: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', tableName)

      return error ? [] : data || []
    } catch (error) {
      console.warn(`⚠️ Erro ao obter constraints da tabela ${tableName}:`, error)
      return []
    }
  }

  // Backup dos dados
  private async backupData(): Promise<any> {
    const data: any = {}

    for (const table of this.config.tables) {
      try {
        console.log(`📊 Backup da tabela: ${table}`)
        
        const { data: tableData, error } = await supabase
          .from(table)
          .select('*')

        if (error) {
          console.warn(`⚠️ Erro ao backup dados da tabela ${table}:`, error)
          data[table] = { error: error.message }
        } else {
          data[table] = tableData || []
          console.log(`✅ ${table}: ${(tableData || []).length} registros`)
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao backup dados da tabela ${table}:`, error)
        data[table] = { error: 'Erro desconhecido' }
      }
    }

    return data
  }

  // Salvar status do backup
  private async saveBackupStatus(status: BackupStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('backup_logs')
        .upsert({
          id: status.id,
          timestamp: status.timestamp,
          status: status.status,
          size: status.size,
          tables: status.tables,
          error: status.error,
          duration: status.duration,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Erro ao salvar status do backup:', error)
      }
    } catch (error) {
      console.error('Erro ao salvar status do backup:', error)
    }
  }

  // Limpar backups antigos
  private async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retention)

      // Listar backups antigos
      const { data: oldBackups, error } = await supabase.storage
        .from('medsenior-backups')
        .list('', {
          limit: 1000
        })

      if (error) {
        console.error('Erro ao listar backups antigos:', error)
        return
      }

      // Filtrar backups antigos
      const backupsToDelete = oldBackups?.filter(file => {
        const fileDate = new Date(file.created_at || '')
        return fileDate < cutoffDate
      }) || []

      // Deletar backups antigos
      for (const backup of backupsToDelete) {
        try {
          await supabase.storage
            .from('medsenior-backups')
            .remove([backup.name])

          console.log(`🗑️ Backup antigo removido: ${backup.name}`)
        } catch (error) {
          console.error(`Erro ao remover backup ${backup.name}:`, error)
        }
      }

      console.log(`🧹 ${backupsToDelete.length} backups antigos removidos`)
    } catch (error) {
      console.error('Erro na limpeza de backups:', error)
    }
  }

  // Restaurar backup
  async restoreBackup(backupId: string): Promise<void> {
    try {
      console.log(`🔄 Restaurando backup: ${backupId}`)

      // Download do backup
      const { data, error } = await supabase.storage
        .from('medsenior-backups')
        .download(`${backupId}.json`)

      if (error) {
        throw error
      }

      const backupData = JSON.parse(await data.text())

      // Validar backup
      if (!backupData.metadata || !backupData.data) {
        throw new Error('Formato de backup inválido')
      }

      // Restaurar dados
      for (const [table, tableData] of Object.entries(backupData.data)) {
        if (Array.isArray(tableData)) {
          console.log(`📊 Restaurando tabela: ${table} (${tableData.length} registros)`)
          
          // Limpar tabela existente
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
          
          // Inserir dados do backup
          if (tableData.length > 0) {
            const { error: insertError } = await supabase
              .from(table)
              .insert(tableData)

            if (insertError) {
              console.error(`Erro ao restaurar tabela ${table}:`, insertError)
            }
          }
        }
      }

      console.log('✅ Backup restaurado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error)
      throw error
    }
  }

  // Listar backups disponíveis
  async listBackups(): Promise<BackupStatus[]> {
    try {
      const { data: files, error } = await supabase.storage
        .from('medsenior-backups')
        .list('', {
          limit: 1000
        })

      if (error) {
        throw error
      }

      const backups: BackupStatus[] = []

      for (const file of files || []) {
        const backupId = file.name.replace('.json', '')
        const timestamp = file.created_at || ''
        const size = file.metadata?.size ? parseInt(file.metadata.size) : 0
        const tables = file.metadata?.tables?.split(',') || []

        backups.push({
          id: backupId,
          timestamp,
          status: 'completed',
          size,
          tables,
          duration: 0
        })
      }

      // Ordenar por data (mais recente primeiro)
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error('Erro ao listar backups:', error)
      return []
    }
  }

  // Obter configuração
  getConfig(): BackupConfig {
    return { ...this.config }
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
    
    // Reagendar backup se necessário
    if (newConfig.schedule || newConfig.time || newConfig.enabled !== undefined) {
      this.scheduleBackup()
    }
  }

  // Verificar se backup está rodando
  isBackupRunning(): boolean {
    return this.isRunning
  }

  // Forçar backup manual
  async forceBackup(): Promise<BackupStatus> {
    return this.performBackup()
  }
} 