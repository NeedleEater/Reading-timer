import React, { useState } from 'react';
import { BookOpen, StopCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import '../styles/Timer.css';

interface TimerProps {
  isActive: boolean;
  elapsed: number;
  sessionId: number | null;
  onStart: (id: number, time: string) => void;
  onStop: () => void;
}

export const Timer: React.FC<TimerProps> = ({ isActive, elapsed, sessionId, onStart, onStop }) => {
  const [loading, setLoading] = useState(false);
  const [lastDuration, setLastDuration] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    return (
      <div className="clock-display">
        <span>{pad(h)}</span>
        <span className="colon">:</span>
        <span>{pad(m)}</span>
        <span className="colon">:</span>
        <span>{pad(s)}</span>
      </div>
    );
  };

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    setLastDuration(null);

    try {
      if (!isActive) {
        const res = await api.startSession();
        if (res.ok && res.data) {
          onStart(res.data.sessionId, res.data.startedAt);
        }
      } else if (sessionId) {
        const res = await api.stopSession(sessionId);
        if (res.ok && res.data) {
          setLastDuration(res.data.durationSeconds);
          onStop();
          setTimeout(() => setLastDuration(null), 5000);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="timer-container">
      <button 
        className={`main-button ${isActive ? 'noir' : ''}`}
        onClick={handleToggle}
        disabled={loading}
        aria-label={isActive ? "Stop Reading" : "Start Reading"}
      >
        <div className="icon">
          {isActive ? <StopCircle size={64} /> : <BookOpen size={64} />}
        </div>
        <span>{isActive ? "Reading..." : "Start"}</span>
        
        {isActive && (
          <div className="button-elapsed">
            {formatTime(elapsed)}
          </div>
        )}
      </button>

      {lastDuration !== null && (
        <div className="confirmation">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} color="#00ffcc" />
            <span>Session saved: {Math.floor(lastDuration / 60)}m {lastDuration % 60}s</span>
          </div>
        </div>
      )}
    </div>
  );
};
