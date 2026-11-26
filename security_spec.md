# Security Specification — Nova Jerusalém Sampaio (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Superadmin/Pastoral Exclusivity on Official Discography (`discography`)**: Only verified users whose server-stored `users/{uid}.role` is `'superadmin'` or `'pastoral'` (or the verified bootstrapped superadmin `rafaelgrulke123@gmail.com`) may create, update, or delete `discography` documents.
2. **Zero Self-Assigned Role Escalation (`users/{uid}`)**: A newly registering user can only create `users/{uid}` with `role == 'membro'` (except the verified bootstrapped superadmin email). On update, a regular user can only modify personal preferences (`displayName`, `photoUrl`, `favoriteTrackIds`, `eventReminders`, `completedBibleDays`, `readNotificationIds`, `notificationPrefs`, `updatedAt`) and can NEVER modify `role`, `uid`, or `createdAt`.
3. **LGPD PII & Prayer Privacy Isolation (`users`, `eventRegistrations`, `prayers`)**:
   - `users/{uid}` (email, profile) is readable ONLY by the owner or `superadmin`/`pastoral`.
   - `eventRegistrations/{id}` (name, phone, email) is readable ONLY by staff/leaders or the signed-in registrant, never publicly.
   - `prayers/{id}` with `privacy == 'equipe_identificado'` or `'equipe_anonimo'` is readable ONLY by `superadmin`/`pastoral` (or the signed-in author), NEVER by visitors or other members.
4. **Master Gate on Subcollections (`users/{uid}/sermonNotes/{noteId}`)**: Personal sermon notes require the parent `users/{uid}` document to exist and `ownerId == request.auth.uid`.
5. **Global Consistency on Event Registrations**: Creating an `eventRegistrations` document MUST verify `exists(/databases/$(database)/documents/events/$(incoming().eventId))`.
6. **Immutable Audit Trail (`auditLogs`)**: Audit logs can only be created by verified staff with `actorUid == request.auth.uid` and `createdAt == request.time`, and can NEVER be updated or deleted.
7. **Temporal Integrity & Anti-DoW Limits**: Every write validates document ID regex (`^[a-zA-Z0-9_\-]+$`), exact allowed keys (`hasAll`/`hasOnly` or `affectedKeys().hasOnly`), strict string `.size()` caps, bounded arrays, and `request.time` timestamps.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return `PERMISSION_DENIED`)
1. **Privilege Escalation on Signup**: Regular user creates `users/{uid}` with `role: "superadmin"`.
2. **Role Self-Promotion on Update**: Member updates own `users/{uid}` with `{ role: "pastoral" }`.
3. **Shadow Field Injection**: Admin or visitor sends an extra undocumented field (`isVerified: true`) in `prayers` or `events`.
4. **Unauthorized Official Music Mutation**: `admin_conteudo` or `lider_ministerio` tries to create/edit a `discography` document.
5. **Email Spoofing Without Verification**: Auth token claims `email: "rafaelgrulke123@gmail.com"` with `email_verified: false`.
6. **LGPD Prayer Leak**: Visitor or regular member tries `get` or `list` on a `prayers` document with `privacy: "equipe_identificado"`.
7. **Event Registration PII Scraping**: Visitor or member tries `list` on `eventRegistrations` to harvest phone numbers and emails.
8. **Orphaned Registration Attack**: Visitor submits `eventRegistrations` referencing a non-existent `eventId: "evt-nonexistent"`.
9. **Terminal Prayer State Bypass**: Non-superadmin tries to edit a prayer already marked `status: "atendido"`, or member tries to jump `prayingCount` by `+500`.
10. **Audit Log Tampering**: Staff member tries to `update` or `delete` an existing `auditLogs` entry, or spoof `actorUid` of another user.
11. **ID Poisoning & 1MB DoW Payload**: Attacker uses a 200-char/invalid-char document ID (`../hack`) or a 50KB `message` string in `prayers`.
12. **Client Timestamp Forgery**: Caller submits a backdated `createdAt` instead of `request.time` on `prayers`, `eventRegistrations`, or `auditLogs`.
