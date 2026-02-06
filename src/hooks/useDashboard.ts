// ============================================
// NODUS - Dashboard Hook
// Combina datos + realtime + store
// ============================================

import { useEffect, useCallback } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useRealtime } from './useRealtime'
import type { AlertaAnomalia, AnalisisLlamada, CoachingReport, RegistroLlamada } from '@/types/database'

export function useDashboard() {
  const {
    metrics,
    alertas,
    llamadasRecientes,
    topPerformers,
    tendencias,
    notifications,
    loading,
    error,
    realtimeConnected,
    lastUpdate,
    fetchDashboardData,
    fetchAlertas,
    fetchLlamadas,
    addAlerta,
    updateAlerta,
    addAnalisis,
    updateLlamada,
    addNotification,
    setRealtimeConnected
  } = useDashboardStore()

  // Setup realtime callbacks
  const handleNuevaAlerta = useCallback((alerta: AlertaAnomalia) => {
    addAlerta(alerta)
  }, [addAlerta])

  const handleAlertaActualizada = useCallback((alerta: AlertaAnomalia) => {
    updateAlerta(alerta)
  }, [updateAlerta])

  const handleNuevoAnalisis = useCallback((analisis: AnalisisLlamada) => {
    addAnalisis(analisis)
    addNotification({
      type: 'analisis',
      title: 'Nueva llamada analizada',
      message: `Score: ${analisis.score_total}/100`,
      data: analisis
    })
  }, [addAnalisis, addNotification])

  const handleNuevoCoachingReport = useCallback((report: CoachingReport) => {
    addNotification({
      type: 'coaching',
      title: 'Nuevo reporte de coaching',
      message: `Reporte generado para el periodo ${report.periodo_inicio} - ${report.periodo_fin}`,
      data: report
    })
  }, [addNotification])

  const handleLlamadaActualizada = useCallback((llamada: RegistroLlamada) => {
    updateLlamada(llamada)
  }, [updateLlamada])

  // Setup realtime connection
  const { isConnected } = useRealtime({
    onNuevaAlerta: handleNuevaAlerta,
    onAlertaActualizada: handleAlertaActualizada,
    onNuevoAnalisis: handleNuevoAnalisis,
    onNuevoCoachingReport: handleNuevoCoachingReport,
    onLlamadaActualizada: handleLlamadaActualizada
  })

  // Update realtime status
  useEffect(() => {
    setRealtimeConnected(isConnected)
  }, [isConnected, setRealtimeConnected])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
    fetchAlertas()
    fetchLlamadas()
  }, [fetchDashboardData, fetchAlertas, fetchLlamadas])

  // Refresh data periodically (every 5 minutes as backup)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchDashboardData])

  return {
    // Data
    metrics,
    alertas,
    llamadasRecientes,
    topPerformers,
    tendencias,
    notifications,
    
    // Status
    loading,
    error,
    realtimeConnected,
    lastUpdate,
    
    // Actions
    refresh: fetchDashboardData,
    refreshAlertas: fetchAlertas,
    refreshLlamadas: fetchLlamadas
  }
}

// Export individual selectors for optimization
export { 
  useMetrics, 
  useAlertas, 
  useLlamadasRecientes, 
  useTopPerformers, 
  useTendencias,
  useNotifications,
  useUnreadNotificationsCount 
} from '@/stores/dashboardStore'




