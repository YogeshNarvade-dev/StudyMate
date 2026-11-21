import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Dashboard() {
  const [items, setItems] = useState([])
  const [filters, setFilters] = useState({ query: '', course: '', semester: '', subject: '', category: '' })
  const [error, setError] = useState('')
  const load = async () => {
    try { const { data } = await api.get('/resources', { params: filters }); setItems(data); setError('') }
    catch (e) { setError(e.response?.data?.message || 'Could not load resources.') }
  }
  useEffect(() => { load() }, [])
  const download = async item => {
    try {
      const res = await api.get(`/resources/${item.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data); const a = document.createElement('a')
      a.href = url; a.download = item.originalFilename; a.click(); URL.revokeObjectURL(url)
    } catch { setError('Download failed. Please try again.') }
  }
  const remove = async item => {
    if (!confirm(`Delete "${item.title}"?`)) return
    try { await api.delete(`/resources/${item.id}`); load() }
    catch (e) { setError(e.response?.data?.message || 'Could not delete resource.') }
  }
  return <>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div><p className="eyebrow mb-1">YOUR LEARNING LIBRARY</p><h1 className="fw-bold mb-1">Explore resources</h1><p className="text-secondary mb-0">Find notes, question papers and useful study material.</p></div>
      <Link to="/upload" className="btn btn-primary"><i className="bi bi-cloud-arrow-up me-2"/>Upload resource</Link>
    </div>
    <div className="card border-0 shadow-sm mb-4"><div className="card-body">
      <div className="row g-2">
        <div className="col-lg-4"><input className="form-control" placeholder="Search title, description or subject…" value={filters.query} onChange={e=>setFilters({...filters,query:e.target.value})}/></div>
        <div className="col-6 col-lg-2"><input className="form-control" placeholder="Course" value={filters.course} onChange={e=>setFilters({...filters,course:e.target.value})}/></div>
        <div className="col-6 col-lg-2"><input className="form-control" placeholder="Semester" value={filters.semester} onChange={e=>setFilters({...filters,semester:e.target.value})}/></div>
        <div className="col-6 col-lg-2"><input className="form-control" placeholder="Subject" value={filters.subject} onChange={e=>setFilters({...filters,subject:e.target.value})}/></div>
        <div className="col-6 col-lg-2"><button className="btn btn-dark w-100" onClick={load}><i className="bi bi-search me-1"/>Search</button></div>
      </div>
    </div></div>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="d-flex justify-content-between mb-3"><span className="text-secondary">{items.length} resource(s) found</span></div>
    <div className="row g-3">
      {items.map(item=><div className="col-md-6 col-xl-4" key={item.id}><div className="card resource-card h-100 border-0 shadow-sm">
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between mb-3"><span className="resource-icon"><i className="bi bi-file-earmark-pdf"/></span><span className="badge text-bg-light">{item.category}</span></div>
          <h5 className="fw-bold">{item.title}</h5><p className="text-secondary small flex-grow-1">{item.description || 'No description provided.'}</p>
          <div className="small text-secondary mb-3"><div>{item.course} · {item.semester}</div><div>{item.subject}</div><div>Uploaded by {item.uploadedByName}</div></div>
          <div className="d-flex gap-2"><button className="btn btn-primary flex-grow-1" onClick={()=>download(item)}><i className="bi bi-download me-2"/>Download</button>
            <button className="btn btn-outline-danger" title="Delete (owner or admin)" onClick={()=>remove(item)}><i className="bi bi-trash"/></button></div>
        </div></div></div>)}
      {!items.length && !error && <div className="col-12"><div className="empty-state"><i className="bi bi-folder2-open display-5 text-secondary"/><h5 className="mt-3">No resources found</h5><p className="text-secondary">Try another search or upload the first resource.</p></div></div>}
    </div>
  </>
}
