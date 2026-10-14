import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export const Layout = () => {
  return (
    <div className="app-shell app-shell--mobile">
      <main className="page">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
