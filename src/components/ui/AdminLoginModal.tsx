import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, LogIn, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { AccessibleModal } from './DesignPrimitives';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  open,
  onClose,
  onSuccess,
  title = 'Área Administrativa / Login',
  subtitle = 'Entre com seu e-mail e senha cadastrados ou com sua conta Google autorizada.',
}) => {
  const { user, authLoading, authError, clearAuthError, loginWithEmail, loginWithGoogle, resendVerificationEmail, logout } =
    useAuth();
  const { realRole, currentMemberName, notify } = useChurch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const displayError = localError || authError;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();
    if (!email.trim() || !password) {
      setLocalError('Informe seu e-mail e senha para entrar.');
      return;
    }
    try {
      const signedIn = await loginWithEmail(email, password);
      notify(`Bem-vindo(a), ${signedIn.displayName || signedIn.email}!`);
      setPassword('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Falha ao autenticar.');
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearAuthError();
    try {
      const signedIn = await loginWithGoogle();
      notify(`Bem-vindo(a), ${signedIn.displayName || signedIn.email}!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg && !msg.includes('fechada antes da conclusão')) {
        setLocalError(msg);
      }
    }
  };

  const handleLogout = async () => {
    setLocalError(null);
    try {
      await logout();
      notify('Sessão encerrada com segurança.');
      onClose();
    } catch {
      setLocalError('Não foi possível encerrar a sessão.');
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setVerificationSent(true);
      notify('E-mail de verificação enviado. Confira sua caixa de entrada.');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao enviar verificação.');
    }
  };

  return (
    <AccessibleModal
      open={open}
      onClose={() => {
        setLocalError(null);
        clearAuthError();
        onClose();
      }}
      title={title}
      subtitle={subtitle}
      maxWidthClass="max-w-md"
    >
      {user ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nj-accent-text)]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Sessão ativa no Firebase Auth</span>
            </div>
            <p className="mt-2 font-serif text-lg font-semibold text-[var(--nj-ink)]">
              {currentMemberName}
            </p>
            <p className="text-xs text-[var(--nj-ink-muted)]">{user.email}</p>
            <p className="mt-1 text-xs font-medium text-[var(--nj-accent-text)]">
              Perfil atual: {realRole}
            </p>
          </div>

          {!user.emailVerified && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-[var(--nj-ink)] space-y-2">
              <p className="font-medium">
                Seu e-mail ainda não foi verificado. Para editar escalas ou conteúdos administrativos, confirme o link enviado ao seu e-mail.
              </p>
              {verificationSent ? (
                <p className="inline-flex items-center gap-1.5 text-[var(--nj-accent-text)]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Link de verificação reenviado.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  disabled={authLoading}
                  className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Reenviar e-mail de verificação
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="nj-btn-secondary rounded-md px-3.5 py-2 text-xs"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={authLoading}
              className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sair da conta
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-[var(--nj-ink)]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={(e) => void handleEmailLogin(e)} className="space-y-3">
            <div>
              <label htmlFor="admin-login-email" className="block text-xs font-medium text-[var(--nj-ink)]">
                E-mail
              </label>
              <input
                id="admin-login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@igreja.com"
                className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="admin-login-password" className="block text-xs font-medium text-[var(--nj-ink)]">
                Senha
              </label>
              <input
                id="admin-login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="nj-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              {authLoading ? 'Autenticando...' : 'Entrar com E-mail e Senha'}
            </button>
          </form>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[var(--nj-border)]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[var(--nj-surface)] px-2 text-[var(--nj-ink-subtle)]">ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={authLoading}
            className="nj-btn-secondary inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {authLoading ? 'Conectando...' : 'Entrar com conta Google'}
          </button>
        </div>
      )}
    </AccessibleModal>
  );
};
