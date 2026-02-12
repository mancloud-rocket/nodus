"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Asegúrate que esta ruta sea correcta
import { llamadasService } from '../../services/llamadasService';
import { Upload, FileAudio, CheckCircle, Clock, X, RefreshCw, AlertTriangle, Play, FileText, Activity } from 'lucide-react';

// --- 1. DEFINICIÓN DE TIPOS (El contrato de datos) ---
interface Llamada {
  id: string;
  nombre_archivo: string;
  estado: 'pendiente' | 'transcribiendo' | 'analizando' | 'finalizado' | 'error';
  created_at: string;
  transcripcion_texto?: string;
  resumen_ejecutivo?: string;
  puntaje_calidad?: number;
  sentimiento?: string;
  hizo_cierre_venta?: boolean;
}

// --- 2. SUB-COMPONENTES (Las piezas de Lego) ---

// A. Botón de Subida
const UploadZone = ({ onUpload, isUploading }: { onUpload: (e: any) => void, isUploading: boolean }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8 text-center transition-all hover:shadow-md">
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Nodus Audio Intelligence</h2>
    <p className="text-gray-500 mb-6">Sube una llamada para que los Agentes la analicen en tiempo real</p>
    
    <div className="relative inline-block">
        <input 
          type="file" 
          accept="audio/*" 
          onChange={onUpload} 
          className="hidden" 
          id="subir-audio" 
          disabled={isUploading}
        />
        <label 
          htmlFor="subir-audio" 
          className={`flex items-center gap-3 px-8 py-4 rounded-full font-medium cursor-pointer transition-all transform active:scale-95
            ${isUploading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'}`}
        >
          {isUploading ? <RefreshCw className="animate-spin" /> : <Upload size={20} />}
          {isUploading ? "Procesando..." : "Nueva Auditoría"}
        </label>
    </div>
  </div>
);

