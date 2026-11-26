import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InstitutionalSite } from './components/InstitutionalSite';
import { MemberApp } from './components/MemberApp';
import { ChurchProvider, useChurch } from './context/ChurchContext';
import { AuthProvider } from './contexts/AuthContext';
import { EnvironmentMode } from './types/church';

const PlatformRouter: React.FC = () => {
  const [environment, setEnvironment] = useState<EnvironmentMode>('site');
  const [appInitialTab, setAppInitialTab] = useState<string>('inicio');
  const { toast, dismissToast } = useChurch();

  const handleSwitchEnvironment = (mode: EnvironmentMode, tab?: string) => {
    if (tab) setAppInitialTab(tab);
    setEnvironment(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {environment === 'site' && (
        <InstitutionalSite onSwitchEnvironment={handleSwitchEnvironment} />
      )}
      {environment === 'app' && (
        <MemberApp
          key={appInitialTab}
          initialTab={appInitialTab}
          onSwitchEnvironment={handleSwitchEnvironment}
        />
      )}
      {environment === 'admin' && (
        <AdminPanel onSwitchEnvironment={handleSwitchEnvironment} />
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-xl backdrop-blur-md ${
            toast.tone === 'warning'
              ? 'border-amber-500/40 bg-amber-950/90 text-amber-100'
              : 'border-[var(--nj-border-strong)] bg-[var(--nj-surface)] text-[var(--nj-ink)]'
          }`}
        >
          <span className="leading-relaxed">{toast.text}</span>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Fechar aviso"
            className="rounded p-1 opacity-70 transition hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ChurchProvider>
          <PlatformRouter />
        </ChurchProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
