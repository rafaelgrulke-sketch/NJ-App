import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { ChurchProvider, useChurch } from './context/ChurchContext';
import { InstitutionalSite } from './components/InstitutionalSite';
import { MemberApp } from './components/MemberApp';
import { AdminPanel } from './components/AdminPanel';
import { OfflineIndicator } from './components/PWAInstallButton';
import { EnvironmentMode } from './types/church';
import { ErrorBoundary } from './components/ErrorBoundary';

const PlatformShell: React.FC = () => {
  const [environment, setEnvironment] = useState<EnvironmentMode>('site');
  const [appInitialTab, setAppInitialTab] = useState<string>('inicio');
  const { toast, dismissToast } = useChurch();

  const handleSwitchEnvironment = (mode: EnvironmentMode, initialTab?: string) => {
    if (initialTab) {
      setAppInitialTab(initialTab);
    }
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

      <OfflineIndicator />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 bottom-20 z-50 flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-xl backdrop-blur-md lg:bottom-5 ${
            toast.tone === 'warning'
              ? 'border-[#F5B971]/60 bg-[#2A2215]/95 text-[#F3F1E9]'
              : 'border-[#B1D3AE]/50 bg-[#18261E]/95 text-[#F3F1E9]'
          }`}
        >
          {toast.tone === 'warning' ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#F5B971]" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#B1D3AE]" aria-hidden="true" />
          )}
          <span className="flex-1 leading-snug">{toast.text}</span>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Fechar notificação"
            className="rounded-md p-1 text-[#F3F1E9]/70 transition hover:bg-white/10 hover:text-[#F3F1E9]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ChurchProvider>
        <PlatformShell />
      </ChurchProvider>
    </ErrorBoundary>
  );
}
