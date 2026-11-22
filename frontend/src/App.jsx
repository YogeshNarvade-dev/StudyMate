import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { api, messageFrom } from './api.js'

const resourceTypes = [
  ['PDF', 'PDF notes'],
  ['EXTERNAL_VIDEO', 'Video link'],
  ['QUESTION_PAPER', 'Question paper'],
  ['PRESENTATION', 'Presentation'],
  ['BOOK', 'Book'],
  ['COURSE', 'Course material'],
  ['PRACTICE_MATERIAL', 'Practice material'],
]

const emptyRequest = { title: '', description: '', course: '', semester: '', subject: '' }

function loadSession() {
  try { return JSON.parse(localStorage.getItem('studymate-session') || 'null') } catch { return null }
}

function App() {
  const [session, setSession] = useState(loadSession)
  const [view, setView] = useState('discover')
  const [libraryView, setLibraryView] = useState('uploads')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [resources, setResources] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const deferredQuery = useDeferredValue(query)
  const isAdmin = session?.role === 'ADMIN'

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (view === 'requests') {
          const { data } = await api.get('/resource-requests', { params: { query: deferredQuery || undefined } })
          if (alive) setRequests(data)
        } else if (view === 'library') {
          const endpoint = libraryView === 'uploads' ? '/resources/my' : '/resources/bookmarks'
          const { data } = await api.get(endpoint)
          if (alive) setResources(data)
        } else {
          const { data } = await api.get('/resources', {
            params: { query: deferredQuery || undefined, type: typeFilter || undefined },
          })
          if (alive) setResources(data)
        }
      } catch (err) {
        if (alive) {
          if (view === 'requests') setRequests([])
          else setResources([])
          setError(messageFrom(err))
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [view, libraryView, deferredQuery, typeFilter, session?.token, refreshKey])

  const announce = (text) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const switchView = (next) => {
    setError('')
    setQuery('')
    setTypeFilter('')
    setView(next)
  }

  const signOut = () => {
    localStorage.removeItem('studymate-session')
    setSession(null)
    announce('You are signed out.')
    if (view === 'library' || view === 'upload') switchView('discover')
  }

  const runAction = async (action, successMessage) => {
    setError('')
    try {
      await action()
      setRefreshKey((key) => key + 1)
      if (successMessage) announce(successMessage)
    } catch (err) { setError(messageFrom(err)) }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); switchView('discover') }}>
          <span className="brand-mark"><i className="bi bi-journal-bookmark-fill" /></span>
          <span>Study<span className="brand-accent">Mate</span><small>LEARN BETTER, TOGETHER</small></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === 'discover' ? 'nav-link active' : 'nav-link'} onClick={() => switchView('discover')}>Discover</button>
          <button className={view === 'requests' ? 'nav-link active' : 'nav-link'} onClick={() => switchView('requests')}>Requests</button>
          <button className={view === 'assistant' ? 'nav-link active' : 'nav-link'} onClick={() => switchView('assistant')}><i className="bi bi-stars" /> Study bot</button>
          {session && <button className={view === 'upload' ? 'nav-link active' : 'nav-link'} onClick={() => switchView('upload')}>Share a resource</button>}
          {session && <button className={view === 'library' ? 'nav-link active' : 'nav-link'} onClick={() => switchView('library')}>My library</button>}
        </nav>
        <div className="account-area">
          {session ? (
            <>
              <span className="user-greeting"><span className="avatar">{session.name?.slice(0, 1).toUpperCase()}</span><span>{session.name?.split(' ')[0]}</span></span>
              <button className="button button-quiet button-small" onClick={signOut}>Sign out</button>
            </>
          ) : <button className="button button-dark button-small" onClick={() => switchView('auth')}>Sign in</button>}
        </div>
      </header>

      <main>
        {notice && <div className="notice" role="status"><i className="bi bi-check-circle-fill" />{notice}</div>}
        {error && <div className="alert alert-error" role="alert"><i className="bi bi-exclamation-circle-fill" />{error}<button aria-label="Dismiss" onClick={() => setError('')}>×</button></div>}

        {view === 'discover' && <DiscoverView
          resources={resources} loading={loading} query={query} setQuery={setQuery}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter} session={session} isAdmin={isAdmin}
          onSignIn={() => switchView('auth')} onAction={runAction} onRefresh={() => setRefreshKey((key) => key + 1)}
        />}
        {view === 'requests' && <RequestsView
          requests={requests} loading={loading} query={query} setQuery={setQuery} session={session}
          isAdmin={isAdmin} onSignIn={() => switchView('auth')} onAction={runAction}
        />}
        {view === 'upload' && session && <UploadView onDone={(resource) => {
          announce(`“${resource.title}” is now in the library.`)
          setView('library')
          setLibraryView('uploads')
          setRefreshKey((key) => key + 1)
        }} onError={setError} />}
        {view === 'library' && session && <LibraryView
          resources={resources} loading={loading} libraryView={libraryView} setLibraryView={setLibraryView}
          session={session} isAdmin={isAdmin} onAction={runAction} onSignIn={() => switchView('auth')}
          onRefresh={() => setRefreshKey((key) => key + 1)} onUpload={() => switchView('upload')}
        />}
        {view === 'assistant' && <AssistantView session={session} onSignIn={() => switchView('auth')} />}
        {view === 'auth' && <AuthView onSuccess={(user) => {
          localStorage.setItem('studymate-session', JSON.stringify(user))
          setSession(user)
          switchView('discover')
          announce(`Welcome to StudyMate, ${user.name.split(' ')[0]}.`)
        }} onError={setError} />}
      </main>

      <footer className="footer"><span>StudyMate</span><span>Good notes travel further when we share them.</span><span>Built for students, by students.</span></footer>
    </div>
  )
}

