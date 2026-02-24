import { supabase } from '../lib/supabase';

// 1. Definimos la estructura del JSON "Exquisito" del Agente
export interface AnalisisAgent {
  score_final: number;
  error_critico: boolean;
  detalle_error: string;
  transcripcion: string;
  resumen_ejecutivo: string;
  tips: string[];
  hitos: {
    presentacion: { cumple: boolean; note: string };
    comunicacion: { cumple: boolean; note: string };
    negociacion:  { cumple: boolean; note: string };
    cierre:       { cumple: boolean; note: string };
  };
  compromiso_pago?: {
    monto: number;
    fecha: string;
    metodo: string;
  };
}

// 2. Actualizamos la interfaz principal de la Llamada
export interface Llamada {
  registro_id: string;
  audio_url: string;
  nombre_archivo: string;
  estado: 'pendiente' | 'transcribiendo' | 'analizando' | 'finalizado' | 'error';
  created_at: string;
  puntaje_calidad?: number;
  resumen_ejecutivo?: string;
  transcripcion_texto?: string;
  analisis_json?: AnalisisAgent; 
  agente?: { nombre: string };
  cliente_ref?: string;
  rut_cliente?: string;
  nombre_cliente?: string;
  tips?: string[];
}

export const llamadasService = {

  // 👇 MÉTODO PRINCIPAL: Subir audio, crear registro y AVISAR A SATURN
 async uploadAndCreate(file: File, rutCliente?: string, nombreCliente?: string) {
    console.log("🚀 PASO 1: Iniciando subida del archivo...", file.name);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `audios_demo/${fileName}`;

    // --- SUBIDA A STORAGE ---
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audios') 
      .upload(filePath, file);

    if (uploadError) {
      console.error("❌ FALLÓ EL PASO 1 (Storage):", uploadError);
      throw uploadError;
    }
    console.log("✅ PASO 1 COMPLETADO: Audio subido al bucket.");

    // --- OBTENER URL ---
    console.log("🔍 PASO 2: Obteniendo URL pública...");
    const { data: publicUrlData } = supabase.storage
      .from('audios')
      .getPublicUrl(filePath);
    console.log("✅ PASO 2 COMPLETADO: URL obtenida ->", publicUrlData.publicUrl);

    // --- INSERTAR EN BD ---
    console.log("💾 PASO 3: Intentando guardar en la tabla registro_llamadas...");
    const { data, error: dbError } = await supabase
      .from('registro_llamadas')
      .insert([
        {
          audio_url: publicUrlData.publicUrl,
          nombre_archivo: file.name,
          estado: 'pendiente',
          rut_cliente: rutCliente || 'Sin RUT',
          nombre_cliente: nombreCliente || 'Cliente Desconocido'
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error("❌ FALLÓ EL PASO 3 (Base de Datos):", dbError);
      throw dbError;
    }
    console.log("✅ PASO 3 COMPLETADO: Registro creado con ID ->", data?.registro_id);

    // --- TIMBRE A SATURN ---
    console.log("🔔 PASO 4: Tocando el timbre a Saturn...");
    try {
      await fetch('https://studio.rocketbot.com/webhook/3fcfa3e52c9c39a2ce27a93e74bcd0ea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registro_id: data.registro_id,
          audio_url: publicUrlData.publicUrl
        })
      });
      console.log("✅ PASO 4 COMPLETADO: Saturn notificado.");
    } catch (webhookError) {
      console.warn("⚠️ EL TIMBRE FALLÓ (Pero lo demás funcionó):", webhookError);
    }

    return data;
  },

  // Eliminar una llamada
  async deleteLlamada(id: string) {
    const { error } = await supabase
      .from('registro_llamadas')
      .delete()
      .eq('registro_id', id);
      
    if (error) throw error;
    return true;
  },

  // Obtener todas las llamadas
  async getAll() {
    const { data, error } = await supabase
      .from('registro_llamadas')
      .select('*, agentes(nombre)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener una sola llamada por ID para la vista de detalle
  async getById(id: string) {
    const { data, error } = await supabase
      .from('registro_llamadas')
      .select('*, agentes(nombre)')
      .eq('registro_id', id)
      .single();

    if (error) throw error;
    return data as Llamada;
  }
};