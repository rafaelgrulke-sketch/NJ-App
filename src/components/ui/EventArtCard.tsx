import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { ChurchEvent } from '../../types/church';
import {
  categoryLabel,
  downloadEventIcs,
  formatDatePtBR,
  formatLongDatePtBR,
} from '../../utils/formatters';
import { isSafeMediaUrl } from '../../utils/mediaUpload';
import { AccessibleModal, Button } from './DesignPrimitives';

function resolveBadgeText(event: ChurchEvent): string {
  if (event.badgeLabel?.trim()) return event.badgeLabel.trim().toUpperCase();
  if (event.category === 'conferencia' || event.category === 'especial') return 'EVENTOS';
  if (event.category === 'congresso') return 'CONGRESSO';
  if (event.category === 'encontro') return 'ENCONTRO';
  return 'CULTO';
}

/* ============================================================================
   EVENT ART CARD — MATCHING REFERENCE LAYOUT IN NOVA JERUSALÉM DESIGN SYSTEM
   Top 16:10 rounded artwork + top-left Verde-sálvia badge + clean metadata line
   + Sora headline with diagonal ↗ + crisp 2-line description excerpt
   ============================================================================ */
interface EventArtCardProps {
  event: ChurchEvent;
  onSelect: (event: ChurchEvent) => void;
  compact?: boolean;
}

export const EventArtCard: React.FC<EventArtCardProps> = ({ event, onSelect, compact = false }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const validArtwork = !imgFailed && isSafeMediaUrl(event.artworkUrl) ? event.artworkUrl : null;
  const badgeText = resolveBadgeText(event);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(event);
        }
      }}
      aria-label={`Abrir detalhes de ${event.title}`}
      className="group flex cursor-pointer flex-col text-left focus-visible:rounded-2xl"
    >
      {/* Artwork Container (16:10) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--nj-border)] bg-[#EAF3EE] shadow-[var(--nj-shadow-sm)] transition-all duration-200 group-hover:border-[var(--nj-border-strong)] group-hover:shadow-[var(--nj-shadow-md)]">
        {validArtwork ? (
          <img
            src={validArtwork}
            alt={`Arte oficial do evento ${event.title}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0F7656] via-[#158C68] to-[#0B5A42] p-6 text-center text-white">
            <Sparkles className="h-7 w-7 text-[#FDE68A]" aria-hidden="true" />
            <p className="mt-2 font-display text-base font-semibold">{event.title}</p>
            <p className="mt-1 text-xs text-white/80">Nova Jerusalém Sampaio</p>
          </div>
        )}

        {/* Top-left Category Tag — Confirmed: Verde-sálvia (#B1D3AE) & Verde-floresta (#213228) */}
        <span
          className="absolute top-3.5 left-3.5 rounded-md px-3 py-1 text-[11px] font-bold tracking-wider uppercase shadow-md"
          style={{ backgroundColor: 'var(--nj-badge-bg)', color: 'var(--nj-badge-ink)' }}
        >
          {badgeText}
        </span>

        {/* Explicit Status Indicator if rescheduled/cancelled (Never color-only) */}
        {event.status !== 'agendado' && (
          <span className="absolute right-3.5 bottom-3.5 inline-flex items-center gap-1 rounded-md bg-[#16231B]/90 px-2.5 py-1 text-[11px] font-semibold uppercase text-[#F5B971] backdrop-blur-sm">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {event.status}
          </span>
        )}
      </div>

      {/* Metadata & Typography Below Image (Exact Editorial Hierarchy from Reference) */}
      <div className={compact ? 'mt-3.5 space-y-1.5' : 'mt-4 space-y-2'}>
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-[var(--nj-ink-subtle)] tabular-nums">
          <span>Início: {formatDatePtBR(event.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{event.time}</span>
          {event.requiresRegistration && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[var(--nj-accent-text)]">Inscrição aberta</span>
            </>
          )}
        </p>

        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display line-clamp-1 text-lg font-semibold tracking-tight text-[var(--nj-ink)] transition-colors group-hover:text-[var(--nj-accent-text)] sm:text-xl">
            {event.title}
          </h3>
          <ArrowUpRight
            className="mt-1 h-5 w-5 shrink-0 text-[var(--nj-ink)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--nj-accent-text)]"
            aria-hidden="true"
          />
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--nj-ink-muted)]">
          {event.description}
        </p>
      </div>
    </article>
  );
};

/* ============================================================================
   EVENT DETAIL & REGISTRATION MODAL (REUSABLE ON SITE AND NJ APP)
   ============================================================================ */
