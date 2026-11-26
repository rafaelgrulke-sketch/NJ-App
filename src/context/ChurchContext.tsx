import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BIBLE_PLAN,
  INITIAL_CHURCH_INFO,
  INITIAL_DEVOTIONALS,
  INITIAL_DISCOGRAPHY,
  INITIAL_EBD_CLASSES,
  INITIAL_EBD_LESSONS,
  INITIAL_EVENTS,
  INITIAL_INSTITUTIONAL_AREAS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRAYERS,
  INITIAL_SERMON_NOTES,
  INITIAL_VIDEOS,
  INITIAL_WEEKLY_INFORMATIVO,
} from '../data/initialData';
import { useAuth } from '../contexts/AuthContext';
import {
  BOOTSTRAP_SUPERADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  buildDiscographyPayload,
  buildEbdClassPayload,
  buildEbdLessonPayload,
  buildEventDocPayload,
  buildMinistryPayload,
  buildSchedulePayload,
  createBroadcastVideoDoc,
  deleteBroadcastVideoDoc,
  deleteScheduleSlotDoc,
  recordAuditEntry,
  saveWeeklyInformativoDoc,
  seedInitialChurchDataIfEmpty,
  stripUndefined,
  subscribeToBroadcastVideos,
  subscribeToMinistrySchedules,
  timestampToDateStr,
  timestampToDateTimePtBR,
} from '../services/firestoreService';
import {
  AccessProfile,
  Announcement,
  AppNotification,
  AuditLogEntry,
  BibleReadingDay,
  BroadcastVideo,
  ChurchEvent,
  ChurchInstitutionInfo,
  CultRepertoire,
  DevotionalItem,
  DiscographyProject,
  EbdClass,
  EbdLesson,
  EventRegistration,
  EventStatus,
  InstitutionalArea,
  MinistryUnit,
  PrayerPrivacy,
  PrayerRequest,
  RegisteredUser,
  RepertoireSong,
  ScheduleSlot,
  SermonNote,
  StoredUserRole,
  ThemeMode,
  UnavailabilityRecord,
  VolunteerStatus,
  WeeklyInformativoVideo,
  WeeklyService,
} from '../types/church';
import {
  makeSafeDocId,
  safeDateIso,
  safeExternalUrl,
  safeHttpsOrRelativeMediaUrl,
  sanitizeText,
} from '../utils/security';

const THEME_KEY = 'nj_sampaio_theme_v3';

export interface NotificationPreferences {
  escala: boolean;
  ebd: boolean;
  evento: boolean;
  musica: boolean;
  comunicado: boolean;
  transmissao: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  escala: true,
  ebd: true,
  evento: true,
  musica: true,
  comunicado: true,
  transmissao: true,
};

interface ToastMessage {
  id: string;
  text: string;
  tone?: 'info' | 'warning';
}

interface ChurchContextValue {
  // Real Firebase Auth & Server-Enforced RBAC
  authUser: User | null;
  authReady: boolean;
  authLoading: boolean;
  userProfile: RegisteredUser | null;
  realRole: AccessProfile;
  accessProfile: AccessProfile;
  setAccessProfile: (profile: AccessProfile) => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  usersList: RegisteredUser[];
  updateUserRole: (uid: string, role: StoredUserRole) => Promise<void>;
  updateUserMinistries: (uid: string, ministryIds: string[], departmentIds?: string[]) => Promise<void>;
  userMinistryIds: string[];
  userDepartmentIds: string[];
  hasScheduleAccess: boolean;
  canManageSchedules: boolean;
  canManageVideos: boolean;
  dataLoading: boolean;
  dataError: string | null;
  dbSynced: boolean;

  // Domain State
  currentMemberName: string;
  theme: ThemeMode;
  toggleTheme: () => void;
  toast: ToastMessage | null;
  notify: (text: string, tone?: 'info' | 'warning') => void;
  dismissToast: () => void;

  churchInfo: ChurchInstitutionInfo;
  weeklyInformativo: WeeklyInformativoVideo;
  institutionalAreas: InstitutionalArea[];
  events: ChurchEvent[];
  registrations: EventRegistration[];
  announcements: Announcement[];
  ebdLessons: EbdLesson[];
  ebdClasses: EbdClass[];
  discography: DiscographyProject[];
  favoriteTrackIds: string[];
  ministries: MinistryUnit[];
  schedules: ScheduleSlot[];
  repertoires: CultRepertoire[];
  unavailability: UnavailabilityRecord[];
  prayers: PrayerRequest[];
  videos: BroadcastVideo[];
  devotionals: DevotionalItem[];
  biblePlan: BibleReadingDay[];
  sermonNotes: SermonNote[];
  eventReminders: string[];
  notifications: AppNotification[];
  notificationPrefs: NotificationPreferences;
  auditLogs: AuditLogEntry[];

  // Actions
  updateChurchInfo: (patch: Partial<ChurchInstitutionInfo>) => void;
  updateWeeklyInformativo: (patch: Partial<WeeklyInformativoVideo>) => void;
  addBroadcastVideo: (video: Omit<BroadcastVideo, 'id'>) => Promise<void>;
  deleteBroadcastVideo: (videoId: string) => Promise<void>;
  addWeeklyService: (srv: Omit<WeeklyService, 'id'>) => void;
  deleteWeeklyService: (id: string) => void;
  registerForEvent: (eventId: string, data: { name: string; phone: string; email: string; notes?: string }) => void;
  toggleEventReminder: (eventId: string) => void;
  addEvent: (event: Omit<ChurchEvent, 'id' | 'registeredCount' | 'status'>) => void;
  updateEvent: (eventId: string, patch: Partial<ChurchEvent>) => void;
  updateEventStatus: (eventId: string, status: EventStatus, newDate?: string, newTime?: string) => void;
  addAnnouncement: (item: Omit<Announcement, 'id'>) => void;
  deleteAnnouncement: (id: string) => void;
  publishEbdLesson: (lesson: Omit<EbdLesson, 'id'>) => void;
  setCurrentWeekLesson: (lessonId: string) => void;
  archiveEbdLesson: (lessonId: string) => void;
  addEbdClass: (cls: Omit<EbdClass, 'id'>) => void;
  updateEbdClass: (cls: EbdClass) => void;
  toggleFavoriteTrack: (trackId: string) => void;
  addAlbumProject: (project: Omit<DiscographyProject, 'id'>) => void;
  createCultRepertoire: (data: { eventTitle: string; date: string; time: string; ministerName: string; musicalNotes: string }) => string;
  addSongToRepertoire: (repertoireId: string, song: Omit<RepertoireSong, 'id' | 'order'>) => void;
  removeSongFromRepertoire: (repertoireId: string, songId: string) => void;
  addMinistryUnit: (unit: { name: string; leader: string; description: string; arrivalTimeNote: string }) => void;
  addMinistryIncident: (ministryId: string, note: string) => void;
  updateVolunteerStatus: (slotId: string, status: VolunteerStatus, swapReason?: string) => void;
  resolveScheduleSwap: (slotId: string, newVolunteerName: string) => { ok: boolean; error?: string };
  addScheduleSlot: (item: Omit<ScheduleSlot, 'id' | 'volunteerStatus'>) => { ok: boolean; error?: string };
  deleteScheduleSlot: (slotId: string) => Promise<void>;
  duplicateEventSchedules: (fromEventTitle: string, toEventTitle: string, newDate: string, newTime: string) => void;
  addUnavailability: (record: Omit<UnavailabilityRecord, 'id'>) => void;
  submitPrayer: (data: { authorName: string; isVisitor?: boolean; category: string; message: string; privacy: PrayerPrivacy }) => void;
  incrementPraying: (prayerId: string) => void;
  updatePrayerStatus: (prayerId: string, status: PrayerRequest['status']) => void;
  toggleBibleDay: (dayId: string) => void;
  saveSermonNote: (note: Omit<SermonNote, 'id'>, existingId?: string) => void;
  deleteSermonNote: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toggleNotificationPref: (key: keyof NotificationPreferences) => void;
  resetDemoData: () => void;
}

