import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TutorialPage } from './components/TutorialPage.tsx'

function Root() {
  const hash = window.location.hash
  if (hash === '#tutorial' || hash.startsWith('#tutorial?')) {
    return <TutorialPage />
  }
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
