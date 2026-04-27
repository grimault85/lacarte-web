import { useNavigate, useLocation } from 'react-router-dom'

export default function BackToDashboard() {
  const navigate  = useNavigate()
  const location  = useLocation()

  // Ne pas afficher sur le dashboard lui-même
  if (location.pathname === '/dashboard') return null

  return (
    <button onClick={() => navigate('/dashboard')} style={s.btn}>
      ← Tableau de bord
    </button>
  )
}

const s = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    padding: '0 0 16px',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'color 0.15s',
  }
}
