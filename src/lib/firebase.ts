import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export const BOOTSTRAP_SUPERADMIN_EMAIL = 'rafaelgrulke123@gmail.com';

const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
const envMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
const envAppId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
const envDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID?.trim();

const hasEnvConfig = Boolean(envApiKey && envProjectId && envAppId);

const firebaseConfig = {
  apiKey: envApiKey || firebaseAppletConfig.apiKey,
  authDomain: envAuthDomain || firebaseAppletConfig.authDomain,
  projectId: envProjectId || firebaseAppletConfig.projectId,
  storageBucket: envStorageBucket || firebaseAppletConfig.storageBucket,
  messagingSenderId: envMessagingSenderId || firebaseAppletConfig.messagingSenderId,
  appId: envAppId || firebaseAppletConfig.appId,
};

// Preserve the provisioned named database ID when targeting the same Firebase project,
// or honor VITE_FIREBASE_DATABASE_ID / default database when deploying to another project.
const resolvedDatabaseId =
  envDatabaseId ||
  (!hasEnvConfig || firebaseConfig.projectId === firebaseAppletConfig.projectId
    ? firebaseAppletConfig.firestoreDatabaseId
    : undefined);

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = resolvedDatabaseId ? getFirestore(app, resolvedDatabaseId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
