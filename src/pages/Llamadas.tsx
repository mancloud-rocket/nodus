import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GestorLlamadas from '../components/llamadas/gestorLlamadas'; 

export default function Llamadas() {
  return (
    <div className="h-full w-full bg-gray-50 min-h-screen">
      
      {/* Encabezado Simple */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Auditoría de Llamadas</h1>
        <p className="text-sm text-gray-500">Sube grabaciones y revisa el análisis de los Agentes IA</p>
      </div>

      {/* AQUÍ ESTÁ LA MAGIA: Tu componente se renderiza aquí */}
      <div className="px-4">
        <GestorLlamadas />
      </div>

    </div>
  );
}