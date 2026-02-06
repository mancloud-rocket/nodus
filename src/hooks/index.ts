// ============================================
// NODUS - Hooks Index
// ============================================

// Supabase Queries
export {
  useAgentes,
  useAgente,
  useResumenAgentes,
  useLlamadas,
  useLlamada,
  useLlamadasPorAgente,
  useAlertas as useAlertasQuery,
  useAlertasCount,
  useCoachingReports,
  useUltimoCoachingReport,
  useDashboardMetrics,
  useTendencias as useTendenciasQuery,
  useTopPerformers as useTopPerformersQuery
} from './useSupabase'

// Realtime
export {
  useRealtime,
  useAlertasRealtime,
  useAnalisisRealtime,
  usePresence
} from './useRealtime'

// Dashboard (combined)
export {
  useDashboard,
  useMetrics,
  useAlertas,
  useLlamadasRecientes,
  useTopPerformers,
  useTendencias,
  useNotifications,
  useUnreadNotificationsCount
} from './useDashboard'

// Modulos de Analisis
export {
  useKPIsPrincipales,
  useModulosGlobal,
  useCompromisoElementos,
  useAbandonosDetalle,
  useAbandonoKPIs,
  useAgentesModulos,
  useEvolucionSemanal,
  useFlujoProbabilidad,
  useContactoDetalle,
  useModulosOverview
} from './useModulos'

