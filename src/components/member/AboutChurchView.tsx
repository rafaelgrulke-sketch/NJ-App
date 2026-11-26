import React from 'react';
import {
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Users,
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { BrandLogoMark, SanctuaryArchitectureArt } from '../EditorialArt';

export const AboutChurchView: React.FC = () => {
  const { churchInfo, institutionalAreas } = useChurch();

  const mapsQuery = encodeURIComponent(
    `${churchInfo.address}, ${churchInfo.neighborhood}, ${churchInfo.cityState}, ${churchInfo.cep}`
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-[var(--nj-border)] pb-6">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
          Conheça Nossa Igreja · Fundada em {churchInfo.foundedDate}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--nj-ink)] sm:text-4xl">
          {churchInfo.officialName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--nj-ink-muted)]">
          {churchInfo.displayName} — {churchInfo.address}, {churchInfo.neighborhood}, {churchInfo.cityState} · CEP {churchInfo.cep}.
        </p>
      </div>

      {/* Story + Visual Split */}
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        <article className="nj-card flex flex-col justify-between p-7 lg:col-span-7">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              Nossa História
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
              Quatro décadas de fé, renovação espiritual e adoração no Sampaio
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--nj-ink-muted)]">
              {churchInfo.history}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--nj-border)] pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--nj-ink-subtle)]">Pastor Fundador</dt>
              <dd className="mt-0.5 font-serif text-lg font-semibold text-[var(--nj-ink)]">
                {churchInfo.foundingPastor}
              </dd>
              <p className="text-xs text-[var(--nj-ink-subtle)]">Fundação em {churchInfo.foundedDate}</p>
            </div>
            <div>
              <dt className="text-xs text-[var(--nj-ink-subtle)]">Pastor Presidente</dt>
              <dd className="mt-0.5 font-serif text-lg font-semibold text-[var(--nj-ink)]">
                {churchInfo.presidentPastor}
              </dd>
              <p className="text-xs text-[var(--nj-ink-subtle)]">Presidência desde {churchInfo.presidencyStart}</p>
            </div>
          </dl>
        </article>

        <div className="relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-xl border border-[var(--nj-border)] lg:col-span-5">
          <SanctuaryArchitectureArt className="absolute inset-0 h-full w-full" />
          <div className="relative z-10 bg-gradient-to-t from-[#213228]/95 via-[#213228]/60 to-transparent p-6 text-[#F3F1E9]">
            <div className="flex items-center gap-3">
              <BrandLogoMark size="md" />
              <div>
                <p className="font-serif text-xl font-semibold">{churchInfo.displayName}</p>
                <p className="text-xs text-[#B1D3AE]">{churchInfo.instagramHandle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Missão, Visão e Valores */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="nj-card p-6">
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">Missão</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--nj-ink-muted)]">{churchInfo.mission}</p>
        </div>
        <div className="nj-card p-6">
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">Visão</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--nj-ink-muted)]">{churchInfo.vision}</p>
        </div>
        <div className="nj-card p-6">
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">Valores</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--nj-ink-muted)]">
            {churchInfo.values.map((v, i) => (
              <li key={i} className="leading-snug">· {v}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Programação Semanal & Endereço / Google Maps */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="nj-card p-6 lg:col-span-6">
          <div className="flex items-center gap-2 text-[var(--nj-accent-text)]">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <h2 className="font-serif text-2xl font-semibold text-[var(--nj-ink)]">Programação Semanal</h2>
          </div>
          <div className="mt-4 divide-y divide-[var(--nj-border)]">
            {churchInfo.weeklyServices.map((srv) => (
              <div key={srv.id} className="flex items-baseline justify-between gap-4 py-3.5">
                <div>
                  <p className="text-xs font-medium text-[var(--nj-accent-text)]">{srv.day}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--nj-ink)]">{srv.title}</p>
                  <p className="text-xs text-[var(--nj-ink-subtle)]">{srv.location}</p>
                </div>
                <span className="font-mono text-sm font-medium text-[var(--nj-ink)] tabular-nums whitespace-nowrap">
                  {srv.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="nj-card-olive flex flex-col justify-between p-6 lg:col-span-6">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
              Localização & Atendimento Oficial
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
              Venha nos visitar no Sampaio
            </h2>

            <div className="mt-5 space-y-3 text-sm text-[var(--nj-ink-muted)]">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nj-accent-text)]" />
                <span>
                  <strong className="text-[var(--nj-ink)]">{churchInfo.address}</strong> — {churchInfo.neighborhood},{' '}
                  {churchInfo.cityState} · CEP {churchInfo.cep}
                </span>
              </p>
              <p className="flex items-center gap-2.5 tabular-nums">
                <Phone className="h-4 w-4 shrink-0 text-[var(--nj-accent-text)]" />
                <span>
                  {churchInfo.phonePrimary} · Alternativo: {churchInfo.phoneSecondary}
                </span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[var(--nj-accent-text)]" />
                <span>{churchInfo.email}</span>
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 border-t border-[var(--nj-border)] pt-5">
            <div className="flex flex-wrap gap-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="nj-btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs"
              >
                <MapPin className="h-3.5 w-3.5" />
                Abrir rota no Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={churchInfo.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
              >
                Site Oficial <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={churchInfo.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
              >
                Instagram <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={churchInfo.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="nj-btn-secondary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs"
              >
                YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-[var(--nj-ink-subtle)]">
              Facebook: {churchInfo.facebookHandle} · Dados editáveis em tempo real pelo Painel Administrativo.
            </p>
          </div>
        </section>
      </div>

      {/* Demais Ministérios e Atividades Institucionais (Seção 14) */}
      <section>
        <div className="border-b border-[var(--nj-border)] pb-4">
          <p className="text-xs font-medium tracking-widest uppercase text-[var(--nj-accent-text)]">
            Áreas de Atuação & Comunhão
          </p>
          <h2 className="mt-1.5 font-serif text-2xl font-semibold text-[var(--nj-ink)]">
            Demais Ministérios e Atividades da Igreja
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {institutionalAreas.map((area) => (
            <article key={area.id} className="nj-card flex flex-col justify-between p-5">
              <div>
                <p className="text-xs font-medium text-[var(--nj-accent-text)]">{area.subtitle}</p>
                <h3 className="mt-1 font-serif text-xl font-semibold text-[var(--nj-ink)]">{area.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--nj-ink-muted)]">{area.description}</p>
              </div>
              <div className="mt-4 space-y-1 border-t border-[var(--nj-border)] pt-3 text-xs text-[var(--nj-ink-subtle)]">
                <p className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 shrink-0 text-[var(--nj-accent-text)]" />
                  {area.leader}
                </p>
                <p>{area.schedule}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
