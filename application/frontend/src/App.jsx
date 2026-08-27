import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import IncidentBrief from './pages/IncidentBrief';
import Investigation from './pages/Investigation';
import Report from './pages/Report';
import Incidents from './pages/Incidents';
import './index.css';

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontFamily: "'JetBrains Mono', monospace",
      color: 'var(--text-muted)',
    }}>
      <span style={{ fontSize: '48px', opacity: 0.2 }}>◈</span>
      <span style={{ fontSize: '13px', letterSpacing: '2px' }}>404 — PAGE NOT FOUND</span>
      <a href="/" style={{
        marginTop: '8px',
        color: 'var(--amber)',
        fontSize: '12px',
        textDecoration: 'none',
        border: '1px solid var(--amber-border)',
        padding: '8px 18px',
        borderRadius: '4px',
      }}>← Back to Home</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/incident" element={<IncidentBrief />} />
        <Route path="/investigate" element={<Investigation />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
