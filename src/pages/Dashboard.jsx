import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const STAGES   = [{key:'prospection',label:'Prospection',color:'#6b7280'},{key:'questionnaire',label:'Questionnaire',color:'#0369a1'},{key:'audit',label:'Audit',color:'#d97706'},{key:'cloture',label:'Clôture',color:'#059669'}]
const FORMULAS = [{key:'audit_menu',label:'Audit Menu'},{key:'audit_menu_financier',label:'Audit Complet'},{key:'suivi_mensuel',label:'Retainer'}]
const MOIS     = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const isOverdue = s => { if(!s) return false; const d = new Date(s); return !isNaN(d) && d < new Date(); }
const stageOf   = k => STAGES.find(s=>s.key===k)   || STAGES[0]
const TASKS_COUNT = { audit_menu:{prospection:4,questionnaire:3,audit:4,cloture:4}, audit_menu_financier:{prospection:4,questionnaire:4,audit:6,cloture:5}, suivi_mensuel:{prospection:3,questionnaire:3,audit:2,cloture:4} }

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [devis,   setDevis]   = useState([])
  const [history, setHistory] = useState([])
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const today    = new Date(); today.setHours(0,0,0,0)

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('compta_devis').select('*').eq('statut','envoye'),
      supabase.from('history').select('*').order('created_at',{ascending:false}).limit(8),
      supabase.from('cabinet_notes').select('*').order('updated_at',{ascending:false}),
    ]).then(([c, d, h, n]) => {
      setClients(c.data||[])
      setDevis(d.data||[])
      setHistory(h.data||[])
      setNotes(n.data||[])
      setLoading(false)
    })
  }, [])

  const actifs   = clients.filter(c => c.stage !== 'cloture')
  const retards  = actifs.filter(c => isOverdue(c.nextAction)).sort((a,b) => new Date(a.nextAction)-new Date(b.nextAction))
  const sansAction = actifs.filter(c => !c.nextAction)
  const retainers  = clients.filter(c => c.formula==='suivi_mensuel' && c.stage!=='cloture')
  const missions   = actifs.filter(c => ['questionnaire','audit'].includes(c.stage)).map(c => {
    const total = TASKS_COUNT[c.formula]?.[c.stage] || 4
    const done  = (c.tasks?.[c.stage]||[]).filter(Boolean).length
    return { ...c, done, total, pct: Math.round(done/total*100) }
  }).sort((a,b) => a.pct - b.pct)
  const devisSansReponse = devis.map(d => ({...d, jours: Math.floor((today-new Date(d.date_emission))/86400000)})).sort((a,b)=>b.jours-a.jours)
  const relances = clients.filter(c => {
    if(c.stage!=='cloture') return false
    const ref = c.updated_at||c.created_at
    return ref && Math.floor((today-new Date(ref))/86400000) > 60
  }).map(c => ({...c, jours: Math.floor((today-new Date(c.updated_at||c.created_at))/86400000)})).slice(0,4)
  const totalAlertes = retards.length + sansAction.length

  if (loading) return <Loader />

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Bonjour 👋</h1>
        <p style={s.sub}>
          {today.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
          {' · '}{actifs.length} dossier{actifs.length>1?'s':''} actif{actifs.length>1?'s':''}
          {totalAlertes > 0 ? ` · ${totalAlertes} alerte${totalAlertes>1?'s':''}` : ' · Tout est à jour ✓'}
        </p>
      </div>

      {/* Raccourcis rapides */}
      <div style={s.shortcuts}>
        {[
          { icon:'📁', label:'Clients',      to:'/clients',     count: actifs.length,        alert: retards.length > 0 },
          { icon:'🎯', label:'Pipeline',     to:'/pipeline',    count: null },
          { icon:'💰', label:'Facturation',  to:'/facturation', count: null },
          { icon:'📱', label:'Réseaux',      to:'/social',      count: null },
        ].map(sh => (
          <button key={sh.to} onClick={()=>navigate(sh.to)} style={s.shortcut}>
            <span style={{fontSize:22,marginBottom:4}}>{sh.icon}</span>
            <span style={{fontSize:12,fontWeight:600,color:'#0D1520'}}>{sh.label}</span>
            {sh.alert && <span style={{position:'absolute',top:8,right:8,width:8,height:8,borderRadius:'50%',background:'#dc2626'}} />}
          </button>
        ))}
      </div>

      {/* Grille principale : 2 cols actions + 1 col notes */}
      <div style={s.grid}>
        <div style={s.col}>

          {/* Actions en retard */}
          <Section title="⚠️ Actions en retard" count={retards.length} onAction={()=>navigate('/clients')} actionLabel="Tous les clients →">
            {retards.length === 0 ? <Empty color="#059669">✓ Aucun retard</Empty>
              : retards.slice(0,4).map(c => {
                const jours = Math.floor((today-new Date(c.nextAction))/86400000)
                const st = stageOf(c.stage)
                return (
                  <Row key={c.id} onClick={()=>navigate(`/clients/${c.id}`)}>
                    <div style={{flex:1}}>
                      <div style={s.rowName}>{c.name}</div>
                      <div style={s.rowSub}>{c.company} · <span style={{color:st.color}}>{st.label}</span></div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:'#dc2626'}}>{jours}j</span>
                    <Arrow />
                  </Row>
                )
              })
            }
            {sansAction.length > 0 && (
              <div style={{marginTop:10,paddingTop:10,borderTop:'1px dashed #DDD5B8'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#d97706',marginBottom:6}}>📋 Sans action planifiée ({sansAction.length})</div>
                {sansAction.slice(0,3).map(c => (
                  <div key={c.id} onClick={()=>navigate(`/clients/${c.id}`)}
                    style={{fontSize:12,color:'#64748b',padding:'3px 0',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    <span style={{color:'#d97706'}}>→</span> {c.name} — {c.company}
                  </div>
                ))}
              </div>
            )}
            {retainers.length > 0 && (
              <div style={{marginTop:10,paddingTop:10,borderTop:'1px dashed #DDD5B8'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#C9A84C',marginBottom:6}}>📅 Suivi {MOIS[today.getMonth()]} à créer ({retainers.length})</div>
                {retainers.slice(0,3).map(c => (
                  <div key={c.id} onClick={()=>navigate(`/clients/${c.id}`)}
                    style={{fontSize:12,color:'#64748b',padding:'3px 0',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    <span style={{color:'#C9A84C'}}>→</span> {c.name}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Missions en cours */}
          <Section title="🎯 Missions en cours" count={missions.length} onAction={()=>navigate('/clients')} actionLabel="Voir tout →">
            {missions.length === 0 ? <Empty>Aucune mission en cours</Empty>
              : missions.slice(0,5).map(c => {
                const st = stageOf(c.stage)
                return (
                  <div key={c.id} onClick={()=>navigate(`/clients/${c.id}`)}
                    style={{padding:'9px 0',borderBottom:'1px solid #F5F0E8',cursor:'pointer'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                      <span style={{fontWeight:700,fontSize:13,color:'#0D1520',flex:1}}>{c.name}</span>
                      <Chip color={st.color}>{st.label}</Chip>
                      <span style={{fontSize:10,color:'#94a3b8'}}>{c.done}/{c.total}</span>
                      <Arrow />
                    </div>
                    <div style={{height:4,background:'#EDE8D5',borderRadius:2,overflow:'hidden'}}>
                      <div style={{width:`${c.pct}%`,height:'100%',background:c.pct===100?'#059669':'#C9A84C',borderRadius:2}} />
                    </div>
                    <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{c.company}</div>
                  </div>
                )
              })
            }
          </Section>
        </div>

        <div style={s.col}>

          {/* Devis sans réponse */}
          <Section title="📧 Devis sans réponse" count={devisSansReponse.length} onAction={()=>navigate('/facturation')} actionLabel="Facturation →">
            {devisSansReponse.length === 0 ? <Empty color="#059669">✓ Aucun devis en attente</Empty>
              : devisSansReponse.slice(0,4).map(d => (
                <Row key={d.id} onClick={()=>navigate('/facturation')}>
                  <div style={{flex:1}}>
                    <div style={s.rowName}>{d.client_nom||'—'}</div>
                    <div style={s.rowSub}>{d.numero}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:d.jours>14?'#dc2626':'#d97706'}}>{d.jours}j</span>
                  <Arrow />
                </Row>
              ))
            }
          </Section>

          {/* Relances à planifier */}
          <Section title="💬 Relances à planifier" count={relances.length} onAction={()=>navigate('/clients')} actionLabel="Clients →">
            {relances.length === 0 ? <Empty>Aucun client à relancer</Empty>
              : relances.map(c => {
                const mois = Math.floor(c.jours/30)
                return (
                  <Row key={c.id} onClick={()=>navigate(`/clients/${c.id}`)}>
                    <div style={{flex:1}}>
                      <div style={s.rowName}>{c.name}</div>
                      <div style={s.rowSub}>{c.company}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:c.jours>120?'#dc2626':'#d97706'}}>{mois>0?`${mois} mois`:`${c.jours}j`}</span>
                    <Arrow />
                  </Row>
                )
              })
            }
          </Section>

          {/* Dernière activité */}
          <Section title="🕐 Activité récente" onAction={()=>navigate('/clients')} actionLabel="Clients →">
            {history.length === 0 ? <Empty>Aucune activité récente</Empty>
              : history.slice(0,6).map((h,i) => {
                const cl = clients.find(c => String(c.id)===String(h.client_id))
                const d  = h.created_at ? new Date(h.created_at) : null
                const isToday = d && d.toDateString()===today.toDateString()
                const dateLabel = isToday ? 'Auj.' : d ? d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : ''
                return (
                  <div key={h.id||i} onClick={()=>cl&&navigate(`/clients/${cl.id}`)}
                    style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid #F5F0E8',cursor:cl?'pointer':'default',alignItems:'flex-start'}}>
                    <div style={{width:5,height:5,borderRadius:'50%',background:'#C9A84C',flexShrink:0,marginTop:5}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#0D1520',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.action}</div>
                      {cl && <div style={{fontSize:10,color:'#64748b'}}>{cl.name}</div>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                      <span style={{fontSize:10,color:'#94a3b8'}}>{dateLabel}</span>
                      {cl && <Arrow />}
                    </div>
                  </div>
                )
              })
            }
          </Section>
        </div>

        {/* Col 3 — Notes */}
        <NotesWidget notes={notes} setNotes={setNotes} />

      </div>
    </div>
  )
}

function NotesWidget({ notes, setNotes }) {
  const [newTitre,  setNewTitre]  = useState('')
  const [newCorps,  setNewCorps]  = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [expanded,  setExpanded]  = useState(null)

  async function handleSave() {
    if (!newCorps.trim()) return
    setSaving(true)
    const row = { titre: newTitre.trim() || 'Note', contenu: newCorps.trim(), updated_at: new Date().toISOString() }
    const { data } = await supabase.from('cabinet_notes').insert(row).select().single()
    if (data) setNotes(prev => [data, ...prev])
    setNewTitre(''); setNewCorps(''); setShowForm(false); setSaving(false)
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    await supabase.from('cabinet_notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
    if (expanded === id) setExpanded(null)
  }

  return (
    <div style={{background:'#0D1520',borderRadius:14,padding:'16px',display:'flex',flexDirection:'column',minHeight:300}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,paddingBottom:10,borderBottom:'1px solid rgba(201,168,76,0.25)'}}>
        <span style={{fontSize:13,fontWeight:800,color:'#EEE6C9',letterSpacing:0.3}}>📝 Notes</span>
        <button onClick={()=>setShowForm(f=>!f)}
          style={{background:showForm?'rgba(201,168,76,0.2)':'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.4)',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:700,color:'#C9A84C',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
          {showForm ? '✕' : '+ Note'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{marginBottom:12}}>
          <input value={newTitre} onChange={e=>setNewTitre(e.target.value)}
            placeholder="Titre (optionnel)"
            style={{width:'100%',padding:'7px 10px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:7,fontSize:12,color:'#EEE6C9',outline:'none',boxSizing:'border-box',fontFamily:'DM Sans,sans-serif',marginBottom:6,'::placeholder':{color:'#64748b'}}} />
          <textarea value={newCorps} onChange={e=>setNewCorps(e.target.value)}
            placeholder="Votre note…" rows={4}
            style={{width:'100%',padding:'7px 10px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:7,fontSize:12,color:'#EEE6C9',outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'DM Sans,sans-serif',lineHeight:1.6}} />
          <button onClick={handleSave} disabled={!newCorps.trim()||saving}
            style={{marginTop:8,width:'100%',background:'#C9A84C',color:'#0D1520',border:'none',borderRadius:7,padding:'8px',fontSize:12,fontWeight:700,cursor:newCorps.trim()?'pointer':'default',opacity:newCorps.trim()?1:0.5,fontFamily:'DM Sans,sans-serif'}}>
            {saving ? '…' : '💾 Enregistrer'}
          </button>
        </div>
      )}

      {/* Liste des notes */}
      {notes.length === 0 && !showForm ? (
        <div onClick={()=>setShowForm(true)}
          style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:0.5}}>
          <div style={{fontSize:28,marginBottom:8}}>📝</div>
          <div style={{fontSize:12,color:'#EEE6C9'}}>Aucune note</div>
          <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>Cliquez pour créer</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
          {notes.map(note => (
            <div key={note.id}
              onClick={()=>setExpanded(expanded===note.id?null:note.id)}
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(201,168,76,0.2)',borderLeft:'3px solid #C9A84C',borderRadius:'0 8px 8px 0',padding:'10px 12px',cursor:'pointer',transition:'background 0.15s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                <span style={{fontWeight:700,fontSize:12,color:'#EEE6C9',flex:1,lineHeight:1.3}}>{note.titre||'Note'}</span>
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                  <span style={{fontSize:10,color:'rgba(238,230,201,0.35)'}}>
                    {note.updated_at ? new Date(note.updated_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : ''}
                  </span>
                  <button onClick={e=>handleDelete(note.id,e)}
                    style={{background:'none',border:'none',cursor:'pointer',color:'rgba(238,230,201,0.25)',fontSize:13,padding:0,lineHeight:1,fontFamily:'DM Sans,sans-serif'}}
                    onMouseEnter={e=>e.currentTarget.style.color='#dc2626'}
                    onMouseLeave={e=>e.currentTarget.style.color='rgba(238,230,201,0.25)'}>✕</button>
                </div>
              </div>
              <div style={{fontSize:11,color:'rgba(238,230,201,0.6)',lineHeight:1.6,marginTop:4,
                ...(expanded===note.id ? {whiteSpace:'pre-wrap'} : {overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'})}}>
                {note.contenu}
              </div>
              {note.contenu.length > 100 && (
                <div style={{fontSize:10,color:'#C9A84C',marginTop:4,fontWeight:600}}>
                  {expanded===note.id ? '▲ Réduire' : '▼ Voir tout'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, count, onAction, actionLabel='Voir →', children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHead}>
        <span style={s.sectionTitle}>{title}</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {count != null && <span style={{background:count>0?'#dc2626':'#059669',color:'#fff',borderRadius:10,fontSize:10,padding:'1px 7px',fontWeight:700}}>{count}</span>}
          {onAction && <button onClick={onAction} style={s.sectionBtn}>{actionLabel}</button>}
        </div>
      </div>
      {children}
    </div>
  )
}
function Row({ children, onClick }) {
  return <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #F5F0E8',cursor:onClick?'pointer':'default'}}>{children}</div>
}
function Chip({ color, children }) {
  return <span style={{background:`${color}18`,color,borderRadius:6,padding:'2px 7px',fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>{children}</span>
}
function Arrow() {
  return <span style={{color:'#DDD5B8',fontSize:14,flexShrink:0}}>›</span>
}
function Empty({ children, color='#94a3b8' }) {
  return <div style={{fontSize:13,color,padding:'8px 0',fontStyle:color==='#94a3b8'?'italic':'normal',fontWeight:color==='#94a3b8'?400:600}}>{children}</div>
}
function Loader() {
  return <div style={{padding:40,textAlign:'center',color:'#94a3b8'}}>Chargement…</div>
}

const s = {
  page:        { padding:'20px 16px 40px', maxWidth:900, margin:'0 auto' },
  header:      { marginBottom:16 },
  title:       { fontSize:24, fontFamily:'DM Serif Display, serif', color:'#0D1520', fontWeight:400, margin:0 },
  sub:         { fontSize:13, color:'#94a3b8', marginTop:4 },
  shortcuts:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 },
  shortcut:    { position:'relative', background:'#fff', border:'1px solid #DDD5B8', borderRadius:14, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer', fontFamily:'DM Sans,sans-serif', transition:'border-color 0.15s, box-shadow 0.15s' },
  grid:        { display:'grid', gridTemplateColumns:'1fr 1fr 320px', gap:14, alignItems:'start' },
  col:         { display:'flex', flexDirection:'column', gap:14 },
  section:     { background:'#fff', border:'1px solid #DDD5B8', borderRadius:14, padding:'14px 16px' },
  sectionHead: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, paddingBottom:8, borderBottom:'1.5px solid #DDD5B8' },
  sectionTitle:{ fontSize:13, fontWeight:800, color:'#0D1520' },
  sectionBtn:  { fontSize:11, color:'#C9A84C', background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'DM Sans,sans-serif' },
  rowName:     { fontWeight:700, fontSize:13, color:'#0D1520' },
  rowSub:      { fontSize:11, color:'#64748b', marginTop:1 },
}
