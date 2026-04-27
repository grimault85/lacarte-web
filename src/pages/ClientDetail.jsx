import { useState, useEffect } from 'react'
import BackToDashboard from '../components/BackToDashboard'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Badge } from './Clients'

const STAGES   = [{key:'prospection',label:'Prospection',color:'#6b7280',bg:'#f3f4f6'},{key:'questionnaire',label:'Questionnaire',color:'#0369a1',bg:'#e0f2fe'},{key:'audit',label:'Audit',color:'#d97706',bg:'#fef3c7'},{key:'cloture',label:'Clôture',color:'#059669',bg:'#d1fae5'}]
const FORMULAS = [{key:'audit_menu',label:'Audit Menu',color:'#0369a1',bg:'#e0f2fe'},{key:'audit_menu_financier',label:'Audit Complet',color:'#7c3aed',bg:'#ede9fe'},{key:'suivi_mensuel',label:'Retainer',color:'#059669',bg:'#d1fae5'}]
const PRIOS    = [{key:'high',label:'Haute',color:'#dc2626',bg:'#fee2e2'},{key:'medium',label:'Moyenne',color:'#d97706',bg:'#fef3c7'},{key:'low',label:'Basse',color:'#6b7280',bg:'#f3f4f6'}]
const TASKS_BY_FORMULA = {
  audit_menu: { prospection:['Premier contact établi','Éligibilité validée','Devis envoyé','Devis accepté + acompte reçu'], questionnaire:['Questionnaire pré-audit envoyé','Données reçues et vérifiées','Accès caisse/exports confirmé'], audit:['Analyse menu réalisée','Rapport rédigé','Rapport envoyé au client','Visio de restitution planifiée'], cloture:['Visio de restitution effectuée','Synthèse call envoyée','Solde facturé et encaissé','Dossier archivé'] },
  audit_menu_financier: { prospection:['Premier contact établi','Éligibilité validée','Devis envoyé','Devis accepté + acompte reçu'], questionnaire:['Questionnaire pré-audit envoyé','Données reçues et vérifiées','Tickets Z reçus (3 mois)','Bilan/compte de résultat reçu'], audit:['Analyse menu réalisée','Analyse financière réalisée','Rapport rédigé','Rapport envoyé','Visio J+7 planifiée','Visio J+30 planifiée'], cloture:['Visio J+7 effectuée','Visio J+30 effectuée','Synthèse envoyée','Solde facturé et encaissé','Dossier archivé'] },
  suivi_mensuel: { prospection:['Premier contact établi','Devis retainer envoyé','Contrat signé + acompte reçu'], questionnaire:['Questionnaire initial envoyé','Données de base reçues','Dashboard initialisé'], audit:['1er rapport mensuel livré','Visio de lancement effectuée'], cloture:['Résiliation reçue','Dernier rapport livré','Solde encaissé','Dossier archivé'] },
}

