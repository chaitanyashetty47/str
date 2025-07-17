# Trainer Workout Plan – UI / UX & Data-Flow Design

*Routes covered*
1. **`/training/plans/create`** – create a brand-new plan.
2. **`/training/plans/[id]`** – view / edit an existing plan (draft or published).

---

## 1 Global layout

| Region | Purpose | Major components |
|--------|---------|------------------|
| Header | Breadcrumbs (`Training › Plans › Create / {title}`), back button, _Save Draft_ & _Publish_ buttons. | `components/training-breadcrumb.tsx`, `components/submit-button.tsx` |
| Main grid (3-panes) | 1️⃣ Left sidebar – Week & Day navigation  2️⃣ Center canvas – Day composer  3️⃣ Right drawer – Exercise library | `components/sidebar.tsx`, **new** `components/plan/day-canvas.tsx`, **new** `components/plan/exercise-drawer.tsx` |

Flex / CSS Grid: `lg:grid-cols-[250px_1fr_320px]` with right drawer hidden on ≤lg.

---

## 2 Entities & hierarchy

```
WorkoutPlan  (title, start_date, duration, …)
└─ Week[n]   (derived by date)           ⇠ UI: *Week accordion*
   └─ Day[1-7]  (day_date, title, …)     ⇠ UI: *Day tabs under week*
      └─ Exercise[]                      ⇠ UI: *Exercise cards list*
         └─ Set[]                        ⇠ UI: *Set inline-table*
```

Mapping ↔ `schema.prisma`

| UI object | Table | Notes |
|-----------|-------|-------|
| Plan      | `workout_plans` | `end_date` = `start_date` + `duration_in_weeks*7 - 1` |
| Week      | *implicit*      | Calculated; no table row (we store `day_date`) |
| Day       | `workout_days`  | uses `day_date`, `week_number`, `day_number` |
| Exercise  | `workout_day_exercises` | `order` column used for drag-to-reorder |
| Set       | `workout_set_instructions` | `weight_prescribed`, `reps`, `intensity` (text / `%1RM`) |

---

## 3 Left sidebar – Week & Day navigation

### 3.1  How "Week N" blocks are produced and kept in sync

The sidebar never stores its own week list – it is derived from the `workout_days` array kept in React state.

1. **Normalise days → weeks**
   ```ts
   type Day = Prisma.workout_daysGetPayload<{ include: { workout_day_exercises: true } }>

   function groupByWeek(days: Day[]) {
     const weeks = new Map<number, {
       weekNumber: number
       start: Date
       end: Date
       days: Day[]
     }>()

     days.forEach((d) => {
       if (!weeks.has(d.week_number)) {
         const monday = d.day_date           // we guarantee DB stores correct dates
         const sunday = addDays(monday, 6)
         weeks.set(d.week_number, {
           weekNumber: d.week_number,
           start: monday,
           end: sunday,
           days: []
         })
       }
       weeks.get(d.week_number)!.days.push(d)
     })

     // Sort by weekNumber before returning
     return Array.from(weeks.values()).sort((a, b) => a.weekNumber - b.weekNumber)
   }
   ```
2. **Render** each entry as an `AccordionItem` label:
   ```jsx
   <AccordionItem value={`week-${w.weekNumber}`}> 
     <AccordionTrigger>
       Week {w.weekNumber}&nbsp;
       <span className="text-muted-foreground text-xs">(
         {format(w.start, "dd MMM")} – {format(w.end, "dd MMM")})
       )</span>
     </AccordionTrigger>
     {/* Inside: Day list */}
   </AccordionItem>
   ```
3. **Adding a new week**
   ```ts
   async function handleAddWeek() {
     const lastWeek = weeks[weeks.length - 1]
     await duplicateWeekAction(planId, lastWeek.weekNumber)
     mutate()             // re-fetch SWR / react-query cache
   }
   ```
   Server-side logic:
   * Read all rows where `week_number = srcWeek` → duplicate with `week_number = srcWeek + 1`,
   * Recalculate `day_date` = previous `day_date` + 7 days.
4. **Reordering weeks (drag-drop)**
   * Client sends `oldIndex, newIndex`.
   * Server loops over affected weeks, updates both `week_number` **and** each `day_date` ±7*K days.
   * Everything in one `prisma.$transaction`.
5. **Guard rails**
   * Unique constraint `@@unique([plan_id, day_date])` already prevents overlapping dates.
   * Extra backend check ensures `week_number` sequence starts at 1 and has no holes.
