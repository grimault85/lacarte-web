import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false); return; }
    navigate(from, { replace: true })
  }

  return (
    <div style={styles.wrap}>
      {/* Background grain */}
      <div style={styles.grain} />

      {/* Card */}
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoBox}>
            <span style={styles.logoLA}>LA</span>
            <span style={styles.logoCARTE}>CARTE</span>
          </div>
          <div style={styles.tagline}>Restaurant Advisory</div>
        </div>

        <h1 style={styles.title}>Connexion</h1>
        <p style={styles.subtitle}>Accès réservé à l'équipe La Carte</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus placeholder="lacarte.advisory@gmail.com"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0D1520', position: 'relative', overflow: 'hidden', padding: 20,
  },
  grain: {
    position: 'absolute', inset: 0, opacity: 0.04,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(201,168,76,0.2)', borderRadius: 20,
    padding: '44px 40px', width: '100%', maxWidth: 420,
    position: 'relative', zIndex: 1,
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
  },
  logo: { textAlign: 'center', marginBottom: 32 },
  logoBox: { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: 6 },
  logoLA: { fontFamily: 'DM Serif Display, serif', fontSize: 11, letterSpacing: 6, color: '#C9A84C' },
  logoCARTE: { fontFamily: 'DM Serif Display, serif', fontSize: 28, letterSpacing: 6, color: '#EEE6C9', lineHeight: 1 },
  tagline: { fontSize: 10, letterSpacing: 3, color: 'rgba(238,230,201,0.35)', textTransform: 'uppercase' },
  title: { fontFamily: 'DM Serif Display, serif', fontSize: 26, color: '#EEE6C9', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: 'rgba(238,230,201,0.4)', textAlign: 'center', marginBottom: 28 },
  error: { background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 12, fontWeight: 600, color: 'rgba(238,230,201,0.6)', letterSpacing: 0.5 },
  input: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10,
    padding: '12px 14px', fontSize: 14, color: '#EEE6C9', outline: 'none', width: '100%',
    fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s',
  },
  btn: {
    background: '#C9A84C', color: '#0D1520', border: 'none', borderRadius: 10,
    padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif', letterSpacing: 0.3, marginTop: 4,
    transition: 'all 0.2s',
  },
}
