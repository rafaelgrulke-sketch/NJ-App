import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Heart,
  List,
  MapPin,
  Music,
  Play,
  Plus,
  Radio,
  Search,
  Share2,
  Type,
  Users,
  X,
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { MUSIC_PLATFORM_CHANNELS } from '../../data/initialData';
import { ChurchEvent, DiscographyProject, EventCategory } from '../../types/church';
import {
  categoryLabel,
  downloadEbdLessonPdf,
  formatDatePtBR,
  formatLongDatePtBR,
  volunteerStatusLabel,
} from '../../utils/formatters';
import { safeExternalUrl, safeSpotifyEmbedUrl, safeYoutubeId } from '../../utils/security';
import { AlbumCoverArt } from '../EditorialArt';
import { EmptyState } from '../ui/DesignPrimitives';
import { EventArtCard, EventDetailModal } from '../ui/EventArtCard';
import { InformativoVideoPlayer } from '../ui/InformativoVideoPlayer';

export type MemberTab =
  | 'inicio'
  | 'agenda'
  | 'ministerios'
  | 'ebd'
  | 'musica'
  | 'igreja'
  | 'oracao'
  | 'transmissoes'
  | 'espiritual'
  | 'contribuicoes'
  | 'notificacoes'
  | 'mais';

/* ==========================================================================
   1. PÁGINA INICIAL DO MEMBRO (DINÂMICA)
   ========================================================================== */
