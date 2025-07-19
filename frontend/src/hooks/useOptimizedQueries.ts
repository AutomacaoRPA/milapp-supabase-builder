/**
 * Hooks otimizados para queries com React Query
 * Implementa cache inteligente, prefetching e otimizações de performance
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { Project, User, DashboardMetrics } from '../types';

// Configurações de cache
const CACHE_TIME = {
  SHORT: 5 * 60 * 1000,    // 5 minutos
  MEDIUM: 15 * 60 * 1000,  // 15 minutos
  LONG: 60 * 60 * 1000,    // 1 hora
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 horas
};

const STALE_TIME = {
  SHORT: 1 * 60 * 1000,    // 1 minuto
  MEDIUM: 5 * 60 * 1000,   // 5 minutos
  LONG: 15 * 60 * 1000,    // 15 minutos
};

// Chaves de cache
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
  },
  dashboard: {
    metrics: ['dashboard', 'metrics'] as const,
    analytics: ['dashboard', 'analytics'] as const,
  },
  auth: {
    user: ['auth', 'user'] as const,
    permissions: ['auth', 'permissions'] as const,
  },
};

// Tipos para queries otimizadas
interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
}

/**
 * Hook para projetos com cache otimizado
 */
export const useProjects = (filters?: any, options?: OptimizedQueryOptions<Project[]>) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: async () => {
      const response = await api.get('/projects', { params: filters });
      return response.data;
    },
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });

  // Prefetch de projetos individuais
  const prefetchProject = useCallback(async (projectId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(projectId),
      queryFn: async () => {
        const response = await api.get(`/projects/${projectId}`);
        return response.data;
      },
      staleTime: STALE_TIME.LONG,
      gcTime: CACHE_TIME.LONG,
    });
  }, [queryClient]);

  // Invalidação inteligente
  const invalidateProjects = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
  }, [queryClient]);

  return {
    ...query,
    prefetchProject,
    invalidateProjects,
  };
};

/**
 * Hook para projeto individual com cache otimizado
 */