function DiscoverView({ resources, loading, query, setQuery, typeFilter, setTypeFilter, session, isAdmin, onSignIn, onAction, onRefresh }) {
  return <>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" />A BETTER WAY TO STUDY</div>
        <h1>Good learning<br />is <em>shared.</em></h1>
        <p>Find the notes, questions and study guides that make a hard topic click. Then pass something useful on.</p>
        <div className="hero-actions">
          <a className="button button-lime" href="#library" onClick={(event) => { event.preventDefault(); document.getElementById('resource-library')?.scrollIntoView({ behavior: 'smooth' }) }}>Explore resources <i className="bi bi-arrow-down-right" /></a>
          {!session && <span className="hero-footnote">Free to browse. Better together.</span>}
        </div>
      </div>
      <div className="hero-art" aria-label="Study materials and a plant on a desk">
        <div className="art-sun" />
        <div className="art-window"><span /><span /><span /><span /></div>
        <div className="art-book book-back" /><div className="art-book book-mid" /><div className="art-book book-front"><i className="bi bi-lightbulb-fill" /><small>IDEAS<br />GROW HERE</small></div>
        <div className="art-plant"><span className="leaf leaf-one" /><span className="leaf leaf-two" /><span className="leaf leaf-three" /><span className="stem" /><span className="pot" /></div>
        <div className="art-card"><span className="art-card-icon"><i className="bi bi-stars" /></span><span><b>Shared knowledge</b><small>keeps growing</small></span></div>
        <div className="art-caption">A little help goes a long way <i className="bi bi-arrow-up-right" /></div>
      </div>
      <div className="hero-bottom"><span><i className="bi bi-book-half" /> Browse student-made resources</span><span><i className="bi bi-people" /> Learn from your community</span><span><i className="bi bi-heart" /> Share what works</span></div>
    </section>

    <section className="content-section" id="resource-library">
      <div className="section-heading">
        <div><div className="eyebrow eyebrow-muted">THE STUDY LIBRARY</div><h2>Find your next <em>aha.</em></h2><p>Useful material, shared by students who have been there.</p></div>
        <span className="resource-total"><b>{resources.length}</b> {resources.length === 1 ? 'resource' : 'resources'}</span>
      </div>
      <div className="filter-row">
        <label className="search-box"><i className="bi bi-search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a topic, subject or course" /></label>
        <label className="select-wrap"><span className="sr-only">Filter by material type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">All material</option>{resourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><i className="bi bi-chevron-down" /></label>
      </div>
      {loading ? <LoadingState /> : resources.length ? <div className="resource-grid">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} session={session} isAdmin={isAdmin} onSignIn={onSignIn} onAction={onAction} onRefresh={onRefresh} />)}</div> : <EmptyState icon="bi-journal-x" title="No resources found yet" detail="Try another search, or be the first to share something helpful." />}
    </section>
  </>
}

