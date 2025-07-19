import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser'
import { supabase } from '../supabase/client'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: string, containsPii: boolean) => {
        if (containsPii) {
          return
        }
        switch (level) {
          case 0:
            console.error(message)
            return
          case 1:
            console.warn(message)
            return
          case 2:
            console.info(message)
            return
          case 3:
            console.debug(message)
            return
          default:
            console.log(message)
            return
        }
      }
    }
  }
}

export interface MedSeniorUser {
  id: string
  email: string
  name: string
  department: string
  role: MedSeniorRole
  permissions: MedSeniorPermissions
  avatar?: string
  company: string
  theme: 'medsenior'
  accessibility: {
    highContrast: boolean
    fontSize: 'small' | 'normal' | 'large'
    reducedMotion: boolean
  }
  lastLogin?: Date
  isActive: boolean
}

export type MedSeniorRole = 'admin' | 'manager' | 'analyst' | 'developer' | 'viewer'

export interface MedSeniorPermissions {
  discovery: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  projects: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    approve: boolean
  }
  qualityGates: {
    g1: boolean
    g2: boolean  
    g3: boolean
    g4: boolean
  }
  analytics: {
    view: boolean
    export: boolean
    advanced: boolean
  }
  administration: {
    users: boolean
    settings: boolean
    audit: boolean
  }
}

