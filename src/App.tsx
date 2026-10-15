import { useEffect, useRef, useState } from 'react'
import { AudioLines, BookOpen, GraduationCap, ArrowRight, LogOut, Users, MessageSquare, MicOff, Video, VideoOff, Volume2, VolumeX, Maximize, Clock3, Settings2, X, CheckCircle2 } from 'lucide-react'

type Lecture = { id: string; title: string; src: string; course?: string }
type ChatMessage = { id: number; name: string; initials: string; tone: string; text: string; time: string }
const CLASSMATES = [
  { name: 'Maria Santos', initials: 'MS', tone: 'curious' },
  { name: 'Alex Chen', initials: 'AC', tone: 'analytical' },
  { name: 'Jordan Lee', initials: 'JL', tone: 'friendly' },
  { name: 'Sophia Reyes', initials: 'SR', tone: 'thoughtful' },
  { name: 'Daniel Cruz', initials: 'DC', tone: 'humorous' },
  { name: 'Avery Brooks', initials: 'AB', tone: 'curious' },
]
const discussionFor = (title: string, tone: string, round: number, recentTexts: string[] = []) => {
  const topic = title || 'today’s lesson'
  const lines: Record<string, string[]> = {
    curious: [
      `Could you give a practical example of ${topic.toLowerCase()}?`,
      `Which part of ${topic.toLowerCase()} is most important to remember?`,
      `How would this concept show up in a real project?`,
      `Is there an easy way to remember this distinction?`,
      `Would this work differently in a larger system?`,
      `I wonder how this connects to the topic from last week.`,
      `What would happen if one of these steps failed?`,
      `Could someone explain that last part in simpler terms?`,
      `Where might we use this outside the classroom?`,
      `Does the same idea apply when the inputs are different?`,
      `I want to try a small example after class.`,
      `What is the most common mistake people make with this?`
    ],
    analytical: [
      `The important part is how the steps depend on one another.`,
      `I'd separate the definition from the practical use case here.`,
      `That example helps clarify the trade-off involved.`,
      `The input conditions seem to change the outcome quite a bit.`,
      `I would test the edge cases before calling this reliable.`,
      `This seems related to efficiency as well as correctness.`,
      `The underlying principle matters more than memorizing the wording.`,
      `It helps to compare this with the alternative approach.`,
      `I think the sequence matters because each stage builds on the last.`,
      `We should distinguish what the system guarantees from what it usually does.`,
      `A small test case would make that easier to verify.`,
      `The limitation is just as important as the benefit.`
    ],
    friendly: [
      `That example made the idea click for me, thanks.`,
      `I was wondering about that too.`,
      `Okay, that makes more sense now.`,
      `Adding that example to my notes.`,
      `Nice, I hadn't thought about it that way.`,
      `That clears up the part I was stuck on.`,
      `I'll revisit this example when I review later.`,
      `Good point — the comparison helps.`,
      `I think I'm following now.`,
      `That explanation connected a few things for me.`,
      `I'll try explaining it in my own words to remember it.`,
      `This section is easier with an example.`
    ],
    thoughtful: [
      `I'm noting the main takeaway from this section.`,
      `The real-world example puts the concept in context.`,
      `I want to review this part once more later.`,
      `This changes how I was thinking about the problem.`,
      `The distinction is subtle, but it seems important.`,
      `I'll write down the assumption behind that example.`,
      `That gives me a better mental model for it.`,
      `I can see why this matters in practice now.`,
      `I'm comparing this with the notes from the previous topic.`,
      `The example makes the limitation easier to remember.`,
      `I should practice applying this instead of only rereading it.`,
      `That is probably worth adding to the revision list.`
    ],
    humorous: [
      `My notes are trying their best to keep up with this slide.`,
      `Rewinding my brain for a second — got it now.`,
      `This is going straight into my revision notes.`,
      `My future self is going to appreciate these notes.`,
      `I understood that just before the next slide appeared.`,
      `One concept at a time, please, brain.`,
      `That example finally rescued me from my confusion.`,
      `My notebook is doing more work than I am today.`,
      `I'm going to pretend I understood it on the first try.`,
      `The diagram is carrying my understanding right now.`,
      `That clicked after a tiny delay.`,
      `Exam-week me will be grateful for this explanation.`
    ]
  }
  const options = [...(lines[tone] || lines.friendly)]
  const recent = new Set(recentTexts.map(text => text.trim().toLowerCase()))
  const available = options.filter(line => !recent.has(line.trim().toLowerCase()))
  const pool = available.length ? available : options.map((line, i) => `${line} (another example: ${['a small program', 'a practical scenario', 'a different input', 'a real-world system'][i % 4]}).`).filter(line => !recent.has(line.trim().toLowerCase()))
  return pool[Math.floor(Math.random() * pool.length)].replace(/today’s lesson/g, topic)
}
const DEFAULT_SCHOOL = 'ClassRoom Learning Hub'
const fmt = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2,'0')}:${Math.floor(seconds % 3600 / 60).toString().padStart(2,'0')}:${Math.floor(seconds % 60).toString().padStart(2,'0')}`

export default function App() {
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('classroom-sim-school') || DEFAULT_SCHOOL)
  const [schoolLogo, setSchoolLogo] = useState(() => localStorage.getItem('classroom-sim-logo') || '')
  const [studentName, setStudentName] = useState(() => localStorage.getItem('classroom-sim-student') || 'Samuel Mallo')
  const [signedIn, setSignedIn] = useState(false)
  const [joined, setJoined] = useState(false)
  const [classEnded, setClassEnded] = useState(false)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loadError, setLoadError] = useState('')
  const [index, setIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatRound = useRef(0)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [classTitle, setClassTitle] = useState(() => localStorage.getItem('classroom-sim-title') || 'Computer Science')
  const [schoolInputOpen, setSchoolInputOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraPreviewRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const current = lectures[index]

  useEffect(() => {
    if (cameraPreviewRef.current && cameraStreamRef.current) cameraPreviewRef.current.srcObject = cameraStreamRef.current
  }, [cameraOn, joined])

  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop())
    cameraStreamRef.current = null
  }, [])

  useEffect(() => {
    fetch('/lectures/playlist.json')
      .then(r => { if (!r.ok) throw new Error('playlist'); return r.json() })
      .then((data: Lecture[]) => { setLectures(data); if (!data.length) setLoadError('Add lecture files to public/lectures and list them in playlist.json.') })
      .catch(() => setLoadError('The lecture playlist is not configured yet. Add your recordings to public/lectures and edit playlist.json.'))
  }, [])

  useEffect(() => {
    if (!joined || !current || !videoRef.current) return
    const video = videoRef.current
    video.muted = true // Android browsers reliably allow muted autoplay.
    video.play().catch(() => setLoadError('Playback was blocked by the browser. Tap Join Class again, or enable playback in browser settings.'))
  }, [joined, index, current])

  useEffect(() => {
    if (!joined) return
    const makeMessage = (round: number): ChatMessage => {
      const person = CLASSMATES[(round * 3 + Math.floor(Math.random() * CLASSMATES.length)) % CLASSMATES.length]
      const now = new Date()
      return { id: Date.now() + round, name: person.name, initials: person.initials, tone: person.tone, text: discussionFor(current?.title || classTitle, person.tone, round, chatMessages.slice(-20).map(message => message.text)), time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    }
    setChatMessages(old => old.length ? old : [
      { id: 1, name: 'Maria Santos', initials: 'MS', tone: 'curious', text: `Has anyone got a good example for ${current?.title || classTitle}?`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      { id: 2, name: 'Alex Chen', initials: 'AC', tone: 'analytical', text: 'I’m following along and noting the main points.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ])
    let cancelled = false
    const timer = window.setInterval(async () => {
      chatRound.current += 1
      const person = CLASSMATES[(chatRound.current * 3 + Math.floor(Math.random() * CLASSMATES.length)) % CLASSMATES.length]
      const fallback = makeMessage(chatRound.current)
      let text = fallback.text
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: current?.title || classTitle,
            persona: { name: person.name, tone: person.tone },
            recentMessages: chatMessages.slice(-8).map(message => ({ name: message.name, text: message.text })),
          }),
        })
        if (response.ok) {
          const data = await response.json() as { message?: string }
          if (typeof data.message === 'string' && data.message.trim()) text = data.message.trim().slice(0, 500)
          const recent = new Set(chatMessages.slice(-20).map(message => message.text.trim().toLowerCase()))
          if (recent.has(text.trim().toLowerCase())) text = discussionFor(current?.title || classTitle, person.tone, chatRound.current, chatMessages.slice(-20).map(message => message.text))
        }
      } catch { /* Local scripted fallback keeps chat working without the API. */ }
      if (cancelled) return
      const now = new Date()
      setChatMessages(old => [...old, {
        id: Date.now(), name: person.name, initials: person.initials, tone: person.tone, text,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }].slice(-40))
    }, 24000 + Math.floor(Math.random() * 12000))
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [joined, current?.title, classTitle])

  useEffect(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight }, [chatMessages])

  const sendChatMessage = async () => {
    const text = chatInput.trim()
    if (!text || chatSending) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMessage: ChatMessage = { id: Date.now(), name: studentName || 'You', initials: (studentName || 'Y').slice(0, 2).toUpperCase(), tone: 'user-message', text: text.slice(0, 500), time: now }
    setChatMessages(old => [...old, userMessage].slice(-40))
    setChatInput('')
    setChatSending(true)
    const responder = CLASSMATES[Math.floor(Math.random() * CLASSMATES.length)]
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'reply',
          topic: current?.title || classTitle,
          userMessage: text.slice(0, 500),
          studentName: (studentName || 'Student').slice(0, 60),
          persona: { name: responder.name, tone: responder.tone },
          recentMessages: [...chatMessages.slice(-7), userMessage].map(message => ({ name: message.name, text: message.text })),
        }),
      })
      if (!response.ok) throw new Error('AI response unavailable')
      const data = await response.json() as { message?: string }
      if (typeof data.message !== 'string' || !data.message.trim()) throw new Error('Empty AI response')
      const replyText = data.message.trim().slice(0, 700)
      const recentReplyTexts = new Set(chatMessages.slice(-20).map(message => message.text.trim().toLowerCase()))
      const finalReplyText = recentReplyTexts.has(replyText.toLowerCase()) ? `${replyText} Let me add a different angle: consider how this applies to a practical example.` : replyText
      setChatMessages(old => [...old, { id: Date.now() + 1, name: responder.name, initials: responder.initials, tone: responder.tone, text: finalReplyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }].slice(-40))
    } catch {
      setLoadError('Could not get an AI reply. Check your OpenRouter setup and try again.')
    } finally {
      setChatSending(false)
    }
  }

  const joinClass = () => {
    setSignedIn(true)
    setJoined(true)
    setClassEnded(false)
    setIndex(0)
    setElapsed(0)
    setLoadError('')
  }
  const toggleCamera = async () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
      setCameraOn(false)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) { setLoadError('Camera access requires HTTPS or localhost and a browser that supports camera access.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      cameraStreamRef.current = stream
      setCameraOn(true)
      setLoadError('')
      if (cameraPreviewRef.current) { cameraPreviewRef.current.srcObject = stream; await cameraPreviewRef.current.play().catch(() => undefined) }
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      setLoadError(name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser site settings and try again.' : name === 'NotFoundError' ? 'No camera was found on this device.' : 'Could not start the camera. Check browser permissions and make sure no other app is using it.')
    }
  }
  const leaveClass = () => { if (videoRef.current && current?.src) localStorage.setItem(`classroom-sim-progress:${current.src}`, String(videoRef.current.currentTime || 0)); cameraStreamRef.current?.getTracks().forEach(track => track.stop()); cameraStreamRef.current = null; setCameraOn(false); setJoined(false); setSignedIn(true) }
  const toggleFullscreen = async () => {
    try { if (!document.fullscreenElement) await document.querySelector('.app-root')?.requestFullscreen(); else await document.exitFullscreen() } catch { /* fullscreen may not be supported */ }
  }
  const saveSchool = () => { localStorage.setItem('classroom-sim-school', schoolName.trim() || DEFAULT_SCHOOL); localStorage.setItem('classroom-sim-title', classTitle); localStorage.setItem('classroom-sim-logo', schoolLogo); setSchoolInputOpen(false); setSettingsOpen(false) }
  const handleLogoUpload = (file?: File) => { if (!file) return; if (!file.type.startsWith('image/')) { setLoadError('Please choose an image file for the logo.'); return } if (file.size > 2 * 1024 * 1024) { setLoadError('Logo must be 2 MB or smaller.'); return } const reader = new FileReader(); reader.onload = () => { const value = String(reader.result || ''); setSchoolLogo(value); localStorage.setItem('classroom-sim-logo', value) }; reader.readAsDataURL(file) }
  const LogoMark = ({ className = '' }: { className?: string }) => schoolLogo ? <img className={`custom-school-logo ${className}`} src={schoolLogo} alt="Custom school logo" /> : <GraduationCap size={28} />

  if (!signedIn) return <main className="school-shell">
    <div className="school-glow" />
    <header className="school-header"><div className="school-brand-mark"><LogoMark /></div><div><strong>{schoolName}</strong><span>STUDENT LEARNING PORTAL</span></div></header>
    <section className="school-login-layout"><div className="school-welcome"><span className="school-eyebrow">YOUR CAMPUS. YOUR CLASSROOM.</span><h1>Learning starts<br/><em>right here.</em></h1><p>Your courses and recorded lessons, all in one place.</p><div className="school-feature-row"><span><BookOpen size={16}/> Recorded lessons</span><span><AudioLines size={16}/> Virtual classroom</span></div></div><div className="login-card"><div className="crest"><LogoMark /></div><span className="school-eyebrow">STUDENT ACCESS</span><h2>Welcome back</h2><p>Enter your student display name to continue.</p><label>School name<input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Your fictional school" maxLength={70}/></label><label>Student display name<input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Student name" maxLength={40}/></label><button className="school-primary" onClick={() => { localStorage.setItem('classroom-sim-school', schoolName.trim() || DEFAULT_SCHOOL); localStorage.setItem('classroom-sim-student', studentName.trim() || 'Student'); setSignedIn(true) }}>Quick sign in <ArrowRight size={17}/></button><div className="login-foot"><span/> Quick access · No password required</div></div></section>
    <footer className="school-footer"><span>© {new Date().getFullYear()} {schoolName}</span><span>Independent classroom app</span></footer>
  </main>

  if (signedIn && !joined) return <main className="school-shell portal-shell"><header className="school-header"><div className="school-brand-mark"><LogoMark /></div><div><strong>{schoolName}</strong><span>STUDENT LEARNING PORTAL</span></div><button className="portal-logout" onClick={() => setSignedIn(false)}><LogOut size={15}/> Sign out</button></header><section className="portal-content"><span className="school-eyebrow">STUDENT DASHBOARD</span><h1>Good day, {studentName || 'Student'}.</h1><p className="portal-lead">Your classroom is ready to join.</p><div className="portal-stats"><div><span>ENROLLED COURSES</span><strong>05</strong></div><div><span>CLASS STATUS</span><strong><i/> Ready</strong></div><div><span>STUDENT ID</span><strong>SIM-2048</strong></div></div><h2 className="portal-section-title">My courses</h2><div className="course-grid"><article className="course-card featured"><div className="course-icon"><BookOpen size={23}/></div><span className="course-tag">AVAILABLE NOW</span><h3>Computer Science</h3><p>Recorded lecture series · Automatic playback</p><div className="course-bottom"><span>CS101</span><button onClick={() => { setClassTitle('Computer Science'); localStorage.setItem('classroom-sim-title', 'Computer Science'); joinClass() }}>Join class <ArrowRight size={16}/></button></div></article><article className="course-card"><div className="course-icon muted"><BookOpen size={23}/></div><span className="course-tag">COURSE</span><h3>Data Structures and Algorithms</h3><p>Core computer science</p><div className="course-bottom"><span>CS201</span><span className="course-soon">Course page</span></div></article><article className="course-card"><div className="course-icon muted"><BookOpen size={23}/></div><span className="course-tag">COURSE</span><h3>Operating Systems</h3><p>Systems and architecture</p><div className="course-bottom"><span>CS301</span><span className="course-soon">Course page</span></div></article><article className="course-card"><div className="course-icon muted"><BookOpen size={23}/></div><span className="course-tag">COURSE</span><h3>Computer Networks</h3><p>Networking fundamentals</p><div className="course-bottom"><span>CS302</span><span className="course-soon">Course page</span></div></article><article className="course-card"><div className="course-icon muted"><BookOpen size={23}/></div><span className="course-tag">COURSE</span><h3>Software Engineering</h3><p>Design and development</p><div className="course-bottom"><span>CS401</span><span className="course-soon">Course page</span></div></article></div>{loadError && <div className="portal-notice"><CheckCircle2 size={18}/><span>{loadError}</span></div>}<div className="portal-notice"><GraduationCap size={18}/><span> University of the People Online Class App</span></div></section><footer className="school-footer"><span>{schoolName}</span><span>Independent classroom app</span></footer></main>

  return <main className="app-root">
    <header className="topbar"><div className="brand"><div className="brand-mark">{schoolLogo ? <img className="custom-school-logo" src={schoolLogo} alt="School logo"/> : <AudioLines size={20}/>}</div><div><strong>{schoolName}</strong><span>{studentName} · Student classroom</span></div></div><div className="top-actions"><span className="local-pill"><span className="green-dot"/> Class in session</span><button className="icon-button" aria-label="Settings" onClick={() => setSettingsOpen(true)}><Settings2 size={19}/></button></div></header>
    <section className="meeting-shell"><div className="meeting-head"><div className="meeting-title-wrap"><span className="meeting-kicker">MEETING ROOM</span><h1>{classTitle}</h1><span className="meeting-subtitle">{current?.title ?? 'Lecture playlist not configured'}</span></div><div className="meeting-meta"><span className="session-chip">IN SESSION</span></div></div>
      <div className="stage">{classEnded ? <div className="empty-stage class-ended-state"><div className="empty-icon"><CheckCircle2 size={32}/></div><h2>Class has ended</h2><p>The recorded lecture sequence has finished.</p><button className="primary-button" onClick={() => { setClassEnded(false); setIndex(0); setElapsed(0) }}>Replay lecture sequence</button></div> : current ? <video key={current.src} ref={videoRef} className="lecture-video" src={current.src} playsInline preload="auto" autoPlay muted={muted} controls={false} controlsList="nodownload noplaybackrate" onPlay={() => setLoadError('')} onTimeUpdate={e => { const v = e.currentTarget; setElapsed(v.currentTime); setDuration(Number.isFinite(v.duration) ? v.duration : 0); if (current?.src) localStorage.setItem(`classroom-sim-progress:${current.src}`, String(v.currentTime)) }} onLoadedMetadata={e => { const v = e.currentTarget; setDuration(Number.isFinite(v.duration) ? v.duration : 0); const saved = Number(localStorage.getItem(`classroom-sim-progress:${current.src}`) || 0); const target = saved > 0 ? Math.min(saved + 300, Math.max(0, v.duration - 1)) : 0; if (Number.isFinite(target) && target > 0 && target < (Number.isFinite(v.duration) ? v.duration : Infinity)) { v.currentTime = target; setElapsed(target); localStorage.setItem(`classroom-sim-progress:${current.src}`, String(target)) } }} onEnded={() => { if (index + 1 < lectures.length) { setIndex(index + 1); setElapsed(0) } else { setClassEnded(true); setElapsed(0) } }} onError={() => setLoadError(`Could not load ${current.title}. Check its file path in public/lectures/playlist.json.`)} /> : <div className="empty-stage"><div className="empty-icon"><BookOpen size={32}/></div><h2>Classroom playlist not configured</h2><p>Add recordings to the app's lecture folder before deployment.</p><code>public/lectures/playlist.json</code></div>}
        <div className="video-overlay"><span className="playing-tag"><span className="green-dot"/>{current ? 'Lecture in progress' : 'Waiting for recordings'}</span><span className="video-title-overlay">{current?.title ?? 'Classroom'}</span></div><div className={`self-tile ${cameraOn ? 'camera-active' : ''}`}>{cameraOn ? <video ref={cameraPreviewRef} className="camera-preview" autoPlay muted playsInline /> : <div className="avatar">{(studentName || 'S').slice(0,1).toUpperCase()}</div>}<span>You · Camera {cameraOn ? 'on' : 'off'}</span></div></div>
      <div className="progress-row"><div className="progress-track passive-progress"><div className="progress-fill" style={{width: duration ? `${Math.min(100, elapsed/duration*100)}%` : '0%'}}/></div></div>
      <div className="controls-bar"><div className="controls-left"><span className="meeting-status"><span className="green-dot"/> Classroom session</span></div><div className="controls-right"><button className={`control-button ${muted ? 'selected' : ''}`} onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted }} title={muted ? 'Enable audio' : 'Mute audio'}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}<span>{muted ? 'Enable audio' : 'Mute audio'}</span></button><button className={`control-button ${cameraOn ? 'selected camera-enabled' : ''}`} onClick={() => void toggleCamera()} title={cameraOn ? 'Turn camera off' : 'Turn camera on'}>{cameraOn ? <Video size={18}/> : <VideoOff size={18}/>}<span>{cameraOn ? 'Camera on' : 'Start camera'}</span></button><button className={`control-button ${chatOpen ? 'selected' : ''}`} onClick={() => setChatOpen(!chatOpen)}><MessageSquare size={18}/><span>Chat</span></button><button className="control-button fullscreen-button" onClick={toggleFullscreen}><Maximize size={18}/><span>Full screen</span></button><button className="leave-button" onClick={leaveClass}>Leave</button></div></div>
      <div className="meeting-footer"><span><span className="green-dot"/> {current ? 'Live Lecture' : 'No lecture recordings configured'}</span><div><span><Users size={15}/> 60 participants</span><button onClick={() => setSettingsOpen(true)}><Settings2 size={15}/> Settings</button></div></div></section>
    <div className="classroom-content-grid"><section className="below-grid"><div className="info-card now-card"><div className="card-heading"><div><span className="eyebrow">NOW PLAYING</span><h2>{current?.title ?? 'No lecture configured'}</h2></div><span className="small-icon"><AudioLines size={17}/></span></div><div className="now-details"><div><span>Playback</span><strong>{current ? 'Automatic' : 'Awaiting setup'}</strong></div><div><span>Playlist</span><strong>{lectures.length} lessons</strong></div></div></div><div className="info-card playlist-card"><div className="card-heading"><div><span className="eyebrow">CLASS PLAN</span><h2>Lecture sequence</h2></div></div>{lectures.length ? <div className="mini-list">{lectures.map((item,i) => <div className={`mini-item ${i===index?'active':''}`} key={item.id}><span className="mini-index">{String(i+1).padStart(2,'0')}</span><span className="mini-name">{item.title}</span><span className="mini-size">{i===index?'Now':''}</span></div>)}</div> : <div className="empty-list">Recordings are bundled with the app, not uploaded from this screen.</div>}</div></section>
    <aside className={`ai-chat-panel ${chatOpen ? '' : 'chat-collapsed'}`}><div className="ai-chat-head"><div><span className="eyebrow">CLASS DISCUSSION</span><h2>Class chat</h2><p>Course discussion</p></div><button className="icon-button" aria-label="Toggle chat" onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? <X size={17}/> : <MessageSquare size={17}/>}</button></div>{chatOpen && <><div className="chat-participant-row"><div className="chat-avatar mini purple">MS</div><div className="chat-avatar mini blue">AC</div><div className="chat-avatar mini green">JL</div><div className="chat-avatar mini rose">SR</div><span>4 active discussants · 84 active users</span></div><div className="ai-chat-messages" ref={chatScrollRef}>{chatMessages.map(message => <article className="ai-chat-message" key={message.id}><div className={`chat-avatar ${message.tone}`}>{message.initials}</div><div className="chat-message-body"><div className="chat-message-meta"><strong>{message.name}</strong><time>{message.time}</time></div><p>{message.text}</p></div></article>)}</div><form className="chat-composer chat-composer-form" onSubmit={e => { e.preventDefault(); void sendChatMessage() }}><input aria-label="Message the class" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask the class a question…" maxLength={500} disabled={chatSending}/><button type="submit" aria-label="Send message" disabled={chatSending || !chatInput.trim()} title="Send message"><MessageSquare size={16}/></button></form>{chatSending && <div className="chat-thinking">A classmate is replying…</div>}</>}</aside></div>
    {loadError && <div className="error-banner"><span>{loadError}</span><button onClick={() => setLoadError('')} aria-label="Dismiss"><X size={16}/></button></div>}<p className="privacy-note">UoPeople classroom experience. Live lessons and participant profiles are active.</p>
    {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><section className="settings-modal" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">PREFERENCES</span><h2>Class settings</h2><p>Configure your classroom experience. Recorded lectures resume five minutes after the last saved position.</p></div><button className="icon-button" onClick={() => setSettingsOpen(false)}><X size={20}/></button></div><label className="field-label">School name<input value={schoolName} onChange={e => setSchoolName(e.target.value)} maxLength={70}/></label><label className="field-label">Class title<input value={classTitle} onChange={e => setClassTitle(e.target.value)} maxLength={80}/></label><div className="logo-setting"><span className="field-label">School logo</span><p>Choose your own PNG, JPG, SVG, or WebP logo (2 MB max). It is saved locally in this browser.</p><div className="logo-setting-row">{schoolLogo ? <img className="logo-preview" src={schoolLogo} alt="Current custom logo"/> : <div className="logo-preview logo-placeholder"><GraduationCap size={22}/></div>}<label className="logo-file-button">{schoolLogo ? 'Change logo' : 'Choose logo'}<input type="file" accept="image/*" onChange={e => handleLogoUpload(e.target.files?.[0])}/></label>{schoolLogo && <button className="logo-remove" onClick={() => { setSchoolLogo(''); localStorage.removeItem('classroom-sim-logo') }}>Remove</button>}</div></div><div className="settings-info"><CheckCircle2 size={17}/><span>Lecture recordings are configured by the app owner in public/lectures/playlist.json.</span></div><button className="primary-button full-width" onClick={saveSchool}>Save settings</button></section></div>}
  </main>
}