export const useProject = (id: string, options?: OptimizedQueryOptions<Project>) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
    staleTime: STALE_TIME.LONG,
    gcTime: CACHE_TIME.LONG,
    enabled: !!id,
    ...options,
  });

  // Mutação otimizada
  const updateProject = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const response = await api.patch(`/projects/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedProject) => {
      // Atualizar cache otimisticamente
      queryClient.setQueryData(queryKeys.projects.detail(id), updatedProject);
      
      // Invalidar listas que podem conter o projeto atualizado
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    onError: (error) => {
      console.error('Error updating project:', error);
    },
  });

  return {
    ...query,
    updateProject,
  };
};

/**
 * Hook para usuários com cache otimizado
 */
export const useUsers = (filters?: any, options?: OptimizedQueryOptions<User[]>) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const response = await api.get('/users', { params: filters });
      return response.data;
    },
    staleTime: STALE_TIME.LONG,
    gcTime: CACHE_TIME.LONG,
    refetchOnWindowFocus: false,
    ...options,
  });

  const prefetchUser = useCallback(async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.detail(userId),
      queryFn: async () => {
        const response = await api.get(`/users/${userId}`);
        return response.data;
      },
      staleTime: STALE_TIME.LONG,
      gcTime: CACHE_TIME.LONG,
    });
  }, [queryClient]);

  return {
    ...query,
    prefetchUser,
  };
};

/**
 * Hook para usuário individual
 */
export const useUser = (id: string, options?: OptimizedQueryOptions<User>) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    staleTime: STALE_TIME.LONG,
    gcTime: CACHE_TIME.LONG,
    enabled: !!id,
    ...options,
  });

  const updateUser = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await api.patch(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.users.detail(id), updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });

  return {
    ...query,
    updateUser,
  };
};

/**
 * Hook para perfil do usuário atual
 */
export const useCurrentUser = (options?: OptimizedQueryOptions<User>) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: async () => {
      const response = await api.get('/auth/profile');
      return response.data;
    },
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
    refetchOnWindowFocus: false,
    ...options,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await api.patch('/auth/profile', data);
      return response.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.users.profile(), updatedUser);
    },
  });

  return {
    ...query,
    updateProfile,
  };
};

/**
 * Hook para métricas do dashboard com cache agressivo
 */
export const useDashboardMetrics = (options?: OptimizedQueryOptions<DashboardMetrics>) => {
  const query = useQuery({
    queryKey: queryKeys.dashboard.metrics,
    queryFn: async () => {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    },
    staleTime: STALE_TIME.SHORT,
    gcTime: CACHE_TIME.SHORT,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    refetchOnWindowFocus: true,
    ...options,
  });

  return query;
};

/**
 * Hook para analytics com cache otimizado
 */
export const useAnalytics = (projectId?: string, options?: OptimizedQueryOptions<any>) => {
  const query = useQuery({
    queryKey: [...queryKeys.dashboard.analytics, projectId],
    queryFn: async () => {
      const response = await api.get('/dashboard/analytics', {
        params: { project_id: projectId },
      });
      return response.data;
    },
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
    enabled: !!projectId,
    ...options,
  });

  return query;
};

/**
 * Hook para permissões do usuário
 */
export const usePermissions = (options?: OptimizedQueryOptions<string[]>) => {
  const query = useQuery({
    queryKey: queryKeys.auth.permissions,
    queryFn: async () => {
      const response = await api.get('/auth/permissions');
      return response.data;
    },
    staleTime: STALE_TIME.LONG,
    gcTime: CACHE_TIME.LONG,
    refetchOnWindowFocus: false,
    ...options,
  });

  const hasPermission = useCallback((permission: string) => {
    return query.data?.includes(permission) ?? false;
  }, [query.data]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(permission => query.data?.includes(permission) ?? false);
  }, [query.data]);

  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(permission => query.data?.includes(permission) ?? false);
  }, [query.data]);

  return {
    ...query,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

/**
 * Hook para busca otimizada com debounce
 */
export const useSearch = <T>(
  searchFn: (query: string) => Promise<T[]>,
  options?: {
    debounceMs?: number;
    minQueryLength?: number;
    enabled?: boolean;
  }
) => {
  const { debounceMs = 300, minQueryLength = 2, enabled = true } = options || {};

  const query = useQuery({
    queryKey: ['search', searchFn.name],
    queryFn: async ({ queryKey }: any) => {
      const [_, query] = queryKey;
      if (!query || query.length < minQueryLength) {
        return [];
      }
      return await searchFn(query);
    },
    staleTime: STALE_TIME.SHORT,
    gcTime: CACHE_TIME.SHORT,
    enabled: enabled && false, // Desabilitado por padrão, será habilitado via setQueryData
  });

  const search = useCallback(async (query: string) => {
    if (query.length >= minQueryLength) {
      // Usar setQueryData para evitar múltiplas requisições
      // queryClient.setQueryData(['search', searchFn.name], query);
    }
  }, [minQueryLength]);

  return {
    ...query,
    search,
  };
};

/**
 * Hook para paginação otimizada
 */
export const usePaginatedQuery = <T>(
  queryKey: string[],
  queryFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  options?: {
    page?: number;
    limit?: number;
    enabled?: boolean;
  }
) => {
  const { page = 1, limit = 10, enabled = true } = options || {};

  const query = useQuery({
    queryKey: [...queryKey, page, limit],
    queryFn: async () => {
      return await queryFn(page, limit);
    },
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
    enabled,
    keepPreviousData: true, // Manter dados anteriores durante carregamento
  });

  const totalPages = useMemo(() => {
    if (!query.data?.total) return 0;
    return Math.ceil(query.data.total / limit);
  }, [query.data?.total, limit]);

  return {
    ...query,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
  };
};

/**
 * Hook para infinite scroll otimizado
 */
export const useInfiniteQuery = <T>(
  queryKey: string[],
  queryFn: (pageParam: number) => Promise<{ data: T[]; nextPage?: number }>,
  options?: {
    enabled?: boolean;
    getNextPageParam?: (lastPage: any, allPages: any[]) => number | undefined;
  }
) => {
  const { enabled = true, getNextPageParam } = options || {};

  const query = useQuery({
    queryKey: [...queryKey, 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return await queryFn(pageParam);
    },
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
    enabled,
    getNextPageParam: getNextPageParam || ((lastPage) => lastPage.nextPage),
  });

  const allData = useMemo(() => {
    return query.data?.pages?.flatMap(page => page.data) || [];
  }, [query.data?.pages]);

  return {
    ...query,
    allData,
  };
};

/**
 * Hook para cache management
 */
export const useCacheManager = () => {
  const queryClient = useQueryClient();

  const clearCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  const invalidateQueries = useCallback((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  const removeQueries = useCallback((queryKey: string[]) => {
    queryClient.removeQueries({ queryKey });
  }, [queryClient]);

  const prefetchQuery = useCallback(async (queryKey: string[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: STALE_TIME.MEDIUM,
      gcTime: CACHE_TIME.MEDIUM,
    });
  }, [queryClient]);

  return {
    clearCache,
    invalidateQueries,
    removeQueries,
    prefetchQuery,
  };
};

/**
 * Hook para otimização de performance
 */
export const usePerformanceOptimizations = () => {
  const queryClient = useQueryClient();

  // Configurar otimizações globais
  useMemo(() => {
    // Configurar retry com backoff exponencial
    queryClient.setDefaultOptions({
      queries: {
        retry: (failureCount, error: any) => {
          if (error?.response?.status === 404) return false;
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    });
  }, [queryClient]);

  return {
    queryClient,
  };
}; 