import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Incidents.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Incidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/incidents`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setIncidents(data);
        } else {
          setError('Unexpected incident response from the backend.');
        }
      })
      .catch(() => setError('Unable to load incident data from the backend.'));
  }, []);

  function selectIncident(incident) {
    sessionStorage.setItem('selectedIncidentId', incident.rawId);
    navigate('/incident');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← Back to home
        </button>
        <div>
          <p className={styles.label}>Incident showcase</p>
          <h1 className={styles.title}>Browse all active scenarios</h1>
          <p className={styles.subtitle}>
            Choose the next real-world incident to investigate. Each card opens the incident briefing page first.
          </p>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {incidents.map((incident) => (
          <button
            key={incident.rawId}
            type="button"
            className={styles.card}
            onClick={() => selectIncident(incident)}
          >
            <div className={styles.cardTop}>
              <span className={styles.cardId}>{incident.id}</span>
              <span className={styles.cardSeverity}>{incident.severity}</span>
            </div>
            <h2 className={styles.cardTitle}>{incident.title}</h2>
            <p className={styles.cardDesc}>{incident.description}</p>
            <div className={styles.cardMeta}>
              <span>{incident.service}</span>
              <span>{incident.team}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
