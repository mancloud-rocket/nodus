// ============================================
// NODUS - Dashboard Store (Zustand)
// Estado global con soporte para Realtime
// ============================================

import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { 
  AlertaAnomalia, 
  AnalisisLlamada, 
  Agente,
  RegistroLlamada,
  ResumenAgente
} from '@/types/database'

// ---------- Types ----------

interface DashboardMetrics {
  total_llamadas: number
  llamadas_hoy: number
  score_promedio: number
  cambio_score: number
  tasa_validacion: number
  cambio_validacion: number
  probabilidad_promedio: number
  cambio_probabilidad: number
  alertas_activas: number
  monto_comprometido: number
}

interface Tendencia {
  fecha: string
  llamadas: number
  score: number
  validacion: number
}

interface TopPerformer {
  agente_id: string
  nombre: string
  score: number
  llamadas: number
  validacion: number
  trend: 'up' | 'down' | 'stable'
}

interface LlamadaConAnalisis extends RegistroLlamada {
  agente_nombre?: string
  analisis?: AnalisisLlamada
}

interface Notification {
  id: string
  type: 'alerta' | 'analisis' | 'coaching' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: unknown
}

interface DashboardState {
  // Data
  metrics: DashboardMetrics | null
  alertas: AlertaAnomalia[]
  llamadasRecientes: LlamadaConAnalisis[]
  topPerformers: TopPerformer[]
  tendencias: Tendencia[]
  agentes: Agente[]
  resumenAgentes: ResumenAgente[]
  notifications: Notification[]
  
  // Status
  loading: boolean
  error: string | null
  realtimeConnected: boolean
  lastUpdate: string | null
  
  // Actions
  fetchDashboardData: () => Promise<void>
  fetchAlertas: () => Promise<void>
  fetchLlamadas: (limit?: number) => Promise<void>
  fetchAgentes: () => Promise<void>
  
  // Realtime handlers
  addAlerta: (alerta: AlertaAnomalia) => void
  updateAlerta: (alerta: AlertaAnomalia) => void
  addAnalisis: (analisis: AnalisisLlamada) => void
  updateLlamada: (llamada: RegistroLlamada) => void
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  
  // Status
  setRealtimeConnected: (connected: boolean) => void
  setError: (error: string | null) => void
}

// ---------- Mock Data (fallback) ----------

const mockMetrics: DashboardMetrics = {
  total_llamadas: 2847,
  llamadas_hoy: 127,
  score_promedio: 72,
  cambio_score: 5,
  tasa_validacion: 0.52,
  cambio_validacion: -3,
  probabilidad_promedio: 54,
  cambio_probabilidad: 2,
  alertas_activas: 3,
  monto_comprometido: 1250000
}

const mockTendencias: Tendencia[] = [
  { fecha: 'Lun', llamadas: 412, score: 68, validacion: 48 },
  { fecha: 'Mar', llamadas: 445, score: 71, validacion: 51 },
  { fecha: 'Mie', llamadas: 398, score: 75, validacion: 55 },
  { fecha: 'Jue', llamadas: 467, score: 73, validacion: 53 },
  { fecha: 'Vie', llamadas: 489, score: 72, validacion: 52 },
  { fecha: 'Sab', llamadas: 312, score: 74, validacion: 54 },
  { fecha: 'Hoy', llamadas: 127, score: 72, validacion: 52 }
]

const mockTopPerformers: TopPerformer[] = [
  { agente_id: '1', nombre: 'Carlos Ramirez', score: 89, llamadas: 145, validacion: 78, trend: 'up' },
  { agente_id: '5', nombre: 'Luis Torres', score: 82, llamadas: 132, validacion: 71, trend: 'stable' },
  { agente_id: '4', nombre: 'Ana Martinez', score: 78, llamadas: 128, validacion: 65, trend: 'up' },
  { agente_id: '2', nombre: 'Maria Gonzalez', score: 72, llamadas: 156, validacion: 52, trend: 'down' },
  { agente_id: '3', nombre: 'Jose Perez', score: 58, llamadas: 98, validacion: 38, trend: 'down' }
]

