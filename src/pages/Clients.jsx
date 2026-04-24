import React, { useState, useEffect } from 'react'
import BackToDashboard from '../components/BackToDashboard'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const STAGES   = [{key:'prospection',label:'Prospection',color:'#6b7280',bg:'#f3f4f6'},{key:'questionnaire',label:'Questionnaire',color:'#0369a1',bg:'#e0f2fe'},{key:'audit',label:'Audit',color:'#d97706',bg:'#fef3c7'},{key:'cloture',label:'Clôture',color:'#059669',bg:'#d1fae5'}]
const FORMULAS = [{key:'audit_menu',label:'Audit Menu',color:'#0369a1',bg:'#e0f2fe'},{key:'audit_menu_financier',label:'Audit Complet',color:'#7c3aed',bg:'#ede9fe'},{key:'suivi_mensuel',label:'Retainer',color:'#059669',bg:'#d1fae5'}]
const stageOf  = k => STAGES.find(s=>s.key===k)||STAGES[0]
const fmOf     = k => FORMULAS.find(f=>f.key===k)||FORMULAS[0]
const isOverdue= s => { if(!s) return false; const d=new Date(s); return !isNaN(d)&&d<new Date(); }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search,  setSearch]  = useState('')
  const [stage,   setStage]   = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('clients').select('*').order('created_at',{ascending:false})
      .then(({data}) => { setClients(data||[]); setLoading(false) })
  }, [])

  const filtered = clients.filter(c => {
    if (stage !== 'all' && c.stage !== stage) return false
    if (!search) return true
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
  })

  return (
    <div style={s.page}>
      <BackToDashboard />
      <div style={s.header}>
        <h1 style={s.title}>Dossiers clients</h1>
        <span style={s.count}>{clients.length} dossiers</span>
      </div>

      {/* Filtres */}
      <div style={s.filters}>
        <input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} style={s.search} />
        <div style={s.stageFilter}>
          <button onClick={()=>setStage('all')} style={{...s.stageBtn, ...(stage==='all'?s.stageBtnActive:{})}}>Tous</button>
          {STAGES.map(st => (
            <button key={st.key} onClick={()=>setStage(st.key)}
              style={{...s.stageBtn, ...(stage===st.key?{...s.stageBtnActive,borderColor:st.color,color:st.color,background:st.bg}:{})}}>
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Chargement…</div>
      : filtered.length === 0 ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Aucun dossier</div>
      : (
        <div style={s.list}>
          {filtered.map(c => {
            const st   = stageOf(c.stage)
            const fm   = fmOf(c.formula)
            const late = false
            return (
              <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.clientName}>{c.name}</div>
                    <div style={s.clientCo}>{c.company}</div>
                  </div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
                    <Badge color={fm.color} bg={fm.bg}>{fm.label}</Badge>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Badge({color,bg,children}) {
  return <span style={{background:bg,color,borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>{children}</span>
}

const s = {
  page: {padding:'24px 20px',maxWidth:700,margin:'0 auto'},
  header: {display:'flex',alignItems:'center',gap:12,marginBottom:20},
  title: {fontSize:28,fontFamily:'DM Serif Display, serif',color:'#0D1520',fontWeight:400,flex:1},
  count: {fontSize:13,color:'#94a3b8'},
  filters: {display:'flex',flexDirection:'column',gap:10,marginBottom:20},
  search: {padding:'10px 14px',borderRadius:10,border:'1px solid #DDD5B8',background:'#fff',fontSize:14,fontFamily:'DM Sans,sans-serif',outline:'none',width:'100%'},
  stageFilter: {display:'flex',gap:6,flexWrap:'wrap'},
  stageBtn: {padding:'5px 12px',borderRadius:20,border:'1px solid #DDD5B8',background:'#fff',fontSize:12,fontWeight:500,cursor:'pointer',color:'#64748b'},
  stageBtnActive: {background:'#FAF3E0',borderColor:'#C9A84C',color:'#0D1520',fontWeight:700},
  list: {display:'flex',flexDirection:'column',gap:10},
  card: {background:'#fff',border:'1px solid #DDD5B8',borderRadius:14,padding:'14px 16px',cursor:'pointer',transition:'box-shadow 0.15s'},
  cardTop: {display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:6},
  clientName: {fontSize:15,fontWeight:700,color:'#0D1520'},
  clientCo: {fontSize:12,color:'#64748b',marginTop:2},
  nextAction: {fontSize:12,fontWeight:500},
}
