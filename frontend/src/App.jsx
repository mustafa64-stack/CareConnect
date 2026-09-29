import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from './components/AppHeader';
import LandingPage from './pages/LandingPage';
import DispatcherPage from './pages/DispatcherPage';
import HospitalPage from './pages/HospitalPage';
import { apiUrl } from './apiConfig';

export default function App() {
  const [page, setPage] = useState('landing');
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sseConnected, setSseConnected] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [hRes, rRes] = await Promise.all([
        fetch(apiUrl('/api/hospitals')),
        fetch(apiUrl('/api/requests')),
      ]);
      if (hRes.ok) setHospitals(await hRes.json());
      if (rRes.ok) setRequests(await rRes.json());
    } catch (e) {
      console.error('Fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchData();

    let eventSource = null;
    try {
      eventSource = new EventSource(apiUrl('/api/events'));
      eventSource.onopen = () => setSseConnected(true);
      eventSource.onmessage = () => fetchData();
      eventSource.onerror = () => setSseConnected(false);
    } catch (err) {
      console.warn('SSE fallback active:', err);
    }

    const pollInterval = sseConnected ? 12000 : 3000;
    const intervalTimer = setInterval(fetchData, pollInterval);

    return () => {
      clearInterval(intervalTimer);
      if (eventSource) eventSource.close();
    };
  }, [fetchData, sseConnected]);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        currentPage={page}
        onNavigate={setPage}
        sseConnected={sseConnected}
        pendingRequestsCount={pendingCount}
      />

      <main style={{ flex: 1 }}>
        {page === 'landing' && (
          <LandingPage onSelect={setPage} />
        )}

        {page === 'dispatcher' && (
          <DispatcherPage
            hospitals={hospitals}
            requests={requests}
            sseConnected={sseConnected}
            onBack={() => setPage('landing')}
            onRefresh={fetchData}
          />
        )}

        {page === 'hospital' && (
          <HospitalPage
            hospitals={hospitals}
            requests={requests}
            sseConnected={sseConnected}
            onBack={() => setPage('landing')}
            onRefresh={fetchData}
          />
        )}
      </main>
    </div>
  );
}
