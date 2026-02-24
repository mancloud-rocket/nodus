"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { llamadasService, type Llamada } from '../../services/llamadasService';
import { Upload, FileAudio, CheckCircle, Clock, X, RefreshCw, AlertTriangle, Play, FileText, Activity, Trash2 } from 'lucide-react';

// --- 2. SUB-COMPONENTES ---

const UploadZone = ({ onUpload, isUploading }: { onUpload: (file: File, rut: string, nombre: string) => void, isUploading: boolean }) => {
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');

  const handleFileChange = (e: any) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    
    if (!rut.trim() || !nombre.trim()) {
      alert("⚠️ Por favor ingresa el RUT y Nombre del cliente antes de subir la auditoría.");
      e.target.value = ''; // Resetea el input
      return;
    }
    
    onUpload(archivo, rut, nombre);
    // Limpiamos después de subir
    setRut('');
    setNombre('');
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8 text-center transition-all">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Nodus Audio Intelligence</h2>
      <p className="text-gray-500 mb-6">Sube una llamada de audio para análisis</p>
      
      {/* Inputs del Cliente */}
      <div className="flex flex-col md:flex-row gap-4 justify-center max-w-2xl mx-auto mb-6">
        <input 
          type="text" 
          placeholder="RUT Cliente (ej: 12345678-9)" 
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-blue-500"
          disabled={isUploading}
        />
        <input 
          type="text" 
          placeholder="Nombre del Cliente" 
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-blue-500"
          disabled={isUploading}
        />
      </div>

      {/* Botón de Subida */}
      <div className="relative inline-block">
          <input 
            type="file" 
            accept="audio/*" 
            onChange={handleFileChange} 
            className="hidden" 
            id="subir-audio" 
            disabled={isUploading}
          />
          <label 
            htmlFor="subir-audio" 
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-medium cursor-pointer transition-all 
              ${isUploading || !rut || !nombre
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transform active:scale-95'}`}
          >
            {isUploading ? <RefreshCw className="animate-spin" /> : <Upload size={20} />}
            {isUploading ? "Procesando en Saturn..." : "Iniciar Auditoría"}
          </label>
      </div>
    </div>
  );
};

const StatusBadge = ({ estado }: { estado: string }) => {
  const styles = {
    finalizado: 'bg-green-100 text-green-700 border-green-200',
    pendiente: 'bg-gray-100 text-gray-600 border-gray-200',
    error: 'bg-red-100 text-red-600 border-red-200',
    default: 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse'
  };
  // @ts-ignore
  const currentStyle = styles[estado] || styles.default;
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${currentStyle}`}>
      {estado === 'finalizado' ? <CheckCircle size={14}/> : <Clock size={14}/>}
      {estado}
    </span>
  );
};

const LlamadaCard = ({ llamada, onClick, onDelete }: { 
  llamada: Llamada, 
  onClick: () => void, 
  onDelete: (id: string) => void 
}) => (
  <div 
    onClick={onClick}
    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-400 cursor-pointer transition-all group relative"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full transition-colors ${llamada.estado === 'finalizado' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
        <FileAudio size={24} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
          {llamada.nombre_archivo || 'Audio sin nombre'}
        </h3>
        <p className="text-xs text-gray-400 font-mono">
          {new Date(llamada.created_at).toLocaleString()}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-6">
      <StatusBadge estado={llamada.estado} />
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          // USAMOS registro_id AQUI TAMBIEN
          if(confirm('¿Eliminar registro?')) onDelete(llamada.registro_id);
        }}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
        title="Eliminar registro"
      >
        <Trash2 size={18} />
      </button>

      <div className="text-right min-w-[60px]">
        {llamada.puntaje_calidad && (
          <span className="text-xl font-bold text-gray-900">{llamada.puntaje_calidad}</span>
        )}
      </div>
    </div>
  </div>
);

const DetalleModal = ({ llamada, onClose }: { llamada: Llamada, onClose: () => void }) => {
  if (!llamada) return null;
  const isProcessing = llamada.estado !== 'finalizado' && llamada.estado !== 'error';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{llamada.nombre_archivo}</h3>
            <div className="mt-2 flex gap-2">
               <StatusBadge estado={llamada.estado} />
               {/* USAMOS registro_id AQUI */}
               <span className="text-xs text-gray-400 flex items-center">ID: {llamada.registro_id.slice(0,8)}...</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 text-gray-500 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
              <RefreshCw className="w-20 h-20 text-blue-600 animate-spin" />
              <h4 className="text-2xl font-bold text-gray-800">Analizando Llamada...</h4>
            </div>
          ) : (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* ... resto de tu UI ... */}
                 <div className="p-4 bg-gray-50 rounded border">
                    <p className="text-sm font-bold">Resumen</p>
                    <p>{llamada.resumen_ejecutivo || "Sin resumen"}</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 3. COMPONENTE PRINCIPAL ---

export default function GestorLlamadas() {
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  
  // 1. INICIALIZAMOS EL HOOK DE NAVEGACIÓN
  const navigate = useNavigate(); 

  useEffect(() => {
    cargarDatos();
    
    // Configuración de Realtime (Mantener igual)
    const channel = supabase
      .channel('gestor-llamadas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registro_llamadas' }, () => {
        cargarDatos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await llamadasService.getAll();
      // @ts-ignore
      if (data) setLlamadas(data);
    } catch (error) {
      console.error("Error cargando llamadas:", error);
    }
  };

  const handleUpload = async (archivo: File, rut: string, nombre: string) => {
    setSubiendo(true);
    try {
      // Le pasamos los nuevos datos al servicio
      await llamadasService.uploadAndCreate(archivo, rut, nombre); 
      await cargarDatos();
    } catch (error) {
      alert("Error al subir: " + error);
    } finally {
      setSubiendo(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await llamadasService.deleteLlamada(id); // Asegúrate de tener este método en el service, o usa supabase directo
      cargarDatos();
    } catch (error) {
      alert("Error al borrar");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
      
      {/* ZONA DE CARGA */}
      <UploadZone onUpload={handleUpload} isUploading={subiendo} />

      <div className="space-y-4">
        <div className="flex justify-between items-end mb-4 px-2">
          <h3 className="text-xl font-bold text-gray-800">Historial de Auditorías</h3>
          <span className="text-sm text-gray-400">{llamadas.length} registros</span>
        </div>
        
        {/* LISTA DE LLAMADAS */}
        <div className="grid gap-3">
          {llamadas.map((llamada) => (
            <LlamadaCard 
              key={llamada.registro_id} 
              llamada={llamada} 
              
              // 2. CAMBIO CLAVE: AHORA NAVEGAMOS A LA PÁGINA DE DETALLE
              onClick={() => navigate(`/llamadas/${llamada.registro_id}`)}
              
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* 3. ELIMINAMOS EL MODAL (Ya no se usa) */}
    </div>
  );
}