import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Building2,
  Calendar,
  Check,
  Copy,
  HandHeart,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Megaphone,
  Music,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChurch } from '../context/ChurchContext';
import {
  AccessProfile,
  EnvironmentMode,
  EventCategory,
  InformativoMediaType,
  ReleaseType,
  StoredUserRole,
} from '../types/church';
import { formatDatePtBR, volunteerStatusLabel } from '../utils/formatters';
import { extractYoutubeId, isSafeMediaUrl } from '../utils/mediaUpload';
import { BrandLogoMark } from './EditorialArt';
import { ThemeToggleButton } from './PWAInstallButton';
import { MediaUploadDropzone } from './ui/DesignPrimitives';
import { EventArtCard } from './ui/EventArtCard';

type AdminTab =
  | 'visao'
  | 'institucional'
  | 'ministerios'
  | 'eventos'
  | 'ebd'
  | 'musica'
  | 'comunicados'
  | 'oracao'
  | 'equipe'
  | 'auditoria';

const PROFILE_LABELS: Record<AccessProfile, string> = {
  superadmin: 'Superadministrador (Acesso Total + Min. NJ)',
  pastoral: 'Pastor / Liderança Geral (Acesso Total + Min. NJ)',
  admin_conteudo: 'Administrador de Conteúdo (Eventos, EBD, Avisos)',
  coord_ebd: 'Coordenador da EBD',
  lider_ministerio: 'Líder de Ministério (Escalas e Repertório de Culto)',
  voluntario: 'Voluntário (Consulta)',
  membro: 'Membro (Restrito)',
  visitante: 'Visitante (Somente Leitura)',
};

const PROFILE_PERMISSIONS: Record<AccessProfile, AdminTab[]> = {
  superadmin: ['visao', 'institucional', 'ministerios', 'eventos', 'ebd', 'musica', 'comunicados', 'oracao', 'equipe', 'auditoria'],
  pastoral: ['visao', 'institucional', 'ministerios', 'eventos', 'ebd', 'musica', 'comunicados', 'oracao', 'equipe', 'auditoria'],
  admin_conteudo: ['visao', 'institucional', 'eventos', 'comunicados', 'auditoria'],
  coord_ebd: ['visao', 'ebd'],
  lider_ministerio: ['visao', 'ministerios', 'eventos'],
  voluntario: ['visao', 'ministerios'],
  membro: ['visao'],
  visitante: ['visao'],
};

