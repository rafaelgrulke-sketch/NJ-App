import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  friendlyMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      friendlyMessage: 'Ocorreu uma instabilidade inesperada ao carregar esta seção.',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendlyMessage = 'Ocorreu uma instabilidade inesperada ao carregar esta seção.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string };
      if (parsed.error?.toLowerCase().includes('permission')) {
        friendlyMessage =
          'Você não possui permissão para executar esta operação. Faça login com uma conta autorizada.';
      } else if (parsed.error?.toLowerCase().includes('quota')) {
        friendlyMessage =
          'Limite temporário de leituras do banco atingido. Tente novamente mais tarde.';
      }
    } catch {
      // Keep default friendly message without exposing stack details
    }
    return { hasError: true, friendlyMessage };
  }

  componentDidCatch(error: Error) {
    console.error('Application boundary caught error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--nj-canvas)] px-4 text-[var(--nj-ink)]">
          <div className="nj-card max-w-md rounded-xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--nj-accent-soft)] text-[var(--nj-accent-text)]">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-serif text-xl font-semibold text-[var(--nj-ink)]">
              Algo não saiu como esperado
            </h1>
            <p className="mt-2 text-sm text-[var(--nj-ink-muted)]">
              {this.state.friendlyMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="nj-btn-primary mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Recarregar plataforma
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
