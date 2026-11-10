import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import Header from '../components/layout/Header';
import {deleteApp,listApps,logoUrl,saveApp,uploadLogo,uploadPresentation} from '../services/applicationService';
import {CheckCircle2,KeyRound,Plus,Presentation,Save,Trash2,Upload,X} from 'lucide-react';

const blank=()=>({_draftKey:crypto.randomUUID(),name:'',description:'',category:'',applicationUrl:'',displayOrder:'',status:'Planned',demoAvailable:false,presentationAvailable:false,credentialsAvailable:false});
const slugify=value=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const formApp=app=>({...blank(),...app,displayOrder:app.displayOrder??'',_draftKey:app._id||crypto.randomUUID()});

export default function AdminPage(){
  const [catalogue,setCatalogue]=useState([]),[loading,setLoading]=useState(true),[drafts,setDrafts]=useState([]),[files,setFiles]=useState({}),[logoFiles,setLogoFiles]=useState({}),[error,setError]=useState(''),[saving,setSaving]=useState(false),[open,setOpen]=useState(false);
  const load=()=>{setLoading(true);listApps().then(setCatalogue).catch(e=>setError(e.message)).finally(()=>setLoading(false))};
  useEffect(load,[]);
  const openAdd=()=>{setDrafts([blank()]);setFiles({});setLogoFiles({});setError('');setOpen(true)};
  const openEdit=app=>{setDrafts([formApp(app)]);setFiles({});setLogoFiles({});setError('');setOpen(true)};
  const close=()=>{if(!saving)setOpen(false)};
  const change=(index,key,value)=>setDrafts(drafts=>drafts.map((app,itemIndex)=>itemIndex===index?{...app,[key]:value}:app));
  const add=()=>setDrafts(drafts=>[...drafts,blank()]);
  const save=async()=>{
    setError('');
    if(drafts.some(app=>!app.name.trim())){setError('Enter an application name before saving.');return}
    setSaving(true);
    try{
      const saved=[];
      for(const app of drafts){const {_draftKey,displayOrder,_id,...data}=app;saved.push(await saveApp({...data,_id,slug:app._id?app.slug:`${slugify(app.name)}-${crypto.randomUUID().slice(0,8)}`,displayOrder:displayOrder===''?undefined:Number(displayOrder)}))}
      for(let index=0;index<saved.length;index++){const key=drafts[index]._draftKey,presentation=files[key],logo=logoFiles[key];if(presentation)await uploadPresentation(saved[index]._id,presentation);if(logo)await uploadLogo(saved[index]._id,logo)}
      setOpen(false);load();
    }catch(e){setError(e.message)}finally{setSaving(false)}
  };
  const removeApplication=async app=>{
    if(!window.confirm(`Delete “${app.name}”? This will remove it from the catalogue.`))return;
    setError('');
    try{await deleteApp(app._id);setCatalogue(catalogue=>catalogue.filter(item=>item._id!==app._id))}catch(e){setError(e.message)}
  };
  return <><Header/><main className="admin"><div className="admin-title"><div><span className="eyebrow">IT ADMINISTRATION</span><h1>Catalogue management</h1><p>Review, update, or remove applications available in the catalogue.</p></div><div className="admin-actions"><Link to="/" className="back">View catalogue</Link><button className="primary add-application" onClick={openAdd}><Plus size={17}/> Add application</button></div></div>
    {error&&!open&&<p className="notice error" role="alert">{error}</p>}
    <section className="application-admin-list"><div className="list-heading"><h2>Added applications</h2><span>{catalogue.length} {catalogue.length===1?'application':'applications'}</span></div>{loading?<div className="empty">Loading applications…</div>:catalogue.length?<div className="admin-grid">{catalogue.map(app=>{const logo=logoUrl(app.logo);return <article className="admin-card" key={app._id}><div className="card-head"><div className="app-icon">{logo?<img src={logo} alt={`${app.name} logo`}/>:app.name.split(' ').map(part=>part[0]).slice(0,2).join('')}</div><span className="category">{app.category||'Uncategorized'}</span></div><h3>{app.name}</h3><p>{app.description||'No description added yet.'}</p><div className="admin-card-status"><span className={app.demoAvailable?'ready':''}><CheckCircle2 size={14}/> Demo {app.demoAvailable?'ready':'unavailable'}</span><span className={app.presentationAvailable?'ready':''}><Presentation size={14}/> Presentation</span><span className={app.credentialsAvailable?'ready':''}><KeyRound size={14}/> Credentials</span></div><div className="admin-card-actions"><button className="edit-entry" onClick={()=>openEdit(app)}>Edit</button><button className="delete-entry" onClick={()=>removeApplication(app)}><Trash2 size={16}/> Delete</button></div></article>})}</div>:<div className="empty"><h3>No applications added yet</h3><p>Use “Add application” to create the first catalogue entry.</p></div>}</section>
  </main>{open&&<div className="overlay" role="dialog" aria-modal="true" aria-labelledby="entry-form-title"><section className="catalogue-modal"><button className="close" type="button" onClick={close} aria-label="Close form"><X size={20}/></button><span className="eyebrow">{drafts[0]?._id?'EDIT APPLICATION':'ADD APPLICATION'}</span><h2 id="entry-form-title">{drafts[0]?._id?'Update application':'Add to catalogue'}</h2><p>Enter the application details below. Fields begin empty so you can add only the information you need.</p>{error&&<p className="notice error" role="alert">{error}</p>}
    {drafts.map((app,index)=><article className="editor" key={app._draftKey}><div className="editor-heading"><h3>Application {drafts.length>1?index+1:''}</h3></div><div className="edit-grid"><label>Application name<input value={app.name} placeholder="e.g. Inventory Portal" onChange={e=>change(index,'name',e.target.value)}/></label><label>Description<textarea value={app.description||''} placeholder="Describe the application's business purpose" onChange={e=>change(index,'description',e.target.value)}/></label><label>Category<input value={app.category||''} placeholder="e.g. Operations" onChange={e=>change(index,'category',e.target.value)}/></label><label>Application URL<input type="url" placeholder="https://example.com" value={app.applicationUrl||''} onChange={e=>change(index,'applicationUrl',e.target.value)}/></label><label>Application logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>setLogoFiles(files=>({...files,[app._draftKey]:e.target.files?.[0]}))}/>{logoFiles[app._draftKey]?.name||app.logo?.split('/').pop()||'No logo selected'}</label><label>Presentation upload<input type="file" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={e=>setFiles(files=>({...files,[app._draftKey]:e.target.files?.[0]}))}/>{files[app._draftKey]?.name||app.presentationFile?.name||'No presentation selected'}</label><label>Display order<input type="number" min="0" placeholder="e.g. 1" value={app.displayOrder} onChange={e=>change(index,'displayOrder',e.target.value)}/></label><label>Status<select value={app.status||'Planned'} onChange={e=>change(index,'status',e.target.value)}><option>Planned</option><option>Active</option><option>Archived</option></select></label></div><div className="toggles">{['demoAvailable','presentationAvailable','credentialsAvailable'].map(key=><label key={key}><input type="checkbox" checked={!!app[key]} onChange={e=>change(index,key,e.target.checked)}/>{key.replace(/Available/,' available').replace(/^./,letter=>letter.toUpperCase())}</label>)}</div></article>)}
    {!drafts[0]?._id&&<button className="add" type="button" onClick={add}><Plus size={17}/> Add another application</button>}<div className="modal-actions"><button className="secondary" type="button" onClick={close}>Cancel</button><button className="primary save" disabled={saving} onClick={save}>{saving?<Upload size={17}/>:<Save size={17}/>}{saving?' Saving…':' Save application'}</button></div></section></div>}</>}
