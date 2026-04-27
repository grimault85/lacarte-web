import { lazy, Suspense, useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './pages/Login'
import Layout from './components/Layout'

const Dashboard   = lazy(() => import('./pages/Dashboard'))
const Clients     = lazy(() => import('./pages/Clients'))
const ClientDetail = lazy(() => import('./pages/ClientDetail'))
const Pipeline    = lazy(() => import('./pages/Pipeline'))
const Facturation = lazy(() => import('./pages/Facturation'))
const Social      = lazy(() => import('./pages/Social'))

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullLoader />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function FullLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'#0D1520' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'DM Serif Display, serif', fontSize:28, color:'#C9A84C', letterSpacing:4, marginBottom:12 }}>LA CARTE</div>
        <div style={{ width:32, height:32, border:'2px solid #C9A84C', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const loading = session === undefined

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <Suspense fallback={<FullLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="clients"     element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="pipeline"    element={<Pipeline />} />
            <Route path="facturation" element={<Facturation />} />
            <Route path="social"      element={<Social />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthContext.Provider>
  )
}