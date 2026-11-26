import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CHURCH_INFO,
  INITIAL_DEVOTIONALS,
  INITIAL_DISCOGRAPHY,
  INITIAL_EBD_CLASSES,
  INITIAL_EBD_LESSONS,
  INITIAL_EVENTS,
  INITIAL_INSTITUTIONAL_AREAS,
  INITIAL_MINISTRIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRAYERS,
  INITIAL_REPERTOIRES,
  INITIAL_SCHEDULES,
  INITIAL_VIDEOS,
  INITIAL_WEEKLY_INFORMATIVO,
} from '../data/initialData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  BroadcastVideo,
  ChurchEvent,
  DiscographyProject,
  EbdClass,
  EbdLesson,
  MinistryUnit,
  ScheduleSlot,
  WeeklyInformativoVideo,
} from '../types/church';
import {
  makeSafeDocId,
  safeDateIso,
  safeHttpsOrRelativeMediaUrl,
  safeYoutubeId,
  sanitizeText,
} from '../utils/security';

export function timestampToDateStr(value: unknown, fallback?: string): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }
  return fallback || new Date().toISOString().slice(0, 10);
}

export function timestampToDateTimePtBR(value: unknown): string {
  const date = value instanceof Timestamp ? value.toDate() : new Date();
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

export function buildEventDocPayload(ev: Omit<ChurchEvent, 'id'>) {
  return stripUndefined({
    title: sanitizeText(ev.title, 140),
    category: ev.category,
    date: safeDateIso(ev.date),
    time: sanitizeText(ev.time, 40),
    location: sanitizeText(ev.location, 160),
    description: sanitizeText(ev.description, 2000),
    guidelines: sanitizeText(ev.guidelines || '', 1000),
    featured: Boolean(ev.featured),
    status: ev.status,
    requiresRegistration: Boolean(ev.requiresRegistration),
    registrationDeadline: ev.registrationDeadline ? safeDateIso(ev.registrationDeadline) : undefined,
    capacity: typeof ev.capacity === 'number' ? Math.max(0, Math.min(50000, ev.capacity)) : undefined,
    registeredCount: Math.max(0, Math.min(50000, ev.registeredCount || 0)),
    artworkUrl: safeHttpsOrRelativeMediaUrl(ev.artworkUrl),
    badgeLabel: sanitizeText(ev.badgeLabel || 'EVENTOS', 40),
    updatedAt: serverTimestamp(),
  });
}

export function buildEbdLessonPayload(lesson: Omit<EbdLesson, 'id'>) {
  return stripUndefined({
    number: Math.max(1, Math.min(999, Number(lesson.number) || 1)),
    title: sanitizeText(lesson.title, 180),
    theme: sanitizeText(lesson.theme, 160),
    quarter: sanitizeText(lesson.quarter, 60),
    year: Math.max(2000, Math.min(2100, Number(lesson.year) || new Date().getFullYear())),
    date: safeDateIso(lesson.date),
    bibleText: sanitizeText(lesson.bibleText, 160),
    goldenVerse: sanitizeText(lesson.goldenVerse, 500),
    author: sanitizeText(lesson.author, 120),
    summary: sanitizeText(lesson.summary, 1200),
    sections: (lesson.sections || []).slice(0, 20),
    reflectionQuestions: (lesson.reflectionQuestions || []).slice(0, 20).map((q) => sanitizeText(q, 240)),
    practicalApplication: sanitizeText(lesson.practicalApplication, 1200),
    pdfFileName: sanitizeText(lesson.pdfFileName, 180),
    status: lesson.status,
    isCurrentWeek: Boolean(lesson.isCurrentWeek),
    updatedAt: serverTimestamp(),
  });
}

export function buildEbdClassPayload(cls: Omit<EbdClass, 'id'>) {
  return {
    name: sanitizeText(cls.name, 120),
    teacher: sanitizeText(cls.teacher, 120),
    room: sanitizeText(cls.room, 80),
    floor: sanitizeText(cls.floor, 80),
    schedule: sanitizeText(cls.schedule, 80),
    ageGroup: sanitizeText(cls.ageGroup, 80),
    notes: sanitizeText(cls.notes, 500),
    visibility: 'public',
    updatedAt: serverTimestamp(),
  };
}

export function buildDiscographyPayload(proj: Omit<DiscographyProject, 'id'>) {
  return stripUndefined({
    title: sanitizeText(proj.title, 140),
    year: Math.max(1980, Math.min(2100, Number(proj.year) || new Date().getFullYear())),
    type: proj.type,
    isRecent: Boolean(proj.isRecent),
    coverImageUrl: safeHttpsOrRelativeMediaUrl(proj.coverImageUrl),
    artworkStyle: typeof proj.artworkStyle === 'number' ? Math.max(0, Math.min(20, proj.artworkStyle)) : 0,
    spotifyUrl: safeHttpsOrRelativeMediaUrl(proj.spotifyUrl),
    spotifyEmbedUrl: safeHttpsOrRelativeMediaUrl(proj.spotifyEmbedUrl),
    appleMusicUrl: safeHttpsOrRelativeMediaUrl(proj.appleMusicUrl),
    amazonMusicUrl: safeHttpsOrRelativeMediaUrl(proj.amazonMusicUrl),
    youtubeUrl: safeHttpsOrRelativeMediaUrl(proj.youtubeUrl),
    tracks: (proj.tracks || []).slice(0, 40),
    updatedAt: serverTimestamp(),
  });
}

export function buildMinistryPayload(min: Omit<MinistryUnit, 'id'>) {
  return stripUndefined({
    slug: sanitizeText(min.slug, 80).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'ministerio',
    name: sanitizeText(min.name, 120),
    leader: sanitizeText(min.leader, 120),
    description: sanitizeText(min.description, 1200),
    arrivalTimeNote: sanitizeText(min.arrivalTimeNote, 240),
    positions: (min.positions || []).slice(0, 40),
    departments: min.departments ? min.departments.slice(0, 20) : undefined,
    checklist: (min.checklist || []).slice(0, 40).map((c) => sanitizeText(c, 240)),
    members: (min.members || []).slice(0, 100).map((m) => sanitizeText(m, 120)),
    incidents: (min.incidents || []).slice(0, 100),
    rehearsals: min.rehearsals ? min.rehearsals.slice(0, 40) : undefined,
    visibility: 'public',
    updatedAt: serverTimestamp(),
  });
}

export function buildSchedulePayload(slot: Omit<ScheduleSlot, 'id'>) {
  return stripUndefined({
    ministryId: sanitizeText(slot.ministryId, 128),
    ministryName: sanitizeText(slot.ministryName, 120),
    departmentId: slot.departmentId ? sanitizeText(slot.departmentId, 128) : undefined,
    departmentName: slot.departmentName ? sanitizeText(slot.departmentName, 120) : undefined,
    eventId: slot.eventId ? sanitizeText(slot.eventId, 128) : undefined,
    eventTitle: sanitizeText(slot.eventTitle, 160),
    date: safeDateIso(slot.date),
    time: sanitizeText(slot.time, 40),
    scheduleStatus: slot.scheduleStatus,
    positionName: sanitizeText(slot.positionName, 120),
    volunteerName: sanitizeText(slot.volunteerName, 120),
    volunteerUid: slot.volunteerUid ? sanitizeText(slot.volunteerUid, 128) : undefined,
    volunteerStatus: slot.volunteerStatus,
    swapReason: slot.swapReason ? sanitizeText(slot.swapReason, 400) : undefined,
    notes: slot.notes ? sanitizeText(slot.notes, 500) : undefined,
    updatedAt: serverTimestamp(),
  });
}

export function buildBroadcastVideoPayload(video: Omit<BroadcastVideo, 'id'>) {
  const ytId = safeYoutubeId(video.youtubeId) || 'dQw4w9WgXcQ';
  return stripUndefined({
    title: sanitizeText(video.title, 160),
    preacher: sanitizeText(video.preacher, 120),
    series: sanitizeText(video.series, 120),
    date: safeDateIso(video.date),
    duration: sanitizeText(video.duration, 40),
    youtubeId: ytId,
    isLive: Boolean(video.isLive),
    description: sanitizeText(video.description, 1000),
    visibility: 'public',
    updatedAt: serverTimestamp(),
  });
}

// =========================================================
// MODULAR CRUD & REAL-TIME SERVICES (Schedules & Videos)
// =========================================================

export async function getSchedulesByMinistry(ministryId: string): Promise<ScheduleSlot[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'schedules'), where('ministryId', '==', sanitizeText(ministryId, 128)))
    );
    return snap.docs
      .map((d) => ({ ...(d.data() as Omit<ScheduleSlot, 'id'>), id: d.id }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `schedules?ministryId=${ministryId}`);
  }
}

