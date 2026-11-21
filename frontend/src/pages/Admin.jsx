import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Admin() {
  const [stats, setStats] = useState({ totalUsers: 0, totalResources: 0 })
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/users')])
      .then(([s,u]) => { setStats(s.data); setUsers(u.data) })
      .catch(e => setError(e.response?.data?.message || 'Admin access required.'))
  }, [])
  return <>
    <p className="eyebrow mb-1">PLATFORM MANAGEMENT</p><h1 className="fw-bold mb-4">Admin dashboard</h1>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="row g-3 mb-4">
      <div className="col-md-6"><div className="stat-card"><span>Total users</span><strong>{stats.totalUsers}</strong></div></div>
      <div className="col-md-6"><div className="stat-card"><span>Total resources</span><strong>{stats.totalResources}</strong></div></div>
    </div>
    <div className="card border-0 shadow-sm"><div className="card-body"><h5 className="fw-bold mb-3">Registered users</h5>
      <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>{users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td><span className="badge text-bg-light">{u.role}</span></td><td>{new Date(u.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
      </table></div>
    </div></div>
  </>
}
