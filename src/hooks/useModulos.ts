import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// ============================================
// Types para las vistas de modulos
// ============================================

export interface ModulosGlobal {
  fecha: string
  total_llamadas: number
  avg_contacto_directo: number | null
  avg_compromiso_pago: number | null
  tasa_abandono: number | null
  avg_score_total: number | null
  avg_probabilidad: number | null
  pct_validacion_cliente: number | null
}

export interface CompromisoElementos {
  categoria: string
  orden: number
  total_llamadas: number
  prob_promedio: number | null
  score_promedio: number | null
  porcentaje_del_total: number | null
}

export interface AbandonoDetalle {
  momento_rango: string
  razon: string
  iniciado_por: string
  total: number
  porcentaje: number | null
}

export interface AbandonoKPI {
  kpi: string
  valor: number
  porcentaje_abandonos: number | null
  porcentaje_total: number | null
}

export interface AgenteModulos {
  agente_id: string
  agente_nombre: string
  equipo: string | null
  estado: string
  total_llamadas: number
  score_contacto: number | null
  score_compromiso: number | null
  tasa_abandono: number | null
  pct_validacion: number | null
  score_total: number | null
  prob_cumplimiento: number | null
  ranking_score: number
  ranking_prob: number
}

export interface EvolucionSemanal {
  semana: string
  total_llamadas: number
  score_total: number | null
  score_contacto: number | null
  score_compromiso: number | null
  tasa_validacion: number | null
  tasa_abandono: number | null
  prob_cumplimiento: number | null
  score_total_anterior: number | null
  prob_anterior: number | null
}

export interface FlujoProbabilidad {
  paso: string
  orden: number
  prob_teorica: number
  prob_real: number | null
  n: number
}

export interface ContactoDetalle {
  variable: string
  peso_maximo: number
  puntos_promedio: number | null
  pct_cumplimiento: number | null
  total_llamadas: number
}

export interface KPIPrincipal {
  kpi: string
  valor: number | null
  valor_anterior: number | null
  cambio: number | null
}

// ============================================
// Hooks
// ============================================

function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const result = await queryFn()
      setData(result)
      setError(null)
    } catch (e) {
      setError(e as Error)
      console.error('Query error:', e)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// Hook: KPIs principales
export function useKPIsPrincipales() {
  return useQuery<KPIPrincipal[]>(async () => {
    const { data, error } = await supabase
      .from('vista_kpis_principales')
      .select('*')

    if (error) throw error
    return data || []
  }, [])
}

// Hook: Modulos global por dia
export function useModulosGlobal(dias = 30) {
  return useQuery<ModulosGlobal[]>(async () => {
    const { data, error } = await supabase
      .from('vista_modulos_global')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(dias)

    if (error) throw error
    return data || []
  }, [dias])
}

// Hook: Compromiso por elementos
export function useCompromisoElementos() {
  return useQuery<CompromisoElementos[]>(async () => {
    const { data, error } = await supabase
      .from('vista_compromiso_elementos')
      .select('*')
      .order('orden', { ascending: true })

    if (error) throw error
    return data || []
  }, [])
}

// Hook: Detalle de abandonos
export function useAbandonosDetalle() {
  return useQuery<AbandonoDetalle[]>(async () => {
    const { data, error } = await supabase
      .from('vista_abandonos_detalle')
      .select('*')
      .order('total', { ascending: false })

    if (error) throw error
    return data || []
  }, [])
}

// Hook: KPIs de abandono
export function useAbandonoKPIs() {
  return useQuery<AbandonoKPI[]>(async () => {
    const { data, error } = await supabase
      .from('vista_abandono_kpis')
      .select('*')

    if (error) throw error
    return data || []
  }, [])
}

// Hook: Agentes con modulos
export function useAgentesModulos() {
  return useQuery<AgenteModulos[]>(async () => {
    const { data, error } = await supabase
      .from('vista_agente_modulos')
      .select('*')
      .order('score_total', { ascending: false })

    if (error) throw error
    return data || []
  }, [])
}

// Hook: Evolucion semanal
export function useEvolucionSemanal() {
  return useQuery<EvolucionSemanal[]>(async () => {
    const { data, error } = await supabase
      .from('vista_evolucion_semanal')
      .select('*')
      .order('semana', { ascending: true })

    if (error) throw error
    return data || []
  }, [])
}

// Hook: Flujo de probabilidad
export function useFlujoProbabilidad() {
  return useQuery<FlujoProbabilidad[]>(async () => {
    const { data, error } = await supabase
      .from('vista_flujo_probabilidad')
      .select('*')
      .order('orden', { ascending: true })

    if (error) throw error
    return data || []
  }, [])
}

// Hook: Detalle de contacto directo
export function useContactoDetalle() {
  return useQuery<ContactoDetalle[]>(async () => {
    const { data, error } = await supabase
      .from('vista_contacto_detalle')
      .select('*')

    if (error) throw error
    return data || []
  }, [])
}

// Hook combinado para la pagina Overview
export function useModulosOverview() {
  const kpis = useKPIsPrincipales()
  const evolucion = useEvolucionSemanal()
  const agentes = useAgentesModulos()
  const elementos = useCompromisoElementos()

  return {
    kpis: kpis.data,
    evolucion: evolucion.data,
    agentes: agentes.data,
    elementos: elementos.data,
    loading: kpis.loading || evolucion.loading || agentes.loading || elementos.loading,
    refetch: () => {
      kpis.refetch()
      evolucion.refetch()
      agentes.refetch()
      elementos.refetch()
    }
  }
}