export async function createScheduleSlotDoc(slot: Omit<ScheduleSlot, 'id'>): Promise<string> {
  const id = makeSafeDocId('sch');
  try {
    await setDoc(doc(db, 'schedules', id), buildSchedulePayload(slot));
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `schedules/${id}`);
  }
}

export async function updateScheduleSlotDoc(
  slotId: string,
  patch: Record<string, unknown>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'schedules', slotId), {
      ...stripUndefined(patch),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `schedules/${slotId}`);
  }
}

export async function deleteScheduleSlotDoc(slotId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'schedules', slotId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `schedules/${slotId}`);
  }
}

export function subscribeToMinistrySchedules(
  ministryId: string,
  onData: (slots: ScheduleSlot[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, 'schedules'), where('ministryId', '==', ministryId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ ...(d.data() as Omit<ScheduleSlot, 'id'>), id: d.id }))
        .sort((a, b) => a.date.localeCompare(b.date));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, `schedules?ministryId=${ministryId}`);
    }
  );
}

export async function getBroadcastVideos(): Promise<BroadcastVideo[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'videos'), where('visibility', '==', 'public'))
    );
    return snap.docs
      .map((d) => ({ ...(d.data() as Omit<BroadcastVideo, 'id'>), id: d.id }))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'videos');
  }
}

