import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const STAGES = [
  { key:'prospection',  label:'Prospection',  color:'#6b7280' },
  { key:'questionnaire',label:'Questionnaire', color:'#0369a1' },
  { key:'audit',        label:'Audit',         color:'#d97706' },
  { key:'cloture',      label:'Clôture',       color:'#059669' },
]
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const fmtEur = v => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v||0)
const isOverdue = s => { if(!s) return false; const d = new Date(s); return !isNaN(d) && d < new Date(); }

export default function Dashboard() {
  const [clients,  setClients]  = useState([])
  const [factures, setFactures] = useState([])
  const [loading,  setLoading]  = useState(true)
  const navigate = useNavigate()
  const today    = new Date()
  const mois     = today.getMonth() + 1
  const annee    = today.getFullYear()

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('cabinet_factures').select('*'),
    ]).then(([c, f]) => {
      setClients(c.data || [])
      setFactures(f.data || [])
      setLoading(false)
    })
  }, [])

  // KPIs
  const actifs   = clients.filter(c => c.stage !== 'cloture')
  const retards  = clients.filter(c => isOverdue(c.nextAction) && c.stage !== 'cloture')
  const factMois = factures.filter(f => { const d = new Date(f.date_emission); return d.getMonth()+1===mois && d.getFullYear()===annee })
  const caEncaisse = factures.filter(f => ['payee','premier_versement'].includes(f.statut))
    .reduce((s,f) => s + (f.statut==='premier_versement' ? (+f.montant||0)*.5 : (+f.montant||0)), 0)
  const caAttente  = factures.filter(f => ['envoyee','attente'].includes(f.statut)).reduce((s,f) => s+(+f.montant||0),0)
  const byStage    = STAGES.map(st => ({ ...st, count: clients.filter(c=>c.stage===st.key).length }))

  // Rappels
  const rappels = []
  if (retards.length) rappels.push({ icon:'⏰', color:'#dc2626', bg:'#fee2e2', text:`${retards.length} dossier${retards.length>1?'s':''} en retard`, action:()=>navigate('/clients') })
  const sansAction = actifs.filter(c => !c.nextAction)
  if (sansAction.length) rappels.push({ icon:'📋', color:'#0369a1', bg:'#e0f2fe', text:`${sansAction.length} dossier${sansAction.length>1?'s':''} sans prochaine action`, action:()=>navigate('/clients') })
  const retainersActifs = clients.filter(c => c.formula==='suivi_mensuel' && c.stage!=='cloture')
  if (retainersActifs.length) rappels.push({ icon:'📅', color:'#C9A84C', bg:'#FAF3E0', text:`${retainersActifs.length} retainer${retainersActifs.length>1?'s':''} — suivi ${MOIS[mois-1]} à créer`, action:()=>navigate('/clients') })

  if (loading) return <Loader />

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tableau de bord</h1>
          <p style={s.sub}>{today.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
        </div>
      </div>

      {/* Rappels */}
      {rappels.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>🔔 Rappels</div>
          <div style={s.rappelGrid}>
            {rappels.map((r,i) => (
              <div key={i} onClick={r.action} style={{ ...s.rappel, background:r.bg, border:`1px solid ${r.color}33`, cursor:'pointer' }}>
                <span style={{ fontSize:18 }}>{r.icon}</span>
                <span style={{ fontSize:13, fontWeight:600, color:r.color }}>{r.text}</span>
                <span style={{ marginLeft:'auto', color:r.color, opacity:0.5 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={s.kpiGrid}>
        <KpiCard icon="👥" label="Clients actifs"   value={actifs.length}      sub={`${clients.length} total`}          color="#C9A84C" />
        <KpiCard icon="✅" label="CA encaissé"       value={fmtEur(caEncaisse)} sub="factures réglées"                   color="#059669" />
        <KpiCard icon="⏳" label="CA en attente"     value={fmtEur(caAttente)}  sub="factures en cours"                  color="#d97706" />
        <KpiCard icon="⚠️" label="Dossiers en retard" value={retards.length}    sub={retards.length?'à relancer':'RAS'} color={retards.length?'#dc2626':'#059669'} />
      </div>

      {/* Pipeline */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Pipeline clients</div>
        <div style={s.pipelineGrid}>
          {byStage.map(st => (
            <div key={st.key} onClick={() => navigate('/clients')} style={{ ...s.pipelineCard, borderTop:`3px solid ${st.color}`, cursor:'pointer' }}>
              <div style={{ fontSize:24, fontWeight:800, color:st.color }}>{st.count}</div>
              <div style={{ fontSize:12, fontWeight:600, color:'#64748b', marginTop:3 }}>{st.label}</div>
              {/* Mini entonnoir */}
              <div style={{ height:4, background:'#EDE8D5', borderRadius:2, marginTop:10, overflow:'hidden' }}>
                <div style={{ width:`${clients.length>0?st.count/clients.length*100:0}%`, height:'100%', background:st.color, borderRadius:2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clients en retard */}
      {retards.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>⚠️ Actions en retard</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {retards.slice(0,5).map(c => (
              <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
                style={{ ...s.clientRow, borderLeft:'3px solid #dc2626', cursor:'pointer' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0D1520' }}>{c.name}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{c.company}</div>
                </div>
                <div style={{ fontSize:12, color:'#dc2626', fontWeight:600 }}>{c.nextAction}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div style={s.kpiCard}>
      <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{sub}</div>
    </div>
  )
}

function Loader() {
  return <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Chargement…</div>
}

const s = {
  page: { padding:'24px 20px', maxWidth:900, margin:'0 auto' },
  header: { marginBottom:24 },
  title: { fontSize:28, fontFamily:'DM Serif Display, serif', color:'#0D1520', fontWeight:400 },
  sub: { fontSize:13, color:'#94a3b8', marginTop:4 },
  section: { marginBottom:24 },
  sectionTitle: { fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:12 },
  rappelGrid: { display:'flex', flexDirection:'column', gap:8 },
  rappel: { display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10 },
  kpiGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:24 },
  kpiCard: { background:'#fff', border:'1px solid #DDD5B8', borderRadius:14, padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' },
  pipelineGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 },
  pipelineCard: { background:'#fff', border:'1px solid #DDD5B8', borderRadius:12, padding:'14px' },
  clientRow: { background:'#fff', border:'1px solid #DDD5B8', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 },
}
