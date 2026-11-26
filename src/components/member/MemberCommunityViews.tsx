import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookMarked,
  BookOpen,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  HandHeart,
  Lock,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { MUSIC_PLATFORM_CHANNELS } from '../../data/initialData';
import { useYouTubeChannel } from '../../hooks/useYouTubeChannel';
import { BroadcastVideo, PrayerPrivacy } from '../../types/church';
import { buildPixCopyPaste, formatDatePtBR } from '../../utils/formatters';
import { safeYoutubeId } from '../../utils/security';
import { PixQrCodeSvg } from '../EditorialArt';
import { MemberTab } from './MemberCoreViews';

/* ==========================================================================
   1. PEDIDOS DE ORAÇÃO (COM PRIVACIDADE LGPD)
   ========================================================================== */
export const PrayerRequestsView: React.FC = () => {
  const { prayers, submitPrayer, incrementPraying } = useChurch();
  const [authorName, setAuthorName] = useState('');
  const [isVisitor, setIsVisitor] = useState(false);
  const [category, setCategory] = useState('Família');
  const [message, setMessage] = useState('');
  const [privacy, setPrivacy] = useState<PrayerPrivacy>('comunidade');

  const publicPrayers = prayers.filter((p) => p.privacy === 'comunidade');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    submitPrayer({
      authorName: authorName.trim(),
      isVisitor,
      category,
      message: message.trim(),
      privacy,
    });
    setMessage('');
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--nj-border)] pb-6">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
          Intercessão & Acompanhamento Pastoral · Aberto a Membros e Visitantes
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
          Pedidos de Oração
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
          Todos podem enviar seu pedido de oração — membros e visitantes, sem necessidade de cadastro prévio. Pedidos sigilosos são encaminhados exclusivamente à equipe pastoral.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form onSubmit={handleSubmit} className="nj-card h-fit space-y-4 p-6 lg:col-span-5">
          <h2 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">Enviar pedido</h2>

          <div>
            <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Nível de privacidade</label>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as PrayerPrivacy)}
              className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
            >
              <option value="comunidade">Compartilhar no Mural da Comunidade</option>
              <option value="equipe_identificado">Somente Equipe Pastoral (Identificado)</option>
              <option value="equipe_anonimo">Somente Equipe Pastoral (Anônimo)</option>
            </select>
          </div>

          {privacy !== 'equipe_anonimo' && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Seu nome</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex.: Rafael Santos"
                  className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--nj-ink-muted)]">
                <input
                  type="checkbox"
                  checked={isVisitor}
                  onChange={(e) => setIsVisitor(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#466053]"
                />
                <span>Sou visitante (gostaria que a igreja orasse por mim)</span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Motivo / Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
            >
              {['Família', 'Saúde', 'Gratidão', 'Trabalho e Estudos', 'Renovação Espiritual', 'Outro'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">Seu pedido *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva aqui o motivo da sua oração..."
              className="nj-input mt-1 w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          <p className="flex items-start gap-2 text-xs text-[var(--nj-ink-subtle)]">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--nj-accent-text)]" aria-hidden="true" />
            <span>
              Tratamento de dados em conformidade com a LGPD: pedidos restritos jamais aparecem no mural público.
            </span>
          </p>

          <button type="submit" className="nj-btn-primary w-full rounded-md px-4 py-2.5 text-sm">
            Enviar pedido de oração
          </button>
        </form>

        <section className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">Mural de Intercessão</h2>
            <span className="text-xs text-[var(--nj-ink-subtle)]">{publicPrayers.length} pedidos públicos</span>
          </div>

          {publicPrayers.map((p) => (
            <article key={p.id} className="nj-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--nj-accent-text)]">
                <span>
                  {p.category} · {formatDatePtBR(p.createdAt)}
                </span>
                <span>{p.authorName}</span>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--nj-ink)]">{p.message}</p>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--nj-border)] pt-3">
                <span className="text-xs text-[var(--nj-ink-subtle)] tabular-nums">
                  {p.prayingCount} irmão(s) em oração
                </span>
                <button
                  type="button"
                  onClick={() => incrementPraying(p.id)}
                  className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
                >
                  <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
                  Estou orando
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

/* ==========================================================================
   2. TRANSMISSÕES E MENSAGENS (YOUTUBE OFICIAL COM SINCRONIZAÇÃO AUTOMÁTICA)
   ========================================================================== */
export const BroadcastsView: React.FC = () => {
  const { churchInfo, videos: storedVideos, notify } = useChurch();
  const youtube = useYouTubeChannel();

  const [playerMode, setPlayerMode] = useState<'live' | 'gravadas'>(() =>
    youtube.live.isLive ? 'live' : 'gravadas'
  );
  const [userPickedMode, setUserPickedMode] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('todas');

  // Auto-switch to Live mode as soon as a live broadcast is detected (unless user manually picked a tab)
  useEffect(() => {
    if (!userPickedMode) {
      setPlayerMode(youtube.live.isLive ? 'live' : 'gravadas');
    }
  }, [youtube.live.isLive, userPickedMode]);

  // Merge automatically synced YouTube videos (newest first) + manually saved Firestore videos (deduplicated)
  const mergedVideos = useMemo<BroadcastVideo[]>(() => {
    const seenIds = new Set<string>();
    const combined: BroadcastVideo[] = [];

    for (const ytVid of youtube.videos) {
      const cleanId = safeYoutubeId(ytVid.youtubeId);
      if (!cleanId || seenIds.has(cleanId)) continue;
      seenIds.add(cleanId);
      combined.push(ytVid);
    }

    for (const saved of storedVideos) {
      const cleanId = safeYoutubeId(saved.youtubeId);
      if (!cleanId || seenIds.has(cleanId)) continue;
      seenIds.add(cleanId);
      combined.push(saved);
    }

    return combined;
  }, [youtube.videos, storedVideos]);

  const seriesList = useMemo(
    () => Array.from(new Set(mergedVideos.map((v) => v.series))),
    [mergedVideos]
  );

  const filteredVideos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return mergedVideos.filter((v) => {
      const matchSeries = seriesFilter === 'todas' || v.series === seriesFilter;
      const matchSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.preacher.toLowerCase().includes(q) ||
        v.series.toLowerCase().includes(q);
      return matchSeries && matchSearch;
    });
  }, [mergedVideos, seriesFilter, searchTerm]);

  const currentVideo =
    mergedVideos.find((v) => v.id === selectedId) || filteredVideos[0] || mergedVideos[0];

  const currentVideoSafeId = safeYoutubeId(currentVideo?.youtubeId);
  const activeShareUrl =
    playerMode === 'live'
      ? youtube.live.watchUrl
      : currentVideoSafeId
        ? `https://www.youtube.com/watch?v=${currentVideoSafeId}`
        : MUSIC_PLATFORM_CHANNELS.youtubeChurchLiveUrl;

  const handleShare = async (title: string) => {
    try {
      await navigator.clipboard.writeText(
        `${title} — Assista no canal oficial da Nova Jerusalém Sampaio: ${activeShareUrl}`
      );
      notify('Link da transmissão copiado para compartilhar.');
    } catch {
      notify('Link da transmissão pronto para compartilhar.');
    }
  };

  const handleManualRefresh = async () => {
    const updated = await youtube.refresh();
    if (updated.live.isLive) {
      setPlayerMode('live');
      setUserPickedMode(false);
      notify('Transmissão ao vivo detectada no canal oficial!');
    } else if (updated.videos.length > 0) {
      notify(`Canal sincronizado (${updated.videos.length} vídeo(s) mais recentes).`);
    } else {
      notify('Verificação concluída com o canal do YouTube.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--nj-border)] pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              YouTube Conectado Automaticamente · Canal Oficial
            </p>
            {youtube.live.isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
                Ao Vivo Agora
              </span>
            )}
          </div>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
            Live dos cultos e pregações gravadas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
            Quando o culto entra ao vivo no YouTube, ele aparece automaticamente aqui. As novas pregações publicadas no canal também são atualizadas sozinhas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={youtube.refreshing}
            className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${youtube.refreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {youtube.refreshing ? 'Atualizando...' : 'Atualizar canal'}
          </button>
          <a
            href={youtube.live.watchUrl}
            target="_blank"
            rel="noreferrer"
            className="nj-btn-primary inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs"
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            {youtube.live.isLive ? 'Assistir Live no YouTube' : 'Abrir canal no YouTube'}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Mode Switcher: Live vs Recorded Sermons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="nj-tabs">
          <button
            type="button"
            onClick={() => {
              setPlayerMode('live');
              setUserPickedMode(true);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium ${
              playerMode === 'live' ? 'nj-tab-active' : 'nj-tab-idle'
            }`}
          >
            {youtube.live.isLive && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            )}
            {youtube.live.isLive ? 'Culto Ao Vivo Agora' : 'Transmissão Ao Vivo'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlayerMode('gravadas');
              setUserPickedMode(true);
            }}
            className={`rounded-md px-4 py-2 text-xs font-medium ${
              playerMode === 'gravadas' ? 'nj-tab-active' : 'nj-tab-idle'
            }`}
          >
            Pregações Publicadas ({mergedVideos.length})
          </button>
        </div>

        <a
          href={MUSIC_PLATFORM_CHANNELS.youtubeChurchStreamsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-[var(--nj-accent-text)] hover:underline"
        >
          Ver histórico de lives no YouTube →
        </a>
      </div>

      {/* Main Player */}
      <section className="nj-card overflow-hidden">
        <div className="aspect-video w-full bg-[#10241C]">
          {playerMode === 'live' ? (
            <iframe
              title={
                youtube.live.isLive && youtube.live.title
                  ? youtube.live.title
                  : `Transmissão Ao Vivo — ${churchInfo.displayName}`
              }
              src={youtube.live.embedUrl}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : currentVideoSafeId ? (
            <iframe
              title={currentVideo?.title || 'Pregação gravada'}
              src={`https://www.youtube.com/embed/${currentVideoSafeId}?rel=0`}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-white/80">
              Selecione uma pregação abaixo ou abra o canal oficial no YouTube.
            </div>
          )}
        </div>

        {playerMode === 'live' ? (
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
                {youtube.live.isLive
                  ? 'Transmissão Ativa Agora · YouTube Live'
                  : 'Canal Oficial Conectado · YouTube Live'}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                {youtube.live.isLive && youtube.live.title
                  ? youtube.live.title
                  : `Culto Ao Vivo — ${churchInfo.displayName}`}
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--nj-ink-muted)]">
                {youtube.live.isLive
                  ? 'A live foi identificada automaticamente no canal oficial da igreja. Assista por aqui ou compartilhe com alguém.'
                  : 'Nenhuma live ativa neste instante. Horários de transmissão: Quintas às 19h30 (Culto do Renovo) e Domingos às 10h10 (Culto Pastoral) e 19h00 (Nossa Celebração).'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleShare(
                    youtube.live.title || `Culto Ao Vivo — ${churchInfo.displayName}`
                  )
                }
                className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                Compartilhar
              </button>
              <a
                href={youtube.live.watchUrl}
                target="_blank"
                rel="noreferrer"
                className="nj-btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2 text-xs"
              >
                Abrir no app do YouTube
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : (
          currentVideo && (
            <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--nj-accent-text)]">
                  {currentVideo.isLive ? 'Transmissão Ao Vivo' : 'Pregação Publicada'} ·{' '}
                  {currentVideo.series} · {formatDatePtBR(currentVideo.date)}
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                  {currentVideo.title}
                </h2>
                <p className="mt-1 text-xs text-[var(--nj-ink-subtle)]">{currentVideo.preacher}</p>
                <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
                  {currentVideo.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleShare(currentVideo.title)}
                  className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Compartilhar
                </button>
                {currentVideoSafeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${currentVideoSafeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
                  >
                    Ver no YouTube
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          )
        )}
      </section>

      {/* Search + Series Filter for Published Sermons */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">
            Acervo de Pregações do Canal
          </h2>
          {youtube.videos.length > 0 && (
            <span className="text-xs text-[var(--nj-ink-subtle)]">
              Sincronizado automaticamente com o YouTube
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSeriesFilter('todas')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                seriesFilter === 'todas'
                  ? 'nj-tab-active'
                  : 'border border-[var(--nj-border)] text-[var(--nj-ink-muted)]'
              }`}
            >
              Todas as séries
            </button>
            {seriesList.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeriesFilter(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  seriesFilter === s
                    ? 'nj-tab-active'
                    : 'border border-[var(--nj-border)] text-[var(--nj-ink-muted)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-[var(--nj-ink-subtle)]" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar mensagem ou pregador..."
              className="nj-input w-full rounded-md py-2 pr-3 pl-9 text-xs"
            />
          </div>
        </div>
      </div>

      {youtube.loading && mergedVideos.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="nj-card overflow-hidden p-4">
              <div className="aspect-video w-full animate-pulse rounded-lg bg-[var(--nj-surface-alt)]" />
              <div className="mt-3 h-3 w-24 animate-pulse rounded bg-[var(--nj-surface-alt)]" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-[var(--nj-surface-alt)]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((vid) => {
            const vidId = safeYoutubeId(vid.youtubeId);
            const isSelected = playerMode === 'gravadas' && vid.id === currentVideo?.id;
            return (
              <button
                key={vid.id}
                type="button"
                onClick={() => {
                  setSelectedId(vid.id);
                  setPlayerMode('gravadas');
                  setUserPickedMode(true);
                }}
                className={`nj-card group overflow-hidden text-left transition ${
                  isSelected
                    ? 'ring-2 ring-[var(--nj-accent)]'
                    : 'hover:border-[var(--nj-border-strong)]'
                }`}
              >
                {vidId && (
                  <div className="relative aspect-video w-full overflow-hidden bg-[#10241C]">
                    <img
                      src={`https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`}
                      alt={vid.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#0A5C43] shadow-md">
                        <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                      </span>
                    </span>
                    {vid.isLive && (
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Ao Vivo
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-[var(--nj-accent-text)]">
                    {vid.series} · {formatDatePtBR(vid.date)}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-serif text-lg font-semibold text-[var(--nj-ink)]">
                    {vid.title}
                  </h3>
                  <p className="mt-1 truncate text-xs text-[var(--nj-ink-subtle)]">
                    {vid.preacher}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   3. CONTEÚDOS ESPIRITUAIS (DEVOCIONAIS + PLANO DE LEITURA + ANOTAÇÕES)
   ========================================================================== */
export const SpiritualContentView: React.FC = () => {
  const { devotionals, biblePlan, sermonNotes, toggleBibleDay, saveSermonNote, deleteSermonNote } = useChurch();
  const [subTab, setSubTab] = useState<'devocionais' | 'plano' | 'anotacoes'>('devocionais');
  const [noteTitle, setNoteTitle] = useState('');
  const [notePreacher, setNotePreacher] = useState('Pr. Samuel Silva');
  const [noteScripture, setNoteScripture] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const completedDays = biblePlan.filter((d) => d.completed).length;

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    saveSermonNote({
      title: noteTitle.trim(),
      date: new Date().toISOString().slice(0, 10),
      preacher: notePreacher.trim() || 'Pregação',
      scripture: noteScripture.trim() || 'Texto bíblico',
      content: noteContent.trim(),
    });
    setNoteTitle('');
    setNoteScripture('');
    setNoteContent('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--nj-border)] pb-6">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
            Edificação Diária
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
            Conteúdos Espirituais
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
            Medite nos devocionais da semana, acompanhe seu plano de leitura bíblica e registre suas anotações pessoais dos cultos.
          </p>
        </div>

        <div className="nj-tabs">
          {(
            [
              { id: 'devocionais', label: 'Devocionais' },
              { id: 'plano', label: `Plano Bíblico (${completedDays}/${biblePlan.length})` },
              { id: 'anotacoes', label: 'Anotações de Sermões' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`rounded-md px-3.5 py-2 text-xs font-medium ${
                subTab === t.id ? 'nj-tab-active' : 'nj-tab-idle'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'devocionais' && (
        <div className="space-y-6">
          {devotionals.map((dev) => (
            <article key={dev.id} className="nj-paper rounded-xl p-6 sm:p-8">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#466053]">
                {formatDatePtBR(dev.date)} · {dev.reference}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-[#213228] sm:text-3xl">
                {dev.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#2D3F34]">{dev.fullText}</p>
              <p className="mt-5 rounded-lg border border-[#466053]/25 bg-[#E7E3D7] p-4 text-sm italic text-[#213228]">
                <strong className="not-italic">Oração:</strong> {dev.prayer}
              </p>
            </article>
          ))}
        </div>
      )}

      {subTab === 'plano' && (
        <div className="nj-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                Plano Semanal de Leitura Bíblica
              </h2>
              <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                Progresso salvo localmente no seu dispositivo.
              </p>
            </div>
            <BookOpen className="h-5 w-5 text-[var(--nj-accent-text)]" aria-hidden="true" />
          </div>

          <div className="mt-5 divide-y divide-[var(--nj-border)]">
            {biblePlan.map((day) => (
              <label
                key={day.id}
                className="flex cursor-pointer items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={day.completed}
                    onChange={() => toggleBibleDay(day.id)}
                    className="h-4 w-4 accent-[#466053]"
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        day.completed ? 'text-[var(--nj-ink-subtle)] line-through' : 'text-[var(--nj-ink)]'
                      }`}
                    >
                      Dia {String(day.dayNumber).padStart(2, '0')} — {day.title}
                    </p>
                    <p className="text-xs text-[var(--nj-accent-text)]">{day.passages}</p>
                  </div>
                </div>
                {day.completed && <Check className="h-4 w-4 text-[var(--nj-accent-text)]" aria-hidden="true" />}
              </label>
            ))}
          </div>
        </div>
      )}

      {subTab === 'anotacoes' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <form onSubmit={handleSaveNote} className="nj-card h-fit space-y-3.5 p-6 lg:col-span-5">
            <h2 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">Nova anotação</h2>
            <input
              type="text"
              required
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Título da mensagem *"
              className="nj-input w-full rounded-md px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={notePreacher}
                onChange={(e) => setNotePreacher(e.target.value)}
                placeholder="Pregador"
                className="nj-input w-full rounded-md px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={noteScripture}
                onChange={(e) => setNoteScripture(e.target.value)}
                placeholder="Texto bíblico (ex.: Sl 84)"
                className="nj-input w-full rounded-md px-3 py-2 text-sm"
              />
            </div>
            <textarea
              required
              rows={5}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Principais pontos, versículos e aplicações..."
              className="nj-input w-full rounded-md px-3 py-2 text-sm"
            />
            <button type="submit" className="nj-btn-primary inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Salvar anotação
            </button>
          </form>

          <div className="space-y-4 lg:col-span-7">
            {sermonNotes.map((note) => (
              <article key={note.id} className="nj-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--nj-accent-text)]">
                      {formatDatePtBR(note.date)} · {note.preacher} · {note.scripture}
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-[var(--nj-ink)]">
                      {note.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSermonNote(note.id)}
                    className="rounded-md p-1.5 text-[var(--nj-ink-subtle)] hover:text-amber-500"
                    aria-label="Excluir anotação"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--nj-ink-muted)]">
                  {note.content}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   4. CONTRIBUIÇÕES — DÍZIMOS E OFERTAS (PIX OFICIAL)
   ========================================================================== */
export const ContributionsView: React.FC = () => {
  const { churchInfo, notify } = useChurch();
  const [purpose, setPurpose] = useState('Dízimo');
  const [amount, setAmount] = useState('');

  const pixPayload = useMemo(
    () => buildPixCopyPaste(churchInfo.pixKey, purpose, amount),
    [churchInfo.pixKey, purpose, amount]
  );

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notify(`${label} copiado para a área de transferência.`);
    } catch {
      notify(`${label} selecionado para cópia.`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--nj-border)] pb-6">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
          Fidelidade & Generosidade · Aberto a Membros e Visitantes
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
          Dízimos, Ofertas e Missões
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
          Tanto membros quanto visitantes podem contribuir livremente e com transparência para o sustento da obra de Deus na {churchInfo.officialName}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="nj-card space-y-5 p-6 lg:col-span-7">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              Destinação da contribuição
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {['Dízimo', 'Oferta Voluntária', 'Missões', 'Ação Social', 'Construção e Manutenção'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPurpose(item)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium ${
                    purpose === item
                      ? 'nj-tab-active'
                      : 'border border-[var(--nj-border)] text-[var(--nj-ink-muted)]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">
              Valor opcional (R$) para gerar código Pix
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex.: 100,00 (ou deixe em branco)"
              className="nj-input mt-1 w-full max-w-xs rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4">
            <p className="text-xs text-[var(--nj-ink-subtle)]">Chave Pix ({churchInfo.pixKeyType})</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-[var(--nj-ink)]">{churchInfo.pixKey}</span>
              <button
                type="button"
                onClick={() => handleCopy(churchInfo.pixKey, 'Chave Pix')}
                className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copiar chave
              </button>
            </div>
          </div>

          <div className="space-y-1 text-xs text-[var(--nj-ink-muted)]">
            <p>
              <strong className="text-[var(--nj-ink)]">Instituição:</strong> {churchInfo.officialName}
            </p>
            <p>
              <strong className="text-[var(--nj-ink)]">Banco / Conta:</strong> {churchInfo.bankName} · Ag.{' '}
              {churchInfo.agency} · Cc. {churchInfo.account}
            </p>
            <p className="pt-1 text-[var(--nj-ink-subtle)]">{churchInfo.cnpjNote}</p>
          </div>
        </section>

        <aside className="nj-card flex flex-col items-center justify-between p-6 text-center lg:col-span-5">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              QR Code Pix · {purpose}
            </p>
            <div className="mt-4 flex justify-center">
              <PixQrCodeSvg seed={pixPayload} />
            </div>
            <p className="mt-3 text-xs text-[var(--nj-ink-muted)]">
              Aponte a câmera do aplicativo do seu banco ou copie o código Pix Copia e Cola abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(pixPayload, 'Código Pix Copia e Cola')}
            className="nj-btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copiar Pix Copia e Cola
          </button>

          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--nj-ink-subtle)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--nj-accent-text)]" aria-hidden="true" />
            Conferir sempre o favorecido oficial antes de concluir.
          </p>
        </aside>
      </div>
    </div>
  );
};

/* ==========================================================================
   5. CENTRAL DE NOTIFICAÇÕES (COM PREFERÊNCIAS E DEEP-LINK)
   ========================================================================== */
export const NotificationsView: React.FC<{ onNavigate: (tab: MemberTab) => void }> = ({ onNavigate }) => {
  const {
    notifications,
    notificationPrefs,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationPref,
  } = useChurch();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const prefItems = [
    { key: 'escala' as const, label: 'Escalas ministeriais e substituições' },
    { key: 'ebd' as const, label: 'Novas lições da EBD Digital' },
    { key: 'evento' as const, label: 'Eventos, prazos e lembretes' },
    { key: 'musica' as const, label: 'Lançamentos do Min. Nova Jerusalém' },
    { key: 'comunicado' as const, label: 'Comunicados oficiais da igreja' },
    { key: 'transmissao' as const, label: 'Avisos de culto ao vivo' },
  ];

  const typeLabel: Record<string, string> = {
    escala: 'Escala',
    ebd: 'EBD Digital',
    evento: 'Evento',
    musica: 'Min. NJ',
    comunicado: 'Comunicado',
    transmissao: 'Transmissão',
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--nj-border)] pb-6">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
            Central de Notificações · {unreadCount} não lida(s)
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
            Avisos, escalas e lembretes
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--nj-ink-muted)]">
            Toque em qualquer notificação para abrir diretamente o módulo correspondente ou configure suas preferências abaixo.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-8">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`nj-card flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center ${
                n.read ? 'opacity-80' : 'border-[var(--nj-border-strong)]'
              }`}
            >
              <div>
                <p className="text-xs font-medium text-[var(--nj-accent-text)]">
                  {typeLabel[n.type] || n.type} · {formatDatePtBR(n.date)}
                  {!n.read ? ' · Nova' : ' · Lida'}
                </p>
                <h2 className="mt-1 text-sm font-semibold text-[var(--nj-ink)]">{n.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--nj-ink-muted)]">{n.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="nj-btn-secondary rounded-md px-3 py-1.5 text-xs"
                  >
                    Marcar lida
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id);
                    onNavigate((n.targetTab as MemberTab) || 'inicio');
                  }}
                  className="nj-btn-primary rounded-md px-3 py-1.5 text-xs"
                >
                  Abrir
                </button>
              </div>
            </div>
          ))}
        </section>

        <aside className="nj-card h-fit p-6 lg:col-span-4">
          <div className="flex items-center gap-2 text-[var(--nj-accent-text)]">
            <Bell className="h-4 w-4" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">Preferências de aviso</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
            Escolha quais categorias de alerta você deseja receber no NJ App.
          </p>

          <div className="mt-4 divide-y divide-[var(--nj-border)]">
            {prefItems.map((pref) => (
              <label
                key={pref.key}
                className="flex cursor-pointer items-center justify-between gap-3 py-3 text-xs text-[var(--nj-ink)] first:pt-0 last:pb-0"
              >
                <span>{pref.label}</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs[pref.key]}
                  onChange={() => toggleNotificationPref(pref.key)}
                  className="h-4 w-4 accent-[#466053]"
                />
              </label>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export { BookMarked };
