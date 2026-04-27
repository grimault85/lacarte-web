import { useState, useEffect } from 'react'
import BackToDashboard from '../components/BackToDashboard'
import { supabase } from '../supabase'

const STATUTS = [
  {key:'brouillon',         label:'Brouillon',          color:'#6b7280',bg:'#f3f4f6'},
  {key:'envoyee',           label:'Envoyée',            color:'#0369a1',bg:'#e0f2fe'},
  {key:'attente',           label:'En attente',         color:'#d97706',bg:'#fef3c7'},
  {key:'premier_versement', label:'1er versement reçu', color:'#7c3aed',bg:'#ede9fe'},
  {key:'payee',             label:'Payée ✓',            color:'#059669',bg:'#d1fae5'},
  {key:'retard',            label:'En retard',          color:'#dc2626',bg:'#fee2e2'},
]
const statutOf = k => STATUTS.find(s=>s.key===k) || STATUTS[0]
const fmtEur   = v => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v||0)

export default function Facturation() {
  const [factures, setFactures] = useState([])
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    Promise.all([
      supabase.from('cabinet_factures').select('*').order('date_emission',{ascending:false}),
      supabase.from('clients').select('id,name,company'),
    ]).then(([f,c]) => { setFactures(f.data||[]); setClients(c.data||[]); setLoading(false) })
  }, [])

  async function changeStatut(id, statut) {
    await supabase.from('cabinet_factures').update({ statut }).eq('id', id)
    setFactures(prev => prev.map(f => f.id===id ? {...f, statut} : f))
  }

  const totalEncaisse = factures.filter(f=>['payee','premier_versement'].includes(f.statut))
    .reduce((s,f)=>s+(f.statut==='premier_versement'?(+f.montant||0)*.5:(+f.montant||0)),0)
  const totalAttente  = factures.filter(f=>['envoyee','attente'].includes(f.statut)).reduce((s,f)=>s+(+f.montant||0),0)
  const totalRetard   = factures.filter(f=>f.statut==='retard').reduce((s,f)=>s+(+f.montant||0),0)
  const filtered      = filter==='all' ? factures : factures.filter(f=>f.statut===filter)

  return (
    <div style={s.page}>
      <BackToDashboard />
      <h1 style={s.title}>Facturation</h1>

      {/* KPIs */}
      <div style={s.kpis}>
        <div style={{...s.kpi,borderLeft:'3px solid #059669'}}>
          <div style={s.kpiLabel}>Encaissé</div>
          <div style={{...s.kpiVal,color:'#059669'}}>{fmtEur(totalEncaisse)}</div>
        </div>
        <div style={{...s.kpi,borderLeft:'3px solid #d97706'}}>
          <div style={s.kpiLabel}>En attente</div>
          <div style={{...s.kpiVal,color:'#d97706'}}>{fmtEur(totalAttente)}</div>
        </div>
        <div style={{...s.kpi,borderLeft:'3px solid #dc2626'}}>
          <div style={s.kpiLabel}>En retard</div>
          <div style={{...s.kpiVal,color:'#dc2626'}}>{fmtEur(totalRetard)}</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={s.filters}>
        <button onClick={()=>setFilter('all')} style={{...s.fBtn,...(filter==='all'?s.fBtnActive:{})}}>Toutes</button>
        {STATUTS.map(st=>(
          <button key={st.key} onClick={()=>setFilter(st.key)}
            style={{...s.fBtn,...(filter===st.key?{...s.fBtnActive,borderColor:st.color,color:st.color,background:st.bg}:{})}}>
            {st.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Chargement…</div>
      : filtered.length===0 ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Aucune facture</div>
      : (
        <div style={s.list}>
          {filtered.map(f => {
            const st = statutOf(f.statut)
            const cl = clients.find(c=>String(c.id)===String(f.client_id))
            const isPv = f.statut==='premier_versement'
            return (
              <div key={f.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:14,color:'#0D1520'}}>{f.numero}</span>
                      <span style={{background:st.bg,color:st.color,borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700}}>{st.label}</span>
                    </div>
                    <div style={{fontSize:12,color:'#64748b'}}>{cl?.name||f.client_nom||'—'}{f.formule?` · ${f.formule}`:''}</div>
                    {f.date_emission&&<div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{new Date(f.date_emission).toLocaleDateString('fr-FR')}</div>}
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:18,fontWeight:800,color:isPv?'#7c3aed':'#059669'}}>
                      {isPv ? fmtEur(+f.montant*.5) : fmtEur(f.montant)}
                    </div>
                    {isPv&&<div style={{fontSize:10,color:'#7c3aed'}}>acompte 50%</div>}
                    {isPv&&<div style={{fontSize:10,color:'#94a3b8'}}>sur {fmtEur(f.montant)}</div>}
                  </div>
                </div>
                {/* Changement statut */}
                <div style={s.statutRow}>
                  <span style={{fontSize:11,color:'#94a3b8'}}>Statut :</span>
                  <select value={f.statut} onChange={e=>changeStatut(f.id,e.target.value)} style={s.select}>
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
  page:      { padding:'20px 16px 40px', maxWidth:700, margin:'0 auto' },
  title:     { fontSize:24, fontFamily:'DM Serif Display, serif', color:'#0D1520', fontWeight:400, marginBottom:20 },
  kpis:      { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 },
  kpi:       { background:'#fff', border:'1px solid #DDD5B8', borderRadius:12, padding:'14px' },
  kpiLabel:  { fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 },
  kpiVal:    { fontSize:20, fontWeight:800 },
  filters:   { display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 },
  fBtn:      { padding:'5px 12px', borderRadius:20, border:'1px solid #DDD5B8', background:'#fff', fontSize:12, fontWeight:500, cursor:'pointer', color:'#64748b', fontFamily:'DM Sans,sans-serif' },
  fBtnActive:{ background:'#FAF3E0', borderColor:'#C9A84C', color:'#0D1520', fontWeight:700 },
  list:      { display:'flex', flexDirection:'column', gap:10 },
  card:      { background:'#fff', border:'1px solid #DDD5B8', borderRadius:14, padding:'14px 16px' },
  cardTop:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:10 },
  statutRow: { display:'flex', alignItems:'center', gap:10 },
  select:    { padding:'4px 8px', borderRadius:8, border:'1px solid #DDD5B8', fontSize:12, fontFamily:'DM Sans,sans-serif', background:'#FAF8F2', color:'#374151' },
}
