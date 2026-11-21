import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../App'

export default function Register() {
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    try { const { data } = await api.post('/auth/register', form); login(data) }
    catch (err) { setError(err.response?.data?.message || 'Registration failed.') }
    finally { setBusy(false) }
  }
  return <div className="auth-wrap"><div className="card shadow-sm auth-card"><div className="card-body p-4 p-md-5">
    <h2 className="fw-bold">Create your account</h2><p className="text-secondary">Join your academic resource community.</p>
    {error && <div className="alert alert-danger">{error}</div>}
    <form onSubmit={submit}>
      <label className="form-label">Full name</label><input className="form-control mb-3" required maxLength="100" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <label className="form-label">Email</label><input className="form-control mb-3" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
      <label className="form-label">Password</label><input className="form-control mb-4" type="password" minLength="8" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
      <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
    </form>
    <p className="text-center mt-4 mb-0 text-secondary">Already registered? <Link to="/login">Sign in</Link></p>
  </div></div></div>
}
