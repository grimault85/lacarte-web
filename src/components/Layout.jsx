import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const NAV = [
  { to: '/dashboard',   icon: '⊞',  label: 'Tableau de bord' },
  { to: '/clients',     icon: '📁', label: 'Dossiers clients' },
  { to: '/pipeline',    icon: '🎯', label: 'Pipeline' },
  { to: '/facturation', icon: '💰', label: 'Facturation' },
  { to: '/social',       icon: '📱', label: 'Réseaux Sociaux' },
]

export default function Layout() {
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={s.root}>
      {/* ── Sidebar desktop ── */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandBox}>
            <span style={s.brandLA}>LA</span>
            <span style={s.brandCARTE}>CARTE</span>
          </div>
          <span style={s.brandSub}>Advisory</span>
        </div>

        <nav style={s.nav}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => ({ ...s.link, ...(isActive ? s.linkActive : {}) })}>
              <span style={s.linkIcon}>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <button onClick={logout} style={s.logout}>
          <span>⎋</span> Déconnexion
        </button>
      </aside>

      {/* ── Mobile top bar ── */}
      <div style={s.topbar}>
        <div style={s.topbarBrand}>
          <span style={{ fontFamily: 'DM Serif Display, serif', color: '#C9A84C', fontSize: 18, letterSpacing: 3 }}>LA CARTE</span>
        </div>
        <button onClick={() => setOpen(!open)} style={s.hamburger}>☰</button>
      </div>

      {/* ── Mobile menu ── */}
      {open && (
        <div style={s.mobileMenu} onClick={() => setOpen(false)}>
          <div style={s.mobileMenuInner} onClick={e => e.stopPropagation()}>
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
                style={({ isActive }) => ({ ...s.mobileLink, ...(isActive ? s.mobileLinkActive : {}) })}>
                <span>{n.icon}</span> {n.label}
              </NavLink>
            ))}
            <button onClick={logout} style={s.mobileLogout}>⎋ Déconnexion</button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  root: { display: 'flex', minHeight: '100dvh', background: '#EEE6C9' },
  sidebar: {
    width: 220, background: '#0D1520', display: 'flex', flexDirection: 'column',
    flexShrink: 0, position: 'sticky', top: 0, height: '100dvh',
    '@media(max-width:768px)': { display: 'none' },
  },
  brand: { padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  brandBox: { display: 'flex', flexDirection: 'column', lineHeight: 1 },
  brandLA: { fontFamily: 'DM Serif Display, serif', fontSize: 10, letterSpacing: 5, color: '#C9A84C' },
  brandCARTE: { fontFamily: 'DM Serif Display, serif', fontSize: 22, letterSpacing: 5, color: '#EEE6C9' },
  brandSub: { fontSize: 10, color: 'rgba(238,230,201,0.25)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
  nav: { flex: 1, padding: '12px 0' },
  link: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
    color: 'rgba(238,230,201,0.45)', textDecoration: 'none', fontSize: 13, fontWeight: 500,
    borderLeft: '3px solid transparent', transition: 'all 0.15s',
  },
  linkActive: { color: '#EEE6C9', background: 'rgba(201,168,76,0.08)', borderLeftColor: '#C9A84C' },
  linkIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  logout: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px',
    background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(238,230,201,0.3)', cursor: 'pointer', fontSize: 12, width: '100%',
  },
  topbar: {
    display: 'none',
    position: 'fixed', top: 0, left: 0, right: 0, height: 56,
    background: '#0D1520', borderBottom: '1px solid rgba(201,168,76,0.15)',
    alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', zIndex: 50,
    '@media(max-width:768px)': { display: 'flex' },
  },
  topbarBrand: {},
  hamburger: { background: 'none', border: 'none', color: '#C9A84C', fontSize: 22, cursor: 'pointer' },
  mobileMenu: {
    position: 'fixed', inset: 0, background: 'rgba(13,21,32,0.85)', zIndex: 100,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
  },
  mobileMenuInner: {
    background: '#0D1520', width: 260, height: '100dvh', padding: '70px 0 20px',
    display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(201,168,76,0.15)',
  },
  mobileLink: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
    color: 'rgba(238,230,201,0.55)', textDecoration: 'none', fontSize: 15, fontWeight: 500,
  },
  mobileLinkActive: { color: '#EEE6C9', background: 'rgba(201,168,76,0.1)' },
  mobileLogout: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
    background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(238,230,201,0.3)', cursor: 'pointer', fontSize: 14, marginTop: 'auto',
  },
  main: { flex: 1, overflow: 'auto', paddingTop: 0 },
}

// CSS mobile hack — inject media queries
const styleEl = document.createElement('style')
styleEl.textContent = `
  @media (max-width: 768px) {
    aside { display: none !important; }
    [data-topbar] { display: flex !important; }
    main { padding-top: 56px; }
  }
`
document.head.appendChild(styleEl)