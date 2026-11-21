import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Upload() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'', description:'', course:'MCA', semester:'1', subject:'', category:'Notes' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async e => {
    e.preventDefault(); setError('')
    if (!file) return setError('Please select a PDF.')
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setError('Only PDF files are accepted.')
    const data = new FormData()
    Object.entries(form).forEach(([k,v])=>data.append(k,v))
    data.append('file', file)
    setBusy(true)
    try { await api.post('/resources', data); navigate('/') }
    catch (err) { setError(err.response?.data?.message || 'Upload failed.') }
    finally { setBusy(false) }
  }
  return <div className="row justify-content-center"><div className="col-lg-8"><div className="mb-4"><p className="eyebrow mb-1">CONTRIBUTE TO THE COMMUNITY</p><h1 className="fw-bold">Upload a resource</h1><p className="text-secondary">Share useful academic material with fellow students.</p></div>
    <div className="card border-0 shadow-sm"><div className="card-body p-4">
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <label className="form-label">Resource title *</label><input className="form-control mb-3" required maxLength="180" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
        <label className="form-label">Description</label><textarea className="form-control mb-3" rows="3" maxLength="1500" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <div className="row">
          <div className="col-md-6"><label className="form-label">Course *</label><input className="form-control mb-3" required value={form.course} onChange={e=>setForm({...form,course:e.target.value})}/></div>
          <div className="col-md-6"><label className="form-label">Semester *</label><input className="form-control mb-3" required value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})}/></div>
          <div className="col-md-6"><label className="form-label">Subject *</label><input className="form-control mb-3" required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></div>
          <div className="col-md-6"><label className="form-label">Category *</label><select className="form-select mb-3" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{['Notes','Question Paper','Assignment','Practical','Reference'].map(x=><option key={x}>{x}</option>)}</select></div>
        </div>
        <label className="form-label">PDF file * (maximum 10 MB)</label><input className="form-control mb-4" type="file" accept="application/pdf,.pdf" required onChange={e=>setFile(e.target.files?.[0] || null)}/>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload resource'}</button>
        <button type="button" className="btn btn-light ms-2" onClick={()=>navigate('/')}>Cancel</button>
      </form>
    </div></div>
  </div></div>
}
