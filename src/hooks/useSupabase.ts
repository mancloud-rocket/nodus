// ============================================
// NODUS - Supabase Queries Hook
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { 
  Agente, 
  RegistroLlamada, 
  AnalisisLlamada, 
  AlertaAnomalia,
  CoachingReport,
  ResumenAgente
} from '@/types/database'

// ---------- Types ----------

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface LlamadaConAnalisis extends RegistroLlamada {
  agente?: Agente
  analisis?: AnalisisLlamada
}

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

// ---------- Generic Query Hook ----------

function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
): QueryState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null
  })

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setState({ data: null, loading: false, error: null })
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await queryFn()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error })
    }
  }, [queryFn])

  useEffect(() => {
    fetch()
  }, deps)

  return { ...state, refetch: fetch }
}

// ---------- Agentes ----------

export function useAgentes() {
  return useQuery<Agente[]>(async () => {
    const { data, error } = await supabase
      .from('agentes')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre')

    if (error) throw error
    return data || []
  }, [])
}

export function useAgente(agenteId: string | undefined) {
  return useQuery<Agente | null>(async () => {
    if (!agenteId) return null

    const { data, error } = await supabase
      .from('agentes')
      .select('*')
      .eq('agente_id', agenteId)
      .single()

    if (error) throw error
    return data
  }, [agenteId])
}

export function useResumenAgentes() {
  return useQuery<ResumenAgente[]>(async () => {
    const { data, error } = await supabase
      .from('vista_resumen_agentes')
      .select('*')
      .order('score_semana', { ascending: false, nullsFirst: false })

    if (error) throw error
    return data || []
  }, [])
}

// ---------- Llamadas ----------

export function useLlamadas(limit = 50) {
  return useQuery<LlamadaConAnalisis[]>(async () => {
    const { data, error } = await supabase
      .from('registro_llamadas')
      .select(`
        *,
        agente:agentes!agente_id(nombre, email, equipo),
        analisis:analisis_llamadas!registro_id(*)
      `)
      .order('timestamp_inicio', { ascending: false })
      .limit(limit)

    if (error) throw error
    
    return (data || []).map(item => ({
      ...item,
      agente: item.agente as unknown as Agente,
      analisis: item.analisis?.[0] as AnalisisLlamada | undefined
    }))
  }, [limit])
}

export function useLlamada(registroId: string | undefined) {
  return useQuery<LlamadaConAnalisis | null>(async () => {
    if (!registroId) return null

    const { data, error } = await supabase
      .from('registro_llamadas')
      .select(`
        *,
        agente:agentes!agente_id(*),
        analisis:analisis_llamadas!registro_id(*),
        transcripcion:transcripciones!registro_id(*)
      `)
      .eq('registro_id', registroId)
      .single()

    if (error) throw error
    return data as unknown as LlamadaConAnalisis
  }, [registroId])
}

export function useLlamadasPorAgente(agenteId: string | undefined, limit = 25) {
  return useQuery<LlamadaConAnalisis[]>(async () => {
    if (!agenteId) return []

    const { data, error } = await supabase
      .from('registro_llamadas')
      .select(`
        *,
        analisis:analisis_llamadas!registro_id(*)
      `)
      .eq('agente_id', agenteId)
      .order('timestamp_inicio', { ascending: false })
      .limit(limit)

    if (error) throw error
    
    return (data || []).map(item => ({
      ...item,
      analisis: item.analisis?.[0] as AnalisisLlamada | undefined
    }))
  }, [agenteId, limit])
}

// ---------- Alertas ----------

export function useAlertas(soloActivas = true) {
  return useQuery<AlertaAnomalia[]>(async () => {
    let query = supabase
      .from('alertas_anomalias')
      .select('*')
      .order('created_at', { ascending: false })

    if (soloActivas) {
      query = query.in('estado', ['nueva', 'en_revision'])
    }

    const { data, error } = await query.limit(100)

    if (error) throw error
    return data || []
  }, [soloActivas])
}

export function useAlertasCount() {
  return useQuery<{ total: number; criticas: number; altas: number }>(async () => {
    const { data, error } = await supabase
      .from('alertas_anomalias')
      .select('severidad')
      .in('estado', ['nueva', 'en_revision'])

    if (error) throw error

    const alertas = data || []
    return {
      total: alertas.length,
      criticas: alertas.filter(a => a.severidad === 'critica').length,
      altas: alertas.filter(a => a.severidad === 'alta').length
    }
  }, [])
}