export class AzureADService {
  private msalInstance: PublicClientApplication
  private currentUser: MedSeniorUser | null = null
  
  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig)
    this.initializeMsal()
  }

  private async initializeMsal() {
    try {
      await this.msalInstance.initialize()
      console.log('MSAL inicializado com sucesso')
    } catch (error) {
      console.error('Erro ao inicializar MSAL:', error)
    }
  }

  async signInWithMicrosoft(): Promise<MedSeniorUser> {
    try {
      console.log('🏥 Iniciando login MedSênior via Azure AD...')

      const loginResponse = await this.msalInstance.loginPopup({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account'
      })

      console.log('✅ Login Azure AD bem sucedido')

      // Integrar com Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'azure',
        token: loginResponse.idToken,
        options: {
          data: {
            full_name: loginResponse.account?.name,
            email: loginResponse.account?.username,
            department: 'Centro de Excelência',
            company: 'MedSênior',
            role: this.determineUserRole(loginResponse.account?.username!),
            last_login: new Date().toISOString()
          }
        }
      })

      if (error) {
        console.error('Erro na integração Supabase:', error)
        throw error
      }

      this.currentUser = this.mapToMedSeniorUser(loginResponse.account!, data.user)
      
      console.log('🎉 Usuário MedSênior autenticado:', this.currentUser.name)
      
      return this.currentUser
    } catch (error) {
      console.error('❌ Azure AD login failed:', error)
      throw new Error('Falha na autenticação MedSênior. Tente novamente.')
    }
  }

  async signOut(): Promise<void> {
    try {
      // Logout do Azure AD
      await this.msalInstance.logoutPopup({
        postLogoutRedirectUri: window.location.origin
      })

      // Logout do Supabase
      await supabase.auth.signOut()

      this.currentUser = null
      
      console.log('👋 Logout MedSênior realizado com sucesso')
    } catch (error) {
      console.error('Erro no logout:', error)
      throw new Error('Erro ao fazer logout')
    }
  }

  async getCurrentUser(): Promise<MedSeniorUser | null> {
    if (this.currentUser) {
      return this.currentUser
    }

    try {
      const accounts = this.msalInstance.getAllAccounts()
      if (accounts.length === 0) {
        return null
      }

      const account = accounts[0]
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        this.currentUser = this.mapToMedSeniorUser(account, user)
        return this.currentUser
      }

      return null
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error)
      return null
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const accounts = this.msalInstance.getAllAccounts()
      if (accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada')
      }

      const account = accounts[0]
      await this.msalInstance.acquireTokenSilent({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        account: account
      })

      console.log('🔄 Token renovado com sucesso')
    } catch (error) {
      console.error('Erro ao renovar token:', error)
      throw error
    }
  }

  private mapToMedSeniorUser(account: AccountInfo, supabaseUser: any): MedSeniorUser {
    const role = this.determineUserRole(account.username!)
    const permissions = this.getUserPermissions(role)

    return {
      id: supabaseUser.id,
      email: account.username!,
      name: account.name!,
      department: 'CoE Automação',
      role: role,
      permissions: permissions,
      avatar: `https://graph.microsoft.com/v1.0/users/${account.username}/photo/$value`,
      company: 'MedSênior',
      theme: 'medsenior',
      accessibility: {
        highContrast: false,
        fontSize: 'normal',
        reducedMotion: false
      },
      lastLogin: new Date(),
      isActive: true
    }
  }

  private determineUserRole(email: string): MedSeniorRole {
    const emailLower = email.toLowerCase()
    
    // Mapeamento baseado em domínios e padrões MedSênior
    if (emailLower.includes('admin') || emailLower.includes('coordenador')) {
      return 'admin'
    }
    if (emailLower.includes('manager') || emailLower.includes('gerente')) {
      return 'manager'
    }
    if (emailLower.includes('analyst') || emailLower.includes('analista')) {
      return 'analyst'
    }
    if (emailLower.includes('developer') || emailLower.includes('desenvolvedor')) {
      return 'developer'
    }
    
    // Padrão para usuários MedSênior
    if (emailLower.includes('@medsenior.com.br')) {
      return 'analyst'
    }
    
    return 'viewer'
  }

  private getUserPermissions(role: MedSeniorRole): MedSeniorPermissions {
    const rolePermissions: Record<MedSeniorRole, MedSeniorPermissions> = {
      admin: {
        discovery: { create: true, read: true, update: true, delete: true },
        projects: { create: true, read: true, update: true, delete: true, approve: true },
        qualityGates: { g1: true, g2: true, g3: true, g4: true },
        analytics: { view: true, export: true, advanced: true },
        administration: { users: true, settings: true, audit: true }
      },
      manager: {
        discovery: { create: true, read: true, update: true, delete: false },
        projects: { create: true, read: true, update: true, delete: false, approve: true },
        qualityGates: { g1: true, g2: true, g3: true, g4: false },
        analytics: { view: true, export: true, advanced: true },
        administration: { users: false, settings: false, audit: true }
      },
      analyst: {
        discovery: { create: true, read: true, update: true, delete: false },
        projects: { create: true, read: true, update: true, delete: false, approve: false },
        qualityGates: { g1: true, g2: true, g3: false, g4: false },
        analytics: { view: true, export: false, advanced: false },
        administration: { users: false, settings: false, audit: false }
      },
      developer: {
        discovery: { create: true, read: true, update: true, delete: false },
        projects: { create: true, read: true, update: true, delete: false, approve: false },
        qualityGates: { g1: true, g2: true, g3: true, g4: false },
        analytics: { view: true, export: false, advanced: false },
        administration: { users: false, settings: false, audit: false }
      },
      viewer: {
        discovery: { create: false, read: true, update: false, delete: false },
        projects: { create: false, read: true, update: false, delete: false, approve: false },
        qualityGates: { g1: true, g2: false, g3: false, g4: false },
        analytics: { view: true, export: false, advanced: false },
        administration: { users: false, settings: false, audit: false }
      }
    }

    return rolePermissions[role]
  }

  async updateUserProfile(updates: Partial<MedSeniorUser>): Promise<MedSeniorUser> {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: this.currentUser.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      this.currentUser = { ...this.currentUser, ...updates }
      return this.currentUser
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      throw new Error('Erro ao atualizar perfil do usuário')
    }
  }

  async updateAccessibilitySettings(settings: MedSeniorUser['accessibility']): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado')
    }

    try {
      await this.updateUserProfile({
        accessibility: settings
      })

      console.log('♿ Configurações de acessibilidade atualizadas')
    } catch (error) {
      console.error('Erro ao atualizar acessibilidade:', error)
      throw error
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  getMsalInstance(): PublicClientApplication {
    return this.msalInstance
  }
} 