// B. Badge de Estado (Componente visual pequeño)
const StatusBadge = ({ estado }: { estado: string }) => {
  const styles = {
    finalizado: 'bg-green-100 text-green-700 border-green-200',
    pendiente: 'bg-gray-100 text-gray-600 border-gray-200',
    error: 'bg-red-100 text-red-600 border-red-200',
    default: 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse' // Para transcribiendo/analizando
  };
  
  const currentStyle = styles[estado as keyof typeof styles] || styles.default;
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${currentStyle}`}>
      {estado === 'finalizado' ? <CheckCircle size={14}/> : <Clock size={14}/>}
      {estado}
    </span>
  );
};

// C. Tarjeta de Llamada Individual
const LlamadaCard = ({ llamada, onClick }: { llamada: Llamada, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-400 cursor-pointer transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full transition-colors ${llamada.estado === 'finalizado' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
        <FileAudio size={24} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
          {llamada.nombre_archivo}
        </h3>
        <p className="text-xs text-gray-400 font-mono">
          {new Date(llamada.created_at).toLocaleString()}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-6">
      <StatusBadge estado={llamada.estado} />
      
      <div className="text-right min-w-[60px]">
        {llamada.puntaje_calidad !== undefined ? (
          <>
            <div className={`text-2xl font-bold ${llamada.puntaje_calidad < 70 ? 'text-red-500' : 'text-gray-900'}`}>
              {llamada.puntaje_calidad}%
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold">Calidad</div>
          </>
        ) : (
          <div className="text-gray-300">-</div>
        )}
      </div>
    </div>
  </div>
);

// D. Modal de Detalles (El cerebro visual)
const DetalleModal = ({ llamada, onClose }: { llamada: Llamada, onClose: () => void }) => {
  if (!llamada) return null;

  const isProcessing = llamada.estado !== 'finalizado' && llamada.estado !== 'error';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{llamada.nombre_archivo}</h3>
            <div className="mt-2 flex gap-2">
               <StatusBadge estado={llamada.estado} />
               <span className="text-xs text-gray-400 flex items-center">ID: {llamada.id.slice(0,8)}...</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 text-gray-500 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto flex-1">
          {isProcessing ? (
            // PANTALLA DE CARGA
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
                <RefreshCw className="w-20 h-20 text-blue-600 animate-spin relative z-10" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-800">Analizando Llamada...</h4>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                  Nuestros agentes están transcribiendo el audio y evaluando la calidad del servicio.
                </p>
              </div>
              <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-2/3 animate-[shimmer_1.5s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)]"></div>
              </div>
            </div>
          ) : (
            // PANTALLA DE RESULTADOS
            <div className="p-8 space-y-8">
              {/* KPIs Principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
                  <Activity className="text-blue-500 mb-2" size={24} />
                  <div className="text-sm text-blue-600 font-bold uppercase">Sentimiento</div>
                  <div className="text-xl font-bold text-gray-900 mt-1 capitalize">{llamada.sentimiento || "Neutro"}</div>
                </div>
                <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col items-center justify-center text-center">
                  <CheckCircle className="text-purple-500 mb-2" size={24} />
                  <div className="text-sm text-purple-600 font-bold uppercase">Cierre Venta</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">
                    {llamada.hizo_cierre_venta ? "Exitoso" : "No Concretado"}
                  </div>
                </div>
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center">
                  <div className="text-amber-500 text-3xl font-black mb-0">{llamada.puntaje_calidad || 0}</div>
                  <div className="text-xs text-amber-700 font-bold uppercase mt-1">Puntaje General</div>
                </div>
              </div>

              {/* Análisis Detallado */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                  <FileText className="text-gray-400" size={20}/> 
                  Resumen del Coach
                </h4>
                <div className="p-6 bg-gray-50 rounded-2xl text-gray-700 leading-relaxed border border-gray-100 text-lg">
                  {llamada.resumen_ejecutivo || "No se generó resumen."}
                </div>
              </div>

              {/* Transcripción */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-400">Transcripción</h4>
                <div className="p-4 bg-white rounded-xl text-gray-600 text-sm h-64 overflow-y-auto font-mono border border-gray-200 leading-relaxed shadow-inner">
                  {llamada.transcripcion_texto || "Texto no disponible."}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- 3. COMPONENTE PRINCIPAL (El Director de Orquesta) ---
export default function GestorLlamadas() {
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Llamada | null>(null);

  // Carga inicial y Suscripción Realtime
  useEffect(() => {
    cargarDatos();
    
    // Suscripción a cambios en la base de datos
    const channel = supabase
      .channel('gestor-llamadas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registro_llamadas' }, (payload) => {
        // 1. Actualizar la lista general
        cargarDatos();

        // 2. Si tenemos el modal abierto de esa llamada, actualizamos sus datos en vivo
        if (selectedCall?.id === payload.new.id) {
            setSelectedCall(payload.new as Llamada);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedCall]); // Dependencia importante para que el modal se refresque

  const cargarDatos = async () => {
    try {
      const data = await llamadasService.getAll();
      if (data) setLlamadas(data as Llamada[]);
    } catch (error) {
      console.error("Error cargando llamadas:", error);
    }
  };

  const handleUpload = async (e: any) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    
    setSubiendo(true);
    try {
      // 1. Subir y crear registro
      const nuevaLlamada = await llamadasService.uploadAndCreate(archivo);
      
      // 2. Refrescar lista
      await cargarDatos();
      
      // 3. Abrir modal automáticamente para ver el progreso
      setSelectedCall(nuevaLlamada as Llamada);
      
    } catch (error) {
      alert("Error al subir el archivo");
      console.error(error);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
      
      {/* Sección Superior: Upload */}
      <UploadZone onUpload={handleUpload} isUploading={subiendo} />

      {/* Sección Inferior: Lista */}
      <div className="space-y-4">
        <div className="flex justify-between items-end mb-4 px-2">
          <h3 className="text-xl font-bold text-gray-800">Historial de Auditorías</h3>
          <span className="text-sm text-gray-400">{llamadas.length} registros</span>
        </div>
        
        {llamadas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No hay llamadas registradas aún. Sube la primera arriba.
          </div>
        ) : (
          <div className="grid gap-3">
            {llamadas.map((llamada) => (
              <LlamadaCard 
                key={llamada.id} 
                llamada={llamada} 
                onClick={() => setSelectedCall(llamada)} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {selectedCall && (
        <DetalleModal 
          llamada={selectedCall} 
          onClose={() => setSelectedCall(null)} 
        />
      )}
    </div>
  );
}