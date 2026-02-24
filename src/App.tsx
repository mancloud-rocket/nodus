import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { 
  Dashboard, 
  Llamadas, 
  DetalleLlamada, 
  Agentes, 
  Chat, 
  Alertas,
  ModulosOverview,
  ContactoDirecto,
  CompromisoPago,
  AbandonoLlamadas
} from '@/pages'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/llamadas" element={<Llamadas />} />
          <Route path="/llamadas/:id" element={<DetalleLlamada />} />
          <Route path="/agentes" element={<Agentes />} />
          <Route path="/agentes/:id" element={<Agentes />} />
          {/* Modulos de Analisis */}
          <Route path="/modulos" element={<ModulosOverview />} />
          <Route path="/modulos/contacto" element={<ContactoDirecto />} />
          <Route path="/modulos/compromiso" element={<CompromisoPago />} />
          <Route path="/modulos/abandono" element={<AbandonoLlamadas />} />
          {/* Otros */}
          <Route path="/coaching" element={<Dashboard />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/estrategia" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Dashboard />} />
        </Route>
      </Routes>
    </TooltipProvider>
  )
}

export default App

