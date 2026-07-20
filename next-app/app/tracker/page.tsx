'use client';
import { useEffect, useMemo, useState } from 'react';

type Contact = { id:string; first:string; last:string; company:string; city:string; phone:string; email:string; status:string; segment:string; chapter:string; assignee_id?:string|null };
type Developer = { id:string; name:string };

export default function Tracker() {
  const [contacts,setContacts] = useState<Contact[]>([]); const [developers,setDevelopers] = useState<Developer[]>([]);
  const [q,setQ] = useState(''); const [status,setStatus] = useState(''); const [loading,setLoading] = useState(true); const [error,setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const [c,d] = await Promise.all([fetch('/api/contacts').then(r=>r.json()),fetch('/api/developers').then(r=>r.json())]); if(c.error) throw new Error(c.error); setContacts(c); setDevelopers(d.error ? [] : d); } catch(e) { setError(e instanceof Error?e.message:'Failed to load contacts'); } finally {setLoading(false);} };
  useEffect(()=>{load()},[]);
  const filtered = useMemo(()=>contacts.filter(c=>(!q || `${c.first} ${c.last} ${c.company} ${c.city}`.toLowerCase().includes(q.toLowerCase())) && (!status || c.status===status)),[contacts,q,status]);
  const counts = useMemo(()=>Object.fromEntries(['Identified','Contacted','Meeting Scheduled','Met','Follow-up','Converted','Not Interested'].map(s=>[s,contacts.filter(c=>c.status===s).length])),[contacts]);
  const saveStatus = async (id:string, value:string) => { const r=await fetch(`/api/contacts/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:value})}); const data=await r.json(); if(!r.ok) return setError(data.error); setContacts(cs=>cs.map(c=>c.id===id?{...c,status:value}:c)); };
  return <section className="content"><h1>Contact Tracker</h1><p className="sub">Full contact database — search, filter, and track each lead&apos;s outreach journey</p>
    {error && <div className="error">{error}</div>}<div className="stats"><div className="stat"><b>{contacts.length}</b><span>Total</span></div>{Object.entries(counts).map(([s,n])=><div className="stat" key={s}><b>{n}</b><span>{s}</span></div>)}</div>
    <div className="toolbar"><input placeholder="Search name, company, city..." value={q} onChange={e=>setQ(e.target.value)}/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{Object.keys(counts).map(s=><option key={s}>{s}</option>)}</select><button className="secondary" onClick={load}>Refresh</button><span style={{color:'#64748b',fontSize:13}}>{developers.length} developers available</span></div>
    {loading?<div className="card empty">Loading contacts…</div>:<div className="table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>City</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><b>{`${c.first||''} ${c.last||''}`.trim()||'Unnamed'}</b></td><td>{c.company||'—'}</td><td>{c.city||'—'}</td><td>{c.phone||'—'}</td><td><span className="pill">{c.status}</span></td><td><select value={c.status} onChange={e=>saveStatus(c.id,e.target.value)}>{Object.keys(counts).map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty">No contacts found.</div>}</div>}
  </section>;
}
