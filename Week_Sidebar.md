Great – let's get our hands dirty 🙂 and begin with the **state layer** that everything else (WeekSidebar, DayCanvas, PlanHeader, etc.) will read from or update.

Below is a guided, incremental path that follows the "teach-don't-code-for-me" rule in `@learnings`.

--------------------------------------------------------------------
1 Why start with a context?
--------------------------------------------------------------------
• We need one *authoritative* object that contains  
  a) the plan metadata (title, start date, …)  
  b) the editable array of weeks ⇢ days ⇢ exercises ⇢ sets.  
• Multiple sibling components mutate or read it.  
• A React Context + reducer lets you share state without an extra library while keeping updates predictable (pure functions!).

Question to ponder  
*If you later switched to Recoil or Zustand, what API conveniences would you gain? What new bundle weight or SSR constraints might appear?*


--------------------------------------------------------------------
2 Design the state *shape* first
--------------------------------------------------------------------
Think through these invariants before you write code:

1. `weeks.length === durationWeeks`  
2. `each week.days.length === 3` (always Day 1-3)  
3. Week numbers and day numbers are contiguous (1…n).  
4. Every exercise inside a day has an `order` index you'll store in `workout_day_exercises.order`.

Sketch your TypeScript interfaces on paper or in a scratch file.  
(Use the blueprint from my previous reply as inspiration.)

Checklist (`state-schema.md`)
```
- [ ] WeekInPlan interface drafted
- [ ] DayInPlan interface drafted
- [ ] ExerciseInPlan & SetInPlan drafted
- [ ] Confirm invariants 1-4 are represented
```

--------------------------------------------------------------------
3 Create the context skeleton
--------------------------------------------------------------------
File suggestion: `components/create-plan/PlanEditorContext.tsx`

