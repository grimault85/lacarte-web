import React, { useState, useEffect } from 'react'
import BackToDashboard from '../components/BackToDashboard'
import { supabase } from '../supabase'

const THEMES  = [{key:'conseil',label:'Conseil & Tips',color:'#0369a1',bg:'#e0f2fe'},{key:'cas_client',label:'Cas client',color:'#059669',bg:'#d1fae5'},{key:'coulisses',label:'Coulisses',color:'#7c3aed',bg:'#ede9fe'},{key:'benchmark',label:'Benchmark',color:'#d97706',bg:'#fef3c7'},{key:'tendance',label:'Tendance CHR',color:'#dc2626',bg:'#fee2e2'},{key:'question',label:'Question',color:'#C9A84C',bg:'#FAF3E0'},{key:'autre',label:'Autre',color:'#6b7280',bg:'#f3f4f6'}]
const STATUTS = [{key:'idee',label:'💡 Idée',color:'#94a3b8',bg:'#f1f5f9'},{key:'brouillon',label:'✏️ Brouillon',color:'#d97706',bg:'#fef3c7'},{key:'programme',label:'📅 Programmé',color:'#0369a1',bg:'#e0f2fe'},{key:'publie',label:'✅ Publié',color:'#059669',bg:'#d1fae5'}]
const PLATES  = [{key:'linkedin',label:'LinkedIn',icon:'💼',color:'#0077b5',bg:'#e8f4fd'},{key:'instagram',label:'Instagram',icon:'📸',color:'#e1306c',bg:'#fce4ec'},{key:'les_deux',label:'Les deux',icon:'🔗',color:'#7c3aed',bg:'#ede9fe'}]
const themeOf  = k => THEMES.find(t=>t.key===k)  || THEMES[6]
const statutOf = k => STATUTS.find(s=>s.key===k) || STATUTS[0]
const plateOf  = k => PLATES.find(p=>p.key===k)  || PLATES[0]

export default function Social() {
  const [tab, setTab] = useState('banque')
  const TABS = [{key:'banque',label:'📝 Banque de contenus'},{key:'stats',label:'📊 Performance'}]
  return (
    <div style={s.page}>
      <BackToDashboard />
      <h1 style={s.title}>Réseaux Sociaux</h1>
      <div style={s.tabs}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{...s.tab,...(tab===t.key?s.tabActive:{})}}>{t.label}</button>
        ))}
      </div>
      {tab==='banque' && <Banque />}
      {tab==='stats'  && <Stats />}
    </div>
  )
}