export async function createBroadcastVideoDoc(video: Omit<BroadcastVideo, 'id'>): Promise<string> {
  const id = makeSafeDocId('vid');
  try {
    await setDoc(doc(db, 'videos', id), buildBroadcastVideoPayload(video));
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `videos/${id}`);
  }
}

export async function updateBroadcastVideoDoc(
  videoId: string,
  video: Omit<BroadcastVideo, 'id'>
): Promise<void> {
  try {
    await setDoc(doc(db, 'videos', videoId), buildBroadcastVideoPayload(video));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `videos/${videoId}`);
  }
}

export async function deleteBroadcastVideoDoc(videoId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'videos', videoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `videos/${videoId}`);
  }
}

export function subscribeToBroadcastVideos(
  onData: (videos: BroadcastVideo[]) => void,
  onError?: (err: unknown) => void
): () => void {
  return onSnapshot(
    query(collection(db, 'videos'), where('visibility', '==', 'public')),
    (snap) => {
      const list = snap.docs
        .map((d) => ({ ...(d.data() as Omit<BroadcastVideo, 'id'>), id: d.id }))
        .sort((a, b) => b.date.localeCompare(a.date));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, 'videos');
    }
  );
}

export async function saveWeeklyInformativoDoc(
  uid: string,
  payload: WeeklyInformativoVideo
): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'weeklyInformativo'), {
      kind: 'weeklyInformativo',
      payload,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/weeklyInformativo');
  }
}

/**
 * One-time initial Firestore seed executed ONLY when a verified Superadmin logs in
 * and settings/churchInfo does not yet exist in Firestore.
 */
