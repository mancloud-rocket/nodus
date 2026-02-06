// ============================================
// NODUS - Supabase Realtime Hook
// Suscripciones en tiempo real
// ============================================

import { useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { AlertaAnomalia, AnalisisLlamada, CoachingReport, RegistroLlamada } from '@/types/database'

// ---------- Types ----------

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

interface RealtimeCallbacks {
  onNuevaAlerta?: (alerta: AlertaAnomalia) => void
  onAlertaActualizada?: (alerta: AlertaAnomalia) => void
  onNuevoAnalisis?: (analisis: AnalisisLlamada) => void
  onNuevoCoachingReport?: (report: CoachingReport) => void
  onLlamadaActualizada?: (llamada: RegistroLlamada) => void
}

// ---------- Main Hook ----------

export function useRealtime(callbacks: RealtimeCallbacks) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  const setupChannel = useCallback(() => {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping realtime setup')
      return null
    }

    // Crear canal con nombre unico
    const channel = supabase.channel('nodus-realtime', {
      config: {
        broadcast: { self: true }
      }
    })

    // Suscribirse a alertas_anomalias
    channel.on<AlertaAnomalia>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'alertas_anomalias'
      },
      (payload: RealtimePostgresChangesPayload<AlertaAnomalia>) => {
        if (payload.new && callbacks.onNuevaAlerta) {
          callbacks.onNuevaAlerta(payload.new as AlertaAnomalia)
        }
      }
    )

    channel.on<AlertaAnomalia>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'alertas_anomalias'
      },
      (payload: RealtimePostgresChangesPayload<AlertaAnomalia>) => {
        if (payload.new && callbacks.onAlertaActualizada) {
          callbacks.onAlertaActualizada(payload.new as AlertaAnomalia)
        }
      }
    )

    // Suscribirse a analisis_llamadas
    channel.on<AnalisisLlamada>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'analisis_llamadas'
      },
      (payload: RealtimePostgresChangesPayload<AnalisisLlamada>) => {
        if (payload.new && callbacks.onNuevoAnalisis) {
          callbacks.onNuevoAnalisis(payload.new as AnalisisLlamada)
        }
      }
    )

    // Suscribirse a coaching_reports
    channel.on<CoachingReport>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'coaching_reports'
      },
      (payload: RealtimePostgresChangesPayload<CoachingReport>) => {
        if (payload.new && callbacks.onNuevoCoachingReport) {
          callbacks.onNuevoCoachingReport(payload.new as CoachingReport)
        }
      }
    )

    // Suscribirse a registro_llamadas (updates de estado)
    channel.on<RegistroLlamada>(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'registro_llamadas'
      },
      (payload: RealtimePostgresChangesPayload<RegistroLlamada>) => {
        if (payload.new && callbacks.onLlamadaActualizada) {
          callbacks.onLlamadaActualizada(payload.new as RegistroLlamada)
        }
      }
    )

    return channel
  }, [callbacks])

  useEffect(() => {
    const channel = setupChannel()
    
    if (channel) {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime connection error')
        }
      })
      
      channelRef.current = channel
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [setupChannel])

  return {
    isConnected: !!channelRef.current
  }
}

// ---------- Specific Table Hooks ----------

export function useAlertasRealtime(onNueva: (alerta: AlertaAnomalia) => void) {
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase
      .channel('alertas-changes')
      .on<AlertaAnomalia>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertas_anomalias'
        },
        (payload) => {
          if (payload.new) {
            onNueva(payload.new as AlertaAnomalia)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onNueva])
}

export function useAnalisisRealtime(onNuevo: (analisis: AnalisisLlamada) => void) {
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase
      .channel('analisis-changes')
      .on<AnalisisLlamada>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analisis_llamadas'
        },
        (payload) => {
          if (payload.new) {
            onNuevo(payload.new as AnalisisLlamada)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onNuevo])
}

// ---------- Presence Hook (opcional) ----------

interface PresenceState {
  odersOnline: number
  users: Array<{ id: string; name: string; lastSeen: string }>
}

export function usePresence(userId: string, userName: string) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId
        }
      }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.log('Users online:', Object.keys(state).length)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            user_name: userName,
            online_at: new Date().toISOString()
          })
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId, userName])

  return { channel: channelRef.current }
}