// ---------- Coaching Reports ----------

export function useCoachingReports(agenteId?: string) {
  return useQuery<CoachingReport[]>(async () => {
    let query = supabase
      .from('coaching_reports')
      .select('*')
      .order('fecha_reporte', { ascending: false })

    if (agenteId) {
      query = query.eq('agente_id', agenteId)
    }

    const { data, error } = await query.limit(50)

    if (error) throw error
    return data || []
  }, [agenteId])
}

export function useUltimoCoachingReport(agenteId: string | undefined) {
  return useQuery<CoachingReport | null>(async () => {
    if (!agenteId) return null

    const { data, error } = await supabase
      .from('coaching_reports')
      .select('*')
      .eq('agente_id', agenteId)
      .order('fecha_reporte', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }, [agenteId])
}

// ---------- Dashboard Metrics ----------

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>(async () => {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Total llamadas
    const { count: totalLlamadas } = await supabase
      .from('registro_llamadas')
      .select('*', { count: 'exact', head: true })

    // Llamadas hoy
    const { count: llamadasHoy } = await supabase
      .from('registro_llamadas')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp_fecha', today)

    // Metricas de analisis (ultima semana)
    const { data: analisis } = await supabase
      .from('analisis_llamadas')
      .select('score_total, probabilidad_cumplimiento, modulo_compromiso_pago')
      .gte('fecha_llamada', weekAgo)

    // Alertas activas
    const { count: alertasActivas } = await supabase
      .from('alertas_anomalias')
      .select('*', { count: 'exact', head: true })
      .in('estado', ['nueva', 'en_revision'])

    // Calcular promedios
    const scores = analisis?.map(a => a.score_total) || []
    const probs = analisis?.map(a => a.probabilidad_cumplimiento) || []
    
    const scorePromedio = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
      : 0

    const probPromedio = probs.length > 0
      ? Math.round(probs.reduce((a, b) => a + b, 0) / probs.length)
      : 0

    // Calcular tasa de validacion
    const validaciones = analisis?.filter(a => {
      const modulo = a.modulo_compromiso_pago as { desglose?: { validacion_cliente?: { tipo?: string } } }
      return modulo?.desglose?.validacion_cliente?.tipo === 'explicita'
    }) || []
    
    const tasaValidacion = analisis && analisis.length > 0
      ? validaciones.length / analisis.length
      : 0

    return {
      total_llamadas: totalLlamadas || 0,
      llamadas_hoy: llamadasHoy || 0,
      score_promedio: scorePromedio,
      cambio_score: 0, // TODO: calcular vs periodo anterior
      tasa_validacion: tasaValidacion,
      cambio_validacion: 0,
      probabilidad_promedio: probPromedio,
      cambio_probabilidad: 0,
      alertas_activas: alertasActivas || 0,
      monto_comprometido: 0 // TODO: sumar de transcripciones.entidades.montos
    }
  }, [])
}

// ---------- Tendencias ----------

export function useTendencias(dias = 7) {
  return useQuery<Array<{ fecha: string; llamadas: number; score: number; validacion: number }>>(async () => {
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('metricas_agregadas')
      .select('fecha, total_llamadas, score_promedio, tasa_validacion')
      .is('agente_id', null)
      .is('equipo', null)
      .gte('fecha', desde)
      .order('fecha')

    if (error) throw error

    return (data || []).map(m => ({
      fecha: new Date(m.fecha).toLocaleDateString('es', { weekday: 'short' }),
      llamadas: m.total_llamadas,
      score: m.score_promedio || 0,
      validacion: (m.tasa_validacion || 0) * 100
    }))
  }, [dias])
}

// ---------- Top Performers ----------

export function useTopPerformers(limit = 5) {
  return useQuery<Array<{
    agente_id: string
    nombre: string
    score: number
    llamadas: number
    validacion: number
    trend: 'up' | 'down' | 'stable'
  }>>(async () => {
    const { data, error } = await supabase
      .from('vista_resumen_agentes')
      .select('*')
      .not('score_semana', 'is', null)
      .order('score_semana', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map(a => ({
      agente_id: a.agente_id,
      nombre: a.nombre,
      score: a.score_semana || 0,
      llamadas: a.llamadas_semana || 0,
      validacion: (a.tasa_validacion_ultimo_reporte || 0) * 100,
      trend: 'stable' as const // TODO: calcular tendencia
    }))
  }, [limit])
}