export const AdminPanel: React.FC<{
  onSwitchEnvironment: (mode: EnvironmentMode, tab?: string) => void;
}> = ({ onSwitchEnvironment }) => {
  const {
    loginWithEmail,
    resendVerificationEmail,
    authError,
    clearAuthError,
  } = useAuth();

  const {
    churchInfo,
    weeklyInformativo,
    videos,
    events,
    registrations,
    announcements,
    ebdLessons,
    ebdClasses,
    discography,
    ministries,
    schedules,
    repertoires,
    prayers,
    auditLogs,
    authUser,
    authReady,
    authLoading,
    dataLoading,
    dataError,
    realRole,
    accessProfile,
    setAccessProfile,
    canManageSchedules,
    canManageVideos,
    signInWithGoogle,
    signOutUser,
    usersList,
    updateUserRole,
    updateUserMinistries,
    updateChurchInfo,
    updateWeeklyInformativo,
    addBroadcastVideo,
    deleteBroadcastVideo,
    addWeeklyService,
    deleteWeeklyService,
    addEvent,
    updateEvent,
    updateEventStatus,
    addAnnouncement,
    deleteAnnouncement,
    publishEbdLesson,
    setCurrentWeekLesson,
    archiveEbdLesson,
    addEbdClass,
    addAlbumProject,
    addSongToRepertoire,
    removeSongFromRepertoire,
    addMinistryUnit,
    addScheduleSlot,
    deleteScheduleSlot,
    resolveScheduleSwap,
    duplicateEventSchedules,
    updatePrayerStatus,
    resetDemoData,
  } = useChurch();

  const [activeTab, setActiveTab] = useState<AdminTab>('visao');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [newVideoForm, setNewVideoForm] = useState({
    title: '',
    youtubeUrl: '',
    preacher: 'Pr. Maurício Souza',
    series: 'Culto de Celebração',
    date: new Date().toISOString().slice(0, 10),
    duration: '01:20:00',
    description: '',
  });

  // Institutional form state
  const [instForm, setInstForm] = useState({
    officialName: churchInfo.officialName,
    displayName: churchInfo.displayName,
    presidentPastor: churchInfo.presidentPastor,
    address: churchInfo.address,
    phonePrimary: churchInfo.phonePrimary,
    phoneSecondary: churchInfo.phoneSecondary,
    email: churchInfo.email,
    pixKey: churchInfo.pixKey,
    history: churchInfo.history,
  });
  const [newService, setNewService] = useState({
    day: 'Quarta-feira',
    title: '',
    time: '19h30',
    location: 'Templo Principal',
  });

  // Schedule creation state
  const [schMinistryId, setSchMinistryId] = useState(ministries[0]?.id || 'min-midia');
  const [schDeptId, setSchDeptId] = useState('dep-transmissao');
  const [schEventTitle, setSchEventTitle] = useState(events[0]?.title || 'Nossa Celebração');
  const [schDate, setSchDate] = useState(events[0]?.date || '2026-11-29');
  const [schTime, setSchTime] = useState('19h00');
  const [schPosition, setSchPosition] = useState('Operador de corte');
  const [schVolunteer, setSchVolunteer] = useState('');
  const [schConflictError, setSchConflictError] = useState<string | null>(null);
  const [swapReplacement, setSwapReplacement] = useState<Record<string, string>>({});

  // Duplicate schedule state
  const [dupFromTitle, setDupFromTitle] = useState(schedules[0]?.eventTitle || 'Nossa Celebração');
  const [dupToTitle, setDupToTitle] = useState('Nossa Celebração (Próximo Domingo)');
  const [dupDate, setDupDate] = useState('2026-12-06');
  const [dupTime, setDupTime] = useState('19h00');

  // New Ministry form
  const [newMin, setNewMin] = useState({ name: '', leader: '', description: '', arrivalTimeNote: 'Chegada 30 min antes do culto.' });

  // New Event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'especial' as EventCategory,
    badgeLabel: 'EVENTOS',
    artworkUrl: '',
    date: '2026-12-13',
    time: '19h00',
    location: 'Templo Principal',
    description: '',
    guidelines: 'Entrada aberta a membros e visitantes.',
    requiresRegistration: false,
    capacity: 120,
  });
  const [editingArtEventId, setEditingArtEventId] = useState<string | null>(null);

  // EBD Lesson & Class forms
  const [newLesson, setNewLesson] = useState({
    number: ebdLessons.length + 1,
    title: '',
    theme: 'Discipulado e Renovação',
    quarter: '4º Trimestre 2026',
    bibleText: '',
    goldenVerse: '',
    author: 'Equipe de Ensino NJ',
    summary: '',
    status: 'publicada' as 'publicada' | 'agendada',
    isCurrentWeek: true,
  });
  const [newClass, setNewClass] = useState({
    name: '',
    teacher: '',
    room: '',
    floor: '2º Andar',
    schedule: 'Domingos · 09h às 10h',
    ageGroup: '',
    notes: '',
  });

  // Discography form (exclusivo Superadmin / Pastor)
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    year: 2026,
    type: 'single' as ReleaseType,
    trackTitle: '',
    key: 'G',
    bpm: 72,
    coverImageUrl: '',
    spotifyUrl: '',
  });

  // Weekly Informativo NJ video editor (Server Upload MP4/WebM + External URL + YouTube)
  const [infoForm, setInfoForm] = useState({
    title: weeklyInformativo.title,
    weekLabel: weeklyInformativo.weekLabel,
    mediaType: (weeklyInformativo.mediaType || 'server_video') as InformativoMediaType,
    videoUrl: weeklyInformativo.videoUrl || '',
    youtubeId: weeklyInformativo.youtubeId,
    summary: weeklyInformativo.summary,
  });

  // Louvor repertoire builder inside Ministérios & Escalas
  const [repId, setRepId] = useState(repertoires[0]?.id || 'rep-1');
  const [repOrigin, setRepOrigin] = useState<'outro_louvor' | 'min_nj'>('outro_louvor');
  const [repSongTitle, setRepSongTitle] = useState('');
  const [repSongArtist, setRepSongArtist] = useState('');
  const [repSongKey, setRepSongKey] = useState('G');
  const [repSongBpm, setRepSongBpm] = useState(72);
  const [repSongRef, setRepSongRef] = useState('');
  const [repSongNotes, setRepSongNotes] = useState('');

  // Announcement form
  const [newAnn, setNewAnn] = useState({
    title: '',
    department: 'Secretaria da Igreja',
    priority: 'normal' as 'normal' | 'importante',
    body: '',
  });

  const allowedTabs = PROFILE_PERMISSIONS[accessProfile];
  const isReadOnlyProfile = accessProfile === 'voluntario' || accessProfile === 'membro' || accessProfile === 'visitante';

  useEffect(() => {
    if (ministries.length > 0 && !ministries.some((m) => m.id === schMinistryId)) {
      const first = ministries[0];
      setSchMinistryId(first.id);
      if (first.departments?.length) {
        setSchDeptId(first.departments[0].id);
        setSchPosition(first.departments[0].positions[0]?.name || '');
      } else {
        setSchPosition(first.positions[0]?.name || '');
      }
    }
  }, [ministries, schMinistryId]);

  useEffect(() => {
    if (repertoires.length > 0 && !repertoires.some((r) => r.id === repId)) {
      setRepId(repertoires[0].id);
    }
  }, [repertoires, repId]);

  const selectedMinistryObj = useMemo(
    () => ministries.find((m) => m.id === schMinistryId) || ministries[0],
    [ministries, schMinistryId]
  );

  const availablePositions = useMemo(() => {
    if (!selectedMinistryObj) return [];
    if (selectedMinistryObj.departments?.length) {
      const dep =
        selectedMinistryObj.departments.find((d) => d.id === schDeptId) ||
        selectedMinistryObj.departments[0];
      return dep ? dep.positions : [];
    }
    return selectedMinistryObj.positions;
  }, [selectedMinistryObj, schDeptId]);

  const swapRequests = schedules.filter((s) => s.volunteerStatus === 'substituicao_solicitada');

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'visao', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'institucional', label: 'Institucional & Horários', icon: Building2 },
    { id: 'ministerios', label: 'Ministérios & Escalas', icon: Users },
    { id: 'eventos', label: 'Eventos & Inscritos', icon: Calendar },
    { id: 'ebd', label: 'EBD Digital & Classes', icon: BookOpen },
    { id: 'musica', label: 'Min. Nova Jerusalém', icon: Music },
    { id: 'comunicados', label: 'Comunicados', icon: Megaphone },
    { id: 'oracao', label: 'Pedidos de Oração (LGPD)', icon: HandHeart },
    { id: 'equipe', label: 'Equipe & Permissões (RBAC)', icon: ShieldCheck },
    { id: 'auditoria', label: 'Histórico (Auditoria)', icon: History },
  ];

  const handleProfileChange = (nextProfile: AccessProfile) => {
    setAccessProfile(nextProfile);
    if (!PROFILE_PERMISSIONS[nextProfile].includes(activeTab)) {
      setActiveTab('visao');
    }
  };

  const handleSaveInst = (e: React.FormEvent) => {
    e.preventDefault();
    updateChurchInfo(instForm);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.title.trim()) return;
    addWeeklyService(newService);
    setNewService({ day: 'Quarta-feira', title: '', time: '19h30', location: 'Templo Principal' });
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setSchConflictError(null);
    if (!selectedMinistryObj || !schVolunteer.trim()) return;
    const dep = selectedMinistryObj.departments?.find((d) => d.id === schDeptId);
    const result = addScheduleSlot({
      ministryId: selectedMinistryObj.id,
      ministryName: selectedMinistryObj.name,
      departmentId: dep?.id,
      departmentName: dep?.name,
      eventTitle: schEventTitle,
      date: schDate,
      time: schTime,
      scheduleStatus: 'publicada',
      positionName: schPosition || availablePositions[0]?.name || 'Voluntário',
      volunteerName: schVolunteer.trim(),
    });
    if (!result.ok && result.error) {
      setSchConflictError(result.error);
    } else {
      setSchVolunteer('');
    }
  };

  const handleCreateMinistry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMin.name.trim() || !newMin.leader.trim()) return;
    addMinistryUnit(newMin);
    setNewMin({ name: '', leader: '', description: '', arrivalTimeNote: 'Chegada 30 min antes do culto.' });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    addEvent({
      title: newEvent.title.trim(),
      category: newEvent.category,
      badgeLabel: newEvent.badgeLabel.trim() || 'EVENTOS',
      artworkUrl: newEvent.artworkUrl.trim() || undefined,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      description: newEvent.description || 'Programação oficial da Nova Jerusalém Sampaio.',
      guidelines: newEvent.guidelines,
      requiresRegistration: newEvent.requiresRegistration,
      capacity: newEvent.requiresRegistration ? Number(newEvent.capacity) || 100 : undefined,
      featured: true,
    });
    setNewEvent({
      title: '',
      category: 'especial',
      badgeLabel: 'EVENTOS',
      artworkUrl: '',
      date: '2026-12-13',
      time: '19h00',
      location: 'Templo Principal',
      description: '',
      guidelines: 'Entrada aberta a membros e visitantes.',
      requiresRegistration: false,
      capacity: 120,
    });
  };

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.title.trim()) return;
    publishEbdLesson({
      number: Number(newLesson.number) || ebdLessons.length + 1,
      title: newLesson.title.trim(),
      theme: newLesson.theme,
      quarter: newLesson.quarter,
      year: 2026,
      date: new Date().toISOString().slice(0, 10),
      bibleText: newLesson.bibleText || 'Texto a definir',
      goldenVerse: newLesson.goldenVerse || 'A tua palavra é lâmpada para os meus pés (Sl 119.105).',
      author: newLesson.author,
      summary: newLesson.summary || 'Estudo bíblico preparado para as classes da EBD da Nova Jerusalém Sampaio.',
      sections: [
        {
          heading: '1. Fundamento Bíblico',
          content: newLesson.summary || 'Conteúdo principal da lição para leitura online e acompanhamento em sala.',
        },
      ],
      reflectionQuestions: ['Como aplicar o ensino desta lição em sua casa e ministério esta semana?'],
      practicalApplication: 'Reserve um tempo diário de leitura bíblica e oração em família.',
      pdfFileName: `NJ_EBD_Licao_${String(newLesson.number).padStart(2, '0')}.pdf`,
      status: newLesson.status,
      isCurrentWeek: newLesson.status === 'publicada' ? newLesson.isCurrentWeek : false,
    });
    setNewLesson((prev) => ({ ...prev, number: prev.number + 1, title: '', bibleText: '', goldenVerse: '', summary: '' }));
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name.trim()) return;
    addEbdClass(newClass);
    setNewClass({
      name: '',
      teacher: '',
      room: '',
      floor: '2º Andar',
      schedule: 'Domingos · 09h às 10h',
      ageGroup: '',
      notes: '',
    });
  };

  const handleCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbum.title.trim()) return;
    const rawSpotify = newAlbum.spotifyUrl.trim();
    const embedFromUrl = rawSpotify.includes('open.spotify.com/')
      ? rawSpotify.replace('open.spotify.com/', 'open.spotify.com/embed/')
      : 'https://open.spotify.com/embed/artist/6vWwQj78h7U0T2V1a182mX?utm_source=generator';
    addAlbumProject({
      title: newAlbum.title.trim(),
      year: Number(newAlbum.year) || 2026,
      type: newAlbum.type,
      isRecent: true,
      coverImageUrl: newAlbum.coverImageUrl.trim() || undefined,
      spotifyUrl: rawSpotify || 'https://open.spotify.com/artist/6vWwQj78h7U0T2V1a182mX',
      spotifyEmbedUrl: embedFromUrl,
      appleMusicUrl: 'https://music.apple.com/br/artist/635009226',
      amazonMusicUrl: 'https://music.amazon.com/artists/B01GED9GYW',
      youtubeUrl: 'https://www.youtube.com/@MinisterioNovaJerusalem',
      tracks: [
        {
          id: `trk-${Date.now()}`,
          title: newAlbum.trackTitle.trim() || newAlbum.title.trim(),
          duration: '05:10',
          key: newAlbum.key || 'G',
          bpm: Number(newAlbum.bpm) || 72,
          spotifyTrackEmbedUrl: embedFromUrl,
          lyrics: 'Letra cadastrada via Painel Administrativo do Min. Nova Jerusalém.',
          chords: `${newAlbum.key || 'G'}  D/F#  Em7  C9`,
        },
      ],
    });
    setNewAlbum({ title: '', year: 2026, type: 'single', trackTitle: '', key: 'G', bpm: 72, coverImageUrl: '', spotifyUrl: '' });
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title.trim() || !newAnn.body.trim()) return;
    addAnnouncement({
      title: newAnn.title.trim(),
      department: newAnn.department,
      priority: newAnn.priority,
      body: newAnn.body.trim(),
      date: new Date().toISOString().slice(0, 10),
    });
    setNewAnn({ title: '', department: 'Secretaria da Igreja', priority: 'normal', body: '' });
  };

  // Security Gate: Require real Firebase Authentication before accessing Admin Panel
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--nj-canvas)] text-[var(--nj-ink)]">
        <p className="text-sm text-[var(--nj-ink-muted)]">Verificando autenticação e permissões...</p>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--nj-canvas)] px-4 py-10 text-[var(--nj-ink)]">
        <div className="nj-card w-full max-w-md space-y-5 p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--nj-accent-soft)] text-[var(--nj-accent-text)]">
              <Lock className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mt-4 text-xs font-semibold tracking-widest uppercase text-[var(--nj-accent-text)]">
              Acesso Restrito · Segurança RBAC
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
              Painel Administrativo
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-[var(--nj-ink-muted)]">
              Entre com seu e-mail e senha de administrador ou com sua conta Google autorizada pela igreja para gerenciar programação, escalas e vídeos.
            </p>
          </div>

          {authError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{authError}</span>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              clearAuthError();
              await loginWithEmail(loginEmail, loginPassword);
            }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="admin-gate-email" className="block text-xs font-medium text-[var(--nj-ink-muted)]">
                E-mail
              </label>
              <input
                id="admin-gate-email"
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="lideranca@igrejabatistanj.com.br"
                className="nj-input mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="admin-gate-password" className="block text-xs font-medium text-[var(--nj-ink-muted)]">
                Senha
              </label>
              <input
                id="admin-gate-password"
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Sua senha administrativa"
                className="nj-input mt-1 w-full rounded-lg px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="nj-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {authLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogIn className="h-4 w-4" aria-hidden="true" />
              )}
              {authLoading ? 'Autenticando...' : 'Entrar com E-mail e Senha'}
            </button>
          </form>

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-[var(--nj-border)]" />
            <span className="mx-3 text-[11px] text-[var(--nj-ink-subtle)]">ou</span>
            <div className="flex-grow border-t border-[var(--nj-border)]" />
          </div>

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={authLoading}
            className="nj-btn-secondary inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Entrar com Google
          </button>

          <div className="flex items-center justify-center gap-4 pt-2 text-xs">
            <button
              type="button"
              onClick={() => onSwitchEnvironment('site')}
              className="text-[var(--nj-ink-muted)] hover:text-[var(--nj-ink)] hover:underline"
            >
              Voltar ao Site Oficial
            </button>
            <span className="text-[var(--nj-border)]">·</span>
            <button
              type="button"
              onClick={() => onSwitchEnvironment('app', 'inicio')}
              className="text-[var(--nj-accent-text)] hover:underline"
            >
              Abrir NJ App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--nj-canvas)] text-[var(--nj-ink)]">
      {/* Strict 3-Zone Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--nj-border)] bg-[var(--nj-header-bg)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 shrink-0">
            <BrandLogoMark size="sm" />
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold whitespace-nowrap text-[var(--nj-ink)]">
                Painel Administrativo
              </p>
              <p className="text-[11px] whitespace-nowrap text-[var(--nj-ink-subtle)]">
                {churchInfo.displayName}
              </p>
            </div>
          </div>

          <nav aria-label="Atalhos administrativos" className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={() => onSwitchEnvironment('site')}
              className="text-sm font-medium whitespace-nowrap text-[var(--nj-ink-muted)] hover:text-[var(--nj-ink)]"
            >
              Site Oficial
            </button>
            <button
              type="button"
              onClick={() => onSwitchEnvironment('app', 'ministerios')}
              className="text-sm font-medium whitespace-nowrap text-[var(--nj-ink-muted)] hover:text-[var(--nj-ink)]"
            >
              Ver Escalas no App
            </button>
          </nav>

          <button
            type="button"
            onClick={() => onSwitchEnvironment('app', 'inicio')}
            className="nj-btn-primary rounded-md px-4 py-2 text-xs whitespace-nowrap shrink-0"
          >
            Abrir NJ App
          </button>
        </div>
      </header>

      {/* Toolbar: Authenticated Identity + Server-Enforced RBAC + Theme + Sign Out */}
      <div className="border-b border-[var(--nj-border)] bg-[var(--nj-surface-alt)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-md border border-[var(--nj-border)] bg-[var(--nj-surface)] px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--nj-accent-text)]" aria-hidden="true" />
              <span className="font-semibold text-[var(--nj-ink)]">{authUser.email}</span>
              <span className="text-[var(--nj-ink-subtle)]">·</span>
              <span className="font-medium text-[var(--nj-accent-text)]">
                {PROFILE_LABELS[realRole]}
              </span>
            </div>

            {(realRole === 'superadmin' || realRole === 'pastoral') && (
              <div className="flex items-center gap-2">
                <label htmlFor="admin-profile-select" className="font-medium text-[var(--nj-ink-muted)]">
                  Visualizar como:
                </label>
                <select
                  id="admin-profile-select"
                  value={accessProfile}
                  onChange={(e) => handleProfileChange(e.target.value as AccessProfile)}
                  className="nj-input rounded-md px-3 py-1.5 text-xs"
                >
                  {(Object.keys(PROFILE_LABELS) as AccessProfile[]).map((p) => (
                    <option key={p} value={p}>
                      {PROFILE_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggleButton />
            {(realRole === 'superadmin' || realRole === 'pastoral') && (
              <button
                type="button"
                onClick={resetDemoData}
                className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Sincronizar base inicial
              </button>
            )}
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
          <nav aria-label="Módulos administrativos" className="nj-card p-2">
            <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {navItems
                .filter((item) => allowedTabs.includes(item.id))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition ${
                          isActive
                            ? 'nj-tab-active'
                            : 'text-[var(--nj-ink-muted)] hover:bg-[#466053]/15 hover:text-[var(--nj-ink)]'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 space-y-6">
          {dataLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface)] px-4 py-2.5 text-xs text-[var(--nj-ink-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--nj-accent-text)]" aria-hidden="true" />
              Sincronizando dados em tempo real com o Firebase Firestore...
            </div>
          )}

          {dataError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{dataError}</span>
            </div>
          )}

          {authUser && !authUser.emailVerified && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-[var(--nj-ink)]">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Verifique seu e-mail para liberar gravações administrativas</p>
                  <p className="mt-0.5 text-[var(--nj-ink-muted)]">
                    As regras de segurança do Firebase exigem e-mail verificado para criar, editar ou excluir escalas e vídeos.
                  </p>
                  {verificationNotice && (
                    <p className="mt-1 font-medium text-[var(--nj-accent-text)]">{verificationNotice}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await resendVerificationEmail();
                    setVerificationNotice('E-mail de verificação enviado! Confirme e recarregue a página.');
                  } catch (err) {
                    setVerificationNotice(
                      err instanceof Error ? err.message : 'Não foi possível enviar o e-mail de verificação.'
                    );
                  }
                }}
                className="nj-btn-secondary shrink-0 rounded-md px-3 py-1.5 text-xs font-medium"
              >
                Reenviar verificação
              </button>
            </div>
          )}

          {isReadOnlyProfile && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-[var(--nj-ink)]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              <p>
                O perfil <strong>{PROFILE_LABELS[accessProfile]}</strong> possui acesso restrito no Painel Administrativo. Somente contas autorizadas (Superadministrador, Pastoral, Coordenador da EBD ou Líder de Ministério) podem editar módulos.
              </p>
            </div>
          )}

          {/* 1. VISÃO GERAL */}
          {activeTab === 'visao' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  Sincronização em Tempo Real · Site + NJ App
                </p>
                <h1 className="mt-1 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                  Visão Geral da Gestão
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: 'Ministérios ativos', value: ministries.length },
                  { label: 'Vagas escaladas', value: schedules.length },
                  { label: 'Trocas pendentes', value: swapRequests.length },
                  { label: 'Inscritos em eventos', value: registrations.length },
                  { label: 'Lições EBD Digital', value: ebdLessons.length },
                  { label: 'Classes da EBD', value: ebdClasses.length },
                  { label: 'Discografia Min. NJ', value: discography.length },
                  { label: 'Registros de auditoria', value: auditLogs.length },
                ].map((kpi) => (
                  <div key={kpi.label} className="nj-card p-5">
                    <p className="text-xs text-[var(--nj-ink-subtle)]">{kpi.label}</p>
                    <p className="mt-1 font-serif text-3xl font-semibold text-[var(--nj-ink)] tabular-nums">
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. INSTITUCIONAL & PROGRAMAÇÃO SEMANAL */}
          {activeTab === 'institucional' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                Dados Institucionais e Programação Semanal
              </h1>

              <form onSubmit={handleSaveInst} className="nj-card space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Nome oficial</label>
                    <input
                      type="text"
                      value={instForm.officialName}
                      onChange={(e) => setInstForm({ ...instForm, officialName: e.target.value })}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Nome de exibição</label>
                    <input
                      type="text"
                      value={instForm.displayName}
                      onChange={(e) => setInstForm({ ...instForm, displayName: e.target.value })}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Pastor Presidente</label>
                    <input
                      type="text"
                      value={instForm.presidentPastor}
                      onChange={(e) => setInstForm({ ...instForm, presidentPastor: e.target.value })}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Endereço</label>
                    <input
                      type="text"
                      value={instForm.address}
                      onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Telefone principal</label>
                    <input
                      type="text"
                      value={instForm.phonePrimary}
                      onChange={(e) => setInstForm({ ...instForm, phonePrimary: e.target.value })}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Telefone secundário</label>
                    <input
                      type="text"
                      value={instForm.phoneSecondary}
                      onChange={(e) => setInstForm({ ...instForm, phoneSecondary: e.target.value })}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">E-mail institucional</label>
                    <input
                      type="email"
                      value={instForm.email}
                      onChange={(e) => setInstForm({ ...instForm, email: e.target.value })}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Chave Pix oficial</label>
                    <input
                      type="text"
                      value={instForm.pixKey}
                      onChange={(e) => setInstForm({ ...instForm, pixKey: e.target.value })}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">História institucional</label>
                  <textarea
                    rows={3}
                    value={instForm.history}
                    onChange={(e) => setInstForm({ ...instForm, history: e.target.value })}
                    className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                  Salvar alterações institucionais
                </button>
              </form>

              <section className="nj-card space-y-4 p-6">
                <h2 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">Programação Semanal Recorrente</h2>
                <ul className="divide-y divide-[var(--nj-border)]">
                  {churchInfo.weeklyServices.map((srv) => (
                    <li key={srv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-[var(--nj-ink)]">
                          {srv.title} · <span className="text-[var(--nj-accent-text)]">{srv.day} ({srv.time})</span>
                        </p>
                        <p className="text-xs text-[var(--nj-ink-subtle)]">{srv.location}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteWeeklyService(srv.id)}
                        className="rounded-md p-1.5 text-[var(--nj-ink-subtle)] hover:text-amber-500"
                        aria-label={`Remover ${srv.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleAddService} className="grid grid-cols-1 gap-3 border-t border-[var(--nj-border)] pt-4 sm:grid-cols-4">
                  <input
                    type="text"
                    placeholder="Dia (ex.: Quarta-feira)"
                    value={newService.day}
                    onChange={(e) => setNewService({ ...newService, day: e.target.value })}
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nome do culto *"
                    value={newService.title}
                    onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Horário (ex.: 19h30)"
                    value={newService.time}
                    onChange={(e) => setNewService({ ...newService, time: e.target.value })}
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <button type="submit" className="nj-btn-primary rounded-md px-3 py-2 text-xs">
                    Adicionar horário
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* 3. MINISTÉRIOS & ESCALAS (CONFLITO + DUPLICAÇÃO + NOVO MINISTÉRIO) */}
          {activeTab === 'ministerios' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                Gestão de Ministérios e Motor de Escalas
              </h1>

              {/* Create Schedule Slot with Conflict Validation */}
              <form onSubmit={handleCreateSchedule} className="nj-card space-y-4 p-6">
                <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                  Escalar voluntário (com detecção automática de conflitos e indisponibilidades)
                </h2>

                {schConflictError && (
                  <div className="flex items-start gap-2.5 rounded-md border border-amber-500/50 bg-amber-500/15 p-3.5 text-xs text-[var(--nj-ink)]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                    <span>{schConflictError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-xs text-[var(--nj-ink-muted)]">Ministério</label>
                    <select
                      value={schMinistryId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setSchMinistryId(nextId);
                        const found = ministries.find((m) => m.id === nextId);
                        if (found?.departments?.length) {
                          setSchDeptId(found.departments[0].id);
                          setSchPosition(found.departments[0].positions[0]?.name || '');
                        } else {
                          setSchPosition(found?.positions[0]?.name || '');
                        }
                      }}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-xs"
                    >
                      {ministries.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMinistryObj?.departments?.length ? (
                    <div>
                      <label className="block text-xs text-[var(--nj-ink-muted)]">Área interna (Mídia)</label>
                      <select
                        value={schDeptId}
                        onChange={(e) => {
                          setSchDeptId(e.target.value);
                          const dep = selectedMinistryObj.departments?.find((d) => d.id === e.target.value);
                          if (dep?.positions[0]) setSchPosition(dep.positions[0].name);
                        }}
                        className="nj-input mt-1 w-full rounded-md px-3 py-2 text-xs"
                      >
                        {selectedMinistryObj.departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-xs text-[var(--nj-ink-muted)]">Função / Vaga</label>
                    <select
                      value={schPosition}
                      onChange={(e) => setSchPosition(e.target.value)}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-xs"
                    >
                      {availablePositions.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--nj-ink-muted)]">Culto / Evento</label>
                    <input
                      type="text"
                      value={schEventTitle}
                      onChange={(e) => setSchEventTitle(e.target.value)}
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[var(--nj-ink-muted)]">Data</label>
                      <input
                        type="date"
                        value={schDate}
                        onChange={(e) => setSchDate(e.target.value)}
                        className="nj-input mt-1 w-full rounded-md px-2 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--nj-ink-muted)]">Horário</label>
                      <input
                        type="text"
                        value={schTime}
                        onChange={(e) => setSchTime(e.target.value)}
                        className="nj-input mt-1 w-full rounded-md px-2 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--nj-ink-muted)]">Nome do voluntário *</label>
                    <input
                      type="text"
                      required
                      value={schVolunteer}
                      onChange={(e) => setSchVolunteer(e.target.value)}
                      placeholder="Ex.: Rafael Santos"
                      className="nj-input mt-1 w-full rounded-md px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <button type="submit" className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Salvar vaga na escala
                </button>
              </form>

              {/* Pending Swaps */}
              {swapRequests.length > 0 && (
                <section className="nj-card space-y-3 p-6">
                  <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                    Solicitações de substituição pendentes ({swapRequests.length})
                  </h2>
                  {swapRequests.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[var(--nj-ink)]">
                          {slot.volunteerName} · {slot.positionName} ({slot.departmentName || slot.ministryName})
                        </p>
                        <p className="text-[var(--nj-ink-muted)]">
                          {slot.eventTitle} · {formatDatePtBR(slot.date)} ({slot.time})
                        </p>
                        {slot.swapReason && <p className="mt-1 text-[var(--nj-accent-text)]">Motivo: {slot.swapReason}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={swapReplacement[slot.id] || ''}
                          onChange={(e) =>
                            setSwapReplacement({ ...swapReplacement, [slot.id]: e.target.value })
                          }
                          placeholder="Novo voluntário..."
                          className="nj-input rounded-md px-3 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const rep = swapReplacement[slot.id]?.trim();
                            if (!rep) return;
                            const res = resolveScheduleSwap(slot.id, rep);
                            if (res.ok) {
                              setSwapReplacement({ ...swapReplacement, [slot.id]: '' });
                            }
                          }}
                          className="nj-btn-primary inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Aprovar troca
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Duplicate Schedules + Create Dynamic Ministry */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="nj-card space-y-3 p-6">
                  <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">Duplicar escala de culto</h2>
                  <p className="text-xs text-[var(--nj-ink-muted)]">
                    Clona todas as vagas de um culto em modo rascunho para agilizar a próxima semana.
                  </p>
                  <input
                    type="text"
                    value={dupFromTitle}
                    onChange={(e) => setDupFromTitle(e.target.value)}
                    placeholder="Culto de origem"
                    className="nj-input w-full rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={dupToTitle}
                    onChange={(e) => setDupToTitle(e.target.value)}
                    placeholder="Novo culto"
                    className="nj-input w-full rounded-md px-3 py-2 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dupDate}
                      onChange={(e) => setDupDate(e.target.value)}
                      className="nj-input rounded-md px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={dupTime}
                      onChange={(e) => setDupTime(e.target.value)}
                      className="nj-input rounded-md px-3 py-2 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => duplicateEventSchedules(dupFromTitle, dupToTitle, dupDate, dupTime)}
                    className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Duplicar vagas
                  </button>
                </div>

                <form onSubmit={handleCreateMinistry} className="nj-card space-y-3 p-6">
                  <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">Criar novo ministério</h2>
                  <p className="text-xs text-[var(--nj-ink-muted)]">
                    Expanda a estrutura da igreja com novas equipes independentes (ex.: Intercessão, Infantil, Ação Social).
                  </p>
                  <input
                    type="text"
                    required
                    value={newMin.name}
                    onChange={(e) => setNewMin({ ...newMin, name: e.target.value })}
                    placeholder="Nome do ministério *"
                    className="nj-input w-full rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newMin.leader}
                    onChange={(e) => setNewMin({ ...newMin, leader: e.target.value })}
                    placeholder="Líder responsável *"
                    className="nj-input w-full rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={newMin.description}
                    onChange={(e) => setNewMin({ ...newMin, description: e.target.value })}
                    placeholder="Descrição resumida"
                    className="nj-input w-full rounded-md px-3 py-2 text-xs"
                  />
                  <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                    Criar ministério
                  </button>
                </form>
              </div>

              {/* Repertório da Escala de Louvor (Qualquer Louvor + Min. NJ) */}
              <section className="nj-card space-y-4 p-6">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                    Músicas da Escala de Louvor (Min. Nova Jerusalém e Outros Louvores)
                  </h2>
                  <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                    Adicione qualquer música ao culto — seja do Ministério Nova Jerusalém ou de outros ministérios/artistas. Todos os integrantes escalados no Louvor recebem notificação e visualizam o repertório direto em "Minhas Escalas".
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!repSongTitle.trim()) return;
                    addSongToRepertoire(repId || repertoires[0]?.id, {
                      title: repSongTitle.trim(),
                      artist:
                        repOrigin === 'min_nj'
                          ? 'Ministério Nova Jerusalém'
                          : repSongArtist.trim() || 'Louvor Congregacional',
                      album: repOrigin === 'min_nj' ? 'Min. Nova Jerusalém' : 'Louvor Congregacional',
                      origin: repOrigin,
                      key: repSongKey.trim() || 'G',
                      bpm: Number(repSongBpm) || 72,
                      referenceUrl: repSongRef.trim() || undefined,
                      notes: repSongNotes.trim() || undefined,
                    });
                    setRepSongTitle('');
                    setRepSongArtist('');
                    setRepSongRef('');
                    setRepSongNotes('');
                  }}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <select
                    value={repId}
                    onChange={(e) => setRepId(e.target.value)}
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  >
                    {repertoires.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.eventTitle} ({formatDatePtBR(r.date)})
                      </option>
                    ))}
                  </select>
                  <select
                    value={repOrigin}
                    onChange={(e) => setRepOrigin(e.target.value as 'outro_louvor' | 'min_nj')}
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  >
                    <option value="outro_louvor">Outro louvor (qualquer artista)</option>
                    <option value="min_nj">Ministério Nova Jerusalém</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={repSongTitle}
                    onChange={(e) => setRepSongTitle(e.target.value)}
                    placeholder="Nome da música *"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  {repOrigin === 'outro_louvor' && (
                    <input
                      type="text"
                      required
                      value={repSongArtist}
                      onChange={(e) => setRepSongArtist(e.target.value)}
                      placeholder="Artista / Ministério *"
                      className="nj-input rounded-md px-3 py-2 text-xs"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={repSongKey}
                      onChange={(e) => setRepSongKey(e.target.value)}
                      placeholder="Tom (G)"
                      className="nj-input rounded-md px-3 py-2 text-xs"
                    />
                    <input
                      type="number"
                      value={repSongBpm}
                      onChange={(e) => setRepSongBpm(Number(e.target.value))}
                      placeholder="BPM"
                      className="nj-input rounded-md px-3 py-2 text-xs"
                    />
                  </div>
                  <input
                    type="url"
                    value={repSongRef}
                    onChange={(e) => setRepSongRef(e.target.value)}
                    placeholder="Link YouTube/Spotify (opcional)"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={repSongNotes}
                    onChange={(e) => setRepSongNotes(e.target.value)}
                    placeholder="Observação para a banda/vocal"
                    className="nj-input rounded-md px-3 py-2 text-xs sm:col-span-2"
                  />
                  <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                    Adicionar música e notificar Louvor
                  </button>
                </form>

                <div className="divide-y divide-[var(--nj-border)] border-t border-[var(--nj-border)] pt-3 text-xs">
                  {repertoires
                    .find((r) => r.id === repId)
                    ?.songs.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 py-2">
                        <div>
                          <span className="font-semibold text-[var(--nj-ink)]">
                            {s.order}. {s.title}
                          </span>{' '}
                          — {s.artist} ({s.origin === 'min_nj' ? 'Min. NJ' : 'Outro louvor'}) · Tom {s.key} · {s.bpm} BPM
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSongFromRepertoire(repId, s.id)}
                          className="rounded p-1 text-[var(--nj-ink-subtle)] hover:text-amber-500"
                          aria-label={`Remover ${s.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </section>

              {/* Current Schedules List */}
              <div className="nj-card p-6">
                <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                  Escalas registradas ({schedules.length})
                </h2>
                <div className="mt-3 divide-y divide-[var(--nj-border)] text-xs">
                  {schedules.length === 0 ? (
                    <p className="py-4 text-[var(--nj-ink-muted)]">
                      Nenhuma vaga registrada ainda para os ministérios sob sua liderança.
                    </p>
                  ) : (
                    schedules.slice(0, 20).map((s) => (
                      <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <div>
                          <span className="font-semibold text-[var(--nj-ink)]">{s.volunteerName}</span> · {s.positionName}{' '}
                          ({s.departmentName || s.ministryName})
                          <p className="text-[var(--nj-ink-subtle)]">
                            {s.eventTitle} · {formatDatePtBR(s.date)} · {s.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-[var(--nj-accent-text)]">
                            {volunteerStatusLabel(s.volunteerStatus)}
                          </span>
                          {canManageSchedules && (
                            <button
                              type="button"
                              onClick={() => void deleteScheduleSlot(s.id)}
                              className="rounded p-1.5 text-[var(--nj-ink-subtle)] transition hover:bg-red-500/10 hover:text-red-500"
                              aria-label={`Excluir escala de ${s.volunteerName}`}
                              title="Excluir vaga da escala"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. EVENTOS & INFORMATIVO NJ */}
          {activeTab === 'eventos' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                Programação, Vídeo do Informativo NJ e Inscritos
              </h1>

              {/* Weekly Informativo NJ Video Editor (Server Upload MP4/WebM + External URL + YouTube) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleanId = extractYoutubeId(infoForm.youtubeId);
                  updateWeeklyInformativo({
                    title: infoForm.title.trim(),
                    weekLabel: infoForm.weekLabel.trim(),
                    mediaType: infoForm.mediaType,
                    videoUrl: infoForm.videoUrl.trim(),
                    youtubeId: cleanId || weeklyInformativo.youtubeId,
                    summary: infoForm.summary.trim(),
                    publishedDate: new Date().toISOString().slice(0, 10),
                  });
                }}
                className="nj-card space-y-4 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[var(--nj-ink)]">
                      Vídeo Semanal do Informativo NJ
                    </h2>
                    <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                      Envie o arquivo MP4/WebM diretamente para o servidor ou use um link do YouTube. Ao abrir a aba Programação, o vídeo inicia automaticamente mutado com controles de pausa e som.
                    </p>
                  </div>
                  <div className="nj-tabs">
                    {(
                      [
                        { id: 'server_video', label: 'Vídeo no Servidor' },
                        { id: 'youtube', label: 'YouTube' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setInfoForm((prev) => ({ ...prev, mediaType: m.id }))}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                          infoForm.mediaType === m.id ||
                          (m.id === 'server_video' && infoForm.mediaType === 'external_video')
                            ? 'nj-tab-active'
                            : 'nj-tab-idle'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={infoForm.title}
                    onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
                    placeholder="Título do Informativo NJ *"
                    className="nj-input sm:col-span-2"
                  />
                  <input
                    type="text"
                    required
                    value={infoForm.weekLabel}
                    onChange={(e) => setInfoForm({ ...infoForm, weekLabel: e.target.value })}
                    placeholder="Semana (ex.: 30/11 a 06/12/2026)"
                    className="nj-input"
                  />
                </div>

                {infoForm.mediaType === 'youtube' ? (
                  <input
                    type="text"
                    required
                    value={infoForm.youtubeId}
                    onChange={(e) => setInfoForm({ ...infoForm, youtubeId: e.target.value })}
                    placeholder="Link ou ID do vídeo no YouTube (ex.: https://youtube.com/watch?v=...)"
                    className="nj-input"
                  />
                ) : (
                  <div className="space-y-3">
                    <MediaUploadDropzone
                      kind="video"
                      label="Arquivo de vídeo do Informativo NJ (MP4 ou WebM)"
                      value={infoForm.videoUrl}
                      onChange={(url, source) =>
                        setInfoForm((prev) => ({
                          ...prev,
                          videoUrl: url,
                          mediaType: source === 'server' ? 'server_video' : 'external_video',
                        }))
                      }
                    />
                    {isSafeMediaUrl(infoForm.videoUrl) && (
                      <div className="overflow-hidden rounded-xl border border-[var(--nj-border)] bg-black">
                        <video
                          src={infoForm.videoUrl}
                          controls
                          muted
                          playsInline
                          className="aspect-video w-full max-h-64 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  rows={2}
                  value={infoForm.summary}
                  onChange={(e) => setInfoForm({ ...infoForm, summary: e.target.value })}
                  placeholder="Resumo dos avisos apresentados no vídeo da semana"
                  className="nj-input"
                />

                <button
                  type="submit"
                  disabled={!canManageVideos}
                  className="nj-btn-primary rounded-lg px-4 py-2.5 text-xs disabled:opacity-50"
                >
                  Publicar vídeo na aba Programação
                </button>
              </form>

              {/* Broadcast Videos (YouTube) CRUD */}
              <section className="nj-card space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-[var(--nj-accent-text)]" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[var(--nj-ink)]">
                      Vídeos Informativos e Transmissões ({videos.length})
                    </h2>
                    <p className="text-xs text-[var(--nj-ink-muted)]">
                      Vídeos exibidos publicamente no Site e no NJ App. Somente administradores autenticados podem adicionar ou excluir.
                    </p>
                  </div>
                </div>

                {canManageVideos && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const ytId = extractYoutubeId(newVideoForm.youtubeUrl);
                      if (!newVideoForm.title.trim() || !ytId) return;
                      await addBroadcastVideo({
                        title: newVideoForm.title.trim(),
                        youtubeId: ytId,
                        preacher: newVideoForm.preacher.trim() || 'Igreja Batista Nova Jerusalém',
                        series: newVideoForm.series.trim() || 'Culto de Celebração',
                        date: newVideoForm.date,
                        duration: newVideoForm.duration.trim() || '01:00:00',
                        description:
                          newVideoForm.description.trim() ||
                          'Transmissão oficial da Igreja Batista Nova Jerusalém Sampaio.',
                      });
                      setNewVideoForm({
                        title: '',
                        youtubeUrl: '',
                        preacher: 'Pr. Maurício Souza',
                        series: 'Culto de Celebração',
                        date: new Date().toISOString().slice(0, 10),
                        duration: '01:20:00',
                        description: '',
                      });
                    }}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <input
                      type="text"
                      required
                      value={newVideoForm.title}
                      onChange={(e) => setNewVideoForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do vídeo *"
                      className="nj-input sm:col-span-2"
                    />
                    <input
                      type="text"
                      required
                      value={newVideoForm.youtubeUrl}
                      onChange={(e) => setNewVideoForm((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
                      placeholder="Link ou ID do YouTube *"
                      className="nj-input sm:col-span-2"
                    />
                    <input
                      type="text"
                      value={newVideoForm.preacher}
                      onChange={(e) => setNewVideoForm((prev) => ({ ...prev, preacher: e.target.value }))}
                      placeholder="Preletor / Equipe"
                      className="nj-input"
                    />
                    <input
                      type="text"
                      value={newVideoForm.series}
                      onChange={(e) => setNewVideoForm((prev) => ({ ...prev, series: e.target.value }))}
                      placeholder="Série / Categoria"
                      className="nj-input"
                    />
                    <input
                      type="date"
                      value={newVideoForm.date}
                      onChange={(e) => setNewVideoForm((prev) => ({ ...prev, date: e.target.value }))}
                      className="nj-input"
                    />
                    <input
                      type="text"
                      value={newVideoForm.duration}
                      onChange={(e) => setNewVideoForm((prev) => ({ ...prev, duration: e.target.value }))}
                      placeholder="Duração (ex.: 01:20:00)"
                      className="nj-input"
                    />
                    <input
                      type="text"
                      value={newVideoForm.description}
                      onChange={(e) => setNewVideoForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Resumo opcional do vídeo"
                      className="nj-input sm:col-span-2 lg:col-span-3"
                    />
                    <button type="submit" className="nj-btn-primary rounded-lg px-4 py-2 text-xs">
                      Adicionar vídeo
                    </button>
                  </form>
                )}

                <div className="divide-y divide-[var(--nj-border)] border-t border-[var(--nj-border)] pt-2 text-xs">
                  {videos.map((v) => (
                    <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div>
                        <p className="font-semibold text-[var(--nj-ink)]">{v.title}</p>
                        <p className="text-[var(--nj-ink-subtle)]">
                          {v.series} · {v.preacher} · {formatDatePtBR(v.date)} · {v.duration}
                        </p>
                      </div>
                      {canManageVideos && (
                        <button
                          type="button"
                          onClick={() => void deleteBroadcastVideo(v.id)}
                          className="rounded p-1.5 text-[var(--nj-ink-subtle)] transition hover:bg-red-500/10 hover:text-red-500"
                          aria-label={`Excluir vídeo ${v.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Create New Event with Artwork Upload + Live Card Preview */}
              <form onSubmit={handleCreateEvent} className="nj-card space-y-4 p-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[var(--nj-ink)]">
                    Publicar novo evento com arte oficial
                  </h2>
                  <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                    Suba a arte promocional do evento para o servidor ou informe um link externo. Veja abaixo a prévia exata do card.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                  <div className="space-y-3 xl:col-span-7">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Título do evento *"
                        className="nj-input"
                      />
                      <input
                        type="text"
                        value={newEvent.badgeLabel}
                        onChange={(e) => setNewEvent({ ...newEvent, badgeLabel: e.target.value })}
                        placeholder="Etiqueta na arte (ex.: EVENTOS, CONGRESSO)"
                        className="nj-input"
                      />
                      <select
                        value={newEvent.category}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, category: e.target.value as EventCategory })
                        }
                        className="nj-input"
                      >
                        <option value="culto">Culto Regular</option>
                        <option value="congresso">Congresso</option>
                        <option value="conferencia">Conferência</option>
                        <option value="encontro">Encontro</option>
                        <option value="especial">Programação Especial</option>
                      </select>
                      <input
                        type="text"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder="Local"
                        className="nj-input"
                      />
                      <input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="nj-input"
                      />
                      <input
                        type="text"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        placeholder="Horário (ex.: 19h00)"
                        className="nj-input"
                      />
                    </div>

                    <MediaUploadDropzone
                      kind="image"
                      label="Arte oficial do evento (PNG, JPG ou WebP)"
                      value={newEvent.artworkUrl}
                      onChange={(url) => setNewEvent((prev) => ({ ...prev, artworkUrl: url }))}
                    />

                    <textarea
                      rows={2}
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Descrição resumida do evento"
                      className="nj-input"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs text-[var(--nj-ink-muted)]">
                        <input
                          type="checkbox"
                          checked={newEvent.requiresRegistration}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, requiresRegistration: e.target.checked })
                          }
                          className="accent-[#466053]"
                        />
                        Exige inscrição prévia
                      </label>
                      <button type="submit" className="nj-btn-primary rounded-lg px-4 py-2.5 text-xs">
                        Publicar evento
                      </button>
                    </div>
                  </div>

                  {/* Live Preview of EventArtCard */}
                  <div className="xl:col-span-5">
                    <p className="mb-2.5 text-xs font-medium text-[var(--nj-ink-subtle)]">
                      Prévia do card no Site e no NJ App
                    </p>
                    <div className="rounded-2xl border border-[var(--nj-border)] bg-[var(--nj-canvas)] p-4">
                      <EventArtCard
                        compact
                        event={{
                          id: 'preview-event',
                          title: newEvent.title.trim() || 'Conferência de Famílias NJ',
                          category: newEvent.category,
                          badgeLabel: newEvent.badgeLabel || 'EVENTOS',
                          artworkUrl: newEvent.artworkUrl || undefined,
                          date: newEvent.date,
                          time: newEvent.time || '19h00',
                          location: newEvent.location,
                          description:
                            newEvent.description.trim() ||
                            'Um encontro preparado para fortalecer lares e renovar a comunhão na Nova Jerusalém Sampaio.',
                          guidelines: newEvent.guidelines,
                          status: 'agendado',
                          requiresRegistration: newEvent.requiresRegistration,
                          registeredCount: 0,
                        }}
                        onSelect={() => undefined}
                      />
                    </div>
                  </div>
                </div>
              </form>

              {/* Manage Existing Events & Replace Artwork */}
              <div className="nj-card space-y-3 p-6">
                <h2 className="font-display text-xl font-semibold text-[var(--nj-ink)]">
                  Gerenciar artes e status dos eventos ({events.length})
                </h2>
                <div className="divide-y divide-[var(--nj-border)]">
                  {events.map((ev) => (
                    <div key={ev.id} className="space-y-3 py-3.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--nj-border)] bg-[#1B2A21]">
                            {isSafeMediaUrl(ev.artworkUrl) ? (
                              <img
                                src={ev.artworkUrl}
                                alt={ev.title}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[var(--nj-ink-subtle)]">
                                <ImageIcon className="h-4 w-4" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--nj-ink)]">
                              {ev.title} ·{' '}
                              <span className="uppercase text-[var(--nj-accent-text)]">
                                {ev.status}
                              </span>
                            </p>
                            <p className="text-[var(--nj-ink-subtle)] tabular-nums">
                              {formatDatePtBR(ev.date)} às {ev.time} · {ev.registeredCount} inscrito(s)
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingArtEventId(editingArtEventId === ev.id ? null : ev.id)
                            }
                            className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
                          >
                            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {editingArtEventId === ev.id ? 'Fechar arte' : 'Alterar arte'}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEventStatus(ev.id, 'agendado')}
                            className="nj-btn-secondary rounded-lg px-2.5 py-1.5 text-xs"
                          >
                            Agendado
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEventStatus(ev.id, 'reagendado')}
                            className="nj-btn-secondary rounded-lg px-2.5 py-1.5 text-xs"
                          >
                            Reagendar
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEventStatus(ev.id, 'cancelado')}
                            className="nj-btn-secondary rounded-lg px-2.5 py-1.5 text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>

                      {editingArtEventId === ev.id && (
                        <div className="rounded-xl border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4">
                          <MediaUploadDropzone
                            kind="image"
                            label={`Nova arte oficial para "${ev.title}"`}
                            value={ev.artworkUrl || ''}
                            onChange={(url) => {
                              updateEvent(ev.id, { artworkUrl: url });
                              setEditingArtEventId(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="nj-card p-6">
                <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                  Últimas inscrições ({registrations.length})
                </h2>
                <div className="mt-3 divide-y divide-[var(--nj-border)] text-xs">
                  {registrations.map((r) => {
                    const ev = events.find((e) => e.id === r.eventId);
                    return (
                      <div key={r.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                        <div>
                          <p className="font-semibold text-[var(--nj-ink)]">{r.name}</p>
                          <p className="text-[var(--nj-ink-subtle)]">
                            {ev?.title || r.eventId} · {r.phone} · {r.email}
                          </p>
                        </div>
                        <span className="text-[var(--nj-ink-subtle)]">{formatDatePtBR(r.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. EBD DIGITAL & CLASSES */}
          {activeTab === 'ebd' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                EBD Digital — Lições e Classes (Sala/Andar)
              </h1>

              <form onSubmit={handleCreateLesson} className="nj-card space-y-3 p-6">
                <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">Publicar ou agendar lição</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="number"
                    value={newLesson.number}
                    onChange={(e) => setNewLesson({ ...newLesson, number: Number(e.target.value) })}
                    placeholder="Nº da lição"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="Título da lição *"
                    className="nj-input rounded-md px-3 py-2 text-xs sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={newLesson.bibleText}
                    onChange={(e) => setNewLesson({ ...newLesson, bibleText: e.target.value })}
                    placeholder="Texto bíblico (ex.: Rm 12.1-8)"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={newLesson.quarter}
                    onChange={(e) => setNewLesson({ ...newLesson, quarter: e.target.value })}
                    placeholder="Trimestre"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <select
                    value={newLesson.status}
                    onChange={(e) =>
                      setNewLesson({ ...newLesson, status: e.target.value as 'publicada' | 'agendada' })
                    }
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  >
                    <option value="publicada">Publicar imediatamente</option>
                    <option value="agendada">Agendar para data futura</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={newLesson.summary}
                  onChange={(e) => setNewLesson({ ...newLesson, summary: e.target.value })}
                  placeholder="Resumo e conteúdo principal da lição"
                  className="nj-input w-full rounded-md px-3 py-2 text-xs"
                />
                <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                  Salvar lição da EBD
                </button>
              </form>

              <div className="nj-card p-6">
                <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">Acervo de lições</h2>
                <div className="mt-3 divide-y divide-[var(--nj-border)] text-xs">
                  {ebdLessons.map((l) => (
                    <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <p className="font-semibold text-[var(--nj-ink)]">
                          Lição {String(l.number).padStart(2, '0')} — {l.title}
                        </p>
                        <p className="text-[var(--nj-ink-subtle)]">
                          {l.quarter} · Status: {l.status}
                          {l.isCurrentWeek ? ' · LIÇÃO DA SEMANA' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!l.isCurrentWeek && (
                          <button
                            type="button"
                            onClick={() => setCurrentWeekLesson(l.id)}
                            className="nj-btn-secondary rounded-md px-2.5 py-1 text-xs"
                          >
                            Definir como atual
                          </button>
                        )}
                        {l.status !== 'arquivada' && (
                          <button
                            type="button"
                            onClick={() => archiveEbdLesson(l.id)}
                            className="nj-btn-secondary inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs"
                          >
                            <Archive className="h-3 w-3" aria-hidden="true" />
                            Arquivar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateClass} className="nj-card space-y-3 p-6">
                <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">Cadastrar nova classe da EBD</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder="Nome da classe *"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={newClass.teacher}
                    onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                    placeholder="Professor(a)"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={newClass.ageGroup}
                    onChange={(e) => setNewClass({ ...newClass, ageGroup: e.target.value })}
                    placeholder="Faixa etária"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    placeholder="Sala (ex.: Sala 204)"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={newClass.floor}
                    onChange={(e) => setNewClass({ ...newClass, floor: e.target.value })}
                    placeholder="Andar (ex.: 2º Andar)"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                    Adicionar classe
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 6. MIN. NOVA JERUSALÉM — EXCLUSIVO SUPERADMINISTRADOR / PASTOR */}
          {activeTab === 'musica' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  Acesso Exclusivo · Superadministrador e Pastor
                </p>
                <h1 className="mt-1 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                  Min. Nova Jerusalém — Catálogo Oficial e Capas
                </h1>
              </div>

              <form onSubmit={handleCreateAlbum} className="nj-card space-y-3 p-6">
                <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                  Adicionar novo lançamento à discografia oficial
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={newAlbum.title}
                    onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                    placeholder="Título do álbum / single *"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    value={newAlbum.year}
                    onChange={(e) => setNewAlbum({ ...newAlbum, year: Number(e.target.value) })}
                    placeholder="Ano"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <select
                    value={newAlbum.type}
                    onChange={(e) => setNewAlbum({ ...newAlbum, type: e.target.value as ReleaseType })}
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  >
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Álbum</option>
                  </select>
                  <input
                    type="text"
                    value={newAlbum.trackTitle}
                    onChange={(e) => setNewAlbum({ ...newAlbum, trackTitle: e.target.value })}
                    placeholder="Faixa principal"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="url"
                    value={newAlbum.coverImageUrl}
                    onChange={(e) => setNewAlbum({ ...newAlbum, coverImageUrl: e.target.value })}
                    placeholder="URL da imagem de capa (opcional)"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                  <input
                    type="url"
                    value={newAlbum.spotifyUrl}
                    onChange={(e) => setNewAlbum({ ...newAlbum, spotifyUrl: e.target.value })}
                    placeholder="Link do álbum/faixa no Spotify (prévia)"
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  />
                </div>
                <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                  Adicionar ao catálogo oficial do Min. NJ
                </button>
              </form>

              <div className="nj-card p-6">
                <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                  Repertório ativo do Ministério de Louvor
                </h2>
                {repertoires.map((rep) => (
                  <div key={rep.id} className="mt-3 rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4 text-xs">
                    <p className="font-semibold text-[var(--nj-ink)]">
                      {rep.eventTitle} · {formatDatePtBR(rep.date)} ({rep.time}) · Ministro: {rep.ministerName}
                    </p>
                    <ul className="mt-2 space-y-1 text-[var(--nj-ink-muted)]">
                      {rep.songs.map((s) => (
                        <li key={s.id}>
                          {s.order}. <strong>{s.title}</strong> ({s.album}) — Tom {s.key} · {s.bpm} BPM
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. COMUNICADOS */}
          {activeTab === 'comunicados' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[var(--nj-ink)]">Comunicados Oficiais</h1>

              <form onSubmit={handleCreateAnnouncement} className="nj-card space-y-3 p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={newAnn.title}
                    onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                    placeholder="Título do comunicado *"
                    className="nj-input rounded-md px-3 py-2 text-xs sm:col-span-2"
                  />
                  <select
                    value={newAnn.priority}
                    onChange={(e) =>
                      setNewAnn({ ...newAnn, priority: e.target.value as 'normal' | 'importante' })
                    }
                    className="nj-input rounded-md px-3 py-2 text-xs"
                  >
                    <option value="normal">Prioridade Normal</option>
                    <option value="importante">Prioridade Importante</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={3}
                  value={newAnn.body}
                  onChange={(e) => setNewAnn({ ...newAnn, body: e.target.value })}
                  placeholder="Mensagem do comunicado..."
                  className="nj-input w-full rounded-md px-3 py-2 text-xs"
                />
                <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                  Publicar comunicado
                </button>
              </form>

              <div className="nj-card divide-y divide-[var(--nj-border)] p-6">
                {announcements.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0 text-xs">
                    <div>
                      <p className="font-semibold text-[var(--nj-ink)]">{a.title}</p>
                      <p className="mt-0.5 text-[var(--nj-ink-muted)]">{a.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement(a.id)}
                      className="rounded-md p-1.5 text-[var(--nj-ink-subtle)] hover:text-amber-500"
                      aria-label="Excluir comunicado"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. PEDIDOS DE ORAÇÃO (LGPD) */}
          {activeTab === 'oracao' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                Pedidos de Oração — Triagem Pastoral (LGPD)
              </h1>
              <div className="space-y-3">
                {prayers.map((p) => (
                  <article key={p.id} className="nj-card p-5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--nj-accent-text)]">
                      <span>
                        {p.authorName} · {p.category} · Privacidade: {p.privacy}
                      </span>
                      <span>{formatDatePtBR(p.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--nj-ink)]">{p.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['recebido', 'em_oracao', 'atendido'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updatePrayerStatus(p.id, st)}
                          className={`rounded-md px-3 py-1 text-xs font-medium ${
                            p.status === st ? 'nj-tab-active' : 'nj-btn-secondary'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* 9. EQUIPE & PERMISSÕES (RBAC + ISOLAMENTO POR MINISTÉRIO NO FIRESTORE) */}
          {activeTab === 'equipe' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                  Equipe, Ministérios & Permissões (Segurança RBAC)
                </h1>
                <p className="mt-1 text-sm text-[var(--nj-ink-muted)]">
                  Defina o nível de acesso e exatamente quais ministérios cada pessoa participa. As regras do Firestore garantem que quem é da Mídia veja apenas Mídia, quem é do Louvor veja apenas Louvor, e visitantes ou membros sem ministério não vejam nenhuma escala.
                </p>
              </div>
              <div className="nj-card divide-y divide-[var(--nj-border)] p-6 text-xs">
                {usersList.length === 0 ? (
                  <p className="py-4 text-center text-[var(--nj-ink-muted)]">
                    Nenhum usuário adicional cadastrado ainda. Assim que líderes e voluntários entrarem no aplicativo, eles aparecerão aqui para vinculação ao seu ministério.
                  </p>
                ) : (
                  usersList.map((u) => {
                    const isPrimaryOwner = u.email.toLowerCase() === 'rafaelgrulke123@gmail.com';
                    const currentMinIds = u.ministryIds || [];
                    const currentDeptIds = u.departmentIds || [];
                    const hasMedia = currentMinIds.includes('min-midia');
                    const ministryCatalog =
                      ministries.length > 0
                        ? ministries.map((m) => ({ id: m.id, name: m.name }))
                        : [
                            { id: 'min-midia', name: 'Mídia' },
                            { id: 'min-louvor', name: 'Louvor' },
                            { id: 'min-recepcao', name: 'Recepção' },
                            { id: 'min-diaconia', name: 'Diaconia' },
                            { id: 'min-infantil', name: 'Infantil' },
                          ];
                    const mediaSubTeams = [
                      { id: 'dep-telao', name: 'Telão / Projeção' },
                      { id: 'dep-transmissao', name: 'Transmissão' },
                      { id: 'dep-social', name: 'Social Media' },
                    ];

                    const toggleMinistry = (minId: string) => {
                      const nextMin = currentMinIds.includes(minId)
                        ? currentMinIds.filter((id) => id !== minId)
                        : [...currentMinIds, minId];
                      const nextDepts = nextMin.includes('min-midia') ? currentDeptIds : [];
                      void updateUserMinistries(u.uid, nextMin, nextDepts);
                    };

                    const toggleMediaDept = (depId: string) => {
                      const nextDepts = currentDeptIds.includes(depId)
                        ? currentDeptIds.filter((id) => id !== depId)
                        : [...currentDeptIds, depId];
                      void updateUserMinistries(u.uid, currentMinIds, nextDepts);
                    };

                    return (
                      <div key={u.uid} className="space-y-3 py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[var(--nj-ink)]">{u.displayName}</p>
                            <p className="text-[var(--nj-ink-subtle)]">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPrimaryOwner ? (
                              <span className="rounded-md bg-[var(--nj-accent-soft)] px-3 py-1.5 font-semibold text-[var(--nj-accent-text)]">
                                Superadministrador Principal (Todos os Ministérios)
                              </span>
                            ) : (
                              <select
                                aria-label={`Perfil de acesso para ${u.displayName}`}
                                value={u.role}
                                onChange={(e) => void updateUserRole(u.uid, e.target.value as StoredUserRole)}
                                className="nj-input rounded-md px-3 py-1.5 text-xs"
                              >
                                <option value="membro">Membro (Sem escalas)</option>
                                <option value="voluntario">Voluntário (Apenas ministérios marcados)</option>
                                <option value="lider_ministerio">Líder de Ministério</option>
                                <option value="coord_ebd">Coordenador da EBD</option>
                                <option value="admin_conteudo">Administrador de Conteúdo</option>
                                <option value="pastoral">Pastor / Liderança Geral</option>
                                <option value="superadmin">Superadministrador</option>
                              </select>
                            )}
                          </div>
                        </div>

                        {!isPrimaryOwner && (
                          <div className="rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-3 space-y-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--nj-ink-subtle)]">
                              Ministérios liberados para ver escala ({currentMinIds.length} selecionado(s))
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {ministryCatalog.map((m) => {
                                const checked = currentMinIds.includes(m.id);
                                return (
                                  <label
                                    key={m.id}
                                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition ${
                                      checked
                                        ? 'border-[var(--nj-accent-text)] bg-[var(--nj-accent-soft)] font-semibold text-[var(--nj-accent-text)]'
                                        : 'border-[var(--nj-border)] bg-[var(--nj-surface)] text-[var(--nj-ink-muted)]'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleMinistry(m.id)}
                                      className="accent-[#466053]"
                                    />
                                    {m.name}
                                  </label>
                                );
                              })}
                            </div>

                            {hasMedia && (
                              <div className="border-t border-[var(--nj-border)] pt-2.5">
                                <p className="mb-1.5 text-[11px] font-medium text-[var(--nj-ink-subtle)]">
                                  Sub-equipes de Mídia (opcional — se nenhuma marcada, vê toda a Mídia):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {mediaSubTeams.map((dep) => {
                                    const checked = currentDeptIds.includes(dep.id);
                                    return (
                                      <label
                                        key={dep.id}
                                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition ${
                                          checked
                                            ? 'border-[var(--nj-accent-text)] bg-[var(--nj-accent-soft)] font-semibold text-[var(--nj-accent-text)]'
                                            : 'border-[var(--nj-border)] bg-[var(--nj-surface)] text-[var(--nj-ink-muted)]'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleMediaDept(dep.id)}
                                          className="accent-[#466053]"
                                        />
                                        {dep.name}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 10. AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                Histórico de Alterações (Auditoria)
              </h1>
              <div className="nj-card divide-y divide-[var(--nj-border)] p-6 text-xs">
                {auditLogs.length === 0 ? (
                  <p className="py-4 text-center text-[var(--nj-ink-muted)]">
                    Os registros imutáveis de auditoria aparecerão aqui conforme alterações administrativas forem salvas.
                  </p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
                      <div>
                        <span className="font-semibold text-[var(--nj-accent-text)]">[{log.module}]</span>{' '}
                        <span className="text-[var(--nj-ink)]">{log.action}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--nj-ink-subtle)]">
                        {log.actor} · {log.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
