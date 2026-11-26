import React, { useState } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  Church,
  Compass,
  Globe,
  HandHeart,
  HeartHandshake,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Music,
  Radio,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { EnvironmentMode } from '../types/church';
import { BrandLogoMark } from './EditorialArt';
import { PWAInstallButton, ThemeToggleButton } from './PWAInstallButton';
import { AdminLoginModal } from './ui/AdminLoginModal';
import { AboutChurchView } from './member/AboutChurchView';
import { MinistriesHubView } from './member/MinistriesHubView';
import {
  BroadcastsView,
  ContributionsView,
  NotificationsView,
  PrayerRequestsView,
  SpiritualContentView,
} from './member/MemberCommunityViews';
import {
  AgendaInformativoView,
  EbdDigitalView,
  MemberHomeView,
  MemberTab,
  MusicMinistryView,
} from './member/MemberCoreViews';

const VALID_TABS: MemberTab[] = [
  'inicio',
  'agenda',
  'ministerios',
  'ebd',
  'musica',
  'igreja',
  'oracao',
  'transmissoes',
  'espiritual',
  'contribuicoes',
  'notificacoes',
  'mais',
];

function resolveInitialTab(tab?: string): { tab: MemberTab; subMode: 'central' | 'minhas' } {
  if (tab === 'escalas' || tab === 'minhas') {
    return { tab: 'ministerios', subMode: 'minhas' };
  }
  if (tab && VALID_TABS.includes(tab as MemberTab)) {
    return { tab: tab as MemberTab, subMode: 'central' };
  }
  return { tab: 'inicio', subMode: 'central' };
}