function ResourceCard({ resource, session, isAdmin, onSignIn, onAction, onRefresh }) {
  const [busy, setBusy] = useState(false)
  const bookmarked = resource.bookmarkedByMe
  const myRating = resource.myRating || 0
  const typeLabel = resourceTypes.find(([value]) => value === resource.resourceType)?.[1] || 'Study resource'
  const invoke = async (action, success) => {
    setBusy(true)
    await onAction(action, success)
    setBusy(false)
  }
  const download = async () => {
    setBusy(true)
    try {
      const { data } = await api.get(`/resources/${resource.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = resource.originalFilename || `${resource.title}.pdf`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      onRefresh()
    } catch (error) { window.alert(messageFrom(error)) } finally { setBusy(false) }
  }
  const canDelete = session && (session.id === resource.uploadedById || isAdmin)
  return <article className="resource-card">
    <div className="card-topline"><span className={`type-pill type-${resource.resourceType?.toLowerCase()}`}><TypeIcon type={resource.resourceType} />{typeLabel}</span><span className="resource-semester">{resource.semester}</span></div>
    <h3>{resource.title}</h3>
    <p className="resource-description">{resource.description || `${resource.subject} material for ${resource.course}.`}</p>
    <div className="resource-tags"><span>{resource.course}</span><span>{resource.subject}</span>{resource.category && <span>{resource.category}</span>}</div>
    <div className="rating-line"><span className="stars" aria-label={`Average rating ${resource.averageRating.toFixed(1)} out of 5`}>{Array.from({ length: 5 }, (_, index) => <i key={index} className={`bi ${index < Math.round(resource.averageRating) ? 'bi-star-fill' : 'bi-star'}`} />)}</span><span>{resource.ratingCount ? `${resource.averageRating.toFixed(1)} · ${resource.ratingCount}` : 'Be the first to rate'}</span></div>
    <div className="resource-meta"><span><i className="bi bi-person-circle" /> {resource.uploadedByName}</span><span><i className="bi bi-download" /> {resource.downloadCount}</span></div>
    <div className="card-actions">
      {resource.externalUrl ? <a className="button button-dark button-small" href={resource.externalUrl} target="_blank" rel="noreferrer">Open link <i className="bi bi-box-arrow-up-right" /></a> : <button className="button button-dark button-small" disabled={!resource.downloadAvailable || busy} onClick={download}>Download <i className="bi bi-download" /></button>}
      <button className={bookmarked ? 'icon-button saved' : 'icon-button'} title={bookmarked ? 'Remove bookmark' : 'Save resource'} aria-label={bookmarked ? 'Remove bookmark' : 'Save resource'} onClick={() => session ? invoke(() => api({ method: bookmarked ? 'delete' : 'post', url: `/resources/${resource.id}/bookmark` }), bookmarked ? 'Removed from your library.' : 'Saved to your library.') : onSignIn()}><i className={`bi ${bookmarked ? 'bi-bookmark-heart-fill' : 'bi-bookmark'}`} /></button>
      {canDelete && <button className="icon-button danger-icon" title="Delete resource" aria-label="Delete resource" onClick={() => { if (window.confirm('Delete this resource?')) invoke(() => api.delete(`/resources/${resource.id}`), 'Resource deleted.') }}><i className="bi bi-trash3" /></button>}
    </div>
    <div className="rate-resource" aria-label="Rate this resource">{session ? <><span>Your rating</span>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} title={`Rate ${rating} out of 5`} className={rating <= myRating ? 'rate-star active' : 'rate-star'} onClick={() => invoke(() => api.put(`/resources/${resource.id}/rating`, { rating }), 'Thanks for rating this resource.')}><i className={`bi ${rating <= myRating ? 'bi-star-fill' : 'bi-star'}`} /></button>)}</> : <button className="text-button" onClick={onSignIn}>Sign in to rate</button>}</div>
  </article>
}

function RequestsView({ requests, loading, query, setQuery, session, isAdmin, onSignIn, onAction }) {
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyRequest)
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/resource-requests', form)
      setForm(emptyRequest)
      setFormOpen(false)
      await onAction(async () => { }, 'Your request is now open to the community.')
    } catch (error) { window.alert(messageFrom(error)) } finally { setSubmitting(false) }
  }
  const statusLabels = { OPEN: 'Open', IN_PROGRESS: 'In progress', FULFILLED: 'Fulfilled', CANCELLED: 'Closed' }
  return <section className="content-section page-section">
    <div className="section-heading">
      <div><div className="eyebrow eyebrow-muted">COMMUNITY BOARD</div><h2>Ask for what you <em>need.</em></h2><p>Upvote a request you can use. When someone shares it, everyone benefits.</p></div>
      {session ? <button className="button button-lime" onClick={() => setFormOpen((open) => !open)}><i className="bi bi-plus-lg" /> Make a request</button> : <button className="button button-dark" onClick={onSignIn}>Sign in to request</button>}
    </div>
    <label className="search-box request-search"><i className="bi bi-search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requests" /></label>
    {formOpen && <form className="request-form" onSubmit={submit}>
      <div className="form-heading"><span className="form-icon"><i className="bi bi-chat-square-text" /></span><div><b>What would help you study?</b><small>Tell the community what you are looking for.</small></div></div>
      <div className="form-grid"><Field label="Resource title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required placeholder="e.g. Organic chemistry past papers" /><Field label="Course" value={form.course} onChange={(value) => setForm({ ...form, course: value })} required placeholder="e.g. BSc Chemistry" /><Field label="Subject" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} required placeholder="e.g. Organic chemistry" /><Field label="Semester" value={form.semester} onChange={(value) => setForm({ ...form, semester: value })} placeholder="e.g. Semester 3" /></div>
      <label className="field-label">A little more detail <textarea maxLength="1500" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Which topics, year or format would be useful?" /></label>
      <div className="form-submit"><button className="button button-dark" disabled={submitting}>{submitting ? 'Posting…' : 'Post request'} <i className="bi bi-arrow-up-right" /></button></div>
    </form>}
    {loading ? <LoadingState /> : requests.length ? <div className="request-list">{requests.map((request) => <article className="request-card" key={request.id}>
      <div className="request-vote"><button className={request.upvotedByMe ? 'vote-button voted' : 'vote-button'} aria-label={request.upvotedByMe ? 'Remove upvote' : 'Upvote request'} onClick={() => session ? onAction(() => api({ method: request.upvotedByMe ? 'delete' : 'put', url: `/resource-requests/${request.id}/upvote` })) : onSignIn()}><i className="bi bi-caret-up-fill" /></button><b>{request.upvoteCount}</b><small>votes</small></div>
      <div className="request-content"><div className="request-title-row"><h3>{request.title}</h3><span className={`status-pill status-${request.status.toLowerCase()}`}><span />{statusLabels[request.status]}</span></div><div className="resource-tags"><span>{request.course}</span><span>{request.subject}</span>{request.semester && <span>{request.semester}</span>}</div><p>{request.description || 'No additional details.'}</p><div className="resource-meta"><span><i className="bi bi-person-circle" /> {request.requestedByName}</span><span><i className="bi bi-calendar3" /> {formatDate(request.createdAt)}</span></div></div>
      {isAdmin && <label className="status-select"><span>Update status</span><select value={request.status} onChange={(event) => onAction(() => api.patch(`/resource-requests/${request.id}/status`, { status: event.target.value }), 'Request status updated.')}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="FULFILLED">Fulfilled</option><option value="CANCELLED">Closed</option></select></label>}
    </article>)}</div> : <EmptyState icon="bi-chat-square-heart" title="No requests here yet" detail="Ask for a resource that would make your next study session easier." />}
  </section>
}

function UploadView({ onDone, onError }) {
  const [form, setForm] = useState({ title: '', description: '', course: '', semester: '', subject: '', category: 'Notes', type: 'PDF', externalUrl: '' })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const isVideo = form.type === 'EXTERNAL_VIDEO'
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    onError('')
    if (!isVideo && !file) { onError('Choose a file to share.'); return }
    setSubmitting(true)
    const data = new FormData()
    for (const [key, value] of Object.entries(form)) if (value !== '') data.append(key, value)
    if (file) data.append('file', file)
    try {
      const response = await api.post('/resources', data)
      onDone(response.data)
    } catch (error) { onError(messageFrom(error)) } finally { setSubmitting(false) }
  }
  return <section className="content-section page-section upload-page">
    <div className="section-heading"><div><div className="eyebrow eyebrow-muted">PASS IT ON</div><h2>Share something <em>useful.</em></h2><p>Your notes today could be someone's breakthrough tomorrow.</p></div><span className="share-illustration"><i className="bi bi-send-heart" /></span></div>
    <form className="upload-form" onSubmit={submit}>
      <div className="form-heading"><span className="form-icon lime-icon"><i className="bi bi-file-earmark-plus" /></span><div><b>Resource details</b><small>Add enough context so classmates know what they are opening.</small></div></div>
      <div className="form-grid"><Field label="Title" value={form.title} onChange={(value) => set('title', value)} required maxLength={180} placeholder="eg. Java Collections" /><label className="field-label">Material type<select value={form.type} onChange={(event) => { set('type', event.target.value); setFile(null) }}>{resourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Field label="Course" value={form.course} onChange={(value) => set('course', value)} required maxLength={100} placeholder="e.g. MCA" /><Field label="Subject" value={form.subject} onChange={(value) => set('subject', value)} required maxLength={120} placeholder="e.g. Java" /><Field label="Semester" value={form.semester} onChange={(value) => set('semester', value)} required maxLength={40} placeholder="e.g. Semester 2" /><Field label="Category" value={form.category} onChange={(value) => set('category', value)} required maxLength={50} placeholder="e.g. Exam revision" /></div>
      <label className="field-label">Description <textarea maxLength="1500" value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="What does this resource cover? Add a few helpful details." /></label>
      {isVideo ? <label className="field-label">Public video link <input type="url" required value={form.externalUrl} onChange={(event) => set('externalUrl', event.target.value)} placeholder="https://…" /><small className="field-hint">Videos stay on their original platform. StudyMate stores the link only.</small></label> : <label className="upload-drop"><input type="file" required={!isVideo} accept=".pdf,.ppt,.pptx,.doc,.docx,.epub" onChange={(event) => setFile(event.target.files?.[0] || null)} /><span className="upload-icon"><i className="bi bi-cloud-arrow-up" /></span><span><b>{file ? file.name : 'Choose a file to share'}</b><small>{file ? `${formatBytes(file.size)} · ready to upload` : 'PDF, PowerPoint, Word or EPUB · up to 10 MB'}</small></span><span className="button button-outline button-small">Browse files</span></label>}
      <div className="form-note"><i className="bi bi-shield-check" /> Share material you have permission to share. Your name will appear as the contributor.</div>
      <div className="form-submit"><button className="button button-dark" disabled={submitting}>{submitting ? 'Sharing…' : 'Share resource'} <i className="bi bi-arrow-up-right" /></button></div>
    </form>
  </section>
}

function LibraryView({ resources, loading, libraryView, setLibraryView, session, isAdmin, onAction, onSignIn, onRefresh, onUpload }) {
  return <section className="content-section page-section">
    <div className="section-heading"><div><div className="eyebrow eyebrow-muted">YOUR STUDY SPACE</div><h2>My <em>library.</em></h2><p>Your contributions and the resources you want to keep close.</p></div><button className="button button-lime" onClick={onUpload}>Share a resource <i className="bi bi-plus-lg" /></button></div>
    <div className="library-tabs"><button className={libraryView === 'uploads' ? 'library-tab active' : 'library-tab'} onClick={() => setLibraryView('uploads')}><i className="bi bi-cloud-upload" /> My uploads</button><button className={libraryView === 'bookmarks' ? 'library-tab active' : 'library-tab'} onClick={() => setLibraryView('bookmarks')}><i className="bi bi-bookmark-heart" /> Saved resources</button></div>
    {loading ? <LoadingState /> : resources.length ? <div className="resource-grid">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} session={session} isAdmin={isAdmin} onSignIn={onSignIn} onAction={onAction} onRefresh={onRefresh} />)}</div> : <EmptyState icon={libraryView === 'uploads' ? 'bi-cloud-arrow-up' : 'bi-bookmark-heart'} title={libraryView === 'uploads' ? 'Your uploads will show up here' : 'Nothing saved yet'} detail={libraryView === 'uploads' ? 'Share a set of notes or a guide with your classmates.' : 'Bookmark a resource and it will be easy to find later.'} />}
  </section>
}

function AssistantView({ session, onSignIn }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me about a topic in the StudyMate library. I’ll look through the uploaded notes and show you where I found the answer.' },
  ])
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, sending])

  const downloadSource = async (source) => {
    try {
      const { data } = await api.get(`/resources/${source.resourceId}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = source.originalFilename || `${source.title}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) { setError(messageFrom(err)) }
  }

  const ask = async (event, suggestedQuestion) => {
    event?.preventDefault()
    if (!session) { onSignIn(); return }
    const text = (suggestedQuestion ?? question).trim()
    if (!text || sending) return
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content: content.slice(0, 1000) }))
    setMessages((current) => [...current, { role: 'user', content: text }])
    setQuestion('')
    setError('')
    setSending(true)
    try {
      const { data } = await api.post('/assistant/ask', { question: text, history })
      setMessages((current) => [...current, { role: 'assistant', content: data.answer, sources: data.sources || [] }])
    } catch (err) {
      setError(messageFrom(err))
    } finally { setSending(false) }
  }

  return <section className="content-section page-section assistant-page">
    <div className="section-heading">
      <div><div className="eyebrow eyebrow-muted">YOUR STUDY COMPANION</div><h2>Ask your <em>resources.</em></h2><p>Get help finding explanations in the notes and study files shared with StudyMate.</p></div>
      <span className="assistant-status"><i className="bi bi-shield-check" /> Library grounded</span>
    </div>
    {!session ? <div className="assistant-signin"><span className="assistant-mark"><i className="bi bi-stars" /></span><h3>Sign in to ask a question</h3><p>The assistant uses StudyMate’s uploaded study files and includes the sources it finds.</p><button className="button button-dark" onClick={onSignIn}>Sign in <i className="bi bi-arrow-up-right" /></button></div> : <div className="assistant-card">
      <div className="assistant-messages" aria-live="polite">
        {messages.map((message, index) => <article className={`chat-message ${message.role}`} key={`${index}-${message.role}`}>
          <span className="chat-avatar"><i className={`bi ${message.role === 'assistant' ? 'bi-stars' : 'bi-person'}`} /></span>
          <div className="chat-body"><div className="chat-bubble">{message.content}</div>
            {message.sources?.length > 0 && <div className="source-list"><small>FOUND IN</small>{message.sources.map((source) => <div className="source-card" key={source.resourceId}>
              <div><span className="source-label">{source.sourceId}</span><b>{source.title}</b><small>{source.course} · {source.subject}{source.originalFilename ? ` · ${source.originalFilename}` : ''}</small><p>{source.excerpt}</p><button className="source-download" onClick={() => downloadSource(source)}><i className="bi bi-download" /> Open source file</button></div>
            </div>)}</div>}
          </div>
        </article>)}
        {sending && <article className="chat-message assistant"><span className="chat-avatar"><i className="bi bi-stars" /></span><div className="chat-bubble typing"><span /><span /><span /></div></article>}
        <div ref={endRef} />
      </div>
      {!messages.some((message) => message.role === 'user') && <div className="suggested-questions"><span>TRY ASKING</span>{['Explain recursion', 'What should I revise for exams?', 'Summarize the main ideas'].map((suggestion) => <button key={suggestion} disabled={sending} onClick={(event) => ask(event, suggestion)}>{suggestion}<i className="bi bi-arrow-up-right" /></button>)}</div>}
      {error && <div className="assistant-error" role="alert">{error}</div>}
      <form className="assistant-composer" onSubmit={ask}><label className="sr-only" htmlFor="assistant-question">Ask about your study resources</label><textarea id="assistant-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ask(event) } }} maxLength={1000} placeholder="Ask a question about your study resources…" disabled={sending} /><button className="button button-dark" disabled={sending || !question.trim()} aria-label="Send question">{sending ? 'Looking…' : 'Ask'} <i className="bi bi-arrow-up-right" /></button></form>
      <p className="assistant-privacy"><i className="bi bi-info-circle" /> StudyMate searches uploaded files. If an AI service is configured, selected passages are sent to it to write the answer.</p>
    </div>}
  </section>
}

function AuthView({ onSuccess, onError }) {
  const [register, setRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    onError('')
    setSubmitting(true)
    try {
      const { data } = await api.post(register ? '/auth/register' : '/auth/login', form)
      onSuccess(data)
    } catch (error) { onError(messageFrom(error)) } finally { setSubmitting(false) }
  }
  return <section className="auth-layout">
    <div className="auth-aside"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR COMMUNITY STARTS HERE</div><h1>Small acts of<br /><em>sharing.</em><br />Big moments of learning.</h1><p>Find answers in shared notes, ask for what you need and help the next student get there faster.</p><div className="auth-points"><span><i className="bi bi-search-heart" /> Find what helps</span><span><i className="bi bi-bookmark-heart" /> Keep what matters</span><span><i className="bi bi-send-heart" /> Share it forward</span></div></div>
    <form className="auth-card" onSubmit={submit}><div className="auth-card-icon"><i className="bi bi-person-heart" /></div><div className="eyebrow eyebrow-muted">{register ? 'JOIN STUDYMATE' : 'WELCOME BACK'}</div><h2>{register ? 'Create your account' : 'Good to have you back.'}</h2><p>{register ? 'A shared library starts with you.' : 'Pick up where your study group left off.'}</p>
      {register && <Field label="Your name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required maxLength={100} placeholder="How classmates know you" />}
      <Field label="Email address" value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" required maxLength={150} placeholder="you@school.edu" />
      <Field label="Password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} type="password" required minLength={register ? 8 : undefined} maxLength={72} placeholder={register ? 'At least 8 characters' : 'Your password'} />
      <button className="button button-dark auth-submit" disabled={submitting}>{submitting ? 'One moment…' : register ? 'Create account' : 'Sign in'} <i className="bi bi-arrow-up-right" /></button>
      <div className="auth-switch">{register ? 'Already part of StudyMate?' : 'New to StudyMate?'} <button type="button" className="text-button" onClick={() => { setRegister(!register); onError('') }}>{register ? 'Sign in' : 'Create an account'}</button></div>
    </form>
  </section>
}

function Field({ label, value, onChange, type = 'text', required, maxLength, minLength, placeholder }) {
  return <label className="field-label">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} maxLength={maxLength} minLength={minLength} placeholder={placeholder} /></label>
}

function TypeIcon({ type }) {
  const icons = { PDF: 'bi-file-earmark-pdf', EXTERNAL_VIDEO: 'bi-play-btn', QUESTION_PAPER: 'bi-file-earmark-text', PRESENTATION: 'bi-easel', BOOK: 'bi-book', COURSE: 'bi-mortarboard', PRACTICE_MATERIAL: 'bi-pencil-square' }
  return <i className={`bi ${icons[type] || 'bi-file-earmark'}`} />
}

function EmptyState({ icon, title, detail }) {
  return <div className="empty-state"><span className="empty-icon"><i className={`bi ${icon}`} /></span><h3>{title}</h3><p>{detail}</p></div>
}

function LoadingState() {
  return <div className="loading-state"><span className="spinner" />Finding good material…</div>
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatBytes(bytes) {
  if (!bytes) return '0 bytes'
  const unit = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / (1024 ** unit)).toFixed(unit ? 1 : 0)} ${['bytes', 'KB', 'MB'][unit] || 'MB'}`
}

export default App
