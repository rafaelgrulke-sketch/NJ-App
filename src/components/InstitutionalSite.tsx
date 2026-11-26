import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Copy,
  Download,
  ExternalLink,
  HandHeart,
  Lock,
  LogOut,
  MapPin,
  Music,
  Play,
  Radio,
  ShieldCheck,
  X,
} from 'lucide-react';
import { MUSIC_PLATFORM_CHANNELS } from '../data/initialData';
import { useChurch } from '../context/ChurchContext';
import { ChurchEvent, EnvironmentMode, PrayerPrivacy } from '../types/church';
import { buildPixCopyPaste, downloadEbdLessonPdf, formatDatePtBR } from '../utils/formatters';
import { AlbumCoverArt, BrandLogoMark, PixQrCodeSvg, SanctuaryArchitectureArt } from './EditorialArt';
import { PWAInstallButton, ThemeToggleButton } from './PWAInstallButton';
import { AdminLoginModal } from './ui/AdminLoginModal';
import { AccessibleModal } from './ui/DesignPrimitives';
import { EventArtCard, EventDetailModal } from './ui/EventArtCard';
import { InformativoVideoPlayer } from './ui/InformativoVideoPlayer';

interface InstitutionalSiteProps {
  onSwitchEnvironment: (mode: EnvironmentMode, initialAppTab?: string) => void;
}

