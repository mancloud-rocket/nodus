// src/hooks/useRealtime.ts
// ============================================
// NODUS - Supabase Realtime Hook (Blindado)
// ============================================

import { useEffect, useRef, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { AlertaAnomalia, AnalisisLlamada, CoachingReport, RegistroLlamada } from '@/types/database'

// ---------- Interfaces ----------

interface RealtimeCallbacks {
  onNuevaAlerta?: (alerta: AlertaAnomalia) => void
  onAlertaActualizada?: (alerta: AlertaAnomalia) => void
  onNuevoAnalisis?: (analisis: AnalisisLlamada) => void
  onNuevoCoachingReport?: (report: CoachingReport) => void
  onLlamadaActualizada?: (llamada: RegistroLlamada) => void
}

// ---------- Hook Principal (El que usa el Dashboard) ----------

export function useRealtime(callbacks: RealtimeCallbacks) {
  // 1. EL TRUCO MAESTRO: Guardamos los callbacks en una referencia
  // Esto evita que React reinicie la conexión cada vez que renderiza
  const callbacksRef = useRef(callbacks);

  // Actualizamos la referencia en cada render silenciosamente
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Conexión única
    const channel = supabase.channel('nodus-global-channel');

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas_anomalias' }, 
        (payload) => callbacksRef.current.onNuevaAlerta?.(payload.new as AlertaAnomalia)
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alertas_anomalias' }, 
        (payload) => callbacksRef.current.onAlertaActualizada?.(payload.new as AlertaAnomalia)
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analisis_llamadas' }, 
        (payload) => callbacksRef.current.onNuevoAnalisis?.(payload.new as AnalisisLlamada)
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'coaching_reports' }, 
        (payload) => callbacksRef.current.onNuevoCoachingReport?.(payload.new as CoachingReport)
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'registro_llamadas' }, 
        (payload) => callbacksRef.current.onLlamadaActualizada?.(payload.new as RegistroLlamada)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []); // Array vacío = Solo se ejecuta UNA vez al montar

  return { isConnected: true };
}

// ---------- Hooks Específicos (Restaurados y Blindados) ----------

export function useAlertasRealtime(onNueva: (alerta: AlertaAnomalia) => void) {
  const onNuevaRef = useRef(onNueva);
  useEffect(() => { onNuevaRef.current = onNueva; });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('alertas-specific')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas_anomalias' },
        (payload) => onNuevaRef.current(payload.new as AlertaAnomalia)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
}

export function useAnalisisRealtime(onNuevo: (analisis: AnalisisLlamada) => void) {
  const onNuevoRef = useRef(onNuevo);
  useEffect(() => { onNuevoRef.current = onNuevo; });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('analisis-specific')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analisis_llamadas' },
        (payload) => onNuevoRef.current(payload.new as AnalisisLlamada)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
}

// ---------- Hook de Presencia (Usuarios Online) ----------

export function usePresence(userId: string, userName: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          user_name: userName,
          online_at: new Date().toISOString()
        });
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [userId, userName]); // Aquí sí permitimos reconexión si cambia el usuario

  return { channel: channelRef.current };
}