// ---------- Store ----------

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  metrics: null,
  alertas: [],
  llamadasRecientes: [],
  topPerformers: [],
  tendencias: [],
  agentes: [],
  resumenAgentes: [],
  notifications: [],
  loading: false,
  error: null,
  realtimeConnected: false,
  lastUpdate: null,

  // Fetch dashboard data
  fetchDashboardData: async () => {
    set({ loading: true, error: null })

    if (!isSupabaseConfigured()) {
      // Use mock data
      set({
        metrics: mockMetrics,
        tendencias: mockTendencias,
        topPerformers: mockTopPerformers,
        loading: false,
        lastUpdate: new Date().toISOString()
      })
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Fetch metrics in parallel
      const [
        { count: totalLlamadas },
        { count: llamadasHoy },
        { data: analisis },
        { count: alertasActivas }
      ] = await Promise.all([
        supabase.from('registro_llamadas').select('*', { count: 'exact', head: true }),
        supabase.from('registro_llamadas').select('*', { count: 'exact', head: true }).gte('timestamp_fecha', today),
        supabase.from('analisis_llamadas').select('score_total, probabilidad_cumplimiento').gte('fecha_llamada', weekAgo),
        supabase.from('alertas_anomalias').select('*', { count: 'exact', head: true }).in('estado', ['nueva', 'en_revision'])
      ])

      const scores = analisis?.map((a: { score_total: number }) => a.score_total) || []
      const probs = analisis?.map((a: { probabilidad_cumplimiento: number }) => a.probabilidad_cumplimiento) || []

      const metrics: DashboardMetrics = {
        total_llamadas: totalLlamadas || 0,
        llamadas_hoy: llamadasHoy || 0,
        score_promedio: scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0,
        cambio_score: 0,
        tasa_validacion: 0.52, // TODO: calculate
        cambio_validacion: 0,
        probabilidad_promedio: probs.length > 0 ? Math.round(probs.reduce((a: number, b: number) => a + b, 0) / probs.length) : 0,
        cambio_probabilidad: 0,
        alertas_activas: alertasActivas || 0,
        monto_comprometido: 0
      }

      // Fetch tendencias
      const { data: metricasData } = await supabase
        .from('metricas_agregadas')
        .select('fecha, total_llamadas, score_promedio, tasa_validacion')
        .is('agente_id', null)
        .is('equipo', null)
        .gte('fecha', weekAgo)
        .order('fecha')

      const tendencias = (metricasData || mockTendencias.map(t => ({
        fecha: t.fecha,
        total_llamadas: t.llamadas,
        score_promedio: t.score,
        tasa_validacion: t.validacion / 100
      }))).map((m: { fecha: string; total_llamadas: number; score_promedio: number | null; tasa_validacion: number | null }) => ({
        fecha: typeof m.fecha === 'string' && m.fecha.includes('-') 
          ? new Date(m.fecha).toLocaleDateString('es', { weekday: 'short' })
          : m.fecha,
        llamadas: m.total_llamadas || 0,
        score: m.score_promedio || 0,
        validacion: (m.tasa_validacion || 0) * 100
      }))

      // Fetch top performers
      const { data: resumen } = await supabase
        .from('vista_resumen_agentes')
        .select('*')
        .not('score_semana', 'is', null)
        .order('score_semana', { ascending: false })
        .limit(5)

      const topPerformers = (resumen || []).map((a: { agente_id: string; nombre: string; score_semana: number | null; llamadas_semana: number | null; tasa_validacion_ultimo_reporte: number | null }) => ({
        agente_id: a.agente_id,
        nombre: a.nombre,
        score: a.score_semana || 0,
        llamadas: a.llamadas_semana || 0,
        validacion: (a.tasa_validacion_ultimo_reporte || 0) * 100,
        trend: 'stable' as const
      }))

      set({
        metrics,
        tendencias: tendencias.length > 0 ? tendencias : mockTendencias,
        topPerformers: topPerformers.length > 0 ? topPerformers : mockTopPerformers,
        loading: false,
        lastUpdate: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      set({ 
        error: (error as Error).message, 
        loading: false,
        // Fallback to mock data
        metrics: mockMetrics,
        tendencias: mockTendencias,
        topPerformers: mockTopPerformers
      })
    }
  },

  // Fetch alertas
  fetchAlertas: async () => {
    if (!isSupabaseConfigured()) {
      set({ alertas: [] })
      return
    }

    try {
      const { data, error } = await supabase
        .from('alertas_anomalias')
        .select('*')
        .in('estado', ['nueva', 'en_revision'])
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      set({ alertas: data || [] })
    } catch (error) {
      console.error('Error fetching alertas:', error)
    }
  },

  // Fetch llamadas
  fetchLlamadas: async (limit = 10) => {
    if (!isSupabaseConfigured()) {
      set({ llamadasRecientes: [] })
      return
    }

    try {
      const { data, error } = await supabase
        .from('registro_llamadas')
        .select(`
          *,
          agente:agentes!agente_id(nombre),
          analisis:analisis_llamadas!registro_id(score_total, probabilidad_cumplimiento)
        `)
        .order('timestamp_inicio', { ascending: false })
        .limit(limit)

      if (error) throw error

      type RawData = RegistroLlamada & { agente: { nombre: string } | null; analisis: AnalisisLlamada[] }
      const llamadas = ((data || []) as RawData[]).map((item) => ({
        ...item,
        agente_nombre: item.agente?.nombre,
        analisis: item.analisis?.[0]
      })) as LlamadaConAnalisis[]

      set({ llamadasRecientes: llamadas })
    } catch (error) {
      console.error('Error fetching llamadas:', error)
    }
  },

  // Fetch agentes
  fetchAgentes: async () => {
    if (!isSupabaseConfigured()) {
      set({ agentes: [], resumenAgentes: [] })
      return
    }

    try {
      const [{ data: agentes }, { data: resumen }] = await Promise.all([
        supabase.from('agentes').select('*').eq('estado', 'activo').order('nombre'),
        supabase.from('vista_resumen_agentes').select('*').order('score_semana', { ascending: false, nullsFirst: false })
      ])

      set({ 
        agentes: agentes || [], 
        resumenAgentes: resumen || [] 
      })
    } catch (error) {
      console.error('Error fetching agentes:', error)
    }
  },

  // Realtime handlers
  addAlerta: (alerta) => {
    set(state => ({
      alertas: [alerta, ...state.alertas],
      metrics: state.metrics ? {
        ...state.metrics,
        alertas_activas: state.metrics.alertas_activas + 1
      } : null
    }))

    // Add notification
    get().addNotification({
      type: 'alerta',
      title: `Nueva alerta ${alerta.severidad}`,
      message: alerta.descripcion,
      data: alerta
    })
  },

  updateAlerta: (alerta) => {
    set(state => ({
      alertas: state.alertas.map(a => 
        a.alerta_id === alerta.alerta_id ? alerta : a
      )
    }))
  },

  addAnalisis: (analisis: AnalisisLlamada) => {
    set(state => ({
      metrics: state.metrics ? {
        ...state.metrics,
        total_llamadas: state.metrics.total_llamadas + 1,
        llamadas_hoy: state.metrics.llamadas_hoy + 1,
        score_promedio: Math.round((state.metrics.score_promedio * state.metrics.total_llamadas + analisis.score_total) / (state.metrics.total_llamadas + 1))
      } : null
    }))
    set(state => ({
      llamadasRecientes: state.llamadasRecientes.map(l => 
        l.registro_id === analisis.registro_id 
          ? { ...l, analisis: analisis, estado: 'analizado' }
          : l
      )
    }))
  },

 updateLlamada: (llamada) => {
    set(state => {
      const existe = state.llamadasRecientes.some(l => l.registro_id === llamada.registro_id);
      if (existe) {
        return {
          llamadasRecientes: state.llamadasRecientes.map(l =>
            l.registro_id === llamada.registro_id ? { ...l, ...llamada } : l
          )
        };
      } else {
        return {
          llamadasRecientes: [llamada, ...state.llamadasRecientes]
        };
      }
    })
  },

  // Notifications
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    }

    set(state => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50)
    }))
  },

  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  // Status
  setRealtimeConnected: (connected) => {
    set({ realtimeConnected: connected })
  },

  setError: (error) => {
    set({ error })
  }
}))

// ---------- Selector Hooks ----------

export const useMetrics = () => useDashboardStore(state => state.metrics)
export const useAlertas = () => useDashboardStore(state => state.alertas)
export const useLlamadasRecientes = () => useDashboardStore(state => state.llamadasRecientes)
export const useTopPerformers = () => useDashboardStore(state => state.topPerformers)
export const useTendencias = () => useDashboardStore(state => state.tendencias)
export const useNotifications = () => useDashboardStore(state => state.notifications)
export const useUnreadNotificationsCount = () => useDashboardStore(
  state => state.notifications.filter(n => !n.read).length
)

