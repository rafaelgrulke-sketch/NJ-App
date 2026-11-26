import React, { useState } from 'react';
import { Download, Moon, Smartphone, Sun, WifiOff, X } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWA';

export const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useChurch();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="nj-btn-secondary inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs whitespace-nowrap shrink-0"
      aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-3.5 w-3.5 text-[#B1D3AE]" aria-hidden="true" />
          Tema claro
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-[#213228]" aria-hidden="true" />
          Tema escuro
        </>
      )}
    </button>
  );
};

export const PWAInstallButton: React.FC<{ variant?: 'primary' | 'subtle' }> = ({
  variant = 'subtle',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'primary'
            ? 'nj-btn-primary inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm whitespace-nowrap shrink-0'
            : 'nj-btn-secondary inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm whitespace-nowrap shrink-0'
        }
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Instalar NJ App
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="nj-card w-full max-w-md p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5 text-[var(--nj-accent-text)]">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
                <h3 id="pwa-install-title" className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                  Instalar NJ App na Tela Inicial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-md p-1.5 text-[var(--nj-ink-muted)] hover:bg-[#466053]/20"
                aria-label="Fechar orientações de instalação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--nj-ink-muted)]">
              O Aplicativo Oficial da Nova Jerusalém Sampaio funciona como PWA: você instala direto pelo navegador e acessa suas escalas e lições da EBD mesmo offline.
            </p>

            <div className="mt-4 space-y-3 border-t border-[var(--nj-border)] pt-4 text-sm text-[var(--nj-ink)]">
              {isIOS ? (
                <>
                  <p>
                    <strong className="font-semibold text-[var(--nj-accent-text)]">1.</strong> Toque em <strong>Compartilhar</strong> na barra inferior do Safari.
                  </p>
                  <p>
                    <strong className="font-semibold text-[var(--nj-accent-text)]">2.</strong> Toque em <strong>Adicionar à Tela de Início</strong>.
                  </p>
                  <p>
                    <strong className="font-semibold text-[var(--nj-accent-text)]">3.</strong> Confirme em <strong>Adicionar</strong> para criar o ícone <strong>NJ App</strong>.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong className="font-semibold text-[var(--nj-accent-text)]">Android (Chrome):</strong> abra o menu do navegador e toque em <strong>Instalar aplicativo</strong>.
                  </p>
                  <p>
                    <strong className="font-semibold text-[var(--nj-accent-text)]">iPhone / iPad (Safari):</strong> toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>.
                  </p>
                  <p>
                    <strong className="font-semibold text-[var(--nj-accent-text)]">Computador:</strong> clique no ícone de instalação na barra de endereços.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="nj-btn-primary rounded-md px-4 py-2 text-sm"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md border border-[#716F56] bg-[#213228] px-3.5 py-2 text-xs font-medium text-[#F3F1E9] shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 text-[#B1D3AE]" aria-hidden="true" />
      <span>Modo offline — conteúdos em cache disponíveis.</span>
    </div>
  );
};