Pseudocode (don't copy-paste blindly – fill the … yourself):

```tsx
import { createContext, useContext, useReducer, ReactNode } from "react"

// 1. ------------- Types -------------
export interface PlanEditorState { /* … from step 2 … */ }

type Action =
  | { type: "ADD_WEEK" }
  | { type: "SELECT_WEEK_DAY"; week: number; day: 1 | 2 | 3 }
  // add others later

// 2. ------------- Reducer -------------
function reducer(state: PlanEditorState, action: Action): PlanEditorState {
  switch (action.type) {
    case "ADD_WEEK": {
      // build new WeekInPlan with 3 blank days
      // return new state
    }
    case "SELECT_WEEK_DAY": {
      // update selectedWeek / selectedDay
    }
    default:
      return state
  }
}

// 3. ------------- Contexts -------------
const StateCtx = createContext<PlanEditorState | undefined>(undefined)
const DispatchCtx = createContext<React.Dispatch<Action> | undefined>(undefined)

// 4. ------------- Provider -------------
export function PlanEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, /* initialState */)
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}

// 5. ------------- Hooks -------------
export function usePlanState() { … }
export function usePlanDispatch() { … }
```

Understanding check  
*Why do we split StateCtx and DispatchCtx instead of one combined object?*  
(Type your answer, then verify it by measuring re-renders with React DevTools.)

--------------------------------------------------------------------
4 Wire the provider into the page
--------------------------------------------------------------------
In `CreatePlanMain` wrap everything:

```tsx
return (
  <PlanEditorProvider>
    {/* existing <PlanHeader … /> <WeekSidebar … /> etc. */}
  </PlanEditorProvider>
)
```

For now you can remove the old local `useState` holders; they'll be replaced by context access.

--------------------------------------------------------------------
5 Implement the first action: ADD_WEEK
--------------------------------------------------------------------
Goal: clicking a temporary "Add Week" button should append Week N with 3 empty days, and `durationWeeks` should read `weeks.length`.

Hints  
• In the reducer build a helper `createBlankWeek(n: number): WeekInPlan`.  
• After pushing, recalculate `selectedWeek` if needed (e.g., scroll to new week).  
• Update PlanHeader to **read** `weeks.length` instead of owning its own duration field.

Thought-provoking questions  
1. Should deleting week 2 in a 3-week plan shift week 3 to week 2?  
2. How does that impact `startDate + offset` when we later compute `day_date`?  
3. What UX happens if the trainer deletes the only remaining week?

--------------------------------------------------------------------
6 Now build WeekSidebar
--------------------------------------------------------------------
• Consume `usePlanState()` to get `weeks`, `selectedWeek`, `selectedDay`.  
• `Add Week` button dispatches `{type:"ADD_WEEK"}`.  
• Each list item dispatches `{type:"SELECT_WEEK_DAY", …}`.  
• Duplicate / delete week menu items can be TODOs for now.

Edge-case to test  
‣ Add 10 weeks quickly → ensure Sidebar list scrolls smoothly.  
‣ Select day 3 week 1, then add week → selection shouldn't jump unexpectedly.

Checklist (`week-sidebar.md`)
```
- [ ] Render list of week titles with exercise counts
- [ ] Highlight selected week/day
- [ ] Add Week button works and header duration updates
- [ ] Scrolling behaviour verified
```

--------------------------------------------------------------------
7 Refactor DayCanvas to use context
--------------------------------------------------------------------
Replace the prop-drilling (`weeks`, `setWeeks`, `selectedDay` …) with hooks:

```tsx
const { weeks, selectedDay, selectedWeek } = usePlanState()
const dispatch = usePlanDispatch()
```

Inside the scroll-into-view `useEffect` you keep the same logic, but the "updateDayTitle", "addSet", "addExercise" helpers now dispatch reducer actions instead of mutating a local copy.

Challenge exercise  
Design an action for `ADD_EXERCISE` that also sets `order = day.exercises.length`.  
Ask yourself: *where is the single source of truth for order: the array index, or a dedicated `order` field inside each exercise?*

--------------------------------------------------------------------
8 Iterate and expand
--------------------------------------------------------------------
Add more actions one by one:

```
RENAME_DAY
DUPLICATE_WEEK
DELETE_WEEK
ADD_EXERCISE
REORDER_EXERCISE
ADD_SET
UPDATE_SET_FIELD
```

Each time:
1. Update the reducer.
2. Update the UI component to dispatch the new action.
3. Add a checkbox in the relevant markdown check-list.
4. Write a quick jest unit test for the reducer branch (optional but instructive).

--------------------------------------------------------------------
Resources to help you along
--------------------------------------------------------------------
• Official docs: [Using a reducer in Context](https://react.dev/learn/scaling-up-with-reducer-and-context)  
• Immer for immutable updates: [Immer docs](https://immerjs.github.io/immer/)  
• Article: "Why split State & Dispatch Context" – Kent C. Dodds blog.

--------------------------------------------------------------------
Next step for you
--------------------------------------------------------------------
1. Draft the state interfaces + invariants.  
2. Create `PlanEditorContext.tsx` with an **empty** reducer and provider.  
3. Wrap `CreatePlanMain` with the provider and confirm your app still renders.  

Ping me once you have that scaffold in place, and we'll add the first `ADD_WEEK` action together!

---------------------------------------------------------------------
                      Workout Day Exercise Adder

---------------------------------------------------------------------
## 9 Day Canvas and Exercise Editing

### 9.1 New reducer actions (add to `PlanEditorContext.tsx`)
```ts
// day-level
{ type: "RENAME_DAY";  week: number; day: 1|2|3; title: string }
{ type: "ADD_EXERCISE"; week: number; day: 1|2|3; exercise: ExerciseInPlan }
{ type: "DELETE_EXERCISE"; week: number; day: 1|2|3; uid: string }
{ type: "REORDER_EXERCISE"; week: number; day: 1|2|3; from: number; to: number }

// set-level inside an exercise
{ type: "ADD_SET";        week: number; day: 1|2|3; uid: string }
{ type: "DELETE_SET";     week: number; day: 1|2|3; uid: string; setNumber: number }
{ type: "UPDATE_SET_FIELD"; week:number; day:number; uid:string; setNumber:number; field:"weight"|"reps"|"rest"|"notes"; value:string|number }
```
All branches update `estimatedTimeMinutes = day.exercises.reduce(…​)` so sidebar progress stays live.

### 9.2 `DayCanvas` component
1. `usePlanState()` → `{ weeks, selectedWeek, selectedDay }`
2. Scroll-into-view same as v0, but **read** only.
3. Inside a selected DayContainer –
   * Title `<input>` dispatches `RENAME_DAY`.
   * "Add exercise" opens `ExerciseDrawer`; drawer passes chosen exercise snapshot to `ADD_EXERCISE` (order = `day.exercises.length`).
   * dnd-kit wrapper emits `onDragEnd` → `REORDER_EXERCISE`.
   * 3-dot menu inside ExerciseCard emits `DELETE_EXERCISE`.
   * Each SetRow has "Add / Delete" icons → `ADD_SET` / `DELETE_SET`.
   * Inputs on the set grid update weight/reps/rest/notes via `UPDATE_SET_FIELD` (debounced).

### 9.3 Helpers to keep arrays consistent
Use Immer in reducer:
```ts
case "ADD_EXERCISE": {
  const day = draft.weeks[w-1].days[d-1];
  day.exercises.push({ ...action.exercise, order: day.exercises.length });
  break;
}
case "REORDER_EXERCISE": {
  const arr = draft.weeks[w-1].days[d-1].exercises;
  const [moved] = arr.splice(from,1);
  arr.splice(to,0,moved);
  arr.forEach((ex,i)=>ex.order=i);
  break;
}
```

---------------------------------------------------------------------
## 10 Plan-wide Intensity Toggle

### 10.1 Reducer action
```ts
{ type: "TOGGLE_PLAN_INTENSITY"; mode: "ABSOLUTE" | "PERCENT"; strategy: "CONVERT" | "RESET" }
```
• If `CONVERT` → run helper over all days converting weights using cached 1RM or blanking when unknown.  
• If `RESET` → set all `weight_prescribed = ""`.

### 10.2 PlanHeader UI
Add `RadioGroup` with two options. On change, open `AlertDialog` asking convert / reset.  Dispatch accordingly.

---------------------------------------------------------------------
## 11 Save / Publish / Archive flows

### 11.1 New reducer action
```ts
{ type: "SET_STATUS"; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }
```
Status lives in `meta.status` (align with `WorkoutPlanStatus`).

### 11.2 Toolbar component (below PlanHeader)
* "Save Draft" → calls server action `savePlan(draft)` (status stays DRAFT).  
* "Publish" → confirm dialog → `SET_STATUS("PUBLISHED")` → same server action.  
* "Delete" → confirm → `SET_STATUS("ARCHIVED")`.

### 11.3 Server action outline
1. Upsert `workout_plans` (by id when editing).  
2. Delete existing child rows when saving (simpler initial impl).  
3. Insert weeks → days → exercises → sets.  
4. Wrap in transaction.

---------------------------------------------------------------------
## 12 Check-list going forward
- [ ] Implement all reducer branches above
- [ ] Build DayCanvas with drag-and-drop & set grid editing
- [ ] Hook ExerciseDrawer to ADD_EXERCISE
- [ ] Add plan-wide intensity toggle UI + logic
- [ ] Add Save / Publish / Delete toolbar and server action
- [ ] Write unit tests for reducer conversions
- [ ] QA: duplicate week, toggle intensity after data, publish then archive
---------------------------------------------------------------------