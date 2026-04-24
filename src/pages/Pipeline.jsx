import React, { useState, useEffect } from 'react'
import BackToDashboard from '../components/BackToDashboard'
import { supabase } from '../supabase'

const STATUTS = [
  {key:'prospect',    label:'Prospect',         color:'#6b7280',bg:'#f3f4f6'},
  {key:'contact',     label:'Premier contact',  color:'#0369a1',bg:'#e0f2fe'},
  {key:'devis',       label:'Devis envoyé',     color:'#d97706',bg:'#fef3c7'},
  {key:'negocia',     label:'Négociation',      color:'#7c3aed',bg:'#ede9fe'},
  {key:'a_evaluer',   label:'À évaluer',        color:'#d97706',bg:'#fef3c7'},
  {key:'non_eligible',label:'Non éligible',     color:'#dc2626',bg:'#fee2e2'},
  {key:'gagne',       label:'Gagné ✓',          color:'#059669',bg:'#d1fae5'},
  {key:'perdu',       label:'Perdu',            color:'#dc2626',bg:'#fee2e2'},
]
const statutOf = k => STATUTS.find(s=>s.key===k)||STATUTS[0]
const fmtEur   = v => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v||0)

export default function Pipeline() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    supabase.from('cabinet_pipeline').select('*').order('id',{ascending:false})
      .then(({data}) => { setItems(data||[]); setLoading(false) })
  }, [])

  async function changeStatut(id, statut) {
    await supabase.from('cabinet_pipeline').update({ statut }).eq('id', id)
    setItems(prev => prev.map(i => i.id===id ? {...i, statut} : i))
  }

  const actifs   = items.filter(i => !['gagne','perdu'].includes(i.statut))
  const caPrevi  = items.filter(i=>i.statut==='devis').reduce((s,i)=>s+(+i.budget_estime||0),0)
  const filtered = filter==='all' ? items : items.filter(i=>i.statut===filter)

  return (
    <div style={s.page}>
      <BackToDashboard />
      <h1 style={s.title}>Pipeline commercial</h1>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.stat}><div style={s.statVal}>{actifs.length}</div><div style={s.statLabel}>Prospects actifs</div></div>
        <div style={s.stat}><div style={{...s.statVal,color:'#d97706'}}>{items.filter(i=>i.statut==='devis').length}</div><div style={s.statLabel}>Devis en attente</div></div>
        <div style={s.stat}><div style={{...s.statVal,color:'#059669'}}>{fmtEur(caPrevi)}</div><div style={s.statLabel}>CA prévisionnel</div></div>
      </div>

      {/* Filtres */}
      <div style={s.filters}>
        <button onClick={()=>setFilter('all')} style={{...s.fBtn,...(filter==='all'?s.fBtnActive:{})}}>Tous</button>
        {STATUTS.slice(0,6).map(st=>(
          <button key={st.key} onClick={()=>setFilter(st.key)}
            style={{...s.fBtn,...(filter===st.key?{...s.fBtnActive,borderColor:st.color,color:st.color,background:st.bg}:{})}}>
            {st.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Chargement…</div>
      : filtered.length===0 ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Aucun prospect</div>
      : (
        <div style={s.list}>
          {filtered.map(item => {
            const st = statutOf(item.statut)
            return (
              <div key={item.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <div style={s.name}>{item.nom}</div>
                    <div style={s.co}>{item.entreprise}{item.source?` · ${item.source}`:''}</div>
                  </div>
                  {item.budget_estime>0 && (
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:15,fontWeight:800,color:'#059669'}}>{fmtEur(item.budget_estime)}</div>
                      <div style={{fontSize:10,color:'#94a3b8'}}>estimé</div>
                    </div>
                  )}
                </div>
                {item.next_action && <div style={s.nextAction}>→ {item.next_action}</div>}
                {item.rapport_notion && <div style={s.hasRapport}>📋 Rapport Tally disponible</div>}
                {/* Changement statut rapide */}
                <div style={s.statutRow}>
                  <span style={{background:st.bg,color:st.color,borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700}}>{st.label}</span>
                  <select value={item.statut} onChange={e=>changeStatut(item.id,e.target.value)} style={s.select}>
                    {STATUTS.map(s2=><option key={s2.key} value={s2.key}>{s2.label}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  page: {padding:'24px 20px',maxWidth:700,margin:'0 auto'},
  title: {fontSize:28,fontFamily:'DM Serif Display, serif',color:'#0D1520',fontWeight:400,marginBottom:20},
  statsRow: {display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20},
  stat: {background:'#fff',border:'1px solid #DDD5B8',borderRadius:12,padding:'14px',textAlign:'center'},
  statVal: {fontSize:22,fontWeight:800,color:'#C9A84C'},
  statLabel: {fontSize:11,color:'#94a3b8',marginTop:3},
  filters: {display:'flex',gap:6,flexWrap:'wrap',marginBottom:16},
  fBtn: {padding:'5px 12px',borderRadius:20,border:'1px solid #DDD5B8',background:'#fff',fontSize:12,fontWeight:500,cursor:'pointer',color:'#64748b',fontFamily:'DM Sans,sans-serif'},
  fBtnActive: {background:'#FAF3E0',borderColor:'#C9A84C',color:'#0D1520',fontWeight:700},
  list: {display:'flex',flexDirection:'column',gap:10},
  card: {background:'#fff',border:'1px solid #DDD5B8',borderRadius:14,padding:'14px 16px'},
  cardTop: {display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:6},
  name: {fontSize:15,fontWeight:700,color:'#0D1520'},
  co: {fontSize:12,color:'#64748b',marginTop:2},
  nextAction: {fontSize:12,color:'#C9A84C',fontWeight:600,marginBottom:6},
  hasRapport: {fontSize:11,color:'#7c3aed',fontWeight:600,marginBottom:6},
  statutRow: {display:'flex',alignItems:'center',gap:10,marginTop:8},
  select: {padding:'4px 8px',borderRadius:8,border:'1px solid #DDD5B8',fontSize:12,fontFamily:'DM Sans,sans-serif',background:'#FAF8F2',color:'#374151'},
}
