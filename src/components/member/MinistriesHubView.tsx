import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Download,
  ExternalLink,
  Lock,
  LogIn,
  Music,
  Plus,
  RefreshCw,
  Share2,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import {
  buildWhatsAppScheduleText,
  downloadSchedulePdf,
  formatDatePtBR,
  volunteerStatusLabel,
} from '../../utils/formatters';
import { safeExternalUrl } from '../../utils/security';

export const MinistriesHubView: React.FC<{
  initialSubMode?: 'central' | 'minhas';
  onRequestLogin?: () => void;
}> = ({ initialSubMode = 'central', onRequestLogin }) => {
  const {
    authUser,
    authReady,
    hasScheduleAccess,
    canManageSchedules,
    userDepartmentIds,
    currentMemberName,
    ministries,
    schedules,
    repertoires,
    unavailability,
    updateVolunteerStatus,
    addUnavailability,
    addMinistryIncident,
    addSongToRepertoire,
    removeSongFromRepertoire,
    notify,
  } = useChurch();

  const [mode, setMode] = useState<'central' | 'minhas' | 'indisponibilidade'>(initialSubMode);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>(ministries[0]?.id || '');
  const [mediaSubTab, setMediaSubTab] = useState<
    'visao' | 'dep-telao' | 'dep-transmissao' | 'dep-social' | 'integrantes' | 'ocorrencias'
  >('visao');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [swapSlotId, setSwapSlotId] = useState<string | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [incidentNote, setIncidentNote] = useState('');
  const [unavDate, setUnavDate] = useState('');
  const [unavMinId, setUnavMinId] = useState(ministries[0]?.id || '');
  const [unavReason, setUnavReason] = useState('');
  const [repTargetId, setRepTargetId] = useState<string>(repertoires[0]?.id || '');
  const [songOrigin, setSongOrigin] = useState<'outro_louvor' | 'min_nj'>('outro_louvor');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songKey, setSongKey] = useState('G');
  const [songBpm, setSongBpm] = useState('72');
  const [songRefUrl, setSongRefUrl] = useState('');
  const [songNotes, setSongNotes] = useState('');

  // Keep selected ministry & repertoire synced with the user's authorized list
  useEffect(() => {
    if (ministries.length > 0 && !ministries.some((m) => m.id === selectedMinistryId)) {
      setSelectedMinistryId(ministries[0].id);
    }
    if (ministries.length > 0 && !ministries.some((m) => m.id === unavMinId)) {
      setUnavMinId(ministries[0].id);
    }
  }, [ministries, selectedMinistryId, unavMinId]);

  useEffect(() => {
    if (repertoires.length > 0 && !repertoires.some((r) => r.id === repTargetId)) {
      setRepTargetId(repertoires[0].id);
    }
  }, [repertoires, repTargetId]);

  // STRICT ACCESS GATE: Visitors & unassigned members CANNOT see ANY schedules or ministry data
  if (!authReady) {
    return (
      <div className="nj-card p-8 text-center text-sm text-[var(--nj-ink-muted)]">
        Verificando seu vínculo ministerial no banco de dados...
      </div>
    );
  }

  if (!authUser) {
    return (
      <section className="nj-card mx-auto max-w-xl space-y-4 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--nj-accent-soft)] text-[var(--nj-accent-text)]">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--nj-accent-text)]">
          Acesso Restrito · Escalas Ministeriais
        </p>
        <h1 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">
          Área exclusiva para voluntários cadastrados
        </h1>
        <p className="text-sm leading-relaxed text-[var(--nj-ink-muted)]">
          Visitantes sem cadastro não têm acesso às escalas dos ministérios. Faça login com sua conta autorizada para visualizar apenas a escala do ministério em que você serve.
        </p>
        {onRequestLogin && (
          <button
            type="button"
            onClick={onRequestLogin}
            className="nj-btn-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Entrar para acessar minha escala
          </button>
        )}
      </section>
    );
  }

  if (!hasScheduleAccess || ministries.length === 0) {
    return (
      <section className="nj-card mx-auto max-w-xl space-y-4 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--nj-accent-text)]">
          Vínculo Ministerial Necessário
        </p>
        <h1 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">
          Você ainda não está vinculado a nenhum ministério
        </h1>
        <p className="text-sm leading-relaxed text-[var(--nj-ink-muted)]">
          Por segurança e organização da igreja, cada voluntário visualiza somente a escala do ministério do qual participa (por exemplo, quem é da Mídia vê apenas Mídia; quem é do Louvor vê apenas Louvor). Solicite à liderança ou ao administrador para vincular sua conta ({authUser.email}) ao seu ministério.
        </p>
      </section>
    );
  }

  const selectedMinistry = ministries.find((m) => m.id === selectedMinistryId) || ministries[0];
  const isMedia = selectedMinistry?.slug === 'midia' && !!selectedMinistry.departments?.length;
  const visibleMediaDepartments = isMedia
    ? (selectedMinistry.departments || []).filter(
        (d) => userDepartmentIds.length === 0 || userDepartmentIds.includes(d.id)
      )
    : [];

  const ministrySlots = schedules.filter((s) => s.ministryId === selectedMinistry?.id);
  const visibleSlots =
    isMedia && mediaSubTab.startsWith('dep-')
      ? ministrySlots.filter((s) => s.departmentId === mediaSubTab)
      : ministrySlots;

  const mySlots = schedules.filter(
    (s) => s.volunteerUid === authUser.uid || s.volunteerName === currentMemberName
  );
  const myUnavailability = unavailability.filter((u) => u.volunteerName === currentMemberName);

  const handleShareWhatsApp = async (title: string, slotsToShare: typeof schedules) => {
    const text = buildWhatsAppScheduleText(title, slotsToShare);
    try {
      await navigator.clipboard.writeText(text);
      notify('Escala formatada copiada para enviar no WhatsApp.');
    } catch {
      notify('Texto da escala preparado para WhatsApp.');
    }
  };

  const handleExportPdf = (title: string, slotsToExport: typeof schedules) => {
    downloadSchedulePdf(title, slotsToExport);
    notify(`PDF da escala "${title}" gerado.`);
  };

  const toggleCheck = (key: string) =>
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapSlotId || !swapReason.trim()) return;
    updateVolunteerStatus(swapSlotId, 'substituicao_solicitada', swapReason.trim());
    setSwapSlotId(null);
    setSwapReason('');
  };

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentNote.trim() || !selectedMinistry) return;
    addMinistryIncident(selectedMinistry.id, incidentNote.trim());
    setIncidentNote('');
  };

  const handleUnavSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unavDate || !unavReason.trim()) return;
    const min = ministries.find((m) => m.id === unavMinId);
    addUnavailability({
      volunteerName: currentMemberName,
      ministryId: unavMinId,
      ministryName: min?.name || 'Ministério',
      date: unavDate,
      reason: unavReason.trim(),
    });
    setUnavDate('');
    setUnavReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Top Mode Switch */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--nj-border)] pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
            Central de Ministérios · Equipes Independentes
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)]">
            Ministérios e Sistema de Escalas
          </h1>
        </div>

        <div className="nj-tabs flex items-center gap-1 self-start">
          {[
            { id: 'central', label: 'Central de Ministérios' },
            { id: 'minhas', label: `Minhas Escalas (${mySlots.length})` },
            { id: 'indisponibilidade', label: 'Indisponibilidade' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id as 'central' | 'minhas' | 'indisponibilidade')}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors whitespace-nowrap tabular-nums ${
                mode === t.id ? 'nj-tab-active' : 'nj-tab-idle'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* MODE 1: CENTRAL DE MINISTÉRIOS (5 Ministérios Independentes) */}
      {mode === 'central' && selectedMinistry && (
        <div className="space-y-6">
          {/* Ministry Selector Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ministries.map((m) => {
              const active = m.id === selectedMinistry.id;
              const slotCount = schedules.filter((s) => s.ministryId === m.id).length;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMinistryId(m.id);
                    setMediaSubTab('visao');
                  }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-[var(--nj-accent)] bg-[#466053]/25'
                      : 'border-[var(--nj-border)] bg-[var(--nj-surface)] hover:border-[var(--nj-border-strong)]'
                  }`}
                >
                  <p className="text-[11px] font-medium text-[var(--nj-accent-text)] tabular-nums">
                    {m.departments ? `${m.departments.length} subdivisões` : `${m.positions.length} funções`} · {slotCount} vagas
                  </p>
                  <p className="mt-1 font-serif text-lg font-semibold leading-snug text-[var(--nj-ink)]">
                    {m.name}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Ministry Overview Card */}
          <section className="nj-card p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--nj-border)] pb-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-xs font-medium text-[var(--nj-accent-text)]">
                  Liderança: {selectedMinistry.leader} · {selectedMinistry.arrivalTimeNote}
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
                  {selectedMinistry.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--nj-ink-muted)]">
                  {selectedMinistry.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleExportPdf(selectedMinistry.name, visibleSlots)}
                  className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedMinistry.name, visibleSlots)}
                  className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartilhar WhatsApp
                </button>
              </div>
            </div>

            {/* Sub-navigation for Ministério de Mídia (scoped to userDepartmentIds when assigned) */}
            {isMedia && visibleMediaDepartments.length > 0 && (
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {visibleMediaDepartments.map((dept) => {
                    const targetCount = dept.positions.reduce((acc, p) => acc + p.quantity, 0);
                    const filledCount = ministrySlots.filter(
                      (s) => s.departmentId === dept.id && s.volunteerStatus !== 'recusado'
                    ).length;
                    return (
                      <div key={dept.id} className="nj-card-olive p-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-serif text-lg font-semibold text-[var(--nj-ink)]">{dept.name}</p>
                          <span className="font-mono text-xs font-semibold text-[var(--nj-accent-text)] tabular-nums">
                            {filledCount}/{targetCount} vagas
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--nj-ink-muted)]">
                          {dept.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="nj-tabs flex flex-wrap items-center gap-1 w-fit">
                  {[
                    { id: 'visao', label: 'Visão Geral' },
                    ...visibleMediaDepartments.map((d) => ({
                      id: d.id,
                      label: d.name,
                    })),
                    { id: 'integrantes', label: 'Integrantes' },
                    { id: 'ocorrencias', label: 'Ocorrências & Checklists' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMediaSubTab(t.id as typeof mediaSubTab)}
                      className={`rounded-md px-3 py-1.5 text-xs whitespace-nowrap ${
                        mediaSubTab === t.id ? 'nj-tab-active' : 'nj-tab-idle'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule table / list */}
            {mediaSubTab !== 'integrantes' && mediaSubTab !== 'ocorrencias' && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                    Escala Publicada ({visibleSlots.length} vagas)
                  </h3>
                  <span className="text-xs text-[var(--nj-ink-subtle)]">
                    Vinculada ao calendário central de cultos
                  </span>
                </div>

                <div className="mt-4 divide-y divide-[var(--nj-border)] border-y border-[var(--nj-border)]">
                  {visibleSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-xs text-[var(--nj-accent-text)] tabular-nums">
                          {slot.departmentName ? `${slot.departmentName} · ` : ''}
                          {formatDatePtBR(slot.date)} · {slot.time} · {slot.eventTitle}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[var(--nj-ink)]">
                          {slot.positionName} — <span className="font-normal">{slot.volunteerName}</span>
                        </p>
                        {slot.swapReason && (
                          <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">
                            Substituição solicitada: {slot.swapReason}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className="text-xs font-medium text-[var(--nj-ink-muted)]">
                          {volunteerStatusLabel(slot.volunteerStatus)}
                        </span>
                        {slot.volunteerName === currentMemberName && slot.volunteerStatus !== 'confirmado' && (
                          <button
                            type="button"
                            onClick={() => updateVolunteerStatus(slot.id, 'confirmado')}
                            className="nj-btn-primary rounded-md px-2.5 py-1 text-xs"
                          >
                            Confirmar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integrantes da Mídia */}
            {isMedia && mediaSubTab === 'integrantes' && (
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                {selectedMinistry.departments?.map((dept) => (
                  <div key={dept.id} className="rounded-lg border border-[var(--nj-border)] p-4">
                    <h4 className="font-serif text-lg font-semibold text-[var(--nj-ink)]">{dept.name}</h4>
                    <p className="mt-1 text-xs text-[var(--nj-accent-text)]">
                      Chegada: {dept.arrivalMinutesBefore} min antes
                    </p>
                    <ul className="mt-3 space-y-1.5 text-xs text-[var(--nj-ink-muted)]">
                      {dept.positions.map((pos) => (
                        <li key={pos.id}>
                          <strong className="text-[var(--nj-ink)]">{pos.name}</strong> ({pos.quantity} vaga) — {pos.responsibilities}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-[var(--nj-border)] pt-2.5 text-xs text-[var(--nj-ink-subtle)]">
                      Equipe habilitada: {dept.members.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Checklists + Ocorrências (para Mídia na aba específica, e abaixo nos demais ministérios) */}
            {(!isMedia || mediaSubTab === 'ocorrencias') && (
              <div className="mt-6 grid grid-cols-1 gap-6 border-t border-[var(--nj-border)] pt-6 lg:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-[var(--nj-accent-text)]">
                    <CheckSquare className="h-4 w-4" />
                    <h3 className="font-serif text-lg font-semibold text-[var(--nj-ink)]">
                      Checklist Operacional & Funções
                    </h3>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(isMedia
                      ? selectedMinistry.departments?.flatMap((d) =>
                          d.checklist.map((item) => `[${d.name}] ${item}`)
                        ) || []
                      : selectedMinistry.checklist
                    ).map((item, idx) => {
                      const key = `${selectedMinistry.id}-${idx}`;
                      return (
                        <label key={key} className="flex cursor-pointer items-start gap-2.5 text-xs text-[var(--nj-ink-muted)]">
                          <input
                            type="checkbox"
                            checked={!!checkedItems[key]}
                            onChange={() => toggleCheck(key)}
                            className="mt-0.5 accent-[#B1D3AE]"
                          />
                          <span className={checkedItems[key] ? 'line-through opacity-60' : ''}>{item}</span>
                        </label>
                      );
                    })}
                  </div>

                  {!isMedia && selectedMinistry.positions.length > 0 && (
                    <div className="mt-5 border-t border-[var(--nj-border)] pt-4">
                      <p className="text-xs font-semibold text-[var(--nj-accent-text)]">
                        Composição padrão por culto
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-[var(--nj-ink-muted)] tabular-nums">
                        {selectedMinistry.positions.map((pos) => (
                          <li key={pos.id}>
                            · <strong className="text-[var(--nj-ink)]">{pos.name}</strong> ({pos.quantity}) — {pos.responsibilities}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[var(--nj-accent-text)]">
                    <AlertTriangle className="h-4 w-4" />
                    <h3 className="font-serif text-lg font-semibold text-[var(--nj-ink)]">
                      Registro de Ocorrências & Histórico
                    </h3>
                  </div>
                  {canManageSchedules && (
                    <form onSubmit={handleIncidentSubmit} className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={incidentNote}
                        onChange={(e) => setIncidentNote(e.target.value)}
                        placeholder="Registrar observação técnica ou ocorrência do culto..."
                        className="nj-input text-xs"
                      />
                      <button
                        type="submit"
                        className="nj-btn-primary inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs whitespace-nowrap"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Salvar
                      </button>
                    </form>
                  )}

                  <div className="mt-4 divide-y divide-[var(--nj-border)]">
                    {selectedMinistry.incidents.map((inc) => (
                      <div key={inc.id} className="py-2.5 text-xs">
                        <p className="text-[var(--nj-accent-text)] tabular-nums">
                          {formatDatePtBR(inc.date)} · {inc.author}
                        </p>
                        <p className="mt-0.5 text-[var(--nj-ink-muted)]">{inc.note}</p>
                      </div>
                    ))}
                    {selectedMinistry.incidents.length === 0 && (
                      <p className="py-3 text-xs text-[var(--nj-ink-subtle)]">
                        Nenhuma ocorrência registrada até o momento.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Repertório & Ensaios exclusivos do Ministério de Louvor (Músicas do Min. NJ + Outros Louvores) */}
            {selectedMinistry.slug === 'louvor' && (
              <div className="mt-6 grid grid-cols-1 gap-6 border-t border-[var(--nj-border)] pt-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-7">
                  <div className="flex items-center gap-2 text-[var(--nj-accent-text)]">
                    <Music className="h-4 w-4" />
                    <h3 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                      Repertório das Escalas (Min. Nova Jerusalém e Outros Louvores)
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--nj-ink-muted)]">
                    Todas as músicas inseridas aqui aparecem automaticamente na escala de cada integrante do Louvor e geram notificação para a equipe escalada.
                  </p>

                  {repertoires.map((rep) => {
                    const scaledNames = Array.from(
                      new Set(
                        schedules
                          .filter(
                            (s) =>
                              s.ministryId === 'min-louvor' &&
                              (s.date === rep.date || s.eventTitle === rep.eventTitle)
                          )
                          .map((s) => s.volunteerName)
                      )
                    );
                    return (
                      <div key={rep.id} className="rounded-lg border border-[var(--nj-border)] p-4">
                        <p className="text-xs font-medium text-[var(--nj-accent-text)] tabular-nums">
                          {rep.eventTitle} · {formatDatePtBR(rep.date)} ({rep.time}) · Ministro: {rep.ministerName}
                        </p>
                        <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">{rep.musicalNotes}</p>
                        {scaledNames.length > 0 && (
                          <p className="mt-1.5 text-[11px] text-[var(--nj-ink-subtle)]">
                            Equipe escalada notificada ({scaledNames.length}): {scaledNames.join(', ')}
                          </p>
                        )}
                        <div className="mt-3 divide-y divide-[var(--nj-border)]">
                          {rep.songs.map((song) => (
                            <div key={song.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                              <div>
                                <p className="font-semibold text-[var(--nj-ink)] tabular-nums">
                                  {song.order}. {song.title}{' '}
                                  <span className="font-normal text-[var(--nj-ink-muted)]">— {song.artist}</span>
                                </p>
                                <p className="text-[var(--nj-ink-subtle)] tabular-nums">
                                  {song.origin === 'min_nj' ? 'Min. Nova Jerusalém' : 'Outro louvor'} · Tom {song.key} · {song.bpm} BPM
                                  {song.notes ? ` · ${song.notes}` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {safeExternalUrl(song.referenceUrl) && (
                                  <a
                                    href={safeExternalUrl(song.referenceUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--nj-accent-text)] hover:underline"
                                  >
                                    Ouvir <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {canManageSchedules && (
                                  <button
                                    type="button"
                                    onClick={() => removeSongFromRepertoire(rep.id, song.id)}
                                    className="rounded p-1 text-[var(--nj-ink-subtle)] hover:text-[var(--nj-ink)]"
                                    aria-label={`Remover ${song.title} do repertório`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-6 lg:col-span-5">
                  {/* Quick form to add ANY worship song to a Louvor schedule (Authenticated leaders/admins ONLY) */}
                  {canManageSchedules && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!songTitle.trim()) return;
                        addSongToRepertoire(repTargetId || repertoires[0]?.id, {
                          title: songTitle.trim(),
                          artist:
                            songOrigin === 'min_nj'
                              ? 'Ministério Nova Jerusalém'
                              : songArtist.trim() || 'Louvor Congregacional',
                          album: songOrigin === 'min_nj' ? 'Min. Nova Jerusalém' : 'Louvor Congregacional',
                          origin: songOrigin,
                          key: songKey.trim() || 'G',
                          bpm: Number(songBpm) || 72,
                          referenceUrl: songRefUrl.trim() || undefined,
                          notes: songNotes.trim() || undefined,
                        });
                        setSongTitle('');
                        setSongArtist('');
                        setSongRefUrl('');
                        setSongNotes('');
                      }}
                      className="rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4 space-y-3"
                    >
                      <h3 className="font-serif text-lg font-semibold text-[var(--nj-ink)]">
                        Adicionar música à escala de Louvor
                      </h3>
                      <div>
                        <label className="block text-[11px] text-[var(--nj-ink-muted)]">Culto / Escala</label>
                        <select
                          value={repTargetId}
                          onChange={(e) => setRepTargetId(e.target.value)}
                          className="nj-input mt-1 w-full rounded-md px-2.5 py-1.5 text-xs"
                        >
                          {repertoires.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.eventTitle} ({formatDatePtBR(r.date)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSongOrigin('outro_louvor')}
                          className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                            songOrigin === 'outro_louvor' ? 'nj-tab-active' : 'nj-btn-secondary'
                          }`}
                        >
                          Outro louvor
                        </button>
                        <button
                          type="button"
                          onClick={() => setSongOrigin('min_nj')}
                          className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                            songOrigin === 'min_nj' ? 'nj-tab-active' : 'nj-btn-secondary'
                          }`}
                        >
                          Min. Nova Jerusalém
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="Nome do louvor *"
                        className="nj-input w-full rounded-md px-2.5 py-1.5 text-xs"
                      />
                      {songOrigin === 'outro_louvor' && (
                        <input
                          type="text"
                          required
                          value={songArtist}
                          onChange={(e) => setSongArtist(e.target.value)}
                          placeholder="Artista / Ministério (ex.: Fernandinho, Morada) *"
                          className="nj-input w-full rounded-md px-2.5 py-1.5 text-xs"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={songKey}
                          onChange={(e) => setSongKey(e.target.value)}
                          placeholder="Tom (ex.: G)"
                          className="nj-input rounded-md px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="number"
                          value={songBpm}
                          onChange={(e) => setSongBpm(e.target.value)}
                          placeholder="BPM"
                          className="nj-input rounded-md px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <input
                        type="url"
                        value={songRefUrl}
                        onChange={(e) => setSongRefUrl(e.target.value)}
                        placeholder="Link YouTube/Spotify para ensaio (opcional)"
                        className="nj-input w-full rounded-md px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        value={songNotes}
                        onChange={(e) => setSongNotes(e.target.value)}
                        placeholder="Observação musical (ex.: abertura, transição)"
                        className="nj-input w-full rounded-md px-2.5 py-1.5 text-xs"
                      />
                      <button type="submit" className="nj-btn-primary inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs">
                        <Plus className="h-3.5 w-3.5" />
                        Incluir e notificar escalados
                      </button>
                    </form>
                  )}

                  <div>
                    <h3 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
                      Calendário de Ensaios
                    </h3>
                    <div className="mt-3 divide-y divide-[var(--nj-border)] border-y border-[var(--nj-border)]">
                      {selectedMinistry.rehearsals?.map((reh) => (
                        <div key={reh.id} className="py-3 text-xs">
                          <p className="font-semibold text-[var(--nj-accent-text)] tabular-nums">
                            {formatDatePtBR(reh.date)} · {reh.time}
                          </p>
                          <p className="mt-0.5 text-[var(--nj-ink-muted)]">{reh.focus}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* MODE 2: MINHAS ESCALAS (Consolidado de todos os ministérios do usuário) */}
      {mode === 'minhas' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--nj-ink-muted)]">
            Todos os seus compromissos em diferentes ministérios reunidos em uma única conta ({currentMemberName}), com detecção automática de conflitos de horário.
          </p>
          {mySlots.map((slot) => {
            const matchedRepertoire =
              slot.ministryId === 'min-louvor'
                ? repertoires.find((r) => r.date === slot.date || r.eventTitle === slot.eventTitle)
                : undefined;

            return (
              <article key={slot.id} className="nj-card p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-medium text-[var(--nj-accent-text)] tabular-nums">
                      {slot.ministryName}
                      {slot.departmentName ? ` · ${slot.departmentName}` : ''} · {formatDatePtBR(slot.date)} às {slot.time}
                    </p>
                    <h2 className="mt-1 font-serif text-xl font-semibold text-[var(--nj-ink)]">
                      {slot.eventTitle}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--nj-ink-muted)]">
                      Função: <strong className="text-[var(--nj-ink)]">{slot.positionName}</strong>
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-[var(--nj-accent-text)]">
                      Situação: {volunteerStatusLabel(slot.volunteerStatus)}
                    </p>
                    {slot.notes && <p className="mt-1 text-xs text-[var(--nj-ink-subtle)]">{slot.notes}</p>}
                    {slot.swapReason && (
                      <p className="mt-1 text-xs text-[var(--nj-ink-subtle)]">Motivo: {slot.swapReason}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {slot.volunteerStatus !== 'confirmado' && (
                      <button
                        type="button"
                        onClick={() => updateVolunteerStatus(slot.id, 'confirmado')}
                        className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirmar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSwapSlotId(slot.id)}
                      className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Solicitar troca
                    </button>
                    {slot.volunteerStatus !== 'recusado' && (
                      <button
                        type="button"
                        onClick={() => updateVolunteerStatus(slot.id, 'recusado')}
                        className="nj-btn-secondary rounded-md px-3 py-2 text-xs"
                      >
                        Recusar
                      </button>
                    )}
                  </div>
                </div>

                {/* Músicas recebidas diretamente na escala do Ministério de Louvor */}
                {matchedRepertoire && (
                  <div className="mt-5 rounded-lg border border-[var(--nj-border)] bg-[var(--nj-surface-alt)] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nj-accent-text)]">
                      <Music className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Repertório desta Escala ({matchedRepertoire.songs.length} louvores)</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--nj-ink-muted)]">{matchedRepertoire.musicalNotes}</p>
                    <ul className="mt-3 divide-y divide-[var(--nj-border)] text-xs">
                      {matchedRepertoire.songs.map((song) => (
                        <li key={song.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                          <div>
                            <span className="font-semibold text-[var(--nj-ink)]">
                              {song.order}. {song.title}
                            </span>{' '}
                            <span className="text-[var(--nj-ink-muted)]">— {song.artist}</span>
                            <p className="text-[11px] text-[var(--nj-ink-subtle)]">
                              Tom {song.key} · {song.bpm} BPM{song.notes ? ` · ${song.notes}` : ''}
                            </p>
                          </div>
                          {safeExternalUrl(song.referenceUrl) && (
                            <a
                              href={safeExternalUrl(song.referenceUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-[var(--nj-accent-text)] hover:underline"
                            >
                              Ouvir referência <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* MODE 3: INDISPONIBILIDADE */}
      {mode === 'indisponibilidade' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <form onSubmit={handleUnavSubmit} className="nj-card space-y-4 p-6 lg:col-span-5 self-start">
            <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
              Bloquear data indisponível
            </h2>
            <p className="text-xs leading-relaxed text-[var(--nj-ink-muted)]">
              Datas bloqueadas aqui impedem automaticamente conflitos na hora em que o líder montar a escala.
            </p>
            <div>
              <label className="block text-xs font-medium text-[var(--nj-ink)]">Ministério</label>
              <select
                value={unavMinId}
                onChange={(e) => setUnavMinId(e.target.value)}
                className="nj-input mt-1"
              >
                {ministries.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--nj-ink)]">Data</label>
              <input
                type="date"
                required
                value={unavDate}
                onChange={(e) => setUnavDate(e.target.value)}
                className="nj-input mt-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--nj-ink)]">Motivo</label>
              <input
                type="text"
                required
                placeholder="Ex.: Viagem ou plantão"
                value={unavReason}
                onChange={(e) => setUnavReason(e.target.value)}
                className="nj-input mt-1"
              />
            </div>
            <button type="submit" className="nj-btn-primary w-full rounded-md px-4 py-2.5 text-xs">
              Registrar bloqueio de data
            </button>
          </form>

          <div className="nj-card p-6 lg:col-span-7">
            <h2 className="font-serif text-xl font-semibold text-[var(--nj-ink)]">
              Minhas datas bloqueadas ({myUnavailability.length})
            </h2>
            <div className="mt-4 divide-y divide-[var(--nj-border)]">
              {myUnavailability.map((u) => (
                <div key={u.id} className="py-3.5">
                  <p className="text-sm font-medium text-[var(--nj-ink)] tabular-nums">
                    {formatDatePtBR(u.date)} · {u.ministryName}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--nj-ink-muted)]">{u.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Solicitar Substituição */}
      {swapSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true">
          <div className="nj-card w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">Solicitar substituição</h3>
              <button
                type="button"
                onClick={() => setSwapSlotId(null)}
                className="rounded-md p-1 text-[var(--nj-ink-muted)] hover:bg-[#466053]/25"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSwapSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--nj-ink)]">
                  Motivo e sugestão de voluntário substituto
                </label>
                <textarea
                  rows={3}
                  required
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Ex.: Imprevisto profissional. Conversei com Vinícius Rocha para cobrir o vMix."
                  className="nj-input mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSwapSlotId(null)}
                  className="nj-btn-secondary rounded-md px-4 py-2 text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="nj-btn-primary rounded-md px-4 py-2 text-xs">
                  Enviar ao líder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
