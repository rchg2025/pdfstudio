import { useState, useEffect } from 'react';
import { Users, UserCheck, Activity } from 'lucide-react';

export default function VisitorTracker() {
  const [stats, setStats] = useState({ totalVisits: 0, todayVisits: 0, onlineNow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('visitor_id', visitorId);
    }

    const fetchStats = async () => {
      try {
        // Ping visit
        await fetch('/api/utils/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId })
        });

        // Get stats
        const res = await fetch('/api/utils/stats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <div style={{
      display: 'flex', 
      flexWrap: 'wrap', 
      justifyContent: 'center', 
      gap: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
        <Activity size={18} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Đang truy cập: <b>{stats.onlineNow}</b>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
        <UserCheck size={18} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Hôm nay: <b>{stats.todayVisits}</b>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
        <Users size={18} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Tổng lượt: <b>{stats.totalVisits}</b>
        </span>
      </div>
    </div>
  );
}
