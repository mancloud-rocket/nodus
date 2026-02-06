import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <Sidebar />
      
      {/* Main content */}
      <main className="ml-64">
        <Outlet />
      </main>
    </div>
  )
}