export const InstitutionalSite: React.FC<InstitutionalSiteProps> = ({ onSwitchEnvironment }) => {
  const {
    churchInfo,
    weeklyInformativo,
    institutionalAreas,
    events,
    ebdLessons,
    ebdClasses,
    discography,
    videos,
    announcements,
    eventReminders,
    toggleEventReminder,
    registerForEvent,
    submitPrayer,
    notify,
    authUser,
    hasScheduleAccess,
    signOutUser,
  } = useChurch();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showInformativoModal, setShowInformativoModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);
  const [pixPurpose, setPixPurpose] = useState('Oferta Voluntária');
  const [pixAmount, setPixAmount] = useState('');
  const [prayerName, setPrayerName] = useState('');
  const [prayerIsVisitor, setPrayerIsVisitor] = useState(true);
  const [prayerCategory, setPrayerCategory] = useState('Família');
  const [prayerPrivacy, setPrayerPrivacy] = useState<PrayerPrivacy>('comunidade');
  const [prayerMessage, setPrayerMessage] = useState('');

  const currentLesson =
    ebdLessons.find((l) => l.isCurrentWeek && l.status === 'publicada') ||
    ebdLessons.find((l) => l.status === 'publicada') ||
    ebdLessons[0];

  const featuredAlbum = discography[0];
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${churchInfo.address}, ${churchInfo.neighborhood}, ${churchInfo.cityState}, ${churchInfo.cep}`
  )}`;

  const pixPayload = useMemo(
    () => buildPixCopyPaste(churchInfo.pixKey, pixPurpose, pixAmount),
    [churchInfo.pixKey, pixPurpose, pixAmount]
  );

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(`${label} copiado para a área de transferência.`);
    } catch {
      notify(`${label}: ${value}`);
    }
  };

  const handlePublicPrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerMessage.trim()) return;
    submitPrayer({
      authorName: prayerName.trim(),
      isVisitor: prayerIsVisitor,
      category: prayerCategory,
      message: prayerMessage.trim(),
      privacy: prayerPrivacy,
    });
    setPrayerMessage('');
  };

  return (
    <div className="min-h-screen bg-[var(--nj-canvas)] text-[var(--nj-ink)]">
      {/* Top Bar Contract: strictly 3 zones separated by gap-8 */}
      <header
        className="sticky top-0 z-30 border-b border-[var(--nj-border)] backdrop-blur-sm"
        style={{ backgroundColor: 'var(--nj-header-bg)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
          <a
            href="#inicio"
            className="inline-flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight text-[var(--nj-ink)] whitespace-nowrap shrink-0"
          >
            <BrandLogoMark size="sm" />
            <span>{churchInfo.displayName}</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--nj-ink-muted)] lg:flex" aria-label="Navegação principal">
            <a href="#programacao" className="transition-colors hover:text-[var(--nj-accent-text)] whitespace-nowrap shrink-0">
              Programação
            </a>
            <a href="#conheca" className="transition-colors hover:text-[var(--nj-accent-text)] whitespace-nowrap shrink-0">
              Conheça a Igreja
            </a>
            <a href="#ebd" className="transition-colors hover:text-[var(--nj-accent-text)] whitespace-nowrap shrink-0">
              EBD Digital
            </a>
            <a href="#musica" className="transition-colors hover:text-[var(--nj-accent-text)] whitespace-nowrap shrink-0">
              Min. Nova Jerusalém
            </a>
            <a href="#transmissoes" className="transition-colors hover:text-[var(--nj-accent-text)] whitespace-nowrap shrink-0">
              Transmissões
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onSwitchEnvironment('app', 'inicio')}
              className="nj-btn-primary rounded-md px-4 py-2 text-sm whitespace-nowrap shrink-0"
            >
              Acessar NJ App
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Institutional Hero */}
        <section id="inicio" className="mx-auto max-w-7xl px-6 pt-12 pb-10 lg:pt-16">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  {churchInfo.officialName} · Desde {churchInfo.foundedDate}
                </p>
                <h1 className="mt-4 font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-[var(--nj-ink)] sm:text-5xl">
                  Uma igreja acolhedora, bíblica e em constante renovação espiritual.
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--nj-ink-muted)] sm:text-base">
                  Bem-vindo à plataforma oficial da <strong>{churchInfo.displayName}</strong> no Rio de Janeiro. Acompanhe nossos cultos, inscreva-se nas programações, estude pela EBD Digital, ouça o Ministério Nova Jerusalém e gerencie as escalas ministeriais.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSwitchEnvironment('app', 'inicio')}
                    className="nj-btn-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm whitespace-nowrap shrink-0"
                  >
                    Abrir Aplicativo NJ
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <PWAInstallButton variant="subtle" />
                  <ThemeToggleButton />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-5 text-xs font-medium text-[var(--nj-ink-subtle)]">
                  <button
                    type="button"
                    onClick={() => onSwitchEnvironment('app', 'igreja')}
                    className="underline decoration-[var(--nj-border-strong)] underline-offset-4 hover:text-[var(--nj-accent-text)]"
                  >
                    Conheça nossa igreja
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchEnvironment('admin')}
                    className="underline decoration-[var(--nj-border-strong)] underline-offset-4 hover:text-[var(--nj-accent-text)]"
                  >
                    Painel Administrativo
                  </button>
                  <a
                    href={churchInfo.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[var(--nj-accent-text)]"
                  >
                    {churchInfo.instagramHandle}
                  </a>
                </div>
              </div>

              {announcements[0] && (
                <div className="mt-10 border-t border-[var(--nj-border)] pt-5">
                  <p className="text-xs text-[var(--nj-accent-text)]">
                    Comunicado em destaque · {announcements[0].department} · {formatDatePtBR(announcements[0].date)}
                  </p>
                  <p className="mt-1.5 font-serif text-xl font-semibold text-[var(--nj-ink)]">
                    {announcements[0].title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--nj-ink-muted)]">{announcements[0].body}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-6">
              <div className="relative flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-xl border border-[var(--nj-border)]">
                <SanctuaryArchitectureArt className="absolute inset-0 h-full w-full" />
                <div className="relative z-10 bg-gradient-to-t from-[#213228]/95 via-[#213228]/60 to-transparent p-7 text-[#F3F1E9]">
                  <div className="mb-4 flex items-center gap-3">
                    <BrandLogoMark size="md" />
                    <div>
                      <p className="text-xs tracking-widest uppercase text-[#B1D3AE]">Próximo Culto</p>
                      <p className="text-xs text-[#F3F1E9]/80">{churchInfo.address} · {churchInfo.neighborhood}</p>
                    </div>
                  </div>
                  <p className="font-serif text-2xl font-semibold sm:text-3xl">
                    {events[0]?.title}
                  </p>
                  <p className="mt-2 text-sm text-[#F3F1E9]/85 tabular-nums">
                    {events[0] ? `${formatDatePtBR(events[0].date)} · ${events[0].time} · ${events[0].location}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Utility Ribbon — Programação Semanal Real */}
          <div
            id="programacao"
            className="mt-12 grid grid-cols-1 gap-6 border-y border-[var(--nj-border)] py-7 sm:grid-cols-2 lg:grid-cols-4"
          >
            {churchInfo.weeklyServices.slice(0, 3).map((srv) => (
              <div key={srv.id}>
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  {srv.day}
                </p>
                <p className="mt-2 font-serif text-xl font-semibold text-[var(--nj-ink)]">{srv.title}</p>
                <p className="mt-1 font-mono text-sm text-[var(--nj-ink-muted)] tabular-nums">{srv.time}</p>
              </div>
            ))}
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                {churchInfo.weeklyServices[3]?.day || 'Quinta-feira'} · Endereço
              </p>
              <p className="mt-2 font-serif text-xl font-semibold text-[var(--nj-ink)]">
                {churchInfo.weeklyServices[3]?.title || 'Culto do Renovo'} ({churchInfo.weeklyServices[3]?.time || '19h30'})
              </p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--nj-accent-text)] hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                {churchInfo.address}, {churchInfo.neighborhood} – RJ
              </a>
            </div>
          </div>
        </section>

        {/* 01. Conheça Nossa Igreja + Departamentos */}
        <section id="conheca" className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--nj-border)] pb-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                01. Conheça Nossa Igreja
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                História, liderança pastoral e ministérios em ação
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSwitchEnvironment('app', 'igreja')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nj-accent-text)] hover:underline self-start md:self-auto whitespace-nowrap"
            >
              Ver página institucional completa
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="nj-card p-7 lg:col-span-5">
              <p className="text-xs font-medium text-[var(--nj-accent-text)]">
                Fundação: {churchInfo.foundedDate} · Sampaio, Rio de Janeiro – RJ
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--nj-ink-muted)]">{churchInfo.history}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--nj-border)] pt-4 text-xs">
                <div>
                  <dt className="text-[var(--nj-ink-subtle)]">Pastor Fundador</dt>
                  <dd className="mt-0.5 font-serif text-base font-semibold text-[var(--nj-ink)]">
                    {churchInfo.foundingPastor}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--nj-ink-subtle)]">Pastor Presidente</dt>
                  <dd className="mt-0.5 font-serif text-base font-semibold text-[var(--nj-ink)]">
                    {churchInfo.presidentPastor}
                  </dd>
                  <p className="text-[11px] text-[var(--nj-ink-subtle)]">Desde {churchInfo.presidencyStart}</p>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              {institutionalAreas.slice(0, 6).map((area) => (
                <div key={area.id} className="nj-card p-5">
                  <p className="text-[11px] font-medium text-[var(--nj-accent-text)]">{area.subtitle}</p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-[var(--nj-ink)]">{area.name}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--nj-ink-muted)]">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 02. Programação & Informativo NJ */}
        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--nj-border)] pb-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                02. Programação & Informativo NJ
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                Vídeo semanal do Informativo NJ e eventos da semana
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSwitchEnvironment('app', 'agenda')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nj-accent-text)] hover:underline self-start md:self-auto whitespace-nowrap"
            >
              Abrir Programação completa
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Destaque do Vídeo Semanal do Informativo NJ */}
          <div className="nj-card mt-8 flex flex-col justify-between gap-5 p-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                Vídeo da Semana · {weeklyInformativo.weekLabel}
              </p>
              <h3 className="mt-1.5 font-display text-xl font-semibold text-[var(--nj-ink)] sm:text-2xl">
                {weeklyInformativo.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--nj-ink-muted)]">
                {weeklyInformativo.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowInformativoModal(true)}
                className="nj-btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Assistir Informativo NJ
              </button>
              <button
                type="button"
                onClick={() => onSwitchEnvironment('app', 'agenda')}
                className="nj-btn-secondary rounded-lg px-4 py-2.5 text-xs"
              >
                Ver Programação no App
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map((ev) => (
              <EventArtCard
                key={ev.id}
                event={ev}
                onSelect={(clicked) => setSelectedEvent(clicked)}
              />
            ))}
          </div>
        </section>

        {/* 03. EBD Digital */}
        <section id="ebd" className="border-y border-[var(--nj-border)] bg-[var(--nj-canvas-alt)] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  03. EBD Digital — Domingos das 09h às 10h
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                  Lições autorais da Nova Jerusalém para estudo durante toda a semana.
                </h2>

                {currentLesson && (
                  <div className="nj-paper mt-6 p-7">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--nj-paper-muted)] tabular-nums">
                      <span className="font-semibold text-[var(--nj-paper-ink)]">
                        Lição {String(currentLesson.number).padStart(2, '0')} em destaque
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{currentLesson.quarter}</span>
                      <span aria-hidden="true">·</span>
                      <span>{currentLesson.bibleText}</span>
                    </div>
                    <h3 className="mt-3 font-serif text-2xl font-semibold text-[var(--nj-paper-ink)]">
                      {currentLesson.title}
                    </h3>
                    <p className="mt-3 font-serif text-base italic text-[var(--nj-paper-muted)]">
                      {currentLesson.goldenVerse}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--nj-paper-ink)]/85">
                      {currentLesson.summary}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onSwitchEnvironment('app', 'ebd')}
                        className="inline-flex items-center gap-2 rounded-md bg-[#213228] px-4 py-2 text-sm font-medium text-[#F3F1E9] hover:bg-[#466053]"
                      >
                        <BookOpen className="h-4 w-4" />
                        Ler lição online
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          downloadEbdLessonPdf(currentLesson);
                          notify(`Download iniciado: ${currentLesson.pdfFileName}`);
                        }}
                        className="inline-flex items-center gap-2 rounded-md border border-[#5D705D] px-4 py-2 text-sm font-medium text-[#213228] hover:bg-[#213228]/8"
                      >
                        <Download className="h-4 w-4" />
                        Baixar PDF offline
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5">
                <h3 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                  Classes e Localização das Salas
                </h3>
                <p className="mt-1 text-xs text-[var(--nj-accent-text)]">
                  Domingos, 09h às 10h · Logo após, Culto Pastoral às 10h10
                </p>
                <div className="mt-5 divide-y divide-[var(--nj-border)] border-y border-[var(--nj-border)]">
                  {ebdClasses.map((cls) => (
                    <div key={cls.id} className="py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="text-sm font-semibold text-[var(--nj-ink)]">{cls.name}</p>
                        <span className="text-xs font-medium text-[var(--nj-accent-text)] whitespace-nowrap">
                          {cls.room} · {cls.floor}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                        {cls.ageGroup} · {cls.teacher}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04. Min. Nova Jerusalém + Transmissões */}
        <section id="musica" className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                04. Min. Nova Jerusalém · Discografia 2001–2025
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                {discography.length} projetos oficiais nas plataformas de streaming
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--nj-ink-muted)]">
                De <em>Bom É Louvar a Deus</em> (2001) e <em>Gerados para Adorar</em> (2013) ao lançamento <em>Te Aguardamos</em> (2025). Acesse o player oficial e letras/cifras no NJ App.
              </p>

              {featuredAlbum && (
                <div className="nj-card mt-6 grid grid-cols-1 overflow-hidden sm:grid-cols-5">
                  <AlbumCoverArt
                    variant={0}
                    title={featuredAlbum.title}
                    year={featuredAlbum.year}
                    className="min-h-[180px] sm:col-span-2"
                  />
                  <div className="flex flex-col justify-between p-5 sm:col-span-3">
                    <div>
                      <p className="text-xs text-[var(--nj-accent-text)] tabular-nums">
                        Lançamento recente · {featuredAlbum.year}
                      </p>
                      <h3 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                        {featuredAlbum.title}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                        Ministério Nova Jerusalém · @m_novajerusalem
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {[
                        { label: 'Spotify', url: MUSIC_PLATFORM_CHANNELS.spotifyAlbumUrl },
                        { label: 'Apple Music', url: MUSIC_PLATFORM_CHANNELS.appleMusicUrl },
                        { label: 'Amazon Music', url: MUSIC_PLATFORM_CHANNELS.amazonMusicUrl },
                        { label: 'YouTube', url: MUSIC_PLATFORM_CHANNELS.youtubeMinistryUrl },
                      ].map((plat) => (
                        <a
                          key={plat.label}
                          href={plat.url}
                          target="_blank"
                          rel="noreferrer"
                          className="nj-btn-secondary inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs"
                        >
                          {plat.label} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => onSwitchEnvironment('app', 'musica')}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nj-accent-text)] hover:underline"
              >
                <Music className="h-4 w-4" />
                Explorar toda a discografia, Spotify Embed e repertórios
              </button>
            </div>

            <div id="transmissoes" className="lg:col-span-6">
              <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                05. Cultos Ao Vivo & Pregações Gravadas (YouTube)
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                Entre na Live ou assista às pregações do canal
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--nj-ink-muted)]">
                Conexão direta com o canal oficial da {churchInfo.displayName} no YouTube para cultos ao vivo e mensagens gravadas.
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <a
                  href={MUSIC_PLATFORM_CHANNELS.youtubeChurchLiveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Entrar na Live (YouTube)
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={MUSIC_PLATFORM_CHANNELS.youtubeChurchVideosUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
                >
                  Ver Pregações Gravadas no Canal
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={() => onSwitchEnvironment('app', 'transmissoes')}
                  className="nj-btn-secondary rounded-md px-3.5 py-2 text-xs"
                >
                  Abrir acervo no App
                </button>
              </div>

              <div className="mt-5 divide-y divide-[var(--nj-border)] border-y border-[var(--nj-border)]">
                {videos.slice(0, 3).map((vid) => (
                  <div key={vid.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--nj-accent-text)] tabular-nums">
                        {vid.isLive ? 'Culto gravado' : vid.series} · {formatDatePtBR(vid.date)} · {vid.duration}
                      </p>
                      <p className="mt-1 truncate font-serif text-lg font-semibold text-[var(--nj-ink)]">
                        {vid.title}
                      </p>
                      <p className="text-xs text-[var(--nj-ink-subtle)]">{vid.preacher}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveVideoId(vid.youtubeId)}
                      className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap shrink-0"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Assistir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 06. Pedidos de Oração & Ofertas (Abertos a Membros e Visitantes) */}
        <section className="border-t border-[var(--nj-border)] bg-[var(--nj-canvas-alt)] py-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-12">
            {/* Ofertas & Dízimos — Aberto a Todos */}
            <div className="nj-card space-y-5 p-7 lg:col-span-6">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  06. Dízimos e Ofertas · Membros e Visitantes
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                  Contribua via Pix com transparência
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--nj-ink-muted)]">
                  Aberto a membros e visitantes. Escolha a destinação e use a chave Pix ou o QR Code oficial abaixo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['Oferta Voluntária', 'Dízimo', 'Missões', 'Ação Social'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPixPurpose(p)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      pixPurpose === p ? 'nj-tab-active' : 'nj-btn-secondary'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-12">
                <div className="space-y-3 sm:col-span-7">
                  <input
                    type="text"
                    value={pixAmount}
                    onChange={(e) => setPixAmount(e.target.value)}
                    placeholder="Valor opcional (ex.: 50,00)"
                    className="nj-input w-full rounded-md px-3 py-2 text-xs"
                  />
                  <div className="rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-3 text-xs">
                    <p className="text-[var(--nj-ink-subtle)]">Chave Pix ({churchInfo.pixKeyType})</p>
                    <p className="mt-0.5 font-mono font-semibold text-[var(--nj-ink)] break-all">
                      {churchInfo.pixKey}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(churchInfo.pixKey, 'Chave Pix')}
                      className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar chave
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(pixPayload, 'Código Pix Copia e Cola')}
                      className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Pix Copia e Cola
                    </button>
                  </div>
                </div>
                <div className="flex justify-center sm:col-span-5">
                  <PixQrCodeSvg seed={pixPayload} />
                </div>
              </div>
              <p className="text-[11px] text-[var(--nj-ink-subtle)]">{churchInfo.cnpjNote}</p>
            </div>

            {/* Pedido de Oração Direto — Aberto a Todos (Inclusive Visitantes) */}
            <form onSubmit={handlePublicPrayerSubmit} className="nj-card-olive space-y-4 p-7 lg:col-span-6">
              <div>
                <div className="flex items-center gap-2 text-[var(--nj-accent-text)]">
                  <HandHeart className="h-4 w-4" />
                  <p className="text-xs font-semibold tracking-wider uppercase">
                    07. Pedido de Oração · Aberto a Visitantes e Membros
                  </p>
                </div>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                  Queremos orar por você e sua família
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--nj-ink-muted)]">
                  Envie seu pedido diretamente por aqui, sem precisar de login. Escolha se deseja compartilhar no mural ou manter sigilo pastoral (LGPD).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={prayerPrivacy}
                  onChange={(e) => setPrayerPrivacy(e.target.value as PrayerPrivacy)}
                  className="nj-input rounded-md px-3 py-2 text-xs"
                >
                  <option value="comunidade">Mural da Comunidade</option>
                  <option value="equipe_identificado">Sigiloso — Pastoral (Identificado)</option>
                  <option value="equipe_anonimo">Sigiloso — Pastoral (Anônimo)</option>
                </select>
                <select
                  value={prayerCategory}
                  onChange={(e) => setPrayerCategory(e.target.value)}
                  className="nj-input rounded-md px-3 py-2 text-xs"
                >
                  {['Família', 'Saúde', 'Gratidão', 'Trabalho e Estudos', 'Renovação Espiritual'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {prayerPrivacy !== 'equipe_anonimo' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={prayerName}
                    onChange={(e) => setPrayerName(e.target.value)}
                    placeholder="Seu nome (opcional)"
                    className="nj-input w-full rounded-md px-3 py-2 text-xs"
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--nj-ink-muted)]">
                    <input
                      type="checkbox"
                      checked={prayerIsVisitor}
                      onChange={(e) => setPrayerIsVisitor(e.target.checked)}
                      className="accent-[#466053]"
                    />
                    <span>Sou visitante</span>
                  </label>
                </div>
              )}

              <textarea
                required
                rows={3}
                value={prayerMessage}
                onChange={(e) => setPrayerMessage(e.target.value)}
                placeholder="Escreva aqui o seu pedido de oração..."
                className="nj-input w-full rounded-md px-3 py-2 text-xs"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="flex items-center gap-1.5 text-[11px] text-[var(--nj-ink-subtle)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--nj-accent-text)]" />
                  Protegido pela LGPD
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSwitchEnvironment('app', 'oracao')}
                    className="nj-btn-secondary rounded-md px-3 py-2 text-xs"
                  >
                    Ver mural completo
                  </button>
                  <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                    Enviar pedido
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Quiet Institutional Footer */}
      <footer
        className="border-t border-[var(--nj-border)] py-10"
        style={{ backgroundColor: 'var(--nj-footer-bg)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3.5">
            <BrandLogoMark size="md" />
            <div>
              <p className="font-serif text-lg font-semibold text-[var(--nj-ink)]">{churchInfo.officialName}</p>
              <p className="mt-0.5 text-xs text-[var(--nj-ink-subtle)]">
                {churchInfo.address}, {churchInfo.neighborhood}, {churchInfo.cityState} · CEP {churchInfo.cep} · Tel. {churchInfo.phonePrimary} · {churchInfo.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[var(--nj-ink-muted)]">
            <button type="button" onClick={() => onSwitchEnvironment('app', 'inicio')} className="hover:text-[var(--nj-accent-text)]">
              NJ App
            </button>
            {hasScheduleAccess && (
              <button type="button" onClick={() => onSwitchEnvironment('app', 'ministerios')} className="hover:text-[var(--nj-accent-text)]">
                Minhas Escalas
              </button>
            )}
            {authUser ? (
              <>
                <button
                  type="button"
                  onClick={() => onSwitchEnvironment('admin')}
                  className="inline-flex items-center gap-1.5 text-[var(--nj-accent-text)] hover:underline"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Painel Admin
                </button>
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="inline-flex items-center gap-1 hover:text-[var(--nj-accent-text)]"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sair
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-1.5 hover:text-[var(--nj-accent-text)]"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Área Administrativa / Login
              </button>
            )}
          </div>
        </div>
      </footer>

      <AdminLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => onSwitchEnvironment('admin')}
      />

      {/* Event Detail & Registration Modal */}
      <EventDetailModal
        event={selectedEvent}
        churchAddress={`${churchInfo.address}, ${churchInfo.neighborhood}`}
        isReminded={selectedEvent ? eventReminders.includes(selectedEvent.id) : false}
        onClose={() => setSelectedEvent(null)}
        onToggleReminder={toggleEventReminder}
        onRegister={registerForEvent}
        onNotify={(msg) => notify(msg)}
      />

      {/* Weekly Informativo NJ Modal (Native Server Video or YouTube Autoplay) */}
      <AccessibleModal
        open={showInformativoModal}
        onClose={() => setShowInformativoModal(false)}
        title={weeklyInformativo.title}
        subtitle={`Informativo NJ · ${weeklyInformativo.weekLabel}`}
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[var(--nj-border)]">
            <InformativoVideoPlayer informativo={weeklyInformativo} autoPlay />
          </div>
          <p className="text-sm leading-relaxed text-[var(--nj-ink-muted)]">
            {weeklyInformativo.summary}
          </p>
        </div>
      </AccessibleModal>

      {/* YouTube Sermon Player Modal */}
      {activeVideoId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1611]/80 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveVideoId(null);
          }}
        >
          <div className="nj-card w-full max-w-3xl overflow-hidden bg-[var(--nj-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--nj-border)] px-5 py-3.5">
              <span className="text-sm font-semibold text-[var(--nj-ink)]">
                Transmissão Oficial — {churchInfo.displayName}
              </span>
              <button
                type="button"
                onClick={() => setActiveVideoId(null)}
                className="nj-icon-btn"
                aria-label="Fechar vídeo"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}`}
                title="Transmissão Oficial Nova Jerusalém Sampaio"
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
