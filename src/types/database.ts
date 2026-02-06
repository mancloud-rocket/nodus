// ============================================
// NODUS - Database Types (Supabase)
// Tipos generados del schema de Supabase
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type EstadoProcesamiento = 'pendiente' | 'procesando' | 'transcrito' | 'analizado' | 'error'
export type NivelCumplimiento = 'baja' | 'media' | 'alta'
export type SeveridadAlerta = 'critica' | 'alta' | 'media' | 'baja'
export type EstadoAlerta = 'nueva' | 'en_revision' | 'resuelta' | 'falso_positivo'
export type EstadoAgente = 'activo' | 'inactivo' | 'vacaciones'
export type TipoAlerta = 'individual' | 'sistemica' | 'patron'

export interface Database {
  public: {
    Tables: {
      agentes: {
        Row: {
          agente_id: string
          nombre: string
          email: string | null
          avatar_url: string | null
          codigo_externo: string | null
          fecha_ingreso: string | null
          estado: EstadoAgente
          equipo: string | null
          supervisor_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          agente_id?: string
          nombre: string
          email?: string | null
          avatar_url?: string | null
          codigo_externo?: string | null
          fecha_ingreso?: string | null
          estado?: EstadoAgente
          equipo?: string | null
          supervisor_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          agente_id?: string
          nombre?: string
          email?: string | null
          avatar_url?: string | null
          codigo_externo?: string | null
          fecha_ingreso?: string | null
          estado?: EstadoAgente
          equipo?: string | null
          supervisor_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      registro_llamadas: {
        Row: {
          registro_id: string
          audio_url: string
          audio_id_externo: string | null
          timestamp_inicio: string
          timestamp_fin: string
          duracion_segundos: number | null
          timestamp_fecha: string | null
          agente_id: string
          cliente_ref: string
          campana: string | null
          tipo_deuda: string | null
          monto_deuda: number | null
          dias_mora: number | null
          estado: EstadoProcesamiento
          error_mensaje: string | null
          transcripcion_id: string | null
          analisis_id: string | null
          metadata_externa: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          registro_id?: string
          audio_url: string
          audio_id_externo?: string | null
          timestamp_inicio: string
          timestamp_fin: string
          duracion_segundos?: number | null
          timestamp_fecha?: string | null
          agente_id: string
          cliente_ref: string
          campana?: string | null
          tipo_deuda?: string | null
          monto_deuda?: number | null
          dias_mora?: number | null
          estado?: EstadoProcesamiento
          error_mensaje?: string | null
          transcripcion_id?: string | null
          analisis_id?: string | null
          metadata_externa?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          registro_id?: string
          audio_url?: string
          audio_id_externo?: string | null
          timestamp_inicio?: string
          timestamp_fin?: string
          duracion_segundos?: number | null
          timestamp_fecha?: string | null
          agente_id?: string
          cliente_ref?: string
          campana?: string | null
          tipo_deuda?: string | null
          monto_deuda?: number | null
          dias_mora?: number | null
          estado?: EstadoProcesamiento
          error_mensaje?: string | null
          transcripcion_id?: string | null
          analisis_id?: string | null
          metadata_externa?: Json
          created_at?: string
          updated_at?: string
        }
      }
      transcripciones: {
        Row: {
          transcripcion_id: string
          registro_id: string
          transcripcion_completa: string
          segmentos: Json
          entidades: Json
          metricas_conversacion: Json
          calidad_audio: Json
          modelo_transcripcion: string | null
          modelo_emociones: string | null
          modelo_entidades: string | null
          tiempo_procesamiento_ms: number | null
          created_at: string
        }
        Insert: {
          transcripcion_id?: string
          registro_id: string
          transcripcion_completa: string
          segmentos?: Json
          entidades?: Json
          metricas_conversacion?: Json
          calidad_audio?: Json
          modelo_transcripcion?: string | null
          modelo_emociones?: string | null
          modelo_entidades?: string | null
          tiempo_procesamiento_ms?: number | null
          created_at?: string
        }
        Update: {
          transcripcion_id?: string
          registro_id?: string
          transcripcion_completa?: string
          segmentos?: Json
          entidades?: Json
          metricas_conversacion?: Json
          calidad_audio?: Json
          modelo_transcripcion?: string | null
          modelo_emociones?: string | null
          modelo_entidades?: string | null
          tiempo_procesamiento_ms?: number | null
          created_at?: string
        }
      }
      analisis_llamadas: {
        Row: {
          analisis_id: string
          registro_id: string
          transcripcion_id: string
          agente_id: string
          score_total: number
          score_contacto_directo: number | null
          score_compromiso_pago: number | null
          modulo_contacto_directo: Json
          modulo_compromiso_pago: Json
          modulo_abandono: Json
          probabilidad_cumplimiento: number
          nivel_cumplimiento: NivelCumplimiento
          factores_prediccion: Json
          alertas: Json
          recomendaciones: Json
          modelo_usado: string | null
          version_prompt: string | null
          confianza_analisis: number | null
          tiempo_procesamiento_ms: number | null
          fecha_llamada: string
          created_at: string
        }
        Insert: {
          analisis_id?: string
          registro_id: string
          transcripcion_id: string
          agente_id: string
          score_total: number
          score_contacto_directo?: number | null
          score_compromiso_pago?: number | null
          modulo_contacto_directo?: Json
          modulo_compromiso_pago?: Json
          modulo_abandono?: Json
          probabilidad_cumplimiento: number
          nivel_cumplimiento: NivelCumplimiento
          factores_prediccion?: Json
          alertas?: Json
          recomendaciones?: Json
          modelo_usado?: string | null
          version_prompt?: string | null
          confianza_analisis?: number | null
          tiempo_procesamiento_ms?: number | null
          fecha_llamada: string
          created_at?: string
        }
        Update: {
          analisis_id?: string
          registro_id?: string
          transcripcion_id?: string
          agente_id?: string
          score_total?: number
          score_contacto_directo?: number | null
          score_compromiso_pago?: number | null
          modulo_contacto_directo?: Json
          modulo_compromiso_pago?: Json
          modulo_abandono?: Json
          probabilidad_cumplimiento?: number
          nivel_cumplimiento?: NivelCumplimiento
          factores_prediccion?: Json
          alertas?: Json
          recomendaciones?: Json
          modelo_usado?: string | null
          version_prompt?: string | null
          confianza_analisis?: number | null
          tiempo_procesamiento_ms?: number | null
          fecha_llamada?: string
          created_at?: string
        }
      }
      alertas_anomalias: {
        Row: {
          alerta_id: string
          tipo: TipoAlerta
          severidad: SeveridadAlerta
          categoria: string | null
          codigo: string | null
          descripcion: string
          causa_probable: string | null
          datos_soporte: Json
          impacto_estimado: Json
          accion_recomendada: Json
          registro_id: string | null
          agentes_relacionados: string[] | null
          estado: EstadoAlerta
          notificacion_enviada: boolean
          resuelto_por: string | null
          fecha_resolucion: string | null
          notas_resolucion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          alerta_id?: string
          tipo: TipoAlerta
          severidad: SeveridadAlerta
          categoria?: string | null
          codigo?: string | null
          descripcion: string
          causa_probable?: string | null
          datos_soporte?: Json
          impacto_estimado?: Json
          accion_recomendada?: Json
          registro_id?: string | null
          agentes_relacionados?: string[] | null
          estado?: EstadoAlerta
          notificacion_enviada?: boolean
          resuelto_por?: string | null
          fecha_resolucion?: string | null
          notas_resolucion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          alerta_id?: string
          tipo?: TipoAlerta
          severidad?: SeveridadAlerta
          categoria?: string | null
          codigo?: string | null
          descripcion?: string
          causa_probable?: string | null
          datos_soporte?: Json
          impacto_estimado?: Json
          accion_recomendada?: Json
          registro_id?: string | null
          agentes_relacionados?: string[] | null
          estado?: EstadoAlerta
          notificacion_enviada?: boolean
          resuelto_por?: string | null
          fecha_resolucion?: string | null
          notas_resolucion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coaching_reports: {
        Row: {
          reporte_id: string
          agente_id: string
          fecha_reporte: string
          periodo_inicio: string
          periodo_fin: string
          total_llamadas_analizadas: number
          metricas_periodo: Json
          comparativa_equipo: Json
          fortalezas: Json
          gap_critico: Json | null
          patrones: Json
          plan_mejora: Json
          progreso_vs_anterior: Json
          generado_por: string
          modelo_usado: string | null
          created_at: string
        }
        Insert: {
          reporte_id?: string
          agente_id: string
          fecha_reporte: string
          periodo_inicio: string
          periodo_fin: string
          total_llamadas_analizadas?: number
          metricas_periodo?: Json
          comparativa_equipo?: Json
          fortalezas?: Json
          gap_critico?: Json | null
          patrones?: Json
          plan_mejora?: Json
          progreso_vs_anterior?: Json
          generado_por?: string
          modelo_usado?: string | null
          created_at?: string
        }
        Update: {
          reporte_id?: string
          agente_id?: string
          fecha_reporte?: string
          periodo_inicio?: string
          periodo_fin?: string
          total_llamadas_analizadas?: number
          metricas_periodo?: Json
          comparativa_equipo?: Json
          fortalezas?: Json
          gap_critico?: Json | null
          patrones?: Json
          plan_mejora?: Json
          progreso_vs_anterior?: Json
          generado_por?: string
          modelo_usado?: string | null
          created_at?: string
        }
      }
      metricas_agregadas: {
        Row: {
          metrica_id: string
          fecha: string
          agente_id: string | null
          equipo: string | null
          campana: string | null
          total_llamadas: number
          duracion_total_segundos: number
          duracion_promedio_segundos: number
          score_promedio: number | null
          score_min: number | null
          score_max: number | null
          desviacion_estandar: number | null
          probabilidad_cumplimiento_promedio: number | null
          tasa_validacion: number | null
          llamadas_score_alto: number
          llamadas_score_medio: number
          llamadas_score_bajo: number
          llamadas_con_abandono: number
          tasa_abandono: number | null
          alertas_criticas: number
          alertas_altas: number
          alertas_medias: number
          created_at: string
          updated_at: string
        }
        Insert: {
          metrica_id?: string
          fecha: string
          agente_id?: string | null
          equipo?: string | null
          campana?: string | null
          total_llamadas?: number
          duracion_total_segundos?: number
          duracion_promedio_segundos?: number
          score_promedio?: number | null
          score_min?: number | null
          score_max?: number | null
          desviacion_estandar?: number | null
          probabilidad_cumplimiento_promedio?: number | null
          tasa_validacion?: number | null
          llamadas_score_alto?: number
          llamadas_score_medio?: number
          llamadas_score_bajo?: number
          llamadas_con_abandono?: number
          tasa_abandono?: number | null
          alertas_criticas?: number
          alertas_altas?: number
          alertas_medias?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          metrica_id?: string
          fecha?: string
          agente_id?: string | null
          equipo?: string | null
          campana?: string | null
          total_llamadas?: number
          duracion_total_segundos?: number
          duracion_promedio_segundos?: number
          score_promedio?: number | null
          score_min?: number | null
          score_max?: number | null
          desviacion_estandar?: number | null
          probabilidad_cumplimiento_promedio?: number | null
          tasa_validacion?: number | null
          llamadas_score_alto?: number
          llamadas_score_medio?: number
          llamadas_score_bajo?: number
          llamadas_con_abandono?: number
          tasa_abandono?: number | null
          alertas_criticas?: number
          alertas_altas?: number
          alertas_medias?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      vista_resumen_agentes: {
        Row: {
          agente_id: string
          nombre: string
          equipo: string | null
          estado: EstadoAgente
          llamadas_semana: number | null
          score_semana: number | null
          prob_cumplimiento_semana: number | null
          tasa_validacion_ultimo_reporte: number | null
        }
      }
    }
    Functions: {
      obtener_datos_coaching: {
        Args: { p_agente_id: string; p_periodo_dias?: number }
        Returns: Json
      }
      obtener_agentes_para_coaching: {
        Args: { p_periodo_dias?: number; p_min_llamadas?: number }
        Returns: {
          agente_id: string
          nombre: string
          equipo: string | null
          total_llamadas: number
          score_promedio: number
          tiene_reporte_anterior: boolean
        }[]
      }
      ejecutar_detector: {
        Args: { p_periodo_horas?: number; p_umbral_score?: number }
        Returns: {
          tipo: TipoAlerta
          severidad: SeveridadAlerta
          codigo: string
          descripcion: string
          agente_id: string | null
          agente_nombre: string | null
          equipo: string | null
          datos: Json
          accion_requerida: string
          es_nueva: boolean
        }[]
      }
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Alias types
export type Agente = Tables<'agentes'>
export type RegistroLlamada = Tables<'registro_llamadas'>
export type Transcripcion = Tables<'transcripciones'>
export type AnalisisLlamada = Tables<'analisis_llamadas'>
export type AlertaAnomalia = Tables<'alertas_anomalias'>
export type CoachingReport = Tables<'coaching_reports'>
export type MetricaAgregada = Tables<'metricas_agregadas'>
export type ResumenAgente = Views<'vista_resumen_agentes'>




