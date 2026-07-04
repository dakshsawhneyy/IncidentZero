import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import IncidentBrief from './pages/IncidentBrief';
import Investigation from './pages/Investigation';
import Report from './pages/Report';
import Incidents from './pages/Incidents';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/incident" element={<IncidentBrief />} />
        <Route path="/investigate" element={<Investigation />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </BrowserRouter>
  );
}