6. **Visual cues**
   * If *today* lies within `w.start` … `w.end` add `bg-primary/5` to header.
   * Completed week: all `days.every(d => d.status === 'DONE')` → show ✅ badge.
   * Locked week: compare with plan status flags (future feature).

These steps let you keep the Week accordion 100 % data-driven while still supporting advanced mutations like clone, insert, delete, or reorder without breaking date alignment.

* Accordion per week (`Week 1 (Mon 07/01–Sun 13/01)`).
* Inner list shows Day 1 … Day 7 with mini-status chips (✔︎ completed, ✎ draft).
* Controls
  * ➕ Add Week – duplicates previous week's structure (no sets) **or** empty.
  * 🗑  Delete week (with confirm).
  * Drag handle to reorder entire week block (updates all contained `week_number` & `day_date`).

_Data operations_
1. `duplicateWeekAction(planId, sourceWeek)` → server-action reads days + exercises + sets, clones rows with new `week_number`, recalculates `day_date`.
2. `reorderWeekAction(planId, oldIndex, newIndex)` → wraps multiple updates in `prisma.$transaction`.

---

## 4 Center canvas – Day composer

### 4.1 Day header
* Dropdown: select another day in same week.
* Editable `title` + focus tag selector.
* KPI summary: *Est. ~14 min · 3 exercises* (calculated client-side from set counts & rest times).

### 4.2 Exercises list
* `dnd-kit` vertical sort – drag cards; onDrop posts `reorderExerciseAction(dayId, newOrder[])` → updates `order` column.
* Card anatomy
  * Thumbnail (gif or YouTube cover).
  * Exercise name (link to library entry).
  * Inline table of sets: Set #, Weight (kg/lb / %1RM selector), Reps, Rest (s).
  * Context menu: Duplicate exercise, Remove, Move to another day.

### 4.3 Add exercise CTA
* _Add exercises from library →_ opens right drawer with search pre-focused.

_Data operations_
* `createExerciseAction(dayId, list_exercise_id, initialSets[])` → inserts into `workout_day_exercises` + bulk create `workout_set_instructions`.
* `updateSetAction(setId, payload)` → patch single set row.

---

## 5 Right drawer – Exercise library

* Tabs by `BodyPart` enum (Chest, Back, All …).
* Search input with debounce; hits `/api/exercises?query=...&type=CHEST` returning `workout_exercise_lists`.
* Infinite scroll list; clicking an item pushes exercise to current day & auto-scrolls canvas.

---

## 6 Plan header (global meta form)

Fields → table columns

| Input            | Validation                         | Column |
|------------------|------------------------------------|--------|
| Title (text)     | required, ≤ 80 chars               | `title` |
| Start Date       | Monday only date-picker            | `start_date` |
| Duration (weeks) | int 1-52                            | `duration_in_weeks` |
| End Date         | disabled, auto-calc                | `end_date` |
| Category         | select `WorkoutCategory`           | `category` |
| Description      | textarea ≤ 500                     | `description` |

_Server action_ `upsertPlanMetaAction(data)` performs `prisma.workout_plans.upsert`.

---

## 7 Set instruction helpers

* Weight cell: toggle between **Absolute** (kg/lb) & **Relative** (%1RM) modes.
  * Stored as: `weight_prescribed` (Float) **and** `intensity` ("ABS" | "PERCENT")
* Reps cell: int; Rest cell: int seconds.
* Optional notes cell expands per row (popover) → saves to `notes`.

---

## 8 Save flows

| Button            | Action                                     |
|-------------------|--------------------------------------------|
| _Save Draft_      | Validate partial form → call all pending server actions (debounced) │
| _Publish_         | Same + `status = PUBLISHED` column (future) │
| _Delete Plan_     | soft delete flag                            │

All mutations run via **Server Actions** assuring RLS & type-safety.

---

## 9 Client libraries & utilities

* React Hook Form + Zod schemas per form scope (PlanMeta, SetRow).
* `useFieldArray` for dynamic sets.
* `react-query` (app router cache) or built-in `use` fetch for initial load.
* `dnd-kit` for drag-n-drop.

---

## 10 Accessibility & responsiveness

* Full keyboard support for sidebar navigation and set table editing.
* Drawer becomes modal on mobile.
* Sticky save buttons on mobile bottom bar.

---

## 11 Data consistency & transactions

