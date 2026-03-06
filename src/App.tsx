import { useState, useEffect } from 'react';
import { useTimer } from './hooks/useTimer';
import { Timer } from './components/Timer';
import { History } from './components/History';
import { Clock, History as HistoryIcon, Sun, Moon } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'timer' | 'history'>('timer');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const { isActive, elapsed, sessionId, start, stop } = useTimer();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isActive) {
      document.body.classList.add('active-timer');
    } else {
      document.body.classList.remove('active-timer');
    }
  }, [isActive]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <>
      <nav className="nav">
        <div className="nav-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.0005rem', marginRight: '0.001rem' }}>
            <Clock size={0.25} color={isActive ? "#444" : "var(--accent-neon)"} />
            <span style={{ fontWeight: 'bold', letterSpacing: '0.05rem', fontSize: '0.35rem' }}>NEON LOG</span>
          </div>
          <button 
            className={`nav-link ${view === 'timer' ? 'active' : ''}`}
            onClick={() => setView('timer')}
          >
            Timer
          </button>
          <button 
            className={`nav-link ${view === 'history' ? 'active' : ''}`}
            onClick={() => setView('history')}
          >
            History
          </button>
        </div>
        
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {view === 'timer' ? (
          <Timer 
            isActive={isActive} 
            elapsed={elapsed} 
            sessionId={sessionId}
            onStart={start}
            onStop={stop}
          />
        ) : (
          <History />
        )}
      </main>
    </>
  );
}
