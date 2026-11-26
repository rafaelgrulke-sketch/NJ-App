export type EnvironmentMode = 'site' | 'app' | 'admin';

export type ThemeMode = 'dark' | 'light';

export type AccessProfile =
  | 'visitante'
  | 'membro'
  | 'voluntario'
  | 'lider_ministerio'
  | 'coord_ebd'
  | 'admin_conteudo'
  | 'pastoral'
  | 'superadmin';

export type StoredUserRole = Exclude<AccessProfile, 'visitante'>;

export interface RegisteredUser {
  uid: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  role: StoredUserRole;
  ministryIds?: string[];
  favoriteTrackIds?: string[];
  eventReminders?: string[];
  completedBibleDays?: string[];
  readNotificationIds?: string[];
  notificationPrefs?: {
    escala: boolean;
    ebd: boolean;
    evento: boolean;
    musica: boolean;
    comunicado: boolean;
    transmissao: boolean;
  };
}

export interface WeeklyService {
  id: string;
  day: string;
  title: string;
  time: string;
  location: string;
  notes?: string;
}

export interface ChurchInstitutionInfo {
  officialName: string;
  displayName: string;
  foundedDate: string;
  foundingPastor: string;
  presidentPastor: string;
  presidencyStart: string;
  address: string;
  neighborhood: string;
  cityState: string;
  cep: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  websiteUrl: string;
  instagramUrl: string;
  instagramHandle: string;
  youtubeUrl: string;
  youtubeChannelId: string;
  facebookHandle: string;
  mission: string;
  vision: string;
  values: string[];
  history: string;
  pixKey: string;
  pixKeyType: string;
  bankName: string;
  agency: string;
  account: string;
  cnpjNote: string;
  weeklyServices: WeeklyService[];
}

export interface InstitutionalArea {
  id: string;
  name: string;
  subtitle: string;
  leader: string;
  schedule: string;
  description: string;
  contact: string;
}

export type EventCategory = 'culto' | 'congresso' | 'conferencia' | 'encontro' | 'especial';
export type EventStatus = 'agendado' | 'reagendado' | 'cancelado';

export interface EventRegistration {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  createdAt: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  description: string;
  guidelines: string;
  featured?: boolean;
  status: EventStatus;
  requiresRegistration: boolean;
  registrationDeadline?: string;
  capacity?: number;
  registeredCount: number;
  artworkUrl?: string;
  badgeLabel?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  department: string;
  priority: 'normal' | 'importante';
}

export interface EbdSection {
  heading: string;
  content: string;
}

export interface EbdLesson {
  id: string;
  number: number;
  title: string;
  theme: string;
  quarter: string;
  year: number;
  date: string;
  bibleText: string;
  goldenVerse: string;
  author: string;
  summary: string;
  sections: EbdSection[];
  reflectionQuestions: string[];
  practicalApplication: string;
  pdfFileName: string;
  status: 'publicada' | 'agendada' | 'arquivada';
  isCurrentWeek?: boolean;
}

export interface EbdClass {
  id: string;
  name: string;
  teacher: string;
  room: string;
  floor: string;
  schedule: string;
  ageGroup: string;
  notes: string;
}

export type ReleaseType = 'album' | 'single' | 'ep';

export type InformativoMediaType = 'server_video' | 'external_video' | 'youtube';

export interface WeeklyInformativoVideo {
  title: string;
  weekLabel: string;
  publishedDate: string;
  mediaType: InformativoMediaType;
  videoUrl?: string;
  posterUrl?: string;
  youtubeId: string;
  summary: string;
  highlights: string[];
}

export interface DiscographyProject {
  id: string;
  title: string;
  year: number;
  type: ReleaseType;
  isRecent?: boolean;
  coverImageUrl?: string;
  artworkStyle?: number;
  spotifyUrl: string;
  spotifyEmbedUrl?: string;
  appleMusicUrl: string;
  amazonMusicUrl: string;
  youtubeUrl: string;
  tracks: {
    id: string;
    title: string;
    duration: string;
    key: string;
    bpm: number;
    youtubeVideoId?: string;
    spotifyTrackEmbedUrl?: string;
    lyrics: string;
    chords: string;
  }[];
}

export interface MinistryPositionSpec {
  id: string;
  name: string;
  quantity: number;
  responsibilities: string;
}

export interface MinistryDepartment {
  id: string;
  name: string;
  description: string;
  arrivalMinutesBefore: number;
  positions: MinistryPositionSpec[];
  checklist: string[];
  members: string[];
}

export interface MinistryUnit {
  id: string;
  slug: string;
  name: string;
  leader: string;
  description: string;
  arrivalTimeNote: string;
  positions: MinistryPositionSpec[];
  departments?: MinistryDepartment[];
  checklist: string[];
  members: string[];
  incidents: { id: string; date: string; author: string; note: string }[];
  rehearsals?: { id: string; date: string; time: string; focus: string }[];
}

export type ScheduleStatus = 'rascunho' | 'publicada' | 'em_andamento' | 'concluida' | 'cancelada';

export type VolunteerStatus =
  | 'aguardando'
  | 'confirmado'
  | 'recusado'
  | 'substituicao_solicitada'
  | 'substituido'
  | 'presente'
  | 'ausente';

export interface RepertoireSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  origin: 'min_nj' | 'outro_louvor';
  key: string;
  bpm: number;
  order: number;
  referenceUrl?: string;
  notes?: string;
}

export interface ScheduleSlot {
  id: string;
  ministryId: string;
  ministryName: string;
  departmentId?: string;
  departmentName?: string;
  eventId?: string;
  eventTitle: string;
  date: string;
  time: string;
  scheduleStatus: ScheduleStatus;
  positionName: string;
  volunteerName: string;
  volunteerUid?: string;
  volunteerStatus: VolunteerStatus;
  swapReason?: string;
  notes?: string;
}

export interface CultRepertoire {
  id: string;
  eventTitle: string;
  date: string;
  time: string;
  ministerName: string;
  musicalNotes: string;
  songs: RepertoireSong[];
}

export interface UnavailabilityRecord {
  id: string;
  volunteerName: string;
  ministryId: string;
  ministryName: string;
  date: string;
  reason: string;
}

export type PrayerPrivacy = 'comunidade' | 'equipe_identificado' | 'equipe_anonimo';

export interface PrayerRequest {
  id: string;
  authorId?: string;
  authorName: string;
  isVisitor?: boolean;
  category: string;
  message: string;
  privacy: PrayerPrivacy;
  createdAt: string;
  prayingCount: number;
  status: 'recebido' | 'em_oracao' | 'atendido';
}

export interface BroadcastVideo {
  id: string;
  title: string;
  preacher: string;
  series: string;
  date: string;
  duration: string;
  youtubeId: string;
  isLive?: boolean;
  description: string;
}

export interface DevotionalItem {
  id: string;
  date: string;
  title: string;
  reference: string;
  excerpt: string;
  fullText: string;
  prayer: string;
}

export interface BibleReadingDay {
  id: string;
  dayNumber: number;
  title: string;
  passages: string;
  completed: boolean;
}

export interface SermonNote {
  id: string;
  title: string;
  date: string;
  preacher: string;
  scripture: string;
  content: string;
}

export interface AppNotification {
  id: string;
  type: 'escala' | 'ebd' | 'evento' | 'musica' | 'comunicado' | 'transmissao';
  title: string;
  body: string;
  date: string;
  read: boolean;
  targetTab: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  module: string;
}
