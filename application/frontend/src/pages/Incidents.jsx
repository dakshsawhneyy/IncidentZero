import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Incidents.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const SEVERITY_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];

export default function Incidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/incidents`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setIncidents(data);
          const storedId = Number(sessionStorage.getItem('selectedIncidentId'));
          const defaultIncident = data.find((item) => item.rawId === storedId) || data[0] || null;
          if (defaultIncident) {
            setSelectedIncidentId(defaultIncident.rawId);
          }
        } else {
          setError('Unexpected incident response from the backend.');
        }
      })
      .catch(() => setError('Unable to load incident data from the backend.'));
  }, []);

  const filteredIncidents = incidents.filter((incident) => {
    return severityFilter === 'All' || incident.severity?.toLowerCase() === severityFilter.toLowerCase();
  });

  const selectedIncident = filteredIncidents.find((item) => item.rawId === selectedIncidentId) || filteredIncidents[0] || null;

  function selectIncident(incident) {
    setSelectedIncidentId(incident.rawId);
    sessionStorage.setItem('selectedIncidentId', incident.rawId);
  }

  function openIncident() {
    if (selectedIncident) {
      sessionStorage.setItem('selectedIncidentId', selectedIncident.rawId);
      navigate('/incident');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div>
              <p className={styles.sidebarLabel}>Incident showcase</p>
              <h1 className={styles.sidebarTitle}>Browse incidents</h1>
              <p className={styles.sidebarSubtitle}>
                Filter by severity and preview incident details before opening the briefing page.
              </p>
            </div>
            <button className={styles.backButton} onClick={() => navigate('/')}>
              ← Home
            </button>
          </div>

          <div className={styles.filterBar}>
            <span className={styles.filterTitle}>Severity</span>
            <div className={styles.filterList}>
              {SEVERITY_FILTERS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`${styles.filterPill} ${severityFilter === level ? styles.filterActive : ''}`}
                  onClick={() => setSeverityFilter(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.incidentList}>
            {filteredIncidents.length === 0 ? (
              <div className={styles.emptyState}>No incidents match this filter.</div>
            ) : (
              filteredIncidents.map((incident) => (
                <button
                  key={incident.rawId}
                  type="button"
                  className={`${styles.incidentItem} ${selectedIncident?.rawId === incident.rawId ? styles.incidentItemActive : ''}`}
                  onClick={() => selectIncident(incident)}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemTitle}>{incident.title}</span>
                    <span className={styles.itemSeverity}>{incident.severity}</span>
                  </div>
                  <div className={styles.itemMeta}>{incident.service} · {incident.team}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div>
              <p className={styles.detailLabel}>Incident detail preview</p>
              <h2 className={styles.detailTitle}>{selectedIncident ? selectedIncident.title : 'Select an incident to preview'}</h2>
            </div>
            <button className={styles.openButton} onClick={openIncident} disabled={!selectedIncident}>
              Open incident
            </button>
          </div>

          {selectedIncident ? (
            <div className={styles.detailCard}>
              <div className={styles.detailTop}>
                <span className={styles.badge}>{selectedIncident.severity}</span>
                <span className={styles.incidentId}>{selectedIncident.id}</span>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Service</span>
                  <span className={styles.infoValue}>{selectedIncident.service}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Team</span>
                  <span className={styles.infoValue}>{selectedIncident.team}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Date</span>
                  <span className={styles.infoValue}>{selectedIncident.date}</span>
                </div>
              </div>
              <div className={styles.detailSection}>
                <span className={styles.sectionLabel}>Description</span>
                <p className={styles.sectionText}>{selectedIncident.description}</p>
              </div>
              <div className={styles.detailSection}>
                <span className={styles.sectionLabel}>Affected services</span>
                <div className={styles.badgeRow}>
                  {(selectedIncident.affectedServices || []).map((service) => (
                    <span key={service} className={styles.serviceBadge}>{service}</span>
                  ))}
                </div>
              </div>
              <div className={styles.detailSection}>
                <span className={styles.sectionLabel}>Investigation notes</span>
                <p className={styles.sectionText}>
                  This incident will open in the briefing page when you choose to proceed. Review the alert here first, then click Open incident to begin the incident workflow.
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyPreview}>
              <p>Select an incident from the left to see details here.</p>
            </div>
          )}
        </main>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
