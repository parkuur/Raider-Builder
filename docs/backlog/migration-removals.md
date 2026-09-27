# Temporary migration removals

Ledger of code that exists only so documents saved in an older format still load. Each entry is
removed (code, tests and this row) in a `chore:` commit once its "remove after" date has passed —
roughly a year after it was added, by which point users have had ample time to re-save their files.
See CLAUDE.md §5.1.

| Migration | Code location | Reason | Added | Remove after |
|---|---|---|---|---|
| Header `revision`/`date` → `metaFields` | `legacyHeaderMetaFields` in `src/lib/model/header-meta.ts`, called from `validateHeaderMetaFields` in `src/lib/model/persistence.ts` | Header meta fields became dynamic (epic 09) | 2026-08-14 | 2027-08-14 |
| Two-list Equipment → split layout of two single-list Equipment sections | `migrateLegacyEquipmentRows` in `src/lib/model/migrations/legacy-equipment.ts`, called from `validateDocumentShape` in `src/lib/model/persistence.ts` | Equipment became a single-list split section (epic 13) | 2026-09-27 | 2027-09-27 |
