/**
 * Phase 0 TDD Specification — Dirty Dozen Adversarial Test Suite
 * Verifies all 12 attack payloads against firestore.rules invariants.
 * Run against Firebase Rules Unit Testing emulator when available.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actor: 'visitor' | 'membro' | 'lider_ministerio' | 'admin_conteudo' | 'unverified_superadmin';
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  blockingRule: string;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Privilege Escalation on Signup',
    collection: '/users/attacker_uid',
    operation: 'create',
    actor: 'membro',
    payload: {
      uid: 'attacker_uid',
      displayName: 'Attacker',
      email: 'attacker@example.com',
      role: 'superadmin',
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'users create: role == "membro" unless isBootstrapSuperAdmin()',
  },
  {
    id: 2,
    name: 'Role Self-Promotion on Update',
    collection: '/users/member_uid',
    operation: 'update',
    actor: 'membro',
    payload: {
      role: 'pastoral',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'users update: self-update affectedKeys().hasOnly(non-role keys)',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Prayer Create',
    collection: '/prayers/pry_shadow',
    operation: 'create',
    actor: 'visitor',
    payload: {
      authorId: 'visitor',
      authorName: 'Visitante',
      isVisitor: true,
      category: 'Família',
      message: 'Oração pela família',
      privacy: 'comunidade',
      prayingCount: 1,
      status: 'recebido',
      createdAt: 'SERVER_TIMESTAMP',
      isAdminApproved: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'isValidPrayer(): data.keys().hasOnly([...]) rejects ghost fields',
  },
  {
    id: 4,
    name: 'Unauthorized Min. Nova Jerusalém Discography Mutation',
    collection: '/discography/alb_rogue',
    operation: 'create',
    actor: 'admin_conteudo',
    payload: {
      title: 'Álbum Não Autorizado',
      year: 2026,
      type: 'single',
      spotifyUrl: 'https://open.spotify.com/',
      appleMusicUrl: 'https://music.apple.com/',
      amazonMusicUrl: 'https://music.amazon.com/',
      youtubeUrl: 'https://www.youtube.com/',
      tracks: [],
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'discography write: strictly requires isSuperAdminOrPastoral()',
  },
  {
    id: 5,
    name: 'Email Spoofing Without email_verified == true',
    collection: '/discography/alb_spoof',
    operation: 'delete',
    actor: 'unverified_superadmin',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'isBootstrapSuperAdmin() requires request.auth.token.email_verified == true',
  },
  {
    id: 6,
    name: 'LGPD Private Prayer Read Leak',
    collection: '/prayers/pry_private_01',
    operation: 'get',
    actor: 'membro',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'prayers get: requires privacy == "comunidade" || authorId == uid || isSuperAdminOrPastoral()',
  },
  {
    id: 7,
    name: 'Event Registration PII Scraping',
    collection: '/eventRegistrations',
    operation: 'list',
    actor: 'visitor',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'eventRegistrations list: strictly restricted to isAdminOrLeader() or own userId',
  },
  {
    id: 8,
    name: 'Orphaned Event Registration Reference',
    collection: '/eventRegistrations/reg_orphan',
    operation: 'create',
    actor: 'visitor',
    payload: {
      eventId: 'evt_does_not_exist',
      userId: 'visitor',
      name: 'Teste',
      phone: '(21) 99999-9999',
      email: 'teste@example.com',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'eventRegistrations create: exists(/databases/$(database)/documents/events/$(incoming().eventId))',
  },
  {
    id: 9,
    name: 'Prayer Intercession Counter Flooding (+500)',
    collection: '/prayers/pry_public_01',
    operation: 'update',
    actor: 'membro',
    payload: {
      prayingCount: 501,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'prayers update: community action mandates incoming().prayingCount == existing().prayingCount + 1',
  },
  {
    id: 10,
    name: 'Audit Log Tampering / Deletion',
    collection: '/auditLogs/aud_01',
    operation: 'delete',
    actor: 'admin_conteudo',
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'auditLogs: allow update, delete: if false;',
  },
  {
    id: 11,
    name: 'ID Poisoning & Oversized Message DoW Payload',
    collection: '/prayers/..%2F..%2Fevil',
    operation: 'create',
    actor: 'visitor',
    payload: {
      authorId: 'visitor',
      authorName: 'Attacker',
      isVisitor: true,
      category: 'DoW',
      message: 'A'.repeat(5000),
      privacy: 'comunidade',
      prayingCount: 1,
      status: 'recebido',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'isValidId(prayerId) && data.message.size() <= 1500',
  },
  {
    id: 12,
    name: 'Client Timestamp Forgery on Prayer / Audit Create',
    collection: '/auditLogs/aud_backdated',
    operation: 'create',
    actor: 'lider_ministerio',
    payload: {
      actorUid: 'leader_uid',
      actor: 'lider_ministerio',
      action: 'Backdated log',
      module: 'Escalas',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingRule: 'incoming().createdAt == request.time',
  },
];
