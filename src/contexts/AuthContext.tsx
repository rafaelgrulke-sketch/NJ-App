import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function translateFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
    case 'auth/invalid-email':
      return 'Informe um endereço de e-mail válido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos antes de tentar novamente.';
    case 'auth/user-disabled':
      return 'Esta conta foi desativada pela administração.';
    case 'auth/operation-not-allowed':
      return 'Login por e-mail e senha ainda não está ativado no Firebase Console (Authentication → Sign-in method).';
    case 'auth/popup-closed-by-user':
      return 'Janela de login fechada antes da conclusão.';
    case 'auth/unauthorized-domain':
      return 'Este domínio ainda não foi autorizado em Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/network-request-failed':
      return 'Erro de conexão com o Firebase. Verifique sua internet e tente novamente.';
    default:
      return 'Não foi possível concluir a autenticação. Tente novamente.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return credential.user;
    } catch (error) {
      const message = translateFirebaseAuthError(error);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return credential.user;
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code || '')
          : '';
      const message = translateFirebaseAuthError(error);
      if (code !== 'auth/popup-closed-by-user') {
        setAuthError(message);
      }
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!auth.currentUser) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      const message = translateFirebaseAuthError(error);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error) {
      const message = translateFirebaseAuthError(error);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        authLoading,
        authError,
        clearAuthError,
        loginWithEmail,
        loginWithGoogle,
        resendVerificationEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return ctx;
}