export const MemberHomeView: React.FC<{ onNavigate: (tab: MemberTab) => void }> = ({ onNavigate }) => {
  const {
    currentMemberName,
    churchInfo,
    events,
    announcements,
    ebdLessons,
    discography,
    ministries,
    schedules,
    videos,
    notifications,
    notify,
  } = useChurch();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const currentLesson = ebdLessons.find((l) => l.isCurrentWeek) || ebdLessons[0];
  const activeEvents = events.filter((e) => e.status !== 'cancelado');
  const nextEvent = activeEvents[0];
  const latestRelease = discography[0];
  const featuredVideo = videos[0];
  const myUpcomingSchedules = schedules.filter(
    (s) => s.volunteerName === currentMemberName && s.scheduleStatus !== 'cancelada'
  );
  const pendingCount = myUpcomingSchedules.filter((s) => s.volunteerStatus === 'aguardando').length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-8">
      {/* Greeting + Next Service */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="nj-card flex flex-col justify-between p-6 sm:p-7 lg:col-span-7">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              {greeting}, {currentMemberName} · {churchInfo.displayName}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
              {nextEvent ? nextEvent.title : 'Nossa Celebração'}
            </h1>
            {nextEvent && (
              <p className="mt-2 text-sm text-[var(--nj-ink-muted)]">
                {formatLongDatePtBR(nextEvent.date)} · {nextEvent.time} · {nextEvent.location}
              </p>
            )}
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--nj-ink-muted)]">
              {nextEvent?.description ||
                'Acompanhe a programação semanal, a lição da EBD Digital, suas escalas ministeriais e a discografia oficial do Ministério Nova Jerusalém.'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--nj-border)] pt-5">
            <button
              type="button"
              onClick={() => onNavigate('agenda')}
              className="nj-btn-primary inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm"
            >
              Agenda e Informativo NJ
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('igreja')}
              className="nj-btn-secondary inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm"
            >
              Conheça Nossa Igreja
            </button>
            {unreadNotifs > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('notificacoes')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--nj-accent-text)] hover:underline"
              >
                <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                {unreadNotifs} notificações não lidas
              </button>
            )}
          </div>
        </div>

        {/* Programação Semanal + Minhas Escalas */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="nj-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">Programação Semanal</h2>
              <Clock className="h-4 w-4 text-[var(--nj-accent-text)]" aria-hidden="true" />
            </div>
            <ul className="mt-3 divide-y divide-[var(--nj-border)] text-sm">
              {churchInfo.weeklyServices.map((srv) => (
                <li key={srv.id} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-[var(--nj-ink)]">{srv.title}</p>
                    <p className="text-xs text-[var(--nj-ink-subtle)]">{srv.day} · {srv.location}</p>
                  </div>
                  <span className="font-mono text-xs font-medium text-[var(--nj-accent-text)] tabular-nums shrink-0">
                    {srv.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="nj-card-olive flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                Minhas Escalas
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--nj-ink)]">
                {myUpcomingSchedules.length} escala(s) atribuída(s)
                {pendingCount > 0 ? ` · ${pendingCount} aguardando confirmação` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ministerios')}
              className="nj-btn-secondary shrink-0 rounded-md px-3.5 py-2 text-xs"
            >
              Ver escalas
            </button>
          </div>
        </div>
      </section>

      {/* Current EBD Lesson (Warm Paper Editorial Surface) */}
      {currentLesson && (
        <section className="nj-paper rounded-xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-widest uppercase text-[#466053]">
                EBD Digital · Lição {String(currentLesson.number).padStart(2, '0')} · {currentLesson.quarter}
              </p>
              <h2 className="mt-1.5 font-serif text-2xl font-semibold text-[#213228] sm:text-3xl">
                {currentLesson.title}
              </h2>
              <p className="mt-1 text-xs font-medium text-[#5D705D]">
                {currentLesson.bibleText} · {currentLesson.author} · {formatDatePtBR(currentLesson.date)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#2D3F34]">{currentLesson.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('ebd')}
                className="inline-flex items-center gap-2 rounded-md bg-[#213228] px-4 py-2 text-xs font-semibold text-[#F3F1E9] transition hover:bg-[#31483B]"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Ler online
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadEbdLessonPdf(currentLesson);
                  notify(`PDF "${currentLesson.pdfFileName}" baixado.`);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-[#213228]/30 bg-transparent px-4 py-2 text-xs font-semibold text-[#213228] transition hover:bg-[#213228]/10"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Baixar PDF
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Quick Access to the 5 Ministries */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              Central de Ministérios
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
              Equipes e escalas independentes
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ministerios')}
            className="text-xs font-medium text-[var(--nj-accent-text)] hover:underline"
          >
            Abrir Central completa →
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ministries.slice(0, 5).map((min) => {
            const count = schedules.filter((s) => s.ministryId === min.id).length;
            return (
              <button
                key={min.id}
                type="button"
                onClick={() => onNavigate('ministerios')}
                className="nj-card flex flex-col justify-between p-4 text-left transition hover:border-[var(--nj-border-strong)]"
              >
                <div>
                  <p className="font-serif text-lg font-semibold text-[var(--nj-ink)]">{min.name}</p>
                  <p className="mt-1 text-xs text-[var(--nj-ink-subtle)]">
                    {min.departments ? `${min.departments.length} áreas internas` : `${min.positions.length} funções`}
                  </p>
                </div>
                <p className="mt-4 text-xs font-medium text-[var(--nj-accent-text)] tabular-nums">
                  {count} escalado(s) · Líder: {min.leader}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Announcements + Broadcast + Music Release */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Announcements */}
        <div className="nj-card p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">Comunicados Recentes</h2>
            <span className="text-xs text-[var(--nj-ink-subtle)]">{announcements.length} ativos</span>
          </div>
          <div className="mt-4 divide-y divide-[var(--nj-border)]">
            {announcements.slice(0, 4).map((ann) => (
              <article key={ann.id} className="py-3.5 first:pt-0 last:pb-0">
                <p className="text-xs text-[var(--nj-accent-text)]">
                  {ann.department} · {formatDatePtBR(ann.date)}
                  {ann.priority === 'importante' ? ' · Prioritário' : ''}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-[var(--nj-ink)]">{ann.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--nj-ink-muted)]">{ann.body}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Min. Nova Jerusalém + Transmissões */}
        <div className="space-y-6 lg:col-span-7">
          {latestRelease && (
            <div className="nj-card grid grid-cols-1 overflow-hidden sm:grid-cols-12">
              <AlbumCoverArt
                variant={0}
                title={latestRelease.title}
                year={latestRelease.year}
                className="min-h-[160px] sm:col-span-5"
              />
              <div className="flex flex-col justify-between p-5 sm:col-span-7">
                <div>
                  <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                    Min. Nova Jerusalém · Lançamento {latestRelease.year}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                    {latestRelease.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--nj-ink-muted)]">
                    Discografia completa com {discography.length} projetos de 2001 a 2025, cifras, letras e integração ao repertório do louvor.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => onNavigate('musica')}
                    className="nj-btn-primary inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs"
                  >
                    <Music className="h-3.5 w-3.5" aria-hidden="true" />
                    Explorar discografia
                  </button>
                  <a
                    href={MUSIC_PLATFORM_CHANNELS.spotifyAlbumUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs"
                  >
                    Spotify <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {featuredVideo && (
            <div className="nj-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  Transmissões e Mensagens · {featuredVideo.series}
                </p>
                <h3 className="mt-1 font-serif text-xl font-semibold text-[var(--nj-ink)]">
                  {featuredVideo.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                  {featuredVideo.preacher} · {formatDatePtBR(featuredVideo.date)} · {featuredVideo.duration}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transmissoes')}
                className="nj-btn-secondary inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-xs"
              >
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                Assistir cultos
              </button>
            </div>
          )}

          {/* Official Channels Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] px-4 py-3 text-xs text-[var(--nj-ink-muted)]">
            <span>Canais oficiais da Nova Jerusalém Sampaio:</span>
            <div className="flex flex-wrap gap-4 font-medium text-[var(--nj-accent-text)]">
              <a href={churchInfo.instagramUrl} target="_blank" rel="noreferrer" className="hover:underline">
                Instagram ({churchInfo.instagramHandle})
              </a>
              <a href={churchInfo.youtubeUrl} target="_blank" rel="noreferrer" className="hover:underline">
                YouTube Oficial
              </a>
              <a href={churchInfo.websiteUrl} target="_blank" rel="noreferrer" className="hover:underline">
                Site Institucional
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ==========================================================================
   2. AGENDA E INFORMATIVO NJ (LISTA + CALENDÁRIO MENSAL + .ICS + INSCRIÇÃO)
   ========================================================================== */
export const AgendaInformativoView: React.FC = () => {
  const {
    churchInfo,
    weeklyInformativo,
    events,
    eventReminders,
    toggleEventReminder,
    registerForEvent,
    notify,
  } = useChurch();

  const [categoryFilter, setCategoryFilter] = useState<'todos' | EventCategory>('todos');
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('lista');
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);

  const filteredEvents = useMemo(
    () =>
      events.filter((ev) => (categoryFilter === 'todos' ? true : ev.category === categoryFilter)),
    [events, categoryFilter]
  );

  const calendarBase = useMemo(() => {
    const firstDate = events[0]?.date || '2026-11-29';
    const [y, m] = firstDate.split('-').map(Number);
    const year = y || 2026;
    const monthIndex = (m || 11) - 1;
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startOffset = firstDay.getDay();
    const label = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return { year, monthIndex, daysInMonth, startOffset, label };
  }, [events]);

  const activeShareUrl =
    weeklyInformativo.mediaType === 'youtube'
      ? `https://www.youtube.com/watch?v=${weeklyInformativo.youtubeId}`
      : weeklyInformativo.videoUrl
        ? `${window.location.origin}${weeklyInformativo.videoUrl.startsWith('/') ? weeklyInformativo.videoUrl : ''}`
        : window.location.href;

  return (
    <div className="space-y-10">
      {/* 1. VÍDEO SEMANAL DO INFORMATIVO NJ — INÍCIO AUTOMÁTICO MUTADO COM PAUSE/MUTE */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--nj-border)] pb-5">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              Programação & Informativo NJ · {weeklyInformativo.weekLabel}
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
              {weeklyInformativo.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
              {weeklyInformativo.summary}
            </p>
          </div>
          <a
            href="#eventos-da-semana"
            className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs whitespace-nowrap"
          >
            Ver eventos da semana ↓
          </a>
        </div>

        <div className="nj-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <InformativoVideoPlayer informativo={weeklyInformativo} autoPlay />
            </div>

            <div className="flex flex-col justify-between p-6 lg:col-span-4">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)] tabular-nums">
                  {weeklyInformativo.mediaType === 'server_video'
                    ? 'Vídeo Hospedado no Servidor'
                    : weeklyInformativo.mediaType === 'external_video'
                      ? 'Vídeo Direto'
                      : 'Vídeo da Semana'}{' '}
                  · {formatDatePtBR(weeklyInformativo.publishedDate)}
                </p>
                <h2 className="mt-2 font-display text-lg font-semibold text-[var(--nj-ink)]">
                  Destaques desta semana
                </h2>
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-[var(--nj-ink-muted)]">
                  {weeklyInformativo.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 font-bold text-[var(--nj-accent-text)]">·</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--nj-border)] pt-4">
                {weeklyInformativo.mediaType === 'youtube' && (
                  <a
                    href={`https://www.youtube.com/watch?v=${safeYoutubeId(weeklyInformativo.youtubeId)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="nj-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs"
                  >
                    Abrir no YouTube
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `*${weeklyInformativo.title}* (${weeklyInformativo.weekLabel})\nAssista: ${activeShareUrl}`
                      );
                      notify('Link do Informativo NJ copiado para o WhatsApp.');
                    } catch {
                      notify('Link do Informativo NJ pronto para compartilhar.');
                    }
                  }}
                  className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Compartilhar informativo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EVENTOS DA SEMANA & AGENDA (CARDS COM ARTES PERSONALIZADAS AO ROLAR) */}
      <div
        id="eventos-da-semana"
        className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--nj-border)] pb-5"
      >
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
            Eventos desta Semana & Agenda Completa
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-[var(--nj-ink)] sm:text-3xl">
            Cultos, congressos e inscrições abertas
          </h2>
        </div>

        <div className="nj-tabs">
          <button
            type="button"
            onClick={() => setViewMode('lista')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap ${
              viewMode === 'lista' ? 'nj-tab-active' : 'nj-tab-idle'
            }`}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" />
            Cards com Artes
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendario')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium whitespace-nowrap ${
              viewMode === 'calendario' ? 'nj-tab-active' : 'nj-tab-idle'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Calendário mensal
          </button>
        </div>
      </div>

      {/* Weekly Recurring Schedule */}
      <section className="nj-card p-5">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
          Programação Regular Semanal · {churchInfo.address}, {churchInfo.neighborhood}
        </p>
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {churchInfo.weeklyServices.map((srv) => (
            <div
              key={srv.id}
              className="rounded-xl border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-3.5"
            >
              <p className="text-xs text-[var(--nj-accent-text)] tabular-nums">
                {srv.day} · <span className="font-mono font-medium">{srv.time}</span>
              </p>
              <p className="mt-1 font-display text-base font-semibold text-[var(--nj-ink)]">
                {srv.title}
              </p>
              <p className="mt-0.5 text-xs text-[var(--nj-ink-subtle)]">{srv.location}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar eventos por categoria">
        {(['todos', 'culto', 'congresso', 'conferencia', 'encontro', 'especial'] as const).map(
          (cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'nj-tab-active'
                  : 'border border-[var(--nj-border)] text-[var(--nj-ink-muted)] hover:border-[var(--nj-border-strong)] hover:text-[var(--nj-ink)]'
              }`}
            >
              {cat === 'todos' ? 'Todas as categorias' : categoryLabel(cat)}
            </button>
          )
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendario' && (
        <section className="nj-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold capitalize text-[var(--nj-ink)]">
              {calendarBase.label}
            </h2>
            <span className="text-xs text-[var(--nj-ink-subtle)] tabular-nums">
              {filteredEvents.length} evento(s) listado(s)
            </span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-medium text-[var(--nj-ink-subtle)]">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-2">
            {Array.from({ length: calendarBase.startOffset }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[76px] rounded-lg bg-[var(--nj-surface-alt)]/40"
              />
            ))}
            {Array.from({ length: calendarBase.daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const iso = `${calendarBase.year}-${String(calendarBase.monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter((e) => e.date === iso);
              return (
                <div
                  key={iso}
                  className={`min-h-[76px] rounded-lg border p-2 ${
                    dayEvents.length > 0
                      ? 'border-[var(--nj-border-strong)] bg-[var(--nj-surface-alt)]'
                      : 'border-[var(--nj-border)]'
                  }`}
                >
                  <p className="font-mono text-xs text-[var(--nj-ink-subtle)] tabular-nums">
                    {day}
                  </p>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        className="block w-full truncate rounded bg-[#B1D3AE]/25 px-1.5 py-0.5 text-left text-[11px] font-medium text-[var(--nj-ink)] hover:bg-[#B1D3AE]/40"
                        title={`${ev.title} (${ev.time})`}
                      >
                        {ev.time} {ev.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Event Artwork Card Grid */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-6 w-6" aria-hidden="true" />}
          title="Nenhum evento nesta categoria"
          description="Não há programações cadastradas para o filtro selecionado. Experimente visualizar todas as categorias."
          action={
            <button
              type="button"
              onClick={() => setCategoryFilter('todos')}
              className="nj-btn-secondary rounded-lg px-4 py-2 text-xs"
            >
              Ver todas as programações
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((ev) => (
            <EventArtCard
              key={ev.id}
              event={ev}
              onSelect={(clicked) => setSelectedEvent(clicked)}
            />
          ))}
        </div>
      )}

      {/* Unified Event Detail & Registration Modal */}
      <EventDetailModal
        event={selectedEvent}
        churchAddress={`${churchInfo.address}, ${churchInfo.neighborhood}`}
        isReminded={selectedEvent ? eventReminders.includes(selectedEvent.id) : false}
        onClose={() => setSelectedEvent(null)}
        onToggleReminder={toggleEventReminder}
        onRegister={registerForEvent}
        onNotify={(msg) => notify(msg)}
      />
    </div>
  );
};

/* ==========================================================================
   3. EBD DIGITAL — LEITURA ONLINE + PDF + BIBLIOTECA + CLASSES (SALA/ANDAR)
   ========================================================================== */
export const EbdDigitalView: React.FC = () => {
  const { ebdLessons, ebdClasses, notify } = useChurch();

  const publishedOrArchived = useMemo(
    () => ebdLessons.filter((l) => l.status !== 'agendada'),
    [ebdLessons]
  );

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    ebdLessons.find((l) => l.isCurrentWeek)?.id || publishedOrArchived[0]?.id || ''
  );
  const [largeFont, setLargeFont] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('todos');

  const quarters = useMemo(
    () => Array.from(new Set(publishedOrArchived.map((l) => l.quarter))),
    [publishedOrArchived]
  );

  const filteredLibrary = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return publishedOrArchived.filter((l) => {
      const matchQuarter = quarterFilter === 'todos' || l.quarter === quarterFilter;
      const matchQuery =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.theme.toLowerCase().includes(q) ||
        l.bibleText.toLowerCase().includes(q);
      return matchQuarter && matchQuery;
    });
  }, [publishedOrArchived, quarterFilter, searchTerm]);

  const activeLesson =
    publishedOrArchived.find((l) => l.id === selectedLessonId) || publishedOrArchived[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--nj-border)] pb-6">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
            EBD Digital · Domingos das 09h às 10h
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
            Escola Bíblica Dominical
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
            Estude a lição da semana diretamente pelo aplicativo em modo de leitura confortável, baixe o material em PDF para acesso offline e consulte as classes com sala e andar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLargeFont((v) => !v)}
            className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
          >
            <Type className="h-3.5 w-3.5" aria-hidden="true" />
            {largeFont ? 'Fonte padrão' : 'Aumentar fonte'}
          </button>
          {activeLesson && (
            <button
              type="button"
              onClick={() => {
                downloadEbdLessonPdf(activeLesson);
                notify(`PDF "${activeLesson.pdfFileName}" baixado.`);
              }}
              className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Baixar PDF
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Online Reader (High-contrast Editorial Paper) */}
        <article className="nj-paper rounded-xl p-6 sm:p-8 lg:col-span-8">
          {activeLesson ? (
            <div className={largeFont ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'}>
              <p className="text-xs font-semibold tracking-widest uppercase text-[#466053]">
                Lição {String(activeLesson.number).padStart(2, '0')} · {activeLesson.quarter} ·{' '}
                {activeLesson.isCurrentWeek ? 'Lição da Semana' : activeLesson.status}
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[#213228]">
                {activeLesson.title}
              </h2>
              <p className="mt-2 text-xs font-medium text-[#5D705D]">
                Tema: {activeLesson.theme} · Texto Bíblico: {activeLesson.bibleText} · Autor: {activeLesson.author}
              </p>

              <blockquote className="mt-5 rounded-lg border border-[#466053]/25 bg-[#E7E3D7] p-4 font-serif text-base italic text-[#213228]">
                “{activeLesson.goldenVerse}”
              </blockquote>

              <p className="mt-5 text-[#2D3F34]">{activeLesson.summary}</p>

              <div className="mt-6 space-y-6">
                {activeLesson.sections.map((sec, idx) => (
                  <section key={idx}>
                    <h3 className="font-serif text-xl font-semibold text-[#213228]">{sec.heading}</h3>
                    <p className="mt-2 text-[#2D3F34]">{sec.content}</p>
                  </section>
                ))}
              </div>

              <section className="mt-8 border-t border-[#213228]/15 pt-6">
                <h3 className="font-serif text-xl font-semibold text-[#213228]">Perguntas para reflexão</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-[#2D3F34]">
                  {activeLesson.reflectionQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </section>

              <section className="mt-6 rounded-lg bg-[#213228] p-5 text-[#F3F1E9]">
                <p className="text-xs font-medium tracking-widest uppercase text-[#B1D3AE]">
                  Aplicação Prática da Semana
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#F3F1E9]/90">
                  {activeLesson.practicalApplication}
                </p>
              </section>
            </div>
          ) : (
            <p className="text-sm text-[#213228]">Nenhuma lição disponível no momento.</p>
          )}
        </article>

        {/* Library + Search */}
        <aside className="space-y-5 lg:col-span-4">
          <div className="nj-card p-5">
            <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">Biblioteca Digital</h2>
            <div className="mt-3 space-y-2.5">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-[var(--nj-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, tema ou livro..."
                  className="nj-input w-full rounded-md py-2 pr-3 pl-9 text-xs"
                />
              </div>
              <select
                value={quarterFilter}
                onChange={(e) => setQuarterFilter(e.target.value)}
                className="nj-input w-full rounded-md px-3 py-2 text-xs"
                aria-label="Filtrar trimestre"
              >
                <option value="todos">Todos os trimestres</option>
                {quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 divide-y divide-[var(--nj-border)]">
              {filteredLibrary.map((lesson) => {
                const isSelected = lesson.id === activeLesson?.id;
                return (
                  <div key={lesson.id} className="py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className="w-full text-left"
                    >
                      <p className="text-xs text-[var(--nj-accent-text)]">
                        Lição {String(lesson.number).padStart(2, '0')} · {lesson.quarter}
                        {lesson.isCurrentWeek ? ' · Atual' : ''}
                      </p>
                      <p
                        className={`mt-0.5 text-sm font-semibold ${
                          isSelected ? 'text-[var(--nj-accent-text)] underline' : 'text-[var(--nj-ink)]'
                        }`}
                      >
                        {lesson.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--nj-ink-subtle)]">{lesson.bibleText}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        downloadEbdLessonPdf(lesson);
                        notify(`PDF "${lesson.pdfFileName}" baixado.`);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--nj-ink-muted)] hover:text-[var(--nj-accent-text)]"
                    >
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      Baixar PDF
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* EBD Classes (with Room + Floor) */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
            Classes da EBD
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
            Salas, andares e faixas etárias
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ebdClasses.map((cls) => (
            <article key={cls.id} className="nj-card p-5">
              <p className="text-xs font-medium text-[var(--nj-accent-text)]">
                {cls.room} · {cls.floor}
              </p>
              <h3 className="mt-1 font-serif text-xl font-semibold text-[var(--nj-ink)]">{cls.name}</h3>
              <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                {cls.ageGroup} · {cls.schedule}
              </p>
              <p className="mt-2 text-xs text-[var(--nj-ink-subtle)]">
                Professor(a): <strong className="font-medium text-[var(--nj-ink)]">{cls.teacher}</strong>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--nj-ink-muted)]">{cls.notes}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ==========================================================================
   4. MIN. NOVA JERUSALÉM — DISCOGRAFIA COMPLETA + CIFRAS/LETRAS + REPERTÓRIO
   ========================================================================== */
export const MusicMinistryView: React.FC = () => {
  const {
    discography,
    favoriteTrackIds,
    toggleFavoriteTrack,
    repertoires,
    addSongToRepertoire,
  } = useChurch();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'todos' | 'album' | 'single_ep' | 'recentes' | 'favoritas'>('todos');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(discography[0]?.id || '');
  const [activePreviewTrackTitle, setActivePreviewTrackTitle] = useState<string | null>(null);
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>(
    discography.find((d) => d.id === 'alb-2013')?.spotifyEmbedUrl || MUSIC_PLATFORM_CHANNELS.spotifyAlbumEmbedUrl
  );
  const [lyricModalTrack, setLyricModalTrack] = useState<{
    project: DiscographyProject;
    track: DiscographyProject['tracks'][number];
  } | null>(null);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return discography.filter((proj) => {
      if (filterMode === 'album' && proj.type !== 'album') return false;
      if (filterMode === 'single_ep' && proj.type === 'album') return false;
      if (filterMode === 'recentes' && !proj.isRecent) return false;
      if (filterMode === 'favoritas' && !proj.tracks.some((t) => favoriteTrackIds.includes(t.id))) {
        return false;
      }
      if (!q) return true;
      return (
        proj.title.toLowerCase().includes(q) ||
        String(proj.year).includes(q) ||
        proj.tracks.some((t) => t.title.toLowerCase().includes(q))
      );
    });
  }, [discography, filterMode, favoriteTrackIds, searchTerm]);

  const selectedProject =
    filteredProjects.find((p) => p.id === selectedProjectId) || filteredProjects[0] || discography[0];

  const nextRepertoire = repertoires[0];

  const handleSelectAlbum = (project: DiscographyProject) => {
    setSelectedProjectId(project.id);
    setActivePreviewTrackTitle(project.tracks[0]?.title || project.title);
    setActiveEmbedUrl(project.spotifyEmbedUrl || MUSIC_PLATFORM_CHANNELS.spotifyArtistEmbedUrl);
  };

  const handlePlayTrackPreview = (project: DiscographyProject, track: DiscographyProject['tracks'][number]) => {
    setSelectedProjectId(project.id);
    setActivePreviewTrackTitle(track.title);
    setActiveEmbedUrl(
      track.spotifyTrackEmbedUrl || project.spotifyEmbedUrl || MUSIC_PLATFORM_CHANNELS.spotifyArtistEmbedUrl
    );
    const el = document.getElementById('nj-spotify-preview-player');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[var(--nj-border)] pb-6">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
          Min. Nova Jerusalém · Discografia Oficial (2001 – 2025)
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
          Capas, prévias no Spotify, letras e cifras
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
          Clique em qualquer álbum ou faixa abaixo para abrir o player de prévia do Spotify, consultar letras e cifras ou enviar canções ao repertório do culto.
        </p>

        {/* Official Streaming & Channels Links */}
        <div className="mt-5 flex flex-wrap gap-2.5 text-xs">
          {[
            { label: 'Spotify Oficial', href: MUSIC_PLATFORM_CHANNELS.spotifyArtistUrl },
            { label: 'Apple Music', href: MUSIC_PLATFORM_CHANNELS.appleMusicUrl },
            { label: 'Amazon Music', href: MUSIC_PLATFORM_CHANNELS.amazonMusicUrl },
            { label: 'YouTube Min. NJ', href: MUSIC_PLATFORM_CHANNELS.youtubeMinistryUrl },
            { label: 'Instagram @m_novajerusalem', href: MUSIC_PLATFORM_CHANNELS.instagramMinistryUrl },
            { label: 'MK Music', href: MUSIC_PLATFORM_CHANNELS.mkMusicUrl },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5"
            >
              {link.label}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      {/* Interactive Spotify Preview Player — Updates on Album/Track Click */}
      {selectedProject && (
        <section id="nj-spotify-preview-player" className="nj-card overflow-hidden">
          <div className="grid grid-cols-1 items-stretch md:grid-cols-12">
            <AlbumCoverArt
              variant={selectedProject.artworkStyle ?? 0}
              title={selectedProject.title}
              year={selectedProject.year}
              coverImageUrl={selectedProject.coverImageUrl}
              className="min-h-[168px] md:col-span-4"
            />
            <div className="flex flex-col justify-between p-5 md:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                    Player de Prévia · Spotify
                  </p>
                  <h2 className="mt-0.5 font-serif text-xl font-semibold text-[var(--nj-ink)]">
                    {activePreviewTrackTitle || selectedProject.title}
                    <span className="ml-2 font-sans text-xs font-normal text-[var(--nj-ink-subtle)]">
                      ({selectedProject.title} · {selectedProject.year})
                    </span>
                  </h2>
                </div>
                {safeExternalUrl(selectedProject.spotifyUrl) && (
                  <a
                    href={safeExternalUrl(selectedProject.spotifyUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[var(--nj-accent-text)] hover:underline"
                  >
                    Abrir completo no Spotify →
                  </a>
                )}
              </div>
              {safeSpotifyEmbedUrl(activeEmbedUrl) && (
                <div className="mt-3 overflow-hidden rounded-lg">
                  <iframe
                    key={`${selectedProject.id}-${activeEmbedUrl}`}
                    title={`Prévia Spotify — ${activePreviewTrackTitle || selectedProject.title}`}
                    src={safeSpotifyEmbedUrl(activeEmbedUrl)}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="border-0"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'todos', label: `Todos (${discography.length})` },
              { id: 'album', label: 'Álbuns' },
              { id: 'single_ep', label: 'Singles / EPs' },
              { id: 'recentes', label: 'Lançamentos' },
              { id: 'favoritas', label: `Favoritas (${favoriteTrackIds.length})` },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterMode(f.id)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                filterMode === f.id
                  ? 'nj-tab-active'
                  : 'border border-[var(--nj-border)] text-[var(--nj-ink-muted)] hover:border-[var(--nj-border-strong)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-[var(--nj-ink-subtle)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar álbum, ano ou música..."
            className="nj-input w-full rounded-md py-2 pr-3 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Discography Split: Album Covers Grid + Active Album Tracklist */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
          {filteredProjects.map((project, index) => {
            const isSelected = selectedProject?.id === project.id;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelectAlbum(project)}
                className={`nj-card group overflow-hidden text-left transition ${
                  isSelected ? 'ring-2 ring-[#B1D3AE]' : 'hover:border-[var(--nj-border-strong)]'
                }`}
              >
                <div className="relative">
                  <AlbumCoverArt
                    variant={project.artworkStyle ?? index}
                    title={project.title}
                    year={project.year}
                    coverImageUrl={project.coverImageUrl}
                    className="h-40"
                  />
                  <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-[#213228]/90 px-2.5 py-1 text-[11px] font-medium text-[#B1D3AE] shadow">
                    <Play className="h-3 w-3" aria-hidden="true" />
                    Ouvir prévia
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[var(--nj-accent-text)]">
                    {project.type.toUpperCase()} · {project.year} · {project.tracks.length} faixa(s)
                  </p>
                  <p className="mt-1 font-serif text-lg font-semibold text-[var(--nj-ink)]">
                    {project.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Project Tracks & Actions */}
        {selectedProject && (
          <aside className="nj-card h-fit p-6 lg:sticky lg:top-20 lg:col-span-5">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              Projeto selecionado · {selectedProject.year}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
              {selectedProject.title}
            </h2>

            <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-[var(--nj-accent-text)]">
              <a href={selectedProject.spotifyUrl} target="_blank" rel="noreferrer" className="hover:underline">
                Spotify ↗
              </a>
              <a href={selectedProject.appleMusicUrl} target="_blank" rel="noreferrer" className="hover:underline">
                Apple Music ↗
              </a>
              <a href={selectedProject.amazonMusicUrl} target="_blank" rel="noreferrer" className="hover:underline">
                Amazon Music ↗
              </a>
              <a href={selectedProject.youtubeUrl} target="_blank" rel="noreferrer" className="hover:underline">
                YouTube ↗
              </a>
            </div>

            <div className="mt-5 divide-y divide-[var(--nj-border)]">
              {selectedProject.tracks.map((track) => {
                const isFav = favoriteTrackIds.includes(track.id);
                const isPlaying = activePreviewTrackTitle === track.title;
                return (
                  <div key={track.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayTrackPreview(selectedProject, track)}
                        className="text-left"
                      >
                        <p
                          className={`text-sm font-semibold transition ${
                            isPlaying ? 'text-[var(--nj-accent-text)]' : 'text-[var(--nj-ink)] hover:text-[var(--nj-accent-text)]'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-[var(--nj-ink-subtle)]">
                          Tom {track.key} · {track.bpm} BPM · {track.duration}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavoriteTrack(track.id)}
                        className="rounded-md p-1.5 text-[var(--nj-ink-muted)] hover:bg-[#466053]/20"
                        aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar música'}
                      >
                        <Heart
                          className={`h-4 w-4 ${isFav ? 'fill-[#B1D3AE] text-[#B1D3AE]' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayTrackPreview(selectedProject, track)}
                        className="nj-btn-primary inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs"
                      >
                        <Play className="h-3 w-3" aria-hidden="true" />
                        Ouvir prévia
                      </button>
                      <button
                        type="button"
                        onClick={() => setLyricModalTrack({ project: selectedProject, track })}
                        className="nj-btn-secondary inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs"
                      >
                        Letra e cifra
                      </button>
                      {nextRepertoire && (
                        <button
                          type="button"
                          onClick={() =>
                            addSongToRepertoire(nextRepertoire.id, {
                              title: track.title,
                              artist: 'Ministério Nova Jerusalém',
                              album: `${selectedProject.title} (${selectedProject.year})`,
                              origin: 'min_nj',
                              key: track.key,
                              bpm: track.bpm,
                              referenceUrl: selectedProject.spotifyUrl,
                              notes: 'Adicionada via Discografia Min. Nova Jerusalém',
                            })
                          }
                          className="nj-btn-secondary inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          Repertório
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Lyrics & Chords Modal */}
      {lyricModalTrack && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lyric-modal-title"
        >
          <div className="nj-card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--nj-border)] pb-4">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  {lyricModalTrack.project.title} ({lyricModalTrack.project.year}) · Tom {lyricModalTrack.track.key} · {lyricModalTrack.track.bpm} BPM
                </p>
                <h3 id="lyric-modal-title" className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                  {lyricModalTrack.track.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLyricModalTrack(null)}
                className="rounded-md p-1.5 text-[var(--nj-ink-muted)] hover:bg-[#466053]/20"
                aria-label="Fechar letra e cifra"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="nj-paper rounded-lg p-4">
                <p className="text-xs font-semibold tracking-widest uppercase text-[#466053]">Letra</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#213228]">
                  {lyricModalTrack.track.lyrics}
                </pre>
              </div>
              <div className="rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4">
                <p className="text-xs font-semibold tracking-widest uppercase text-[var(--nj-accent-text)]">
                  Cifra / Guia Harmônico
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--nj-ink)]">
                  {lyricModalTrack.track.chords}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--nj-border)] pt-4">
              <a
                href={lyricModalTrack.project.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--nj-accent-text)] hover:underline"
              >
                Assistir no YouTube Min. Nova Jerusalém
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => setLyricModalTrack(null)}
                className="nj-btn-primary rounded-md px-4 py-2 text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Re-export helpers used across views
export { Users, Check, volunteerStatusLabel };