function Banque() {
  const [items,    setItems]    = useState([])
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('social_contenus').select('*').order('updated_at',{ascending:false})
    setItems(data||[])
    setLoading(false)
  }

  async function markPublished(item) {
    await supabase.from('social_contenus').update({statut:'publie',date_publi:new Date().toISOString().split('T')[0]}).eq('id',item.id)
    setSelected(null)
    load()
  }

  async function handleSave(form) {
    await supabase.from('social_contenus').insert({
      titre:       form.titre,
      plateforme:  form.plateforme,
      theme:       form.theme,
      statut:      form.statut,
      contenu:     form.contenu || '',
      visuel_notes:form.visuel_notes || '',
      updated_at:  new Date().toISOString(),
    })
    setShowForm(false)
    load()
  }

  const counts = {}
  STATUTS.forEach(st => counts[st.key] = items.filter(i=>i.statut===st.key).length)
  const filtered = filter==='all' ? items : items.filter(i=>i.statut===filter)

  // Vue formulaire
  if (showForm) return (
    <NouveauContenu onSave={handleSave} onCancel={()=>setShowForm(false)} />
  )

  // Vue détail
  if (selected) {
    const theme  = themeOf(selected.theme)
    const statut = statutOf(selected.statut)
    const plat   = plateOf(selected.plateforme)
    return (
      <div>
        <button onClick={()=>setSelected(null)} style={s.back}>← Retour</button>
        <div style={{display:'flex',gap:7,marginBottom:12,flexWrap:'wrap'}}>
          <Chip color={plat.color} bg={plat.bg}>{plat.icon} {plat.label}</Chip>
          <Chip color={theme.color} bg={theme.bg}>{theme.label}</Chip>
          <Chip color={statut.color} bg={statut.bg}>{statut.label}</Chip>
          {selected.date_publi&&<Chip color='#6b7280' bg='#f3f4f6'>📅 {new Date(selected.date_publi).toLocaleDateString('fr-FR')}</Chip>}
        </div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#0D1520',marginBottom:12}}>{selected.titre}</h2>
        {selected.image_path && (
          <div style={{textAlign:'center',marginBottom:12}}>
            <img src={`https://eqkpugvccpolkgtnmpxs.supabase.co/storage/v1/object/public/attachments/${selected.image_path}`}
              alt="" style={{maxWidth:'100%',maxHeight:300,borderRadius:10,border:'1px solid #DDD5B8',objectFit:'contain'}} />
          </div>
        )}
        {selected.contenu && (
          <div style={{background:'#fff',border:'1px solid #DDD5B8',borderRadius:12,padding:'16px',marginBottom:12,fontSize:14,lineHeight:1.8,color:'#1e293b',whiteSpace:'pre-wrap'}}>
            {selected.contenu}
          </div>
        )}
        {selected.visuel_notes && (
          <div style={{background:'#FAF3E0',border:'1px solid rgba(201,168,76,0.3)',borderLeft:'3px solid #C9A84C',borderRadius:'0 8px 8px 0',padding:'12px 14px',marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:'#C9A84C',textTransform:'uppercase',letterSpacing:0.8,marginBottom:4}}>🎨 Notes visuelles</div>
            <div style={{fontSize:13,color:'#374151'}}>{selected.visuel_notes}</div>
          </div>
        )}
        {selected.statut !== 'publie' && (
          <button onClick={()=>markPublished(selected)} style={{...s.btnPrimary,background:'#059669'}}>✓ Marquer publié</button>
        )}
      </div>
    )
  }

  if (loading) return <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Chargement…</div>

  return (
    <div>
      {/* Pipeline */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {STATUTS.map(st=>(
          <div key={st.key} onClick={()=>setFilter(filter===st.key?'all':st.key)}
            style={{background:filter===st.key?st.bg:'#fff',border:`1px solid ${filter===st.key?st.color:'#DDD5B8'}`,borderTop:`3px solid ${st.color}`,borderRadius:12,padding:'12px',cursor:'pointer',textAlign:'center'}}>
            <div style={{fontSize:11,fontWeight:700,color:st.color}}>{st.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:st.color,marginTop:4}}>{counts[st.key]||0}</div>
          </div>
        ))}
      </div>

      {/* Bouton nouveau */}
      <button onClick={()=>setShowForm(true)} style={{...s.btnPrimary,marginBottom:16,display:'flex',alignItems:'center',gap:6}}>
        + Nouvelle idée
      </button>

      {filtered.length===0
        ? (
          <div onClick={()=>setShowForm(true)}
            style={{border:'2px dashed #DDD5B8',borderRadius:12,padding:48,textAlign:'center',cursor:'pointer',color:'#94a3b8'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#C9A84C'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#DDD5B8'}>
            <div style={{fontSize:32,marginBottom:8}}>📝</div>
            <div style={{fontSize:14,fontWeight:600,color:'#64748b'}}>Aucun contenu</div>
            <div style={{fontSize:12,marginTop:4}}>Appuyez ici pour capturer une idée</div>
          </div>
        )
        : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map(item => {
              const theme  = themeOf(item.theme)
              const statut = statutOf(item.statut)
              const plat   = plateOf(item.plateforme)
              return (
                <div key={item.id} onClick={()=>setSelected(item)}
                  style={{background:'#fff',border:'1px solid #DDD5B8',borderRadius:12,padding:'12px 14px',cursor:'pointer',display:'flex',gap:12,alignItems:'center'}}>
                  <span style={{fontSize:20,flexShrink:0}}>{plat.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#0D1520',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.titre}</div>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                      <Chip color={theme.color} bg={theme.bg}>{theme.label}</Chip>
                      <Chip color={statut.color} bg={statut.bg}>{statut.label}</Chip>
                    </div>
                  </div>
                  {item.date_publi&&<div style={{fontSize:11,color:'#94a3b8',whiteSpace:'nowrap',flexShrink:0}}>{new Date(item.date_publi).toLocaleDateString('fr-FR')}</div>}
                  <span style={{color:'#DDD5B8',fontSize:16,flexShrink:0}}>›</span>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

// ── Formulaire nouveau contenu ─────────────────────────────────────
function NouveauContenu({ onSave, onCancel }) {
  const [form, setForm] = useState({
    titre: '', plateforme: 'linkedin', theme: 'conseil',
    statut: 'idee', contenu: '', visuel_notes: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({...p, [k]: v}))

  const charLimit = form.plateforme === 'instagram' ? 2200 : 3000
  const charCount = form.contenu.length
  const overLimit = charCount > charLimit

  async function handleSubmit() {
    if (!form.titre.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
        <button onClick={onCancel} style={s.back}>← Retour</button>
        <h2 style={{flex:1,margin:0,fontSize:18,fontWeight:800,color:'#0D1520'}}>Nouvelle idée</h2>
        <button onClick={handleSubmit} disabled={!form.titre.trim()||saving}
          style={{...s.btnPrimary,opacity:form.titre.trim()?1:0.5,minWidth:120}}>
          {saving ? '…' : '💾 Enregistrer'}
        </button>
      </div>

      <div style={s.formCard}>

        {/* Titre */}
        <div style={{marginBottom:16}}>
          <label style={s.label}>Titre *</label>
          <input value={form.titre} onChange={e=>set('titre',e.target.value)}
            style={s.input} placeholder="Ex: 3 erreurs qui font exploser le CMV en cuisine" autoFocus />
        </div>

        {/* Plateforme + Statut */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          <div>
            <label style={s.label}>Plateforme</label>
            <div style={{display:'flex',gap:5,marginTop:4}}>
              {PLATES.map(p=>(
                <button key={p.key} onClick={()=>set('plateforme',p.key)}
                  style={{flex:1,padding:'8px 4px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,textAlign:'center',
                    border:`1px solid ${form.plateforme===p.key?p.color:'#DDD5B8'}`,
                    background:form.plateforme===p.key?p.bg:'#fff',
                    color:form.plateforme===p.key?p.color:'#6b7280'}}>
                  {p.icon}<br/><span style={{fontSize:10}}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={s.label}>Statut</label>
            <select value={form.statut} onChange={e=>set('statut',e.target.value)} style={{...s.input,marginTop:4}}>
              {STATUTS.map(st=><option key={st.key} value={st.key}>{st.label}</option>)}
            </select>
          </div>
        </div>

        {/* Thème */}
        <div style={{marginBottom:16}}>
          <label style={s.label}>Thème</label>
          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:6}}>
            {THEMES.map(t=>(
              <button key={t.key} onClick={()=>set('theme',t.key)}
                style={{padding:'5px 10px',borderRadius:20,cursor:'pointer',fontSize:11,fontWeight:600,
                  border:`1px solid ${form.theme===t.key?t.color:'#DDD5B8'}`,
                  background:form.theme===t.key?t.bg:'#fff',
                  color:form.theme===t.key?t.color:'#6b7280'}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <label style={s.label}>Texte du post</label>
            <span style={{fontSize:10,color:overLimit?'#dc2626':'#94a3b8',fontWeight:overLimit?700:400}}>
              {charCount} / {charLimit.toLocaleString('fr-FR')}
            </span>
          </div>
          <textarea rows={8} value={form.contenu} onChange={e=>set('contenu',e.target.value)}
            style={{...s.input,resize:'vertical',minHeight:160,fontFamily:'inherit',lineHeight:1.7,
              borderColor:overLimit?'#dc2626':'#DDD5B8'}}
            placeholder={`Rédigez votre post ${form.plateforme==='instagram'?'Instagram':'LinkedIn'}…\n\nAstuce : commencez par une accroche forte sur la première ligne.`} />
        </div>

        {/* Notes visuelles */}
        <div>
          <label style={s.label}>Notes visuelles <span style={{fontWeight:400,color:'#94a3b8'}}>(optionnel)</span></label>
          <textarea rows={3} value={form.visuel_notes} onChange={e=>set('visuel_notes',e.target.value)}
            style={{...s.input,resize:'vertical',marginTop:4,fontFamily:'inherit'}}
            placeholder="Ex: Fond navy, chiffre en or centré, logo La Carte en bas à droite" />
        </div>

      </div>
    </div>
  )
}

// ── Suivi Performance ──────────────────────────────────────────────
function Stats() {
  const [stats, setStats]   = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('social_stats').select('*').order('date_publi',{ascending:false})
      .then(({data}) => { setStats(data||[]); setLoading(false) })
  }, [])

  const filtered = filter==='all' ? stats : stats.filter(s=>s.plateforme===filter)
  const totaux = {
    vues:  filtered.reduce((s,i)=>s+(+i.vues||0),0),
    likes: filtered.reduce((s,i)=>s+(+i.likes||0),0),
    comms: filtered.reduce((s,i)=>s+(+i.commentaires||0),0),
    posts: filtered.length,
  }
  const engag = totaux.vues>0 ? (((totaux.likes+totaux.comms)/totaux.vues)*100).toFixed(1) : '—'

  if (loading) return <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Chargement…</div>

  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {[{key:'all',label:'Tous',icon:''},
          {key:'linkedin',label:'LinkedIn',icon:'💼'},
          {key:'instagram',label:'Instagram',icon:'📸'}].map(p=>(
          <button key={p.key} onClick={()=>setFilter(p.key)}
            style={{...s.fBtn,...(filter===p.key?s.fBtnActive:{})}}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {[{l:'Posts',v:totaux.posts,c:'#0D1520',i:'📝'},{l:'Vues',v:totaux.vues.toLocaleString('fr-FR'),c:'#0369a1',i:'👁️'},{l:'Likes',v:totaux.likes,c:'#dc2626',i:'❤️'},{l:'Engagement',v:`${engag}%`,c:'#C9A84C',i:'📈'}].map((k,i)=>(
          <div key={i} style={{background:'#fff',border:'1px solid #DDD5B8',borderRadius:12,padding:'12px',textAlign:'center'}}>
            <div style={{fontSize:18,marginBottom:4}}>{k.i}</div>
            <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:3}}>{k.l}</div>
            <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {filtered.length===0
        ? <div style={{textAlign:'center',padding:40,color:'#94a3b8',fontStyle:'italic'}}>Aucun résultat enregistré</div>
        : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map(stat => {
              const plat = PLATES.find(p=>p.key===stat.plateforme)||PLATES[0]
              const eng  = stat.vues>0 ? (((+stat.likes||0)+(+stat.commentaires||0))/stat.vues*100).toFixed(1) : null
              return (
                <div key={stat.id} style={{background:'#fff',border:'1px solid #DDD5B8',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:20,flexShrink:0}}>{plat.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#0D1520',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{stat.titre||'—'}</div>
                    <div style={{fontSize:11,color:'#94a3b8'}}>{stat.date_publi?new Date(stat.date_publi).toLocaleDateString('fr-FR'):''}</div>
                  </div>
                  <div style={{display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
                    <div style={{textAlign:'center'}}><div style={{fontSize:9,color:'#94a3b8'}}>Vues</div><div style={{fontWeight:700,color:'#0369a1'}}>{(+stat.vues||0).toLocaleString('fr-FR')}</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:9,color:'#94a3b8'}}>Likes</div><div style={{fontWeight:700,color:'#dc2626'}}>{+stat.likes||0}</div></div>
                    {eng&&<Chip color='#C9A84C' bg='#FAF3E0'>{eng}%</Chip>}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

function Chip({ color, bg, children }) {
  return <span style={{background:bg||`${color}18`,color,borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{children}</span>
}

const s = {
  page:      { padding:'20px 16px 40px', maxWidth:700, margin:'0 auto' },
  title:     { fontSize:24, fontFamily:'DM Serif Display, serif', color:'#0D1520', fontWeight:400, marginBottom:16 },
  tabs:      { display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid #DDD5B8' },
  tab:       { padding:'8px 16px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, fontWeight:400, color:'#64748b', borderBottom:'2px solid transparent', fontFamily:'DM Sans,sans-serif' },
  tabActive: { color:'#C9A84C', fontWeight:700, borderBottomColor:'#C9A84C' },
  back:      { display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:13, marginBottom:16, padding:0, fontFamily:'DM Sans,sans-serif' },
  btnPrimary:{ background:'#C9A84C', color:'#0D1520', border:'none', borderRadius:8, padding:'10px 18px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'DM Sans,sans-serif' },
  fBtn:      { padding:'5px 12px', borderRadius:20, border:'1px solid #DDD5B8', background:'#fff', fontSize:12, fontWeight:500, cursor:'pointer', color:'#64748b', fontFamily:'DM Sans,sans-serif' },
  fBtnActive:{ background:'#FAF3E0', borderColor:'#C9A84C', color:'#0D1520', fontWeight:700 },
  formCard:  { background:'#fff', border:'1px solid #DDD5B8', borderRadius:14, padding:'20px' },
  label:     { display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 },
  input:     { width:'100%', padding:'10px 12px', border:'1px solid #DDD5B8', borderRadius:8, fontSize:13, fontFamily:'DM Sans,sans-serif', background:'#FFFDF8', color:'#0D1520', outline:'none', boxSizing:'border-box' },
}
