# Client Workout Log – Implementation Blueprint

This document captures **all functional, architectural, and UX requirements** for the client-side workout logging feature. It is intended for:
1. Engineering hand-off (Next.js + Supabase implementation).
2. Feeding into AI design tools such as **UX Pilot** for automated wire-frame / high-fidelity design generation.

---
## 1. High-level Goals
* Allow athletes to **view, log, and edit** their prescribed workouts on a rolling weekly basis.
* Support navigation to past/future weeks while preserving data integrity.
* Provide a mobile-first experience with offline support.

---
## 2. Routing & URL Structure
| Route | Type | Purpose | Query Params |
|-------|------|---------|-------------|
| `/client/workouts` | RSC (Server Component) | Default entry point. Loads the **current week** for the signed-in client. | `week` (optional ISO string, ex: `2025-W25`)
| `/client/workouts/[planId]` | RSC | Same view but scoped to a particular plan if multiple plans are active. | `week` (optional)
| `/client/workouts/log/[exerciseLogId]` | Client Route (Modal) | Deep-link to **edit a single set log**. Opens as a modal over the week view. | –
| `/client/workouts/calendar` | Client Route | Optional **month overview** grid. Navigates back to week view on date click. | `month` (ISO `YYYY-MM`, default = current month)

Redirect rules:
* If `week` is missing → server assigns `today`'s ISO week.
* If user is not authenticated → middleware redirects to `/sign-in?next=/client/workouts`.

---
## 3. Database Entities (Supabase/Postgres)
```sql
-- Enum already in schema
CREATE TYPE intensity AS ENUM ('ABS', 'PERCENT');

CREATE TABLE exercise_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_instruction   uuid REFERENCES workout_set_instruction(id) ON DELETE CASCADE,
  client_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  performed_at      timestamptz NOT NULL DEFAULT now(),
  weight_actual     numeric NOT NULL CHECK (weight_actual > 0),
  reps_actual       int     NOT NULL CHECK (reps_actual > 0),
  rpe               numeric(3,1),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON exercise_log (client_id, performed_at);
```

---
## 4. Server Actions / API End-points
| File | Func | Input Zod Schema | Use-case |
|------|------|------------------|----------|
| `actions/exercise-log.create.ts` | `logSet` | `{ setInstructionId: uuid, weight: number, reps: number, rpe?: number }` | Insert new log row. |
| `actions/exercise-log.update.ts` | `updateSetLog` | `{ logId: uuid, weight: number, reps: number, rpe?: number }` | Edit existing entry. |
| `actions/exercise-log.delete.ts` | `deleteSetLog` | `{ logId: uuid }` | Allow user to delete a mistaken entry. |
| `actions/fetch-week-workouts.ts` | `fetchWeek` | `{ week: string (ISO), planId?: uuid }` | Return prescription sets + existing logs + client max lifts for a 7-day span. |

All actions use **`createSafeAction`** helper (see `lib/create-safe-action.ts`) for auth, validation and typed errors.

---
## 5. React Component Hierarchy
```text
app/(client)/workouts/page.tsx          (RSC)
└─ WeeklyLogShell                        (Client boundary – hydration)
   ├─ WeekHeader                         (week nav, today btn)
   ├─ WeekDayChips                       (Su–Sa progress chips) 
   └─ WorkoutDayPanel                    (renders the selected day)
      ├─ ExerciseCard                    (collapsible)
      │  └─ SetLogTable
      │     └─ SetRow                   (inline form ➜ logSet / update)
      └─ EmptyState / CelebrationBanner
```
Mobile variant:
* `WeekDayChips` becomes horizontally scrollable (`overflow-x-auto`, `snap-x`).
* `ExerciseCard` auto-expands only the first incomplete exercise.

---
## 6. State & Data Flow
1. **RSC fetches** `fetchWeek()` → returns `{ days, logs, maxLifts }`.
2. Client component builds derived UI state (`targetLoad`, completion %) with helper `getTargetLoad`.
3. On log submit → optimistic UI update + `startTransition(() => logSet(...))`.
4. Upon success → `revalidatePath('/client/workouts')` (Next 15).

Offline:
* Failed mutations stored in **IndexedDB** via `react-query` or custom queue; retried by SW.

---
## 7. UI/UX Requirements
* **Accessibility**: every interactive element is a `<button>` or `<input>` w/ appropriate ARIA.
* **Visual feedback**:
  * Row flashes green on save.
  * Progress ring in chip animates (`stroke-dasharray`).
* **Lock rule**: entries older than 14 days become read-only (show lock icon).
* **Error handling**: toast on network / validation error.
* **Responsive**: target 320 px width – use 1-column cards & sticky footer save bar on mobile.

---
## 8. Edge Cases & Validation
* `intensity='PERCENT'` but client has no 1-RM → show **TBD** label.
* Attempting to log set for a future date (> program day) → server rejects.
* Duplicate log for same set → `ON CONFLICT (set_instruction, client_id, performed_at)` upsert or validate client-side.

---
## 9. Open API-style Contract (Optional)
```yaml
post /api/exercise-log
  requestBody:
    application/json:
      schema: CreateExerciseLog
  responses:
    201:
      description: Created
```
(Generated automatically from Zod with `zod-to-openapi` – out of scope here.)

---
## 10. Deliverables Checklist
- [ ] DB migration + Prisma model for `exercise_log`.
- [ ] Four server actions with unit tests.
- [ ] Component tree scaffold with Storybook stories.
- [ ] Integration tests (Cypress) for week navigation and set logging.
- [ ] Lighthouse mobile score ≥ 95.

---
## 11. Machine-readable Spec
The following JSON encapsulates the critical entities for ingestion by LLM/UX-Pilot tools.

```json
{
  "routes": [
    {
      "path": "/client/workouts",
      "type": "RSC",
      "query": { "week": "ISO Week String (optional)" },
      "description": "Main week-view workout logger"
    },
    {
      "path": "/client/workouts/[planId]",
      "type": "RSC",
      "query": { "week": "ISO Week String (optional)" },
      "description": "Same view but filtered to a specific plan"
    },
    {
      "path": "/client/workouts/log/[exerciseLogId]",
      "type": "Client Modal",
      "description": "Deep-link to edit a specific set log"
    },
    {
      "path": "/client/workouts/calendar",
      "type": "Client",
      "query": { "month": "YYYY-MM" },
      "description": "Month overview grid"
    }
  ],
  "serverActions": [
    "logSet",
    "updateSetLog",
    "deleteSetLog",
    "fetchWeek"
  ],
  "components": {
    "WeeklyLogShell": "hydrates week data & manages selection",
    "WeekHeader": "navigation buttons & week label",
    "WeekDayChips": "progress indicators for each day",
    "WorkoutDayPanel": "lists exercises for selected day",
    "ExerciseCard": "collapsible container per exercise",
    "SetLogTable": "table of sets inside a card",
    "SetRow": "inline form for a single set"
  },
  "db": {
    "exercise_log": {
      "cols": [
        "id uuid pk",
        "set_instruction uuid fk",
        "client_id uuid fk",
        "performed_at timestamptz",
        "weight_actual numeric",
        "reps_actual int",
        "rpe numeric"
      ]
    }
  },
  "ux": {
    "mobileDefault": "Week chips horizontally scrollable",
    "desktopDefault": "7-column grid with collapsible exercises",
    "lockAfterDays": 14
  }
}
