import { useState } from 'react'
import PinGate from './components/PinGate.jsx'
import Header from './components/Header.jsx'
import CaseStudyForm from './components/CaseStudyForm.jsx'

const SESSION_KEY = 'chesterton_casestudy_auth'
const CORRECT_PIN = '1884'

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  })
  const [exiting, setExiting] = useState(false)

  function handleAuthenticated() {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setExiting(true)
    setTimeout(() => {
      setAuthenticated(true)
      setExiting(false)
    }, 520)
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthenticated(false)
  }

  if (!authenticated) {
    return (
      <PinGate
        correctPin={CORRECT_PIN}
        onAuthenticated={handleAuthenticated}
        exiting={exiting}
      />
    )
  }

  return (
    <div className="app-fade-in h-full flex flex-col">
      <Header onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto px-4 py-8">
        <CaseStudyForm />
      </main>
    </div>
  )
}