export async function seedInitialChurchDataIfEmpty(uid: string): Promise<boolean> {
  const markerRef = doc(db, 'settings', 'churchInfo');
  try {
    const snap = await getDoc(markerRef);
    if (snap.exists()) return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/churchInfo');
  }

  try {
    const batch = writeBatch(db);

    batch.set(doc(db, 'settings', 'churchInfo'), {
      kind: 'churchInfo',
      payload: INITIAL_CHURCH_INFO,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'settings', 'weeklyInformativo'), {
      kind: 'weeklyInformativo',
      payload: INITIAL_WEEKLY_INFORMATIVO,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'settings', 'institutionalAreas'), {
      kind: 'institutionalAreas',
      payload: { items: INITIAL_INSTITUTIONAL_AREAS },
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'settings', 'devotionals'), {
      kind: 'devotionals',
      payload: { items: INITIAL_DEVOTIONALS },
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });

    for (const ev of INITIAL_EVENTS) {
      const { id, ...rest } = ev;
      batch.set(doc(db, 'events', id), buildEventDocPayload(rest));
    }

    for (const ann of INITIAL_ANNOUNCEMENTS) {
      const { id, ...rest } = ann;
      batch.set(doc(db, 'announcements', id), {
        title: sanitizeText(rest.title, 160),
        body: sanitizeText(rest.body, 2000),
        date: safeDateIso(rest.date),
        department: sanitizeText(rest.department, 100),
        priority: rest.priority,
        createdAt: serverTimestamp(),
      });
    }

    for (const lesson of INITIAL_EBD_LESSONS) {
      const { id, ...rest } = lesson;
      batch.set(doc(db, 'ebdLessons', id), buildEbdLessonPayload(rest));
    }

    for (const cls of INITIAL_EBD_CLASSES) {
      const { id, ...rest } = cls;
      batch.set(doc(db, 'ebdClasses', id), buildEbdClassPayload(rest));
    }

    for (const proj of INITIAL_DISCOGRAPHY) {
      const { id, ...rest } = proj;
      batch.set(doc(db, 'discography', id), buildDiscographyPayload(rest));
    }

    for (const min of INITIAL_MINISTRIES) {
      const { id, ...rest } = min;
      batch.set(doc(db, 'ministries', id), buildMinistryPayload(rest));
    }

    for (const slot of INITIAL_SCHEDULES) {
      const { id, ...rest } = slot;
      batch.set(doc(db, 'schedules', id), buildSchedulePayload(rest));
    }

    for (const rep of INITIAL_REPERTOIRES) {
      const { id, ...rest } = rep;
      batch.set(doc(db, 'repertoires', id), {
        eventTitle: sanitizeText(rest.eventTitle, 160),
        date: safeDateIso(rest.date),
        time: sanitizeText(rest.time, 40),
        ministerName: sanitizeText(rest.ministerName, 120),
        musicalNotes: sanitizeText(rest.musicalNotes, 1000),
        songs: rest.songs.slice(0, 30),
        visibility: 'public',
        updatedAt: serverTimestamp(),
      });
    }

    for (const vid of INITIAL_VIDEOS) {
      const { id, ...rest } = vid;
      batch.set(doc(db, 'videos', id), buildBroadcastVideoPayload(rest));
    }

    for (const notif of INITIAL_NOTIFICATIONS) {
      const { id, ...rest } = notif;
      batch.set(doc(db, 'notifications', id), {
        type: rest.type,
        title: sanitizeText(rest.title, 160),
        body: sanitizeText(rest.body, 600),
        date: safeDateIso(rest.date),
        targetTab: sanitizeText(rest.targetTab, 40),
        createdAt: serverTimestamp(),
      });
    }

    for (const pry of INITIAL_PRAYERS) {
      const { id, ...rest } = pry;
      batch.set(doc(db, 'prayers', id), {
        authorId: uid,
        authorName: sanitizeText(rest.authorName, 120),
        isVisitor: Boolean(rest.isVisitor),
        category: sanitizeText(rest.category, 80),
        message: sanitizeText(rest.message, 1500),
        privacy: rest.privacy,
        prayingCount: 1,
        status: 'recebido',
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'initial-seed-batch');
  }
}

export async function recordAuditEntry(
  uid: string,
  actorLabel: string,
  moduleName: string,
  action: string
) {
  const id = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await setDoc(doc(db, 'auditLogs', id), {
      actorUid: uid,
      actor: sanitizeText(actorLabel, 120),
      module: sanitizeText(moduleName, 80),
      action: sanitizeText(action, 400),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}
