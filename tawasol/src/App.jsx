import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ParentDashboard from './pages/ParentDashboard'
import KidsDashboard from './pages/KidsDashboard'
import TawaslDashboard from './pages/TawaslDashboard'

function QuickNav() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 16,
      zIndex: 9999,
      display: 'flex',
      gap: 8,
      background: 'white',
      padding: 8,
      borderRadius: 12,
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      fontFamily: 'Tajawal, sans-serif'
    }}>
      <Link to="/" style={linkStyle}>الرئيسية</Link>
      <Link to="/auth" style={linkStyle}>الدخول</Link>
      <Link to="/parent" style={linkStyle}>ولي الأمر</Link>
      <Link to="/kids" style={linkStyle}>الطفل</Link>
      <Link to="/tawasl" style={linkStyle}>الأخصائي</Link>
    </div>
  )
}

const linkStyle = {
  textDecoration: 'none',
  color: '#2C6E8A',
  fontWeight: 700,
  fontSize: 13,
  padding: '8px 10px',
  borderRadius: 8,
  background: '#F0EDE8'
}

export default function App() {
  return (
    <BrowserRouter>
      <QuickNav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/kids" element={<KidsDashboard />} />
        <Route path="/tawasl" element={<TawaslDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}