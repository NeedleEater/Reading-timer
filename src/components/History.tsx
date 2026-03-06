import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon } from 'lucide-react';
import { api, Stats } from '../services/api';
import '../styles/History.css';

export const History: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const monthStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

  useEffect(() => {
    fetchStats();
  }, [monthStr]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getStats(monthStr);
      if (res.ok && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate);
    next.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(next);
  };

  const goToToday = () => setCurrentDate(new Date());

  const formatMinutes = (seconds: number) => Math.round(seconds / 60);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="day-tile empty" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const seconds = stats?.dailyTotals[dateKey] || 0;
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();

    days.push(
      <div key={d} className={`day-tile ${isToday ? 'today' : ''}`}>
        <span className="day-number">{d}</span>
        <span className={`day-minutes ${seconds > 0 ? 'has-data' : ''}`}>
          {seconds > 0 ? `${formatMinutes(seconds)}m` : '0'}
        </span>
      </div>
    );
  }

  return (
    <div className="container history-container">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Weekly Total</span>
          <span className="stat-value">{formatMinutes(stats?.weeklyTotalSeconds || 0)}m</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Monthly Total</span>
          <span className="stat-value">{formatMinutes(stats?.monthlyTotalSeconds || 0)}m</span>
        </div>
      </div>

      <div className="calendar-header">
        <div className="month-nav">
          <button className="nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous Month">
            <ChevronLeft size={20} />
          </button>
          <span className="current-month-label">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button className="nav-btn" onClick={() => changeMonth(1)} aria-label="Next Month">
            <ChevronRight size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="export-btn" onClick={goToToday}>Today</button>
          <a 
            href={api.getExportUrl(monthStr)} 
            className="export-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            download
          >
            <Download size={16} />
            Export
          </a>
        </div>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="weekday-label">{day}</div>
        ))}
        {days}
      </div>
    </div>
  );
};