interface EventDetailModalProps {
  event: ChurchEvent | null;
  churchAddress: string;
  isReminded: boolean;
  onClose: () => void;
  onToggleReminder: (eventId: string) => void;
  onRegister: (
    eventId: string,
    data: { name: string; phone: string; email: string; notes?: string }
  ) => void;
  onNotify: (text: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  churchAddress,
  isReminded,
  onClose,
  onToggleReminder,
  onRegister,
  onNotify,
}) => {
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNotes, setRegNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!event) return null;

  const remaining = event.capacity ? Math.max(0, event.capacity - event.registeredCount) : null;
  const validArtwork = isSafeMediaUrl(event.artworkUrl) ? event.artworkUrl : null;

  const handleShare = async () => {
    const text = `*Informativo NJ — ${event.title}*\nData: ${formatLongDatePtBR(event.date)} às ${event.time}\nLocal: ${event.location} (${churchAddress})\n${event.description}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotify('Convite copiado para compartilhar no WhatsApp.');
    } catch {
      onNotify('Convite pronto para compartilhamento.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;
    onRegister(event.id, {
      name: regName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || 'membro@novajerusalemsampaio.com.br',
      notes: regNotes.trim() || undefined,
    });
    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setRegNotes('');
    setSubmitted(true);
  };

  return (
    <AccessibleModal
      open={Boolean(event)}
      onClose={() => {
        setSubmitted(false);
        onClose();
      }}
      title={event.title}
      subtitle={`${categoryLabel(event.category)} · ${formatLongDatePtBR(event.date)}`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        {validArtwork && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-[var(--nj-border)] bg-[#16231B]">
            <img
              src={validArtwork}
              alt={`Arte oficial de ${event.title}`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <span
              className="absolute top-3 left-3 rounded-md px-3 py-1 text-[11px] font-bold tracking-wider uppercase shadow-md"
              style={{ backgroundColor: 'var(--nj-badge-bg)', color: 'var(--nj-badge-ink)' }}
            >
              {resolveBadgeText(event)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4 text-xs sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nj-accent-text)]" aria-hidden="true" />
            <div>
              <p className="text-[var(--nj-ink-subtle)]">Data e Horário</p>
              <p className="font-medium text-[var(--nj-ink)] tabular-nums">
                {formatDatePtBR(event.date)} · {event.time}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nj-accent-text)]" aria-hidden="true" />
            <div>
              <p className="text-[var(--nj-ink-subtle)]">Local</p>
              <p className="font-medium text-[var(--nj-ink)]">{event.location}</p>
            </div>
          </div>
          {event.requiresRegistration && (
            <div className="flex items-start gap-2.5 sm:col-span-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nj-accent-text)]" aria-hidden="true" />
              <div className="tabular-nums">
                <p className="text-[var(--nj-ink-subtle)]">Vagas e Inscrição</p>
                <p className="font-medium text-[var(--nj-ink)]">
                  {event.registeredCount} inscritos
                  {remaining !== null ? ` · ${remaining} vagas disponíveis` : ''}
                  {event.registrationDeadline
                    ? ` · Prazo: ${formatDatePtBR(event.registrationDeadline)}`
                    : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-[var(--nj-ink)]">{event.description}</p>
          <p className="text-xs leading-relaxed text-[var(--nj-ink-muted)]">
            <strong className="font-semibold text-[var(--nj-ink)]">Orientações:</strong>{' '}
            {event.guidelines}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-y border-[var(--nj-border)] py-3.5">
          <Button variant="secondary" size="sm" onClick={() => onToggleReminder(event.id)}>
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            {isReminded ? 'Lembrete ativo' : 'Lembrar-me'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              downloadEventIcs(event);
              onNotify('Arquivo .ics baixado para adicionar à sua agenda.');
            }}
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            Adicionar ao calendário (.ics)
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleShare()}>
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Compartilhar no WhatsApp
          </Button>
        </div>

        {event.requiresRegistration && event.status !== 'cancelado' && (
          <div className="space-y-3">
            <h4 className="font-display text-base font-semibold text-[var(--nj-ink)]">
              Inscrição Rápida — Informativo NJ
            </h4>

            {submitted ? (
              <div className="nj-status-success flex items-center gap-2.5 rounded-xl p-4 text-xs font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Inscrição confirmada! Esperamos você na Nova Jerusalém Sampaio.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex.: Rafael Santos"
                      className="nj-input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="(21) 99999-0000"
                      className="nj-input mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="nj-input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--nj-ink-muted)]">
                      Observações
                    </label>
                    <input
                      type="text"
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      placeholder="Opcional (ex.: casal, criança)"
                      className="nj-input mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="secondary" size="sm" onClick={onClose}>
                    Fechar
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Confirmar inscrição
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </AccessibleModal>
  );
};