export const MemberApp: React.FC<{
  initialTab?: string;
  onSwitchEnvironment: (mode: EnvironmentMode, tab?: string) => void;
}> = ({ initialTab = 'inicio', onSwitchEnvironment }) => {
  const initial = resolveInitialTab(initialTab);
  const [activeTab, setActiveTab] = useState<MemberTab>(initial.tab);
  const [ministrySubMode, setMinistrySubMode] = useState<'central' | 'minhas'>(initial.subMode);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    churchInfo,
    currentMemberName,
    notifications,
    authUser,
    authLoading,
    realRole,
    hasScheduleAccess,
    dataLoading,
    dataError,
    signOutUser,
  } = useChurch();

  const roleDisplayName: Record<string, string> = {
    superadmin: 'Superadministrador',
    pastoral: 'Pastor / Liderança Geral',
    admin_conteudo: 'Administrador de Conteúdo',
    coord_ebd: 'Coordenador da EBD',
    lider_ministerio: 'Líder de Ministério',
    voluntario: 'Voluntário',
    membro: 'Membro Conectado',
    visitante: 'Visitante',
  };

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const navigate = (tab: MemberTab, subMode: 'central' | 'minhas' = 'central') => {
    setMinistrySubMode(subMode);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sidebarItems: {
    id: MemberTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'agenda', label: 'Programação', icon: Calendar },
    ...(hasScheduleAccess ? [{ id: 'ministerios' as MemberTab, label: 'Minhas Escalas', icon: Users }] : []),
    { id: 'ebd', label: 'EBD Digital', icon: BookOpen },
    { id: 'musica', label: 'Min. Nova Jerusalém', icon: Music },
    { id: 'igreja', label: 'Conheça Nossa Igreja', icon: Church },
    { id: 'transmissoes', label: 'Transmissões', icon: Radio },
    { id: 'oracao', label: 'Pedidos de Oração', icon: HandHeart },
    { id: 'espiritual', label: 'Conteúdos Espirituais', icon: Sparkles },
    { id: 'contribuicoes', label: 'Contribuições Pix', icon: HeartHandshake },
    { id: 'notificacoes', label: 'Notificações', icon: Bell, badge: unreadNotifs || undefined },
  ];

  const mobileTabs: {
    id: MemberTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'agenda', label: 'Programação', icon: Calendar },
    hasScheduleAccess
      ? { id: 'ministerios', label: 'Escalas', icon: Users }
      : { id: 'musica', label: 'Min. NJ', icon: Music },
    { id: 'ebd', label: 'EBD', icon: BookOpen },
    { id: 'mais', label: 'Mais', icon: LayoutGrid },
  ];

  const topNavItems: { label: string; tab: MemberTab }[] = [
    { label: 'Início', tab: 'inicio' },
    { label: 'Programação', tab: 'agenda' },
    ...(hasScheduleAccess ? [{ label: 'Escalas', tab: 'ministerios' as MemberTab }] : []),
    { label: 'EBD Digital', tab: 'ebd' },
    { label: 'Min. Nova Jerusalém', tab: 'musica' },
  ];

  return (
    <div className="min-h-screen bg-[var(--nj-canvas)] text-[var(--nj-ink)]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--nj-border)] bg-[var(--nj-header-bg)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('inicio')}
            className="flex items-center gap-3 text-left shrink-0"
          >
            <BrandLogoMark size="sm" />
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold whitespace-nowrap text-[var(--nj-ink)]">
                NJ App
              </p>
              <p className="text-[11px] whitespace-nowrap text-[var(--nj-ink-subtle)]">
                {churchInfo.displayName}
              </p>
            </div>
          </button>

          <nav aria-label="Navegação rápida do aplicativo" className="hidden items-center gap-8 md:flex">
            {topNavItems.map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => navigate(item.tab)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 transition ${
                  activeTab === item.tab
                    ? 'text-[var(--nj-accent-text)]'
                    : 'text-[var(--nj-ink-muted)] hover:text-[var(--nj-ink)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => onSwitchEnvironment('site')}
            className="nj-btn-secondary rounded-md px-3.5 py-2 text-xs whitespace-nowrap shrink-0"
          >
            Site Oficial
          </button>
        </div>
      </header>

      {/* Main Shell: Desktop Sidebar + Content */}
      <div className="mx-auto flex max-w-7xl gap-8 px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-12">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-22 space-y-5">
            <div className="nj-card space-y-2.5 p-4">
              <div>
                <p className="text-xs text-[var(--nj-ink-subtle)]">
                  {authUser ? 'Conta autenticada' : 'Navegação como visitante'}
                </p>
                <p className="mt-0.5 truncate font-serif text-lg font-semibold text-[var(--nj-ink)]">
                  {currentMemberName}
                </p>
                <p className="mt-0.5 text-xs text-[var(--nj-accent-text)]">
                  {roleDisplayName[realRole] || 'Membro'}
                </p>
              </div>
              {authUser ? (
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  disabled={authLoading}
                  className="nj-btn-secondary inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sair da conta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  disabled={authLoading}
                  className="nj-btn-primary inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  {authLoading ? 'Entrando...' : 'Entrar / Login'}
                </button>
              )}
            </div>

            <nav aria-label="Menu do aplicativo" className="nj-card p-2">
              <ul className="space-y-0.5">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigate(item.id)}
                        className={`flex w-full items-center justify-between gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition ${
                          isActive
                            ? 'nj-tab-active'
                            : 'text-[var(--nj-ink-muted)] hover:bg-[#466053]/15 hover:text-[var(--nj-ink)]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </span>
                        {item.badge ? (
                          <span className="font-mono text-[11px] font-semibold tabular-nums">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="nj-card space-y-2.5 p-4">
              <p className="text-[11px] font-medium tracking-widest uppercase text-[var(--nj-ink-subtle)]">
                Preferências e Ambientes
              </p>
              <div className="flex flex-col gap-2">
                <ThemeToggleButton />
                <PWAInstallButton />
                <button
                  type="button"
                  onClick={() => onSwitchEnvironment('admin')}
                  className="nj-btn-secondary inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs"
                >
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  Painel Administrativo
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Active View */}
        <main className="min-w-0 flex-1">
          {dataLoading && (
            <div className="mb-4 rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] px-4 py-2.5 text-xs text-[var(--nj-ink-muted)]">
              Sincronizando dados em tempo real com o Firebase...
            </div>
          )}
          {dataError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-[var(--nj-ink)]"
            >
              {dataError}
            </div>
          )}
          {activeTab === 'inicio' && <MemberHomeView onNavigate={(t) => navigate(t)} />}
          {activeTab === 'agenda' && <AgendaInformativoView />}
          {activeTab === 'ministerios' && (
            <MinistriesHubView
              key={ministrySubMode}
              initialSubMode={ministrySubMode}
              onRequestLogin={() => setShowLoginModal(true)}
            />
          )}
          {activeTab === 'ebd' && <EbdDigitalView />}
          {activeTab === 'musica' && <MusicMinistryView />}
          {activeTab === 'igreja' && <AboutChurchView />}
          {activeTab === 'transmissoes' && <BroadcastsView />}
          {activeTab === 'oracao' && <PrayerRequestsView />}
          {activeTab === 'espiritual' && <SpiritualContentView />}
          {activeTab === 'contribuicoes' && <ContributionsView />}
          {activeTab === 'notificacoes' && <NotificationsView onNavigate={(t) => navigate(t)} />}

          {activeTab === 'mais' && (
            <section className="space-y-6">
              <div className="border-b border-[var(--nj-border)] pb-5">
                <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                  Menu Completo · NJ App
                </p>
                <h1 className="mt-1 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
                  Mais recursos da igreja
                </h1>
              </div>

              <div className="nj-card flex flex-wrap items-center justify-between gap-3 p-4 lg:hidden">
                <div>
                  <p className="text-xs text-[var(--nj-ink-subtle)]">
                    {authUser ? 'Conta autenticada' : 'Visitante'}
                  </p>
                  <p className="font-serif text-base font-semibold text-[var(--nj-ink)]">
                    {currentMemberName}
                  </p>
                  <p className="text-xs text-[var(--nj-accent-text)]">
                    {roleDisplayName[realRole] || 'Membro'}
                  </p>
                </div>
                {authUser ? (
                  <button
                    type="button"
                    onClick={() => void signOutUser()}
                    disabled={authLoading}
                    className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    Sair
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(true)}
                    disabled={authLoading}
                    className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
                  >
                    <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                    {authLoading ? 'Entrando...' : 'Entrar / Login'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {[
                  {
                    title: 'Min. Nova Jerusalém',
                    desc: 'Discografia completa (2001–2025), cifras, letras e Spotify',
                    icon: Music,
                    onClick: () => navigate('musica'),
                  },
                  {
                    title: 'Conheça Nossa Igreja',
                    desc: 'História desde 1985, liderança, endereço e áreas institucionais',
                    icon: Church,
                    onClick: () => navigate('igreja'),
                  },
                  ...(hasScheduleAccess
                    ? [
                        {
                          title: 'Minhas Escalas',
                          desc: 'Confirmar participação, solicitar troca e marcar indisponibilidade',
                          icon: Compass,
                          onClick: () => navigate('ministerios', 'minhas'),
                        },
                      ]
                    : []),
                  {
                    title: 'Transmissões',
                    desc: 'Cultos ao vivo e mensagens no YouTube oficial',
                    icon: Radio,
                    onClick: () => navigate('transmissoes'),
                  },
                  {
                    title: 'Pedidos de Oração',
                    desc: 'Mural de intercessão e pedidos sigilosos com LGPD',
                    icon: HandHeart,
                    onClick: () => navigate('oracao'),
                  },
                  {
                    title: `Notificações${unreadNotifs ? ` (${unreadNotifs})` : ''}`,
                    desc: 'Central de avisos e preferências de alertas',
                    icon: Bell,
                    onClick: () => navigate('notificacoes'),
                  },
                  {
                    title: 'Conteúdos Espirituais',
                    desc: 'Devocionais, plano de leitura bíblica e anotações',
                    icon: Sparkles,
                    onClick: () => navigate('espiritual'),
                  },
                  {
                    title: 'Contribuições Pix',
                    desc: 'Dízimos, ofertas e QR Code oficial da igreja',
                    icon: HeartHandshake,
                    onClick: () => navigate('contribuicoes'),
                  },
                  {
                    title: 'Site Institucional',
                    desc: 'Voltar para a vitrine pública da Nova Jerusalém Sampaio',
                    icon: Globe,
                    onClick: () => onSwitchEnvironment('site'),
                  },
                  {
                    title: 'Painel Administrativo',
                    desc: 'Gestão de escalas, EBD, eventos e dados institucionais',
                    icon: Shield,
                    onClick: () => onSwitchEnvironment('admin'),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={item.onClick}
                      className="nj-card flex items-start gap-3.5 p-4 text-left transition hover:border-[var(--nj-border-strong)]"
                    >
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--nj-accent-text)]" aria-hidden="true" />
                      <div>
                        <p className="font-serif text-lg font-semibold text-[var(--nj-ink)]">{item.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--nj-ink-muted)]">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="nj-card flex flex-wrap items-center gap-3 p-4">
                <ThemeToggleButton />
                <PWAInstallButton />
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (56px, exact 5 tabs) */}
      <nav
        aria-label="Navegação inferior do aplicativo"
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-[var(--nj-border)] bg-[var(--nj-header-bg)] backdrop-blur-md lg:hidden"
      >
        <div className="grid h-14 grid-cols-5">
          {mobileTabs.map((item) => {
            const Icon = item.icon;
            const primaryIds = mobileTabs.filter((t) => t.id !== 'mais').map((t) => t.id);
            const isActive =
              activeTab === item.id ||
              (item.id === 'mais' && !primaryIds.includes(activeTab));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                  isActive ? 'text-[var(--nj-accent-text)]' : 'text-[var(--nj-ink-subtle)]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AdminLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Entrar no NJ App"
        subtitle="Voluntários e administradores podem acessar com e-mail/senha ou conta Google."
      />
    </div>
  );
};