const stageOf  = k => STAGES.find(s=>s.key===k)||STAGES[0]
const fmOf     = k => FORMULAS.find(f=>f.key===k)||FORMULAS[0]
const prioOf   = k => PRIOS.find(p=>p.key===k)||PRIOS[1]
const fmtEur   = v => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v||0)

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client,  setClient]  = useState(null)
  const [history, setHistory] = useState([])
  const [tab,     setTab]     = useState('infos')
  const [saving,  setSaving]  = useState(false)
  const [note,    setNote]    = useState('')
  const [editField, setEditField] = useState(null)
  const [editVal,   setEditVal]   = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    const [{ data: c }, { data: h }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('history').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(20),
    ])
    setClient(c)
    setHistory(h || [])
  }

  async function toggleTask(stageKey, idx) {
    const tasks = { ...(client.tasks || {}) }
    const stageTasks = getTasksForStage(stageKey)
    const current = tasks[stageKey] || stageTasks.map(() => false)
    const padded  = [...current]
    while (padded.length < stageTasks.length) padded.push(false)
    padded[idx] = !padded[idx]
    tasks[stageKey] = padded
    await supabase.from('clients').update({ tasks }).eq('id', id)
    setClient(prev => ({ ...prev, tasks }))
  }

  async function updateField(field, value) {
    setSaving(true)
    await supabase.from('clients').update({ [field]: value }).eq('id', id)
    setClient(prev => ({ ...prev, [field]: value }))
    setEditField(null)
    setSaving(false)
  }

  async function addNote() {
    if (!note.trim()) return
    await supabase.from('history').insert({ client_id: +id, action: 'Note ajoutée (web)', details: note.trim() })
    setNote('')
    const { data: h } = await supabase.from('history').select('*').eq('client_id', id).order('created_at',{ascending:false}).limit(20)
    setHistory(h || [])
  }

  function getTasksForStage(stageKey) {
    const f = client?.formula || 'audit_menu'
    return TASKS_BY_FORMULA[f]?.[stageKey] || []
  }

  if (!client) return <div style={{padding:40,textAlign:'center',color:'#94a3b8'}}>Chargement…</div>

  const st   = stageOf(client.stage)
  const fm   = fmOf(client.formula)
  const prio = prioOf(client.priority)

  const TABS = [
    { key:'infos',   label:'Infos' },
    { key:'taches',  label:'Tâches' },
    { key:'notes',   label:'Notes' },
    { key:'historique', label:'Historique' },
  ]

  return (
    <div style={s.page}>
      <BackToDashboard />
      {/* Back */}
      <button onClick={()=>navigate('/clients')} style={s.back}>← Dossiers</button>

      {/* Header */}
      <div style={s.header}>
        <div style={{flex:1}}>
          <h1 style={s.name}>{client.name}</h1>
          <div style={s.company}>{client.company}</div>
          <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
            <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
            <Badge color={fm.color} bg={fm.bg}>{fm.label}</Badge>
            <Badge color={prio.color} bg={prio.bg}>{prio.label}</Badge>
          </div>
        </div>
      </div>

      {/* Changement de statut rapide */}
      <div style={s.stageRow}>
        <span style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>Étape</span>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {STAGES.map(st2 => (
            <button key={st2.key} onClick={()=>updateField('stage',st2.key)} style={{
              ...s.stageBtn,
              border:`1px solid ${client.stage===st2.key?st2.color:'#DDD5B8'}`,
              background:client.stage===st2.key?st2.bg:'#fff',
              color:client.stage===st2.key?st2.color:'#64748b',
              fontWeight:client.stage===st2.key?700:400,
            }}>{st2.label}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)} style={{...s.tab, ...(tab===t.key?s.tabActive:{})}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Infos */}
      {tab === 'infos' && (
        <div style={s.card}>
          {[
            { k:'email',      l:'Email',            v:client.email },
            { k:'phone',      l:'Téléphone',         v:client.phone },

            { k:'notes',      l:'Notes',             v:client.notes, multiline:true },
          ].map(f => (
            <div key={f.k} style={s.field}>
              <div style={s.fieldLabel}>{f.l}</div>
              {editField === f.k ? (
                <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                  {f.multiline
                    ? <textarea value={editVal} onChange={e=>setEditVal(e.target.value)} style={{...s.input,minHeight:80,resize:'vertical'}} autoFocus />
                    : <input value={editVal} onChange={e=>setEditVal(e.target.value)} style={s.input} autoFocus onKeyDown={e=>e.key==='Enter'&&updateField(f.k,editVal)} />
                  }
                  <button onClick={()=>updateField(f.k,editVal)} style={s.saveBtn} disabled={saving}>✓</button>
                  <button onClick={()=>setEditField(null)} style={s.cancelBtn}>✕</button>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:8}} onClick={()=>{setEditField(f.k);setEditVal(f.v||'')}}>
                  <span style={{...s.fieldVal,color:f.v?'#0D1520':'#94a3b8',fontStyle:f.v?'normal':'italic'}}>
                    {f.v || 'Non renseigné'}
                  </span>
                  <span style={s.editIcon}>✎</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tâches */}
      {tab === 'taches' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {STAGES.map(st2 => {
            const stageTasks = getTasksForStage(st2.key)
            if (!stageTasks.length) return null
            const tasks   = client.tasks?.[st2.key] || stageTasks.map(()=>false)
            const padded  = [...tasks]; while(padded.length<stageTasks.length) padded.push(false)
            const done    = padded.filter(Boolean).length
            const isCurr  = client.stage === st2.key
            return (
              <div key={st2.key} style={{...s.card, borderLeft:`3px solid ${isCurr?st2.color:'#DDD5B8'}`, opacity:isCurr?1:0.6}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <span style={{fontWeight:700,fontSize:13,color:st2.color}}>{st2.label} {isCurr&&<span style={{fontSize:10,background:st2.color,color:'#fff',borderRadius:4,padding:'1px 5px',marginLeft:4}}>EN COURS</span>}</span>
                  <span style={{fontSize:12,color:'#94a3b8'}}>{done}/{stageTasks.length}</span>
                </div>
                <div style={{height:3,background:'#EDE8D5',borderRadius:2,marginBottom:10,overflow:'hidden'}}>
                  <div style={{width:`${stageTasks.length>0?done/stageTasks.length*100:0}%`,height:'100%',background:st2.color}} />
                </div>
                {stageTasks.map((label,i) => (
                  <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',cursor:'pointer',borderBottom:'1px solid #F5F0E8'}}>
                    <input type="checkbox" checked={padded[i]||false} onChange={()=>toggleTask(st2.key,i)} style={{accentColor:st2.color,width:15,height:15}} />
                    <span style={{fontSize:13,color:padded[i]?'#94a3b8':'#374151',textDecoration:padded[i]?'line-through':'none'}}>{label}</span>
                  </label>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Notes */}
      {tab === 'notes' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={s.card}>
            <div style={s.fieldLabel}>Ajouter une note rapide</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Compte-rendu d'un call, observation terrain…"
              style={{...s.input,minHeight:80,resize:'vertical',marginTop:6}} />
            <button onClick={addNote} disabled={!note.trim()} style={{...s.saveBtn,marginTop:8,padding:'8px 16px',width:'100%'}}>
              Ajouter la note
            </button>
          </div>
          {client.notes && (
            <div style={{...s.card, borderLeft:'3px solid #C9A84C'}}>
              <div style={s.fieldLabel}>Notes du dossier</div>
              <div style={{fontSize:13,color:'#374151',lineHeight:1.65,whiteSpace:'pre-wrap',marginTop:4}}>{client.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Historique */}
      {tab === 'historique' && (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {history.length === 0
            ? <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Aucune activité</div>
            : history.map(h => (
              <div key={h.id} style={{...s.card,padding:'10px 14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                  <span style={{fontSize:13,fontWeight:600,color:'#0D1520'}}>{h.action}</span>
                  {h.utilisateur && <span style={{fontSize:10,background:'#FAF3E0',color:'#C9A84C',borderRadius:5,padding:'1px 6px',fontWeight:700}}>{h.utilisateur}</span>}
                </div>
                {h.details && <div style={{fontSize:12,color:'#64748b'}}>{h.details}</div>}
                <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>{h.created_at ? new Date(h.created_at).toLocaleString('fr-FR') : ''}</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

const s = {
  page: {padding:'16px 16px 40px',maxWidth:700,margin:'0 auto'},
  back: {display:'inline-flex',alignItems:'center',gap:6,background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:13,marginBottom:16,padding:0},
  header: {display:'flex',gap:12,marginBottom:14},
  name: {fontSize:24,fontFamily:'DM Serif Display, serif',color:'#0D1520',fontWeight:400},
  company: {fontSize:13,color:'#64748b',marginTop:3},
  stageRow: {display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:16,background:'#fff',border:'1px solid #DDD5B8',borderRadius:12,padding:'10px 14px'},
  stageBtn: {padding:'4px 11px',borderRadius:20,cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif'},
  tabs: {display:'flex',gap:0,marginBottom:16,background:'#fff',border:'1px solid #DDD5B8',borderRadius:12,overflow:'hidden'},
  tab: {flex:1,padding:'10px 6px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:500,color:'#64748b',fontFamily:'DM Sans,sans-serif'},
  tabActive: {background:'#FAF3E0',color:'#C9A84C',fontWeight:700},
  card: {background:'#fff',border:'1px solid #DDD5B8',borderRadius:12,padding:'14px'},
  field: {marginBottom:14},
  fieldLabel: {fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.8,marginBottom:4},
  fieldVal: {fontSize:14,cursor:'pointer',flex:1},
  editIcon: {fontSize:12,color:'#C9A84C',opacity:0.5,cursor:'pointer'},
  input: {width:'100%',padding:'9px 12px',border:'1px solid #DDD5B8',borderRadius:8,fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none',background:'#FAF8F2'},
  saveBtn: {background:'#C9A84C',color:'#0D1520',border:'none',borderRadius:8,padding:'8px 12px',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'DM Sans,sans-serif'},
  cancelBtn: {background:'#f3f4f6',color:'#6b7280',border:'none',borderRadius:8,padding:'8px 12px',cursor:'pointer',fontSize:13,fontFamily:'DM Sans,sans-serif'},
}
