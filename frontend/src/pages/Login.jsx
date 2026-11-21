import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../App'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    try { const { data } = await api.post('/auth/login', form); login(data) }
    catch (err) { setError(err.response?.data?.message || 'Login failed. Check your details and backend.') }
    finally { setBusy(false) }
  }
  return <div className="auth-wrap"><div className="card shadow-sm auth-card">
    <div className="card-body p-4 p-md-5">
      <div className="text-center mb-4"><div className="brand-icon"><i className="bi bi-journal-bookmark-fill"/></div>
        <h2 className="fw-bold mt-3">Welcome back</h2><p className="text-secondary">Sign in to access your study resources.</p></div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={submit}>
        <label className="form-label">Email</label><input className="form-control mb-3" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <label className="form-label">Password</label><input className="form-control mb-4" type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="text-center mt-4 mb-0 text-secondary">New here? <Link to="/register">Create an account</Link></p>
    </div>
  </div></div>
}