* All multi-row writes (`duplicateWeek`, `reorderWeek`, `saveDay`) run inside `prisma.$transaction`.
* Back-end validates that `day_date` matches `week_number` & `day_number` before commit.

---

## 12 Open questions / future TODOs

* Progression rule engine (auto-fill next week).
* Deload week flagging.
* Plan templating / exporting.
* Client progress tracking overlay.

---

## 🚀 LLM build instructions

```json
{
  "goal": "Implement Trainer Workout-Plan Builder (/training/plans/create and /training/plans/[id]) in Next.js 15 + Prisma + Supabase.",
  "steps": [
    {
      "title": "Scaffold pages & layout",
      "task": "Create /training/plans/create/page.tsx and /training/plans/[id]/page.tsx using 3-pane grid layout described above."
    },
    {
      "title": "Build left sidebar component",
      "task": "Implement WeekAccordion and DayNav with drag-to-reorder via dnd-kit; wire to server actions duplicateWeekAction & reorderWeekAction."
    },
    {
      "title": "Implement center DayCanvas",
      "task": "Render Day header, ExerciseCard list and SetTable. Provide inline editing with React Hook Form useFieldArray; call updateSetAction on blur."
    },
    {
      "title": "Create right ExerciseDrawer",
      "task": "Query workout_exercise_lists via Supabase RPC; search & filter; onSelect -> createExerciseAction."
    },
    {
      "title": "Plan meta form",
      "task": "Add PlanHeader component with Zod validation; call upsertPlanMetaAction. Auto-calculate end_date."
    },
    {
      "title": "Server actions & Prisma",
      "task": "Implement createPlanAction, upsertPlanMetaAction, duplicateWeekAction, reorderWeekAction, createExerciseAction, reorderExerciseAction, updateSetAction with transactions and RLS safe-guards."
    },
    {
      "title": "Drag-n-drop ordering",
      "task": "Exercise cards sortable; persist order column. Week blocks sortable; persist week_number & day_date."
    },
    {
      "title": "Cloning week / exercise helpers",
      "task": "Provide UI buttons; backend clones exercises & sets adjusting week_number and day_date."
    },
    {
      "title": "Set instruction enhancements",
      "task": "Weight mode switch (ABS vs %1RM), notes popover, intensity field mapping to workout_set_instructions.intensity." 
    },
    {
      "title": "RLS & validation",
      "task": "Ensure server actions verify trainer owns the plan; enforce date consistency; write CHECK constraints as needed."
    }
  ]
}

```

---

## 13 Shadcn UI component map

Below is a quick reference showing which [shadcn/ui](https://ui.shadcn.com) primitives fit each area of the builder.  Use this as the starting palette—feel free to swap or extend.

| Page region / element | Suggested component(s) | Notes |
|-----------------------|------------------------|-------|
| Page header           | `header` wrapper + `Breadcrumb`, `Button` (variant="outline" for _Back_, variant="default" for _Save_) | Place buttons inside a flex row with `gap-2` |
| Plan meta form        | `Card`/`Fieldset`, `Input`, `Textarea`, `Select`, `Calendar` | Calendar is the [Date Picker] recipe (`Popover` + `Calendar`) |
| Week accordion        | `Accordion` (type="multiple"), `Separator` between weeks | Each `AccordionItem` = Week block |
| Day tabs              | `Tabs` (`TabList` horizontal), `Badge` for status chip | Alternatively small `RadioGroup` |
| Exercise card         | `Card`, `DropdownMenu` (ellipsis actions), `Avatar` for thumb | Drag handle is a small `Button` with `Grip` icon |
| Set table             | `Table`, `Input`, `Select`, `Popover` for notes | Weight cell uses `Input` + `Select` inside `InputRightElement` |
| Add-exercise CTA      | `Button` (variant="link") with ChevronRight icon | Sticks to bottom of Day canvas |
| Right drawer / modal  | `Sheet` (side="right") on ≥lg, `Dialog` on <lg | Inside use `Command` for search + `ScrollArea` list |
| Search / filter chips | `Command`, `Tabs` or `SegmentedControl` pattern | BodyPart tabs map to enum |
| Notifications / toasts | `toast` hook (`useToast`) | Show success / error after server actions |
| Confirm dialogs       | `AlertDialog` | For delete week / exercise |
| Drag-and-drop overlay | CSS only; highlight target with `Card` + `ring-primary` | not in shadcn directly |

> Hint: generate the base JSX quickly with `npx shadcn-ui@latest add <component>` and then adapt styling.

---