const ChurchContext = createContext<ChurchContextValue | null>(null);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state (visual preference only, zero sensitive data)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  // Firebase Auth from dedicated AuthContext
  const {
    user: authUser,
    authReady: baseAuthReady,
    authLoading,
    loginWithGoogle,
    logout: authLogout,
  } = useAuth();
  const [profileReady, setProfileReady] = useState(false);
  const authReady = baseAuthReady && (!authUser || profileReady);
  const [userProfile, setUserProfile] = useState<RegisteredUser | null>(null);
  const [previewProfile, setPreviewProfile] = useState<AccessProfile | null>(null);
  const [usersList, setUsersList] = useState<RegisteredUser[]>([]);
  const [dbSynced, setDbSynced] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Domain collections hydrated from Firestore
  // Note: ministries, schedules, and repertoires start strictly EMPTY (never exposed to visitors or unassigned members)
  const [churchInfo, setChurchInfo] = useState<ChurchInstitutionInfo>(INITIAL_CHURCH_INFO);
  const [weeklyInformativo, setWeeklyInformativo] = useState<WeeklyInformativoVideo>(INITIAL_WEEKLY_INFORMATIVO);
  const [institutionalAreas, setInstitutionalAreas] = useState<InstitutionalArea[]>(INITIAL_INSTITUTIONAL_AREAS);
  const [devotionals, setDevotionals] = useState<DevotionalItem[]>(INITIAL_DEVOTIONALS);

  const [events, setEvents] = useState<ChurchEvent[]>(INITIAL_EVENTS);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [ebdLessons, setEbdLessons] = useState<EbdLesson[]>(INITIAL_EBD_LESSONS);
  const [ebdClasses, setEbdClasses] = useState<EbdClass[]>(INITIAL_EBD_CLASSES);
  const [discography, setDiscography] = useState<DiscographyProject[]>(INITIAL_DISCOGRAPHY);
  const [ministries, setMinistries] = useState<MinistryUnit[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [repertoires, setRepertoires] = useState<CultRepertoire[]>([]);
  const [unavailability, setUnavailability] = useState<UnavailabilityRecord[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>(
    INITIAL_PRAYERS.filter((p) => p.privacy === 'comunidade')
  );
  const [videos, setVideos] = useState<BroadcastVideo[]>(INITIAL_VIDEOS);
  const [rawNotifications, setRawNotifications] = useState<Omit<AppNotification, 'read'>[]>(
    INITIAL_NOTIFICATIONS.map(({ read: _r, ...rest }) => rest)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Per-user state (backed by users/{uid} when signed in, transient in memory when visitor)
  const [localFavoriteTrackIds, setLocalFavoriteTrackIds] = useState<string[]>(['trk-2025-1']);
  const [localEventReminders, setLocalEventReminders] = useState<string[]>([]);
  const [localCompletedBibleDays, setLocalCompletedBibleDays] = useState<string[]>(['day-1', 'day-2']);
  const [localReadNotifIds, setLocalReadNotifIds] = useState<string[]>([]);
  const [localNotifPrefs, setLocalNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [sermonNotes, setSermonNotes] = useState<SermonNote[]>(INITIAL_SERMON_NOTES);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.dataset.theme = theme;
    root.style.colorScheme = isDark ? 'only dark' : 'only light';

    const schemeContent = isDark ? 'dark only' : 'light only';
    let colorSchemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    if (!colorSchemeMeta) {
      colorSchemeMeta = document.createElement('meta');
      colorSchemeMeta.name = 'color-scheme';
      document.head.appendChild(colorSchemeMeta);
    }
    colorSchemeMeta.content = schemeContent;

    const supportedSchemeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="supported-color-schemes"]'
    );
    if (supportedSchemeMeta) {
      supportedSchemeMeta.content = schemeContent;
    }

    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.content = isDark ? '#13231D' : '#0F7656';
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const notify = (text: string, tone: 'info' | 'warning' = 'info') => {
    const id = String(Date.now());
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4400);
  };

  const dismissToast = () => setToast(null);
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const isBootstrapSuperAdmin = Boolean(
    authUser &&
      authUser.emailVerified &&
      authUser.email?.toLowerCase() === BOOTSTRAP_SUPERADMIN_EMAIL
  );

  // Server-enforced real role (NEVER self-assigned by client state)
  const realRole: AccessProfile = useMemo(() => {
    if (!authUser) return 'visitante';
    if (userProfile?.role) return userProfile.role;
    if (isBootstrapSuperAdmin) return 'superadmin';
    return 'membro';
  }, [authUser, userProfile, isBootstrapSuperAdmin]);

  // Only Superadmin/Pastoral may toggle a read-only visual preview of another role's tabs
  const accessProfile: AccessProfile = useMemo(() => {
    if (previewProfile && (realRole === 'superadmin' || realRole === 'pastoral')) {
      return previewProfile;
    }
    return realRole;
  }, [previewProfile, realRole]);

  const setAccessProfile = (profile: AccessProfile) => {
    if (realRole !== 'superadmin' && realRole !== 'pastoral') {
      notify('Apenas Superadministrador ou Pastor podem simular a visualização de outros perfis.', 'warning');
      return;
    }
    setPreviewProfile(profile === realRole ? null : profile);
  };

  const isSuperAdminOrPastoral = realRole === 'superadmin' || realRole === 'pastoral';
  const isAdminContentOrHigher = isSuperAdminOrPastoral || realRole === 'admin_conteudo';
  const isEbdManager = isAdminContentOrHigher || realRole === 'coord_ebd';
  const isAdminOrLeader = isAdminContentOrHigher || realRole === 'lider_ministerio';
  const isStaff = isEbdManager || isAdminOrLeader;

  // Strict per-ministry membership (assigned by Superadmin / Pastoral in users/{uid})
  const userMinistryIds = useMemo(
    () => (Array.isArray(userProfile?.ministryIds) ? userProfile.ministryIds : []),
    [userProfile?.ministryIds]
  );
  const userDepartmentIds = useMemo(
    () => (Array.isArray(userProfile?.departmentIds) ? userProfile.departmentIds : []),
    [userProfile?.departmentIds]
  );
  const hasScheduleAccess = Boolean(
    authUser && (isSuperAdminOrPastoral || userMinistryIds.length > 0)
  );
  const canManageSchedules = Boolean(
    authUser && (isSuperAdminOrPastoral || (isAdminOrLeader && userMinistryIds.length > 0))
  );
  const canManageVideos = Boolean(authUser && isAdminContentOrHigher);

  // 1. User profile bootstrap & real-time listener in users/{uid}
  useEffect(() => {
    if (!baseAuthReady) return;
    setPreviewProfile(null);

    if (!authUser) {
      setUserProfile(null);
      setUsersList([]);
      setRegistrations([]);
      setUnavailability([]);
      setMinistries([]);
      setSchedules([]);
      setRepertoires([]);
      setAuditLogs([]);
      setSermonNotes(INITIAL_SERMON_NOTES);
      setProfileReady(true);
      return;
    }

    let cancelled = false;
    let unsubUserDoc: (() => void) | null = null;
    setProfileReady(false);

    const bootstrapProfile = async () => {
      const userRef = doc(db, 'users', authUser.uid);
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists() && authUser.emailVerified) {
          const isPrimaryAdmin =
            authUser.email?.toLowerCase() === BOOTSTRAP_SUPERADMIN_EMAIL;
          const initialRole: StoredUserRole = isPrimaryAdmin ? 'superadmin' : 'membro';
          await setDoc(userRef, {
            uid: authUser.uid,
            displayName: sanitizeText(authUser.displayName || authUser.email?.split('@')[0] || 'Membro NJ', 120),
            email: sanitizeText(authUser.email || '', 160),
            photoUrl: safeHttpsOrRelativeMediaUrl(authUser.photoURL),
            role: initialRole,
            ministryIds: [],
            departmentIds: [],
            favoriteTrackIds: ['trk-2025-1'],
            eventReminders: [],
            completedBibleDays: ['day-1', 'day-2'],
            readNotificationIds: [],
            notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        if (authUser.emailVerified && authUser.email?.toLowerCase() === BOOTSTRAP_SUPERADMIN_EMAIL) {
          const seeded = await seedInitialChurchDataIfEmpty(authUser.uid);
          if (seeded && !cancelled) {
            notify('Banco de dados Firestore inicializado com o conteúdo oficial da Nova Jerusalém Sampaio.');
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar perfil do usuário:', error);
      }

      if (cancelled) return;
      unsubUserDoc = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as RegisteredUser);
          } else {
            setUserProfile(null);
          }
          setProfileReady(true);
        },
        (error) => {
          setProfileReady(true);
          setDataError('Não foi possível carregar seu perfil de permissões no Firestore.');
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
        }
      );
    };

    void bootstrapProfile();

    return () => {
      cancelled = true;
      if (unsubUserDoc) unsubUserDoc();
    };
  }, [baseAuthReady, authUser]);

  // 2. Public Firestore real-time listeners (settings, events, announcements, ebdClasses, discography, videos, notifications)
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    setDataLoading(true);
    setDataError(null);

    const handlePublicReadError = (path: string, op: OperationType) => (error: unknown) => {
      setDataLoading(false);
      setDataError('Erro ao sincronizar dados com o Firebase Firestore. Verifique sua conexão.');
      handleFirestoreError(error, op, path);
    };

    // Settings documents (direct get listeners)
    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'churchInfo'),
        (snap) => {
          if (snap.exists()) {
            const payload = snap.data().payload as ChurchInstitutionInfo | undefined;
            if (payload) setChurchInfo(payload);
            setDbSynced(true);
          }
          setDataLoading(false);
        },
        handlePublicReadError('settings/churchInfo', OperationType.GET)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'weeklyInformativo'),
        (snap) => {
          if (snap.exists()) {
            const payload = snap.data().payload as WeeklyInformativoVideo | undefined;
            if (payload) setWeeklyInformativo(payload);
          }
        },
        handlePublicReadError('settings/weeklyInformativo', OperationType.GET)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'institutionalAreas'),
        (snap) => {
          if (snap.exists()) {
            const items = snap.data().payload?.items as InstitutionalArea[] | undefined;
            if (items && items.length > 0) setInstitutionalAreas(items);
          }
        },
        handlePublicReadError('settings/institutionalAreas', OperationType.GET)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'devotionals'),
        (snap) => {
          if (snap.exists()) {
            const items = snap.data().payload?.items as DevotionalItem[] | undefined;
            if (items && items.length > 0) setDevotionals(items);
          }
        },
        handlePublicReadError('settings/devotionals', OperationType.GET)
      )
    );

    // Events (matches allow list: status in [...])
    unsubs.push(
      onSnapshot(
        query(collection(db, 'events'), where('status', 'in', ['agendado', 'reagendado', 'cancelado'])),
        (snap) => {
          if (!snap.empty) {
            const initialEventMap = new Map(INITIAL_EVENTS.map((ev) => [ev.id, ev]));
            const list = snap.docs
              .map((d) => {
                const raw = d.data() as Omit<ChurchEvent, 'id'>;
                const fallback = initialEventMap.get(d.id);
                return {
                  ...raw,
                  id: d.id,
                  artworkUrl: raw.artworkUrl || fallback?.artworkUrl,
                  badgeLabel: raw.badgeLabel || fallback?.badgeLabel,
                };
              })
              .sort((a, b) => a.date.localeCompare(b.date));
            setEvents(list);
            setDbSynced(true);
          }
          setDataLoading(false);
        },
        handlePublicReadError('events', OperationType.LIST)
      )
    );

    // Announcements
    unsubs.push(
      onSnapshot(
        query(collection(db, 'announcements'), where('priority', 'in', ['normal', 'importante'])),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  title: data.title,
                  body: data.body,
                  date: data.date,
                  department: data.department,
                  priority: data.priority,
                } as Announcement;
              })
              .sort((a, b) => b.date.localeCompare(a.date));
            setAnnouncements(list);
          }
        },
        handlePublicReadError('announcements', OperationType.LIST)
      )
    );

    // EBD Classes (visibility == 'public')
    unsubs.push(
      onSnapshot(
        query(collection(db, 'ebdClasses'), where('visibility', '==', 'public')),
        (snap) => {
          if (!snap.empty) {
            setEbdClasses(
              snap.docs.map((d) => ({ ...(d.data() as Omit<EbdClass, 'id'>), id: d.id }))
            );
          }
        },
        handlePublicReadError('ebdClasses', OperationType.LIST)
      )
    );

    // Official Min. Nova Jerusalém Discography
    unsubs.push(
      onSnapshot(
        query(collection(db, 'discography'), where('type', 'in', ['album', 'single', 'ep'])),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as Omit<DiscographyProject, 'id'>), id: d.id }))
              .sort((a, b) => b.year - a.year);
            setDiscography(list);
          }
        },
        handlePublicReadError('discography', OperationType.LIST)
      )
    );

    // Broadcast Videos (Public Read)
    unsubs.push(
      subscribeToBroadcastVideos(
        (list) => {
          if (list.length > 0) setVideos(list);
        },
        handlePublicReadError('videos', OperationType.LIST)
      )
    );

    // App Notifications
    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'notifications'),
          where('type', 'in', ['escala', 'ebd', 'evento', 'musica', 'comunicado', 'transmissao'])
        ),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  type: data.type,
                  title: data.title,
                  body: data.body,
                  date: data.date,
                  targetTab: data.targetTab,
                };
              })
              .sort((a, b) => b.date.localeCompare(a.date));
            setRawNotifications(list);
          }
        },
        handlePublicReadError('notifications', OperationType.LIST)
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // 3. Role-aware & PII-isolated Firestore listeners (only attach after authReady!)
  useEffect(() => {
    if (!authReady) return;
    const unsubs: (() => void)[] = [];

    // EBD Lessons: managers see all (including 'agendada'); public sees only 'publicada' & 'arquivada'
    const ebdQuery = isEbdManager
      ? collection(db, 'ebdLessons')
      : query(collection(db, 'ebdLessons'), where('status', 'in', ['publicada', 'arquivada']));
    unsubs.push(
      onSnapshot(
        ebdQuery,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as Omit<EbdLesson, 'id'>), id: d.id }))
              .sort((a, b) => b.number - a.number);
            setEbdLessons(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'ebdLessons')
      )
    );

    // STRICT PER-MINISTRY ISOLATION:
    // Visitors & unassigned members receive ZERO ministries, schedules, or repertoires.
    // Volunteers / Leaders ONLY receive data for their own assigned ministryIds (and optional departmentIds).
    if (isSuperAdminOrPastoral) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'ministries'), where('visibility', '==', 'public')),
          (snap) => {
            setMinistries(
              snap.docs.map((d) => ({ ...(d.data() as Omit<MinistryUnit, 'id'>), id: d.id }))
            );
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'ministries')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'schedules'),
          (snap) => {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as Omit<ScheduleSlot, 'id'>), id: d.id }))
              .sort((a, b) => a.date.localeCompare(b.date));
            setSchedules(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'schedules')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'repertoires'), where('visibility', '==', 'public')),
          (snap) => {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as Omit<CultRepertoire, 'id'>), id: d.id }))
              .sort((a, b) => b.date.localeCompare(a.date));
            setRepertoires(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'repertoires')
        )
      );
    } else if (authUser && userMinistryIds.length > 0) {
      const ministryMap = new Map<string, MinistryUnit>();
      const schedulesByMin = new Map<string, ScheduleSlot[]>();

      userMinistryIds.forEach((mid) => {
        // Direct get listener per assigned ministry (enforced by allow get: isMemberOfMinistry(ministryId))
        unsubs.push(
          onSnapshot(
            doc(db, 'ministries', mid),
            (docSnap) => {
              if (docSnap.exists()) {
                ministryMap.set(mid, {
                  ...(docSnap.data() as Omit<MinistryUnit, 'id'>),
                  id: docSnap.id,
                });
              } else {
                ministryMap.delete(mid);
              }
              setMinistries(Array.from(ministryMap.values()));
            },
            (error) => handleFirestoreError(error, OperationType.GET, `ministries/${mid}`)
          )
        );

        // Per-ministry schedule query (enforced by allow list: isMemberOfMinistry(resource.data.ministryId))
        unsubs.push(
          subscribeToMinistrySchedules(
            mid,
            (slots) => {
              const filtered = slots.filter((slot) => {
                // Non-leaders only see published/active/completed shifts
                if (!isAdminOrLeader && !['publicada', 'em_andamento', 'concluida'].includes(slot.scheduleStatus)) {
                  return false;
                }
                // Optional granular department scoping (e.g. Mídia -> Transmissão only)
                if (
                  slot.departmentId &&
                  userDepartmentIds.length > 0 &&
                  !userDepartmentIds.includes(slot.departmentId)
                ) {
                  return false;
                }
                return true;
              });
              schedulesByMin.set(mid, filtered);
              const merged = Array.from(schedulesByMin.values())
                .flat()
                .sort((a, b) => a.date.localeCompare(b.date));
              setSchedules(merged);
            },
            (error) => handleFirestoreError(error, OperationType.LIST, `schedules?ministryId=${mid}`)
          )
        );
      });

      // Repertoires ONLY for Louvor ministry members
      if (userMinistryIds.includes('min-louvor')) {
        unsubs.push(
          onSnapshot(
            query(collection(db, 'repertoires'), where('visibility', '==', 'public')),
            (snap) => {
              const list = snap.docs
                .map((d) => ({ ...(d.data() as Omit<CultRepertoire, 'id'>), id: d.id }))
                .sort((a, b) => b.date.localeCompare(a.date));
              setRepertoires(list);
            },
            (error) => handleFirestoreError(error, OperationType.LIST, 'repertoires')
          )
        );
      } else {
        setRepertoires([]);
      }
    } else {
      // Visitor or member without ministry assignment: zero access to schedules/ministries/repertoires
      setMinistries([]);
      setSchedules([]);
      setRepertoires([]);
    }

    // Prayers (LGPD Isolation: public only sees 'comunidade'; Superadmin/Pastoral sees all including confidential)
    const prayersQuery = isSuperAdminOrPastoral
      ? collection(db, 'prayers')
      : query(collection(db, 'prayers'), where('privacy', '==', 'comunidade'));
    unsubs.push(
      onSnapshot(
        prayersQuery,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  authorId: data.authorId,
                  authorName: data.authorName,
                  isVisitor: Boolean(data.isVisitor),
                  category: data.category,
                  message: data.message,
                  privacy: data.privacy,
                  createdAt: timestampToDateStr(data.createdAt),
                  prayingCount: Number(data.prayingCount || 1),
                  status: data.status,
                } as PrayerRequest;
              })
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setPrayers(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'prayers')
      )
    );

    // Authenticated-only collections
    if (authUser) {
      // Personal Sermon Notes (Master Gate subcollection)
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'users', authUser.uid, 'sermonNotes'),
            where('ownerId', '==', authUser.uid)
          ),
          (snap) => {
            const list = snap.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  title: data.title,
                  date: data.date,
                  preacher: data.preacher,
                  scripture: data.scripture,
                  content: data.content,
                } as SermonNote;
              })
              .sort((a, b) => b.date.localeCompare(a.date));
            setSermonNotes(list);
          },
          (error) =>
            handleFirestoreError(error, OperationType.LIST, `users/${authUser.uid}/sermonNotes`)
        )
      );

      // Event Registrations (PII isolated: leaders see all; regular users see only their own)
      const regsQuery = isAdminOrLeader
        ? collection(db, 'eventRegistrations')
        : query(collection(db, 'eventRegistrations'), where('userId', '==', authUser.uid));
      unsubs.push(
        onSnapshot(
          regsQuery,
          (snap) => {
            const list = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                eventId: data.eventId,
                name: data.name,
                phone: data.phone,
                email: data.email,
                notes: data.notes,
                createdAt: timestampToDateStr(data.createdAt),
              } as EventRegistration;
            });
            setRegistrations(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'eventRegistrations')
        )
      );

      // Unavailability (leaders see all; regular users see only their own)
      const unavQuery = isAdminOrLeader
        ? collection(db, 'unavailability')
        : query(collection(db, 'unavailability'), where('userId', '==', authUser.uid));
      unsubs.push(
        onSnapshot(
          unavQuery,
          (snap) => {
            setUnavailability(
              snap.docs.map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  volunteerName: data.volunteerName,
                  ministryId: data.ministryId,
                  ministryName: data.ministryName,
                  date: data.date,
                  reason: data.reason,
                } as UnavailabilityRecord;
              })
            );
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'unavailability')
        )
      );

      // Audit Logs (AdminContentOrHigher only)
      if (isAdminContentOrHigher) {
        unsubs.push(
          onSnapshot(
            collection(db, 'auditLogs'),
            (snap) => {
              const list = snap.docs
                .map((d) => {
                  const data = d.data();
                  return {
                    id: d.id,
                    timestamp: timestampToDateTimePtBR(data.createdAt),
                    actor: data.actor,
                    action: data.action,
                    module: data.module,
                    _ms: data.createdAt?.toMillis?.() || 0,
                  };
                })
                .sort((a, b) => b._ms - a._ms)
                .map(({ _ms: _ignored, ...entry }) => entry as AuditLogEntry);
              setAuditLogs(list);
            },
            (error) => handleFirestoreError(error, OperationType.LIST, 'auditLogs')
          )
        );
      } else {
        setAuditLogs([]);
      }

      // Users list (Superadmin & Pastoral RBAC management only)
      if (isSuperAdminOrPastoral) {
        unsubs.push(
          onSnapshot(
            collection(db, 'users'),
            (snap) => {
              const list = snap.docs
                .map((d) => d.data() as RegisteredUser)
                .sort((a, b) => a.displayName.localeCompare(b.displayName));
              setUsersList(list);
            },
            (error) => handleFirestoreError(error, OperationType.LIST, 'users')
          )
        );
      } else {
        setUsersList([]);
      }
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [
    authReady,
    authUser,
    isEbdManager,
    isAdminOrLeader,
    isAdminContentOrHigher,
    isSuperAdminOrPastoral,
    userMinistryIds,
    userDepartmentIds,
  ]);

  // Derived personal preferences (from Firestore profile if signed in, else local memory)
  const favoriteTrackIds = userProfile?.favoriteTrackIds ?? localFavoriteTrackIds;
  const eventReminders = userProfile?.eventReminders ?? localEventReminders;
  const completedBibleDayIds = userProfile?.completedBibleDays ?? localCompletedBibleDays;
  const readNotificationIds = userProfile?.readNotificationIds ?? localReadNotifIds;
  const notificationPrefs = userProfile?.notificationPrefs ?? localNotifPrefs;

  const biblePlan: BibleReadingDay[] = useMemo(
    () =>
      INITIAL_BIBLE_PLAN.map((d) => ({
        ...d,
        completed: completedBibleDayIds.includes(d.id),
      })),
    [completedBibleDayIds]
  );

  const notifications: AppNotification[] = useMemo(
    () =>
      rawNotifications.map((n) => ({
        ...n,
        read: readNotificationIds.includes(n.id),
      })),
    [rawNotifications, readNotificationIds]
  );

  const currentMemberName = userProfile?.displayName || authUser?.displayName || 'Visitante';

  // Auth actions (delegated to AuthContext)
  const signInWithGoogle = async () => {
    try {
      const signedIn = await loginWithGoogle();
      notify(`Bem-vindo(a), ${signedIn.displayName || signedIn.email}!`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg && !msg.includes('fechada antes da conclusão')) {
        notify(msg, 'warning');
      }
    }
  };

  const signOutUser = async () => {
    try {
      await authLogout();
      setPreviewProfile(null);
      notify('Sessão encerrada com segurança.');
    } catch {
      notify('Erro ao encerrar a sessão.', 'warning');
    }
  };

  const updateUserRole = async (uid: string, role: StoredUserRole) => {
    if (!authUser || !isSuperAdminOrPastoral) {
      notify('Apenas o Superadministrador ou Pastor podem alterar níveis de acesso.', 'warning');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        updatedAt: serverTimestamp(),
      });
      await recordAuditEntry(
        authUser.uid,
        `${currentMemberName} (${realRole})`,
        'Segurança / RBAC',
        `Alterou o perfil de acesso do usuário ${uid} para "${role}".`
      );
      notify(`Nível de acesso atualizado para "${role}".`);
    } catch (error) {
      notify('Não foi possível alterar o perfil de acesso deste usuário.', 'warning');
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const updateUserMinistries = async (
    uid: string,
    ministryIds: string[],
    departmentIds: string[] = []
  ) => {
    if (!authUser || !isSuperAdminOrPastoral) {
      notify('Apenas o Superadministrador ou Pastor podem vincular ministérios aos membros.', 'warning');
      return;
    }
    const safeMinistries = ministryIds.slice(0, 10).map((m) => sanitizeText(m, 128));
    const safeDepartments = departmentIds.slice(0, 10).map((d) => sanitizeText(d, 128));
    try {
      await updateDoc(doc(db, 'users', uid), {
        ministryIds: safeMinistries,
        departmentIds: safeDepartments,
        updatedAt: serverTimestamp(),
      });
      await recordAuditEntry(
        authUser.uid,
        `${currentMemberName} (${realRole})`,
        'Segurança / Ministérios',
        `Atualizou os ministérios permitidos do usuário ${uid} (${safeMinistries.join(', ') || 'nenhum'}).`
      );
      notify('Permissões de ministério atualizadas no banco de dados.');
    } catch (error) {
      notify('Não foi possível atualizar os ministérios deste usuário.', 'warning');
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Helper to update own user preferences safely in Firestore
  const patchOwnUserPrefs = async (patch: Record<string, unknown>) => {
    if (!authUser) return;
    try {
      await updateDoc(doc(db, 'users', authUser.uid), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to sync user preferences:', error);
    }
  };

  const publishBroadcastNotification = async (
    type: AppNotification['type'],
    title: string,
    body: string,
    targetTab: string
  ) => {
    if (!authUser || !isStaff) return;
    const id = makeSafeDocId('not');
    try {
      await setDoc(doc(db, 'notifications', id), {
        type,
        title: sanitizeText(title, 160),
        body: sanitizeText(body, 600),
        date: safeDateIso(),
        targetTab: sanitizeText(targetTab, 40),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to publish notification:', error);
    }
  };

  // =========================================================
  // DOMAIN MUTATIONS (ALL PERSISTED TO FIRESTORE)
  // =========================================================

  const updateChurchInfo: ChurchContextValue['updateChurchInfo'] = (patch) => {
    if (!authUser || !isAdminContentOrHigher) {
      notify('Acesso negado. Faça login com permissão de Administrador.', 'warning');
      return;
    }
    const next: ChurchInstitutionInfo = { ...churchInfo, ...patch };
    setChurchInfo(next);
    void setDoc(doc(db, 'settings', 'churchInfo'), {
      kind: 'churchInfo',
      payload: next,
      updatedBy: authUser.uid,
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Institucional', 'Atualizou dados institucionais da Nova Jerusalém Sampaio.');
        notify('Informações institucionais salvas no banco de dados.');
      })
      .catch((error) => {
        notify('Erro ao salvar dados institucionais.', 'warning');
        handleFirestoreError(error, OperationType.WRITE, 'settings/churchInfo');
      });
  };

  const updateWeeklyInformativo: ChurchContextValue['updateWeeklyInformativo'] = (patch) => {
    if (!authUser || !isAdminContentOrHigher) {
      notify('Acesso negado. Faça login com permissão de Administrador.', 'warning');
      return;
    }
    const next: WeeklyInformativoVideo = {
      ...weeklyInformativo,
      ...patch,
      videoUrl: patch.videoUrl !== undefined ? safeHttpsOrRelativeMediaUrl(patch.videoUrl) : weeklyInformativo.videoUrl,
      posterUrl: patch.posterUrl !== undefined ? safeHttpsOrRelativeMediaUrl(patch.posterUrl) : weeklyInformativo.posterUrl,
    };
    setWeeklyInformativo(next);
    void saveWeeklyInformativoDoc(authUser.uid, next)
      .then(() => {
        void publishBroadcastNotification('evento', 'Novo vídeo do Informativo NJ publicado', next.title, 'agenda');
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Informativo NJ', `Atualizou o vídeo semanal (${next.weekLabel}).`);
        notify('Vídeo semanal do Informativo NJ publicado no banco de dados.');
      })
      .catch(() => {
        notify('Erro ao atualizar Informativo NJ.', 'warning');
      });
  };

  const addBroadcastVideo: ChurchContextValue['addBroadcastVideo'] = async (video) => {
    if (!authUser || !canManageVideos) {
      notify('Acesso negado. Apenas administradores autenticados podem cadastrar vídeos.', 'warning');
      return;
    }
    try {
      await createBroadcastVideoDoc(video);
      await publishBroadcastNotification('transmissao', `Novo vídeo: ${video.title}`, `${video.preacher} · ${video.series}`, 'transmissoes');
      await recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Vídeos / Transmissões', `Publicou vídeo "${video.title}".`);
      notify('Vídeo publicado no banco de dados.');
    } catch {
      notify('Erro ao publicar vídeo no Firestore.', 'warning');
    }
  };

  const deleteBroadcastVideo: ChurchContextValue['deleteBroadcastVideo'] = async (videoId) => {
    if (!authUser || !canManageVideos) {
      notify('Acesso negado. Apenas administradores autenticados podem excluir vídeos.', 'warning');
      return;
    }
    try {
      await deleteBroadcastVideoDoc(videoId);
      await recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Vídeos / Transmissões', `Removeu vídeo ${videoId}.`);
      notify('Vídeo removido com sucesso.');
    } catch {
      notify('Erro ao remover vídeo.', 'warning');
    }
  };

  const addWeeklyService: ChurchContextValue['addWeeklyService'] = (srv) => {
    const nextServices = [...churchInfo.weeklyServices, { ...srv, id: makeSafeDocId('srv') }];
    updateChurchInfo({ weeklyServices: nextServices });
  };

  const deleteWeeklyService = (id: string) => {
    const nextServices = churchInfo.weeklyServices.filter((s) => s.id !== id);
    updateChurchInfo({ weeklyServices: nextServices });
  };

  const registerForEvent: ChurchContextValue['registerForEvent'] = (eventId, data) => {
    const regId = makeSafeDocId('reg');
    const payload = stripUndefined({
      eventId: sanitizeText(eventId, 128),
      userId: authUser ? authUser.uid : 'visitor',
      name: sanitizeText(data.name, 120),
      phone: sanitizeText(data.phone, 40),
      email: sanitizeText(data.email, 160),
      notes: data.notes ? sanitizeText(data.notes, 500) : undefined,
      createdAt: serverTimestamp(),
    });
    void setDoc(doc(db, 'eventRegistrations', regId), payload)
      .then(() => {
        notify('Inscrição confirmada com proteção de dados (LGPD).');
      })
      .catch((error) => {
        notify('Não foi possível registrar sua inscrição. Verifique os dados informados.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `eventRegistrations/${regId}`);
      });
  };

  const toggleEventReminder = (eventId: string) => {
    const exists = eventReminders.includes(eventId);
    const next = exists ? eventReminders.filter((id) => id !== eventId) : [...eventReminders, eventId].slice(0, 100);
    setLocalEventReminders(next);
    void patchOwnUserPrefs({ eventReminders: next });
    notify(exists ? 'Lembrete removido.' : 'Lembrete ativado para este evento.');
  };

  const addEvent: ChurchContextValue['addEvent'] = (event) => {
    if (!authUser || !isAdminOrLeader) {
      notify('Acesso negado. Faça login como Líder ou Administrador.', 'warning');
      return;
    }
    const id = makeSafeDocId('evt');
    const payload = buildEventDocPayload({
      ...event,
      status: 'agendado',
      registeredCount: 0,
    });
    void setDoc(doc(db, 'events', id), payload)
      .then(() => {
        void publishBroadcastNotification(
          'evento',
          `Novo evento: ${event.title}`,
          `${event.date} às ${event.time} · ${event.location}`,
          'agenda'
        );
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Eventos', `Publicou evento: ${event.title}.`);
        notify('Evento publicado no banco de dados.');
      })
      .catch((error) => {
        notify('Erro ao publicar evento.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `events/${id}`);
      });
  };

  const updateEvent: ChurchContextValue['updateEvent'] = (eventId, patch) => {
    if (!authUser || !isAdminOrLeader) {
      notify('Acesso negado. Faça login como Líder ou Administrador.', 'warning');
      return;
    }
    const current = events.find((e) => e.id === eventId);
    if (!current) return;
    const { id: _id, ...merged } = { ...current, ...patch };
    void setDoc(doc(db, 'events', eventId), buildEventDocPayload(merged))
      .then(() => {
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Eventos', `Atualizou arte/detalhes do evento "${merged.title}".`);
        notify('Arte e informações do evento salvas no banco de dados.');
      })
      .catch((error) => {
        notify('Erro ao atualizar o evento.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `events/${eventId}`);
      });
  };

  const updateEventStatus: ChurchContextValue['updateEventStatus'] = (eventId, status, newDate, newTime) => {
    const current = events.find((e) => e.id === eventId);
    if (!current) return;
    updateEvent(eventId, {
      status,
      date: newDate || current.date,
      time: newTime || current.time,
    });
  };

  const addAnnouncement: ChurchContextValue['addAnnouncement'] = (item) => {
    if (!authUser || !isAdminContentOrHigher) {
      notify('Acesso negado. Faça login como Administrador.', 'warning');
      return;
    }
    const id = makeSafeDocId('ann');
    void setDoc(doc(db, 'announcements', id), {
      title: sanitizeText(item.title, 160),
      body: sanitizeText(item.body, 2000),
      date: safeDateIso(item.date),
      department: sanitizeText(item.department, 100),
      priority: item.priority,
      createdAt: serverTimestamp(),
    })
      .then(() => {
        void publishBroadcastNotification('comunicado', item.title, item.body, 'inicio');
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Comunicados', `Publicou comunicado: ${item.title}.`);
        notify('Comunicado publicado no banco de dados.');
      })
      .catch((error) => {
        notify('Erro ao publicar comunicado.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `announcements/${id}`);
      });
  };

  const deleteAnnouncement = (id: string) => {
    if (!authUser || !isAdminContentOrHigher) {
      notify('Acesso negado.', 'warning');
      return;
    }
    void deleteDoc(doc(db, 'announcements', id))
      .then(() => notify('Comunicado removido.'))
      .catch((error) => {
        notify('Erro ao remover comunicado.', 'warning');
        handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
      });
  };

  const publishEbdLesson: ChurchContextValue['publishEbdLesson'] = (lesson) => {
    if (!authUser || !isEbdManager) {
      notify('Acesso negado. Apenas Coordenador da EBD ou Administração podem publicar lições.', 'warning');
      return;
    }
    const id = makeSafeDocId('ebd');
    const batch = writeBatch(db);
    if (lesson.isCurrentWeek) {
      for (const existingLesson of ebdLessons.filter((l) => l.isCurrentWeek)) {
        const { id: exId, ...rest } = existingLesson;
        batch.set(doc(db, 'ebdLessons', exId), buildEbdLessonPayload({ ...rest, isCurrentWeek: false }));
      }
    }
    batch.set(doc(db, 'ebdLessons', id), buildEbdLessonPayload(lesson));
    void batch
      .commit()
      .then(() => {
        if (lesson.status === 'publicada') {
          void publishBroadcastNotification(
            'ebd',
            `Nova lição da EBD: ${lesson.title}`,
            `Lição ${String(lesson.number).padStart(2, '0')} (${lesson.bibleText}) disponível online e em PDF.`,
            'ebd'
          );
        }
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'EBD Digital', `Salvou Lição ${lesson.number}: ${lesson.title}.`);
        notify(lesson.status === 'publicada' ? 'Lição da EBD publicada.' : 'Lição da EBD agendada.');
      })
      .catch((error) => {
        notify('Erro ao salvar lição da EBD.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `ebdLessons/${id}`);
      });
  };

  const setCurrentWeekLesson = (lessonId: string) => {
    if (!authUser || !isEbdManager) {
      notify('Acesso negado.', 'warning');
      return;
    }
    const batch = writeBatch(db);
    for (const l of ebdLessons) {
      if (l.id === lessonId || l.isCurrentWeek) {
        const { id: exId, ...rest } = l;
        batch.set(
          doc(db, 'ebdLessons', exId),
          buildEbdLessonPayload({
            ...rest,
            isCurrentWeek: l.id === lessonId,
            status: l.id === lessonId ? 'publicada' : l.status,
          })
        );
      }
    }
    void batch
      .commit()
      .then(() => notify('Lição da semana atualizada na EBD Digital.'))
      .catch((error) => {
        notify('Erro ao atualizar lição da semana.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `ebdLessons/${lessonId}`);
      });
  };

  const archiveEbdLesson = (lessonId: string) => {
    if (!authUser || !isEbdManager) {
      notify('Acesso negado.', 'warning');
      return;
    }
    const target = ebdLessons.find((l) => l.id === lessonId);
    if (!target) return;
    const { id: _id, ...rest } = target;
    void setDoc(
      doc(db, 'ebdLessons', lessonId),
      buildEbdLessonPayload({ ...rest, status: 'arquivada', isCurrentWeek: false })
    )
      .then(() => notify('Lição arquivada na biblioteca histórica.'))
      .catch((error) => {
        notify('Erro ao arquivar lição.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `ebdLessons/${lessonId}`);
      });
  };

  const addEbdClass: ChurchContextValue['addEbdClass'] = (cls) => {
    if (!authUser || !isEbdManager) {
      notify('Acesso negado.', 'warning');
      return;
    }
    const id = makeSafeDocId('cls');
    void setDoc(doc(db, 'ebdClasses', id), buildEbdClassPayload(cls))
      .then(() => {
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'EBD Digital', `Cadastrou classe da EBD: ${cls.name}.`);
        notify('Nova classe da EBD cadastrada.');
      })
      .catch((error) => {
        notify('Erro ao cadastrar classe da EBD.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `ebdClasses/${id}`);
      });
  };

  const updateEbdClass: ChurchContextValue['updateEbdClass'] = (cls) => {
    if (!authUser || !isEbdManager) {
      notify('Acesso negado.', 'warning');
      return;
    }
    const { id, ...rest } = cls;
    void setDoc(doc(db, 'ebdClasses', id), buildEbdClassPayload(rest))
      .then(() => notify('Classe da EBD atualizada.'))
      .catch((error) => {
        notify('Erro ao atualizar classe da EBD.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `ebdClasses/${id}`);
      });
  };

  const toggleFavoriteTrack = (trackId: string) => {
    const exists = favoriteTrackIds.includes(trackId);
    const next = exists ? favoriteTrackIds.filter((id) => id !== trackId) : [...favoriteTrackIds, trackId].slice(0, 100);
    setLocalFavoriteTrackIds(next);
    void patchOwnUserPrefs({ favoriteTrackIds: next });
  };

  const addAlbumProject: ChurchContextValue['addAlbumProject'] = (project) => {
    if (!authUser || !isSuperAdminOrPastoral) {
      notify('Apenas o Superadministrador ou o Pastor podem modificar o catálogo oficial do Min. Nova Jerusalém.', 'warning');
      return;
    }
    const id = makeSafeDocId('alb');
    void setDoc(doc(db, 'discography', id), buildDiscographyPayload(project))
      .then(() => {
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Min. Nova Jerusalém', `Adicionou projeto musical oficial: ${project.title} (${project.year}).`);
        notify('Projeto adicionado à discografia oficial do Ministério Nova Jerusalém.');
      })
      .catch((error) => {
        notify('Erro ao publicar projeto musical (requer perfil Superadmin/Pastoral).', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `discography/${id}`);
      });
  };

  const createCultRepertoire: ChurchContextValue['createCultRepertoire'] = (data) => {
    const newId = makeSafeDocId('rep');
    if (!authUser || !isAdminOrLeader) {
      notify('Acesso negado. Faça login como Líder de Louvor ou Administração.', 'warning');
      return newId;
    }
    void setDoc(doc(db, 'repertoires', newId), {
      eventTitle: sanitizeText(data.eventTitle, 160),
      date: safeDateIso(data.date),
      time: sanitizeText(data.time, 40),
      ministerName: sanitizeText(data.ministerName, 120),
      musicalNotes: sanitizeText(data.musicalNotes, 1000),
      songs: [],
      visibility: 'public',
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Louvor / Repertório', `Criou repertório para ${data.eventTitle}.`);
        notify(`Repertório criado para ${data.eventTitle}.`);
      })
      .catch((error) => {
        notify('Erro ao criar repertório.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `repertoires/${newId}`);
      });
    return newId;
  };

  const addSongToRepertoire: ChurchContextValue['addSongToRepertoire'] = (repertoireId, song) => {
    if (!authUser || !isAdminOrLeader) {
      notify('Acesso negado. Faça login como Líder de Louvor ou Administração.', 'warning');
      return;
    }
    const targetRep = repertoires.find((r) => r.id === repertoireId);
    if (!targetRep) return;

    const cleanRefUrl = safeExternalUrl(song.referenceUrl);
    const nextSongs: RepertoireSong[] = [
      ...targetRep.songs,
      {
        ...song,
        id: makeSafeDocId('rs'),
        title: sanitizeText(song.title, 140),
        artist: sanitizeText(song.artist, 120),
        album: sanitizeText(song.album, 120),
        key: sanitizeText(song.key, 12),
        bpm: Math.max(40, Math.min(240, Number(song.bpm) || 72)),
        referenceUrl: cleanRefUrl,
        notes: song.notes ? sanitizeText(song.notes, 300) : undefined,
        order: targetRep.songs.length + 1,
      },
    ].slice(0, 30);

    const scaledLouvorMembers = Array.from(
      new Set(
        schedules
          .filter(
            (s) =>
              s.ministryId === 'min-louvor' &&
              (s.date === targetRep.date || s.eventTitle === targetRep.eventTitle)
          )
          .map((s) => s.volunteerName)
      )
    );

    void setDoc(doc(db, 'repertoires', repertoireId), {
      eventTitle: sanitizeText(targetRep.eventTitle, 160),
      date: safeDateIso(targetRep.date),
      time: sanitizeText(targetRep.time, 40),
      ministerName: sanitizeText(targetRep.ministerName, 120),
      musicalNotes: sanitizeText(targetRep.musicalNotes, 1000),
      songs: nextSongs,
      visibility: 'public',
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        void publishBroadcastNotification(
          'escala',
          `Repertório da escala atualizado — ${targetRep.eventTitle}`,
          `"${song.title}" (${song.artist}, Tom ${song.key}) adicionada à escala de ${targetRep.date}. Notificado para ${scaledLouvorMembers.length || 'toda a'} equipe de Louvor.`,
          'ministerios'
        );
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Louvor / Repertório', `Adicionou "${song.title}" ao repertório de ${targetRep.eventTitle}.`);
        notify(
          scaledLouvorMembers.length > 0
            ? `"${song.title}" salva e enviada para ${scaledLouvorMembers.length} integrante(s) escalado(s).`
            : `"${song.title}" adicionada ao repertório do culto.`
        );
      })
      .catch((error) => {
        notify('Erro ao adicionar música ao repertório.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `repertoires/${repertoireId}`);
      });
  };

  const removeSongFromRepertoire = (repertoireId: string, songId: string) => {
    if (!authUser || !isAdminOrLeader) {
      notify('Acesso negado.', 'warning');
      return;
    }
    const targetRep = repertoires.find((r) => r.id === repertoireId);
    if (!targetRep) return;
    const remaining = targetRep.songs
      .filter((s) => s.id !== songId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));

    void setDoc(doc(db, 'repertoires', repertoireId), {
      eventTitle: sanitizeText(targetRep.eventTitle, 160),
      date: safeDateIso(targetRep.date),
      time: sanitizeText(targetRep.time, 40),
      ministerName: sanitizeText(targetRep.ministerName, 120),
      musicalNotes: sanitizeText(targetRep.musicalNotes, 1000),
      songs: remaining,
      visibility: 'public',
      updatedAt: serverTimestamp(),
    })
      .then(() => notify('Música removida do repertório.'))
      .catch((error) => {
        notify('Erro ao remover música.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `repertoires/${repertoireId}`);
      });
  };

  const addMinistryUnit: ChurchContextValue['addMinistryUnit'] = (unit) => {
    if (!authUser || !isSuperAdminOrPastoral) {
      notify('Apenas o Superadministrador ou Pastor podem criar novos ministérios.', 'warning');
      return;
    }
    const slug = unit.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');
    const id = makeSafeDocId('min');
    void setDoc(
      doc(db, 'ministries', id),
      buildMinistryPayload({
        slug,
        name: unit.name,
        leader: unit.leader,
        description: unit.description,
        arrivalTimeNote: unit.arrivalTimeNote || 'Chegada 30 min antes do culto.',
        positions: [
          {
            id: makeSafeDocId('pos'),
            name: 'Voluntário',
            quantity: 2,
            responsibilities: 'Apoio operacional do ministério.',
          },
        ],
        checklist: ['Confirmar escala com antecedência'],
        members: [unit.leader],
        incidents: [],
      })
    )
      .then(() => {
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Ministérios', `Criou ministério: ${unit.name}.`);
        notify(`Ministério "${unit.name}" criado no banco de dados.`);
      })
      .catch((error) => {
        notify('Erro ao criar ministério.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `ministries/${id}`);
      });
  };

  const addMinistryIncident = (ministryId: string, note: string) => {
    if (!authUser || !isAdminOrLeader) {
      notify('Faça login como Líder ou Administração para registrar ocorrências.', 'warning');
      return;
    }
    const target = ministries.find((m) => m.id === ministryId);
    if (!target) return;
    const { id: _id, ...rest } = target;
    const nextIncidents = [
      {
        id: makeSafeDocId('inc'),
        date: safeDateIso(),
        author: currentMemberName,
        note: sanitizeText(note, 400),
      },
      ...target.incidents,
    ].slice(0, 100);
    void setDoc(doc(db, 'ministries', ministryId), buildMinistryPayload({ ...rest, incidents: nextIncidents }))
      .then(() => notify('Ocorrência registrada no histórico do ministério.'))
      .catch((error) => {
        notify('Erro ao registrar ocorrência.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `ministries/${ministryId}`);
      });
  };

  const findScheduleConflict = (
    allSchedules: ScheduleSlot[],
    allUnavailability: UnavailabilityRecord[],
    volunteerName: string,
    date: string,
    time: string,
    ignoreSlotId?: string
  ): string | null => {
    const normalizedName = volunteerName.trim().toLowerCase();
    const unavailable = allUnavailability.find(
      (u) => u.volunteerName.toLowerCase() === normalizedName && u.date === date
    );
    if (unavailable) {
      return `${volunteerName} registrou indisponibilidade em ${date} (${unavailable.reason}).`;
    }
    const existing = allSchedules.find(
      (s) =>
        s.id !== ignoreSlotId &&
        s.volunteerName.toLowerCase() === normalizedName &&
        s.date === date &&
        s.time === time &&
        s.volunteerStatus !== 'recusado' &&
        s.volunteerStatus !== 'substituido' &&
        s.scheduleStatus !== 'cancelada'
    );
    if (existing) {
      return `Conflito detectado: ${volunteerName} já está escalado(a) como "${existing.positionName}" (${existing.departmentName || existing.ministryName}) em ${date} às ${time}.`;
    }
    return null;
  };

  const updateVolunteerStatus: ChurchContextValue['updateVolunteerStatus'] = (slotId, status, swapReason) => {
    if (!authUser) {
      notify('Faça login com sua conta Google para confirmar ou atualizar sua escala.', 'warning');
      return;
    }
    const target = schedules.find((s) => s.id === slotId);
    if (!target) return;
    const patch: Record<string, unknown> = {
      volunteerStatus: status,
      updatedAt: serverTimestamp(),
    };
    if (status === 'substituicao_solicitada' && swapReason) {
      patch.swapReason = sanitizeText(swapReason, 400);
    }
    void updateDoc(doc(db, 'schedules', slotId), patch)
      .then(() => {
        const msg =
          status === 'confirmado'
            ? 'Participação na escala confirmada.'
            : status === 'recusado'
              ? 'Recusa registrada e liderança notificada.'
              : status === 'substituicao_solicitada'
                ? 'Solicitação de substituição enviada ao líder.'
                : 'Status do voluntário atualizado.';
        notify(msg);
      })
      .catch((error) => {
        notify('Você só pode atualizar suas próprias vagas (ou sendo líder de ministério).', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `schedules/${slotId}`);
      });
  };

  const resolveScheduleSwap: ChurchContextValue['resolveScheduleSwap'] = (slotId, newVolunteerName) => {
    if (!authUser || !isAdminOrLeader) {
      notify('Apenas líderes e administradores podem aprovar substituições.', 'warning');
      return { ok: false, error: 'Permissão insuficiente.' };
    }
    const target = schedules.find((s) => s.id === slotId);
    if (!target) return { ok: false, error: 'Escala não encontrada.' };

    const conflict = findScheduleConflict(schedules, unavailability, newVolunteerName, target.date, target.time, slotId);
    if (conflict) {
      notify(conflict, 'warning');
      return { ok: false, error: conflict };
    }

    const { id: _id, ...rest } = target;
    void setDoc(
      doc(db, 'schedules', slotId),
      buildSchedulePayload({
        ...rest,
        volunteerName: newVolunteerName,
        volunteerStatus: 'confirmado',
        swapReason: undefined,
      })
    )
      .then(() => {
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Escalas', `Aprovou substituição na vaga "${target.positionName}" para ${newVolunteerName}.`);
        notify(`Substituição concluída: ${newVolunteerName} confirmado(a).`);
      })
      .catch((error) => {
        notify('Erro ao aprovar substituição.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `schedules/${slotId}`);
      });

    return { ok: true };
  };

  const addScheduleSlot: ChurchContextValue['addScheduleSlot'] = (item) => {
    if (!authUser || !isAdminOrLeader) {
      notify('Acesso negado. Faça login como Líder de Ministério ou Administração.', 'warning');
      return { ok: false, error: 'Permissão insuficiente.' };
    }
    const conflict = findScheduleConflict(schedules, unavailability, item.volunteerName, item.date, item.time);
    if (conflict) {
      notify(conflict, 'warning');
      return { ok: false, error: conflict };
    }
    const id = makeSafeDocId('sch');
    void setDoc(doc(db, 'schedules', id), buildSchedulePayload({ ...item, volunteerStatus: 'aguardando' }))
      .then(() => {
        void publishBroadcastNotification(
          'escala',
          `Nova escala publicada: ${item.departmentName || item.ministryName}`,
          `${item.volunteerName} escalado(a) como ${item.positionName} em ${item.date} (${item.time}).`,
          'ministerios'
        );
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Escalas', `Escalou ${item.volunteerName} para ${item.positionName} em ${item.date}.`);
        notify('Escala salva no banco de dados sem conflitos.');
      })
      .catch((error) => {
        notify('Erro ao salvar escala.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `schedules/${id}`);
      });
    return { ok: true };
  };

  const deleteScheduleSlot: ChurchContextValue['deleteScheduleSlot'] = async (slotId) => {
    if (!authUser || !canManageSchedules) {
      notify('Acesso negado. Apenas líderes ou administradores autenticados podem excluir escalas.', 'warning');
      return;
    }
    try {
      await deleteScheduleSlotDoc(slotId);
      await recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Escalas', `Excluiu vaga de escala (${slotId}).`);
      notify('Vaga removida da escala.');
    } catch {
      notify('Não foi possível remover esta vaga da escala.', 'warning');
    }
  };

  const duplicateEventSchedules: ChurchContextValue['duplicateEventSchedules'] = (
    fromEventTitle,
    toEventTitle,
    newDate,
    newTime
  ) => {
    if (!authUser || !isAdminOrLeader) {
      notify('Acesso negado.', 'warning');
      return;
    }
    const sourceSlots = schedules.filter((s) => s.eventTitle === fromEventTitle);
    if (sourceSlots.length === 0) {
      notify('Nenhuma escala encontrada para duplicar.', 'warning');
      return;
    }
    const batch = writeBatch(db);
    sourceSlots.forEach((s, idx) => {
      const { id: _oldId, ...rest } = s;
      const newId = makeSafeDocId(`schdup${idx}`);
      batch.set(
        doc(db, 'schedules', newId),
        buildSchedulePayload({
          ...rest,
          eventTitle: toEventTitle,
          date: newDate,
          time: newTime,
          scheduleStatus: 'rascunho',
          volunteerStatus: 'aguardando',
          swapReason: undefined,
        })
      );
    });
    void batch
      .commit()
      .then(() => {
        void recordAuditEntry(authUser.uid, `${currentMemberName} (${realRole})`, 'Escalas', `Duplicou ${sourceSlots.length} vagas de "${fromEventTitle}" para "${toEventTitle}".`);
        notify(`${sourceSlots.length} vagas duplicadas em modo rascunho para ${newDate}.`);
      })
      .catch((error) => {
        notify('Erro ao duplicar escalas.', 'warning');
        handleFirestoreError(error, OperationType.WRITE, 'schedules/duplicate');
      });
  };

  const addUnavailability: ChurchContextValue['addUnavailability'] = (record) => {
    if (!authUser) {
      notify('Faça login com sua conta Google para registrar indisponibilidade.', 'warning');
      return;
    }
    const id = makeSafeDocId('unav');
    void setDoc(doc(db, 'unavailability', id), {
      userId: authUser.uid,
      volunteerName: sanitizeText(record.volunteerName || currentMemberName, 120),
      ministryId: sanitizeText(record.ministryId, 128),
      ministryName: sanitizeText(record.ministryName, 120),
      date: safeDateIso(record.date),
      reason: sanitizeText(record.reason, 400),
      createdAt: serverTimestamp(),
    })
      .then(() => notify('Data bloqueada como indisponível para a liderança.'))
      .catch((error) => {
        notify('Erro ao registrar indisponibilidade.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `unavailability/${id}`);
      });
  };

  const submitPrayer: ChurchContextValue['submitPrayer'] = (data) => {
    const id = makeSafeDocId('pry');
    const isVisitorFlag = !authUser ? true : Boolean(data.isVisitor);
    const cleanAuthor =
      data.privacy === 'equipe_anonimo'
        ? 'Anônimo'
        : sanitizeText(data.authorName || (isVisitorFlag ? 'Visitante' : currentMemberName), 120);
    const cleanMessage = sanitizeText(data.message, 1500);
    if (cleanMessage.length < 3) {
      notify('Escreva seu pedido de oração com pelo menos 3 caracteres.', 'warning');
      return;
    }

    void setDoc(doc(db, 'prayers', id), {
      authorId: authUser ? authUser.uid : 'visitor',
      authorName: cleanAuthor,
      isVisitor: isVisitorFlag,
      category: sanitizeText(data.category, 80),
      message: cleanMessage,
      privacy: data.privacy,
      prayingCount: 1,
      status: 'recebido',
      createdAt: serverTimestamp(),
    })
      .then(() => {
        notify('Pedido de oração enviado com carinho e proteção de privacidade (LGPD).');
      })
      .catch((error) => {
        notify('Não foi possível enviar o pedido de oração.', 'warning');
        handleFirestoreError(error, OperationType.CREATE, `prayers/${id}`);
      });
  };

  const incrementPraying = (prayerId: string) => {
    if (!authUser) {
      notify('Faça login com Google para registrar sua intercessão neste pedido.', 'warning');
      return;
    }
    const target = prayers.find((p) => p.id === prayerId);
    if (!target) return;
    void updateDoc(doc(db, 'prayers', prayerId), {
      prayingCount: target.prayingCount + 1,
    })
      .then(() => notify('Obrigado por interceder por este pedido.'))
      .catch((error) => {
        notify('Não foi possível registrar intercessão neste pedido.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `prayers/${prayerId}`);
      });
  };

  const updatePrayerStatus = (prayerId: string, status: PrayerRequest['status']) => {
    if (!authUser || !isSuperAdminOrPastoral) {
      notify('Apenas a equipe pastoral ou superadministrador podem alterar o status dos pedidos.', 'warning');
      return;
    }
    void updateDoc(doc(db, 'prayers', prayerId), { status })
      .then(() => notify('Status do pedido de oração atualizado.'))
      .catch((error) => {
        notify('Não foi possível atualizar o status do pedido.', 'warning');
        handleFirestoreError(error, OperationType.UPDATE, `prayers/${prayerId}`);
      });
  };

  const toggleBibleDay = (dayId: string) => {
    const exists = completedBibleDayIds.includes(dayId);
    const next = exists
      ? completedBibleDayIds.filter((id) => id !== dayId)
      : [...completedBibleDayIds, dayId].slice(0, 60);
    setLocalCompletedBibleDays(next);
    void patchOwnUserPrefs({ completedBibleDays: next });
  };

  const saveSermonNote: ChurchContextValue['saveSermonNote'] = (note, existingId) => {
    if (!authUser) {
      notify('Faça login com sua conta Google para salvar suas anotações pessoais na nuvem.', 'warning');
      return;
    }
    const id = existingId || makeSafeDocId('note');
    const ref = doc(db, 'users', authUser.uid, 'sermonNotes', id);
    const payload = {
      ownerId: authUser.uid,
      title: sanitizeText(note.title, 160),
      date: safeDateIso(note.date),
      preacher: sanitizeText(note.preacher, 120),
      scripture: sanitizeText(note.scripture, 160),
      content: sanitizeText(note.content, 10000),
      updatedAt: serverTimestamp(),
    };
    const op = existingId
      ? updateDoc(ref, {
          title: payload.title,
          date: payload.date,
          preacher: payload.preacher,
          scripture: payload.scripture,
          content: payload.content,
          updatedAt: serverTimestamp(),
        })
      : setDoc(ref, { ...payload, createdAt: serverTimestamp() });

    void op
      .then(() => notify('Anotação de sermão salva com privacidade na sua conta.'))
      .catch((error) => {
        notify('Erro ao salvar anotação.', 'warning');
        handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, `users/${authUser.uid}/sermonNotes/${id}`);
      });
  };

  const deleteSermonNote = (id: string) => {
    if (!authUser) {
      notify('Faça login para gerenciar suas anotações.', 'warning');
      return;
    }
    void deleteDoc(doc(db, 'users', authUser.uid, 'sermonNotes', id))
      .then(() => notify('Anotação removida.'))
      .catch((error) => {
        notify('Erro ao remover anotação.', 'warning');
        handleFirestoreError(error, OperationType.DELETE, `users/${authUser.uid}/sermonNotes/${id}`);
      });
  };

  const markNotificationRead = (id: string) => {
    if (readNotificationIds.includes(id)) return;
    const next = [...readNotificationIds, id].slice(-200);
    setLocalReadNotifIds(next);
    void patchOwnUserPrefs({ readNotificationIds: next });
  };

  const markAllNotificationsRead = () => {
    const next = Array.from(new Set([...readNotificationIds, ...rawNotifications.map((n) => n.id)])).slice(-200);
    setLocalReadNotifIds(next);
    void patchOwnUserPrefs({ readNotificationIds: next });
    notify('Todas as notificações marcadas como lidas.');
  };

  const toggleNotificationPref = (key: keyof NotificationPreferences) => {
    const next = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setLocalNotifPrefs(next);
    void patchOwnUserPrefs({ notificationPrefs: next });
  };

  const resetDemoData = () => {
    if (!authUser || !isSuperAdminOrPastoral) {
      notify('Apenas o Superadministrador pode restaurar os dados iniciais no banco.', 'warning');
      return;
    }
    void seedInitialChurchDataIfEmpty(authUser.uid)
      .then((seeded) => {
        notify(
          seeded
            ? 'Dados iniciais restaurados no Firestore.'
            : 'Os dados oficiais já estão sincronizados no Firestore.'
        );
      })
      .catch((error) => {
        notify('Erro ao sincronizar dados iniciais.', 'warning');
        console.error(error);
      });
  };

  return (
    <ChurchContext.Provider
      value={{
        authUser,
        authReady,
        authLoading,
        userProfile,
        realRole,
        accessProfile,
        setAccessProfile,
        signInWithGoogle,
        signOutUser,
        usersList,
        updateUserRole,
        updateUserMinistries,
        userMinistryIds,
        userDepartmentIds,
        hasScheduleAccess,
        canManageSchedules,
        canManageVideos,
        dataLoading,
        dataError,
        dbSynced,
        currentMemberName,
        theme,
        toggleTheme,
        toast,
        notify,
        dismissToast,
        churchInfo,
        weeklyInformativo,
        institutionalAreas,
        events,
        registrations,
        announcements,
        ebdLessons,
        ebdClasses,
        discography,
        favoriteTrackIds,
        ministries,
        schedules,
        repertoires,
        unavailability,
        prayers,
        videos,
        devotionals,
        biblePlan,
        sermonNotes,
        eventReminders,
        notifications,
        notificationPrefs,
        auditLogs,
        updateChurchInfo,
        updateWeeklyInformativo,
        addBroadcastVideo,
        deleteBroadcastVideo,
        addWeeklyService,
        deleteWeeklyService,
        registerForEvent,
        toggleEventReminder,
        addEvent,
        updateEvent,
        updateEventStatus,
        addAnnouncement,
        deleteAnnouncement,
        publishEbdLesson,
        setCurrentWeekLesson,
        archiveEbdLesson,
        addEbdClass,
        updateEbdClass,
        toggleFavoriteTrack,
        addAlbumProject,
        createCultRepertoire,
        addSongToRepertoire,
        removeSongFromRepertoire,
        addMinistryUnit,
        addMinistryIncident,
        updateVolunteerStatus,
        resolveScheduleSwap,
        addScheduleSlot,
        deleteScheduleSlot,
        duplicateEventSchedules,
        addUnavailability,
        submitPrayer,
        incrementPraying,
        updatePrayerStatus,
        toggleBibleDay,
        saveSermonNote,
        deleteSermonNote,
        markNotificationRead,
        markAllNotificationsRead,
        toggleNotificationPref,
        resetDemoData,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
};

export function useChurch() {
  const ctx = useContext(ChurchContext);
  if (!ctx) throw new Error('useChurch must be used inside ChurchProvider');
  return ctx;
}
