import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { llamadasService, Llamada } from '../services/llamadasService';
import { 
  Brain, Lock, CheckCircle, XCircle, Play, Pause, ChevronLeft, 
  User, DollarSign, Calendar, CreditCard, TrendingUp, AlertTriangle, Activity 
} from 'lucide-react'; 

export default function DetalleLlamada() {
  const { id } = useParams<{ id: string }>();
  const [llamada, setLlamada] = useState<Llamada | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    llamadasService.getById(id)
      .then(setLlamada)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-20 text-center text-gray-500">Cargando la magia de Saturn... 🪐</div>;
  if (!llamada) return <div className="p-20 text-center">No pillamos la llamada, hermano 😔</div>;

  let datos = {} as any;
  
  try {
    if (typeof llamada.analisis_json === 'string') {
      const cleanString = (llamada.analisis_json as any).replace(/```json\n?/g, '').replace(/```/g, '').trim();
      datos = JSON.parse(cleanString);
    } else {
      datos = llamada.analisis_json || {};
    }
  } catch (error) {
    console.error("Saturn mandó un JSON inválido:", error);
    datos = {}; 
  }

  const hitos = datos.hitos || {};
  const coaching = datos.coaching || {};
  const compromiso = datos.compromiso_pago;
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      
      {/* 1. HEADER Y DATOS DEL CLIENTE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Link to="/llamadas" className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 border">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Auditoría de Llamada</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
              <User size={14} /> 
              {llamada.nombre_cliente || 'Cliente Desconocido'} | RUT: {llamada.rut_cliente || 'Sin RUT'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Score General</p>
            <p className={`text-3xl font-black ${datos.score_final >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
              {datos.score_final || 0}%
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full font-bold text-sm border ${
            llamada.estado === 'finalizado' 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
          }`}>
            {llamada.estado.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ALERTA CRÍTICA (Solo aparece si el agente detectó algo grave) */}
      {datos.error_critico && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-3" size={24} />
            <div>
              <h3 className="text-red-800 font-bold">ERROR CRÍTICO DETECTADO</h3>
              <p className="text-red-700">{datos.detalle_error}</p>
            </div>
          </div>
        </div>
      )}

      {/* RESUMEN EJECUTIVO */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-2 text-gray-800 flex items-center gap-2">
          <Activity size={20} className="text-blue-500" />
          Resumen de Gestión
        </h3>
        <p className="text-gray-600 leading-relaxed text-sm">
          {datos.resumen_ejecutivo || "Esperando resumen..."}
        </p>
      </div>

      {/* COMPROMISO DE PAGO (Tarjeta Premium) */}
      {compromiso && compromiso.monto > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-2xl shadow-lg text-white flex justify-between items-center transform hover:scale-[1.01] transition-all">
          <div>
            <h4 className="font-bold mb-1 flex items-center gap-2">
              <CheckCircle size={20} /> COMPROMISO DE PAGO ACORDADO
            </h4>
            <p className="text-emerald-100 text-sm">El cliente regularizará su deuda pronto.</p>
          </div>
          <div className="text-right flex items-center gap-6">
            <div className="border-r border-emerald-400 pr-6">
              <p className="text-sm font-medium text-emerald-100 uppercase tracking-wide flex items-center justify-end gap-1"><DollarSign size={14}/> Monto</p>
              <p className="text-3xl font-bold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(compromiso.monto)}</p>
            </div>
            <div className="border-r border-emerald-400 pr-6">
              <p className="text-sm font-medium text-emerald-100 uppercase tracking-wide flex items-center justify-end gap-1"><Calendar size={14}/> Fecha</p>
              <p className="text-xl font-bold">{compromiso.fecha}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-100 uppercase tracking-wide flex items-center justify-end gap-1"><CreditCard size={14}/> Canal</p>
              <p className="text-xl font-bold">{compromiso.metodo}</p>
            </div>
          </div>
        </div>
      )}

      {/* LOS HITOS DEL EXCEL (Métricas) */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Evaluación de Protocolo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(hitos).map(([nombreHito, data]: any) => (
          <div key={nombreHito} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${data.cumple ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-700 capitalize text-sm">{nombreHito}</h4>
              {data.cumple 
                ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold flex gap-1"><CheckCircle size={14}/> CUMPLE</span>
                : <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold flex gap-1"><XCircle size={14}/> NO CUMPLE</span>
              }
            </div>
            <p className="text-xs text-gray-500 mt-2">{data.nota || data.note || "Sin observaciones"}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* COLUMNA IZQUIERDA: TRANSCRIPCIÓN (Chat Style) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-gray-800 flex justify-between items-center border-b pb-4">
              Transcripción Completa
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition">
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>
            </h3>
            <div className="overflow-y-auto flex-1 pr-2 space-y-4 font-mono text-sm">
              {datos.transcripcion ? (
                // Simulamos un chat separando la transcripción cruda por cambios de hablante
                datos.transcripcion.split(/(?=Ejecutiva:|Cliente:)/g).map((linea: string, i: number) => {
                  const isAgent = linea.startsWith("Ejecutiva:");
                  return (
                    <div key={i} className={`p-4 rounded-xl max-w-[85%] ${isAgent ? 'bg-blue-50 ml-auto border border-blue-100' : 'bg-gray-50 mr-auto border border-gray-200'}`}>
                      <p className={`text-xs font-bold mb-1 uppercase ${isAgent ? 'text-blue-600' : 'text-gray-500'}`}>
                        {isAgent ? 'Ejecutivo' : 'Cliente'}
                      </p>
                      <p className="text-gray-700 leading-relaxed">{linea.replace(/Ejecutiva:|Cliente:/g, '').trim()}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-400 italic mt-20">Esperando texto del agente... ✍️</div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: COACHING IA (La Venta) */}
        <div className="space-y-6">
          
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Brain size={100} /></div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 relative z-10"><Brain size={24} /> AI Coach Feedback</h2>
            
            <div className="space-y-4 relative z-10">
              <div className="flex gap-4 mb-6">
                <div className="bg-white/10 p-3 rounded-lg flex-1 text-center">
                  <p className="text-xs text-indigo-200 uppercase font-bold">Empatía</p>
                  <p className="text-2xl font-black">{coaching.score_empatia || 0}%</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg flex-1 text-center">
                  <p className="text-xs text-indigo-200 uppercase font-bold">Cierre</p>
                  <p className="text-2xl font-black">{coaching.score_cierre || 0}%</p>
                </div>
              </div>

              {coaching.tips && coaching.tips.length > 0 ? (
                coaching.tips.map((tip: string, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${i === 0 ? 'bg-white/20 font-bold backdrop-blur-sm shadow-sm' : 'text-indigo-100'}`}>
                    <CheckCircle size={18} className={`mt-0.5 shrink-0 ${i === 0 ? 'text-green-300' : 'text-indigo-300'}`} />
                    <span>{tip}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm italic opacity-70 text-center">Sin sugerencias disponibles para esta llamada.</p>
              )}
            </div>
          </div>

          {/* TARJETA 3: PAYWALL */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 relative overflow-hidden group">
            <div className="filter blur-sm select-none opacity-50 transition duration-500 group-hover:blur-md">
              <h3 className="font-bold text-gray-800 mb-4 flex gap-2"><TrendingUp/>Análisis Emocional Profundo</h3>
              <div className="space-y-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-32 bg-gray-100 rounded w-full mt-4"></div></div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 z-10 backdrop-blur-[2px]">
              <div className="bg-gray-900 text-white p-4 rounded-full mb-3 shadow-xl transform group-hover:scale-110 transition"><Lock size={24} /></div>
              <h4 className="font-bold text-gray-900 text-lg">Función Premium</h4>
              <p className="text-sm text-gray-700 mb-4 text-center font-medium px-4">Desbloquea el análisis de sentimientos micro-gestuales.</p>
              <button className="px-6 py-2 bg-black text-white font-bold rounded-lg shadow-md hover:bg-gray-800 transition">Mejorar Plan 🚀</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}