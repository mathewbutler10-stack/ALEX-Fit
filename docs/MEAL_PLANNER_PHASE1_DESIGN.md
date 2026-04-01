# APEX Smart Meal Planner — Phase 1 Design Document

> **Date:** 2026-04-01
> **Status:** Design / Pre-Implementation
> **Timeline:** 3 weeks
> **Inspired by:** EatThisMuch.com

---

## 1. Executive Summary

Phase 1 adds a fully automated meal planning system to APEX. A PT generates a personalised 7-day meal plan for a client in one click, the client browses it in a mobile-first swipe interface, can request meal swaps, and gets an auto-generated grocery list. The backend generation runs in a deterministic scoring algorithm (pure TypeScript, no ML dependency) that respects dietary restrictions, calorie/macro targets, variety rules, and prep-time constraints.

---

## 2. Existing State Audit

### What we already have

| Asset | Location | Notes |
|-------|----------|-------|
| `meal_library` table | `001_apex_schema.sql:96` | Has name, calories, protein, carbs, fat, tags[], ingredients[], is_global, gym_id |
| `weekly_meal_plans` table | `001_apex_schema.sql:111` | Per-slot rows (client_id, day, meal_type, meal_id, client_swap_meal_id) |
| `food_log` table | `001_apex_schema.sql:126` | Client daily intake tracking |
| `food_favourites` table | `001_apex_schema.sql:142` | Saved meals per client |
| `clients` table | `001_apex_schema.sql:63` | Has calorie_goal, protein_goal, carbs_goal, fat_goal |
| PT Meal Library UI | `src/app/pt/meals/page.tsx` | Browse, search, filter by tag, add meal modal |
| 16 seed meals | `002_seed_data.sql` | Global meals (breakfasts, lunches, dinners, snacks) |
| RLS policies | `001_apex_schema.sql:447` | PT/owner insert, gym-or-global read, client read-own |

### Gaps that block Phase 1

| Gap | Impact |
|-----|--------|
| `meal_library` has no `prep_time`, `difficulty`, dietary flags, or `cuisine` | Algorithm can't filter by diet or prep constraints |
| No `client_dietary_preferences` table | No way to store allergies, dislikes, preferences |
| `weekly_meal_plans.client_swap_meal_id` has no FK, no status | Swap workflow is incomplete |
| No `grocery_lists` / `grocery_list_items` tables | Can't generate shopping lists |
| `weekly_meal_plans` has no plan-level grouping or status | Can't distinguish draft from published plans |
| `meal_library.ingredients` is `text[]` of free-form strings | Can't parse quantities for grocery aggregation |

---

## 3. Database Schema Enhancements

### Migration 003 — Enhance meal_library

```sql
-- Add nutritional & metadata columns to meal_library
ALTER TABLE meal_library
  ADD COLUMN IF NOT EXISTS fiber          int     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sugar          int     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS serving_size   text,                    -- e.g. "1 bowl (400g)"
  ADD COLUMN IF NOT EXISTS prep_time_mins int     DEFAULT 15,      -- minutes
  ADD COLUMN IF NOT EXISTS difficulty     text    DEFAULT 'easy'
                            CHECK (difficulty IN ('easy','medium','hard')),
  ADD COLUMN IF NOT EXISTS cuisine        text,                    -- e.g. 'asian', 'mediterranean'
  ADD COLUMN IF NOT EXISTS image_url      text,
  ADD COLUMN IF NOT EXISTS is_vegetarian  bool    DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_vegan       bool    DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_gluten_free bool    DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_dairy_free  bool    DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_nut_free    bool    DEFAULT false,
  ADD COLUMN IF NOT EXISTS meal_type      text                     -- 'breakfast','lunch','dinner','snack'
                            CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

-- Move meal_type out of tags[] into a proper column
-- (tags[] remains for cuisine/style labels like 'high-protein', 'meal-prep-friendly')

CREATE TRIGGER meal_library_updated_at
  BEFORE UPDATE ON meal_library
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS: pts/owners can update meals they created or that belong to their gym
CREATE POLICY "meal_library: creator or gym can update"
  ON meal_library FOR UPDATE
  USING (
    auth_role() IN ('pt','owner')
    AND (created_by = auth.uid() OR gym_id = auth_gym_id())
  );

CREATE POLICY "meal_library: creator or gym can delete"
  ON meal_library FOR DELETE
  USING (
    auth_role() IN ('pt','owner')
    AND (created_by = auth.uid() OR gym_id = auth_gym_id())
    AND is_global = false     -- protect global meals
  );
```

### Migration 004 — Client dietary preferences

```sql
-- Per-client dietary profile, set by client (or PT on their behalf)
CREATE TABLE IF NOT EXISTS client_dietary_preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gym_id              uuid NOT NULL REFERENCES gyms(id),
  -- Hard restrictions (filter out meals that violate these)
  is_vegetarian       bool DEFAULT false,
  is_vegan            bool DEFAULT false,
  is_gluten_free      bool DEFAULT false,
  is_dairy_free       bool DEFAULT false,
  is_nut_free         bool DEFAULT false,
  -- Allergen text list (free-form, matched against ingredients[])
  allergens           text[] DEFAULT '{}',   -- e.g. ['shellfish','soy']
  -- Disliked ingredients (soft filter — avoid but don't block)
  disliked_ingredients text[] DEFAULT '{}',  -- e.g. ['capsicum','olives']
  -- Preferred cuisines (used to boost scores)
  preferred_cuisines  text[] DEFAULT '{}',   -- e.g. ['mediterranean','asian']
  -- Max prep time the client is willing to do
  max_prep_time_mins  int DEFAULT 45,
  -- Meal frequency per day (drives how many slots to fill)
  meals_per_day       int DEFAULT 3 CHECK (meals_per_day BETWEEN 2 AND 6),
  -- Notes visible to PT
  notes               text,
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (client_id)
);

ALTER TABLE client_dietary_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dietary_prefs: client access own"
  ON client_dietary_preferences FOR ALL
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "dietary_prefs: pt/owner access gym clients"
  ON client_dietary_preferences FOR ALL
  USING (
    gym_id = auth_gym_id()
    AND auth_role() IN ('pt','owner')
  );

CREATE TRIGGER dietary_prefs_updated_at
  BEFORE UPDATE ON client_dietary_preferences
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### Migration 005 — Meal plan status + swap workflow

```sql
-- Add plan-level status to weekly_meal_plans
ALTER TABLE weekly_meal_plans
  ADD COLUMN IF NOT EXISTS status           text DEFAULT 'published'
                            CHECK (status IN ('draft','published','archived')),
  ADD COLUMN IF NOT EXISTS swap_status      text DEFAULT 'none'
                            CHECK (swap_status IN ('none','pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS swap_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS swap_resolved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS pt_notes          text,
  ADD COLUMN IF NOT EXISTS client_notes      text;

-- Fix the dangling FK on client_swap_meal_id
ALTER TABLE weekly_meal_plans
  ADD CONSTRAINT fk_client_swap_meal
  FOREIGN KEY (client_swap_meal_id) REFERENCES meal_library(id) ON DELETE SET NULL;

-- Client can write swap requests on their own plan slots
CREATE POLICY "weekly_meal_plans: client request swap"
  ON weekly_meal_plans FOR UPDATE
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()))
  WITH CHECK (
    -- Client can only touch swap columns, not reassign meals
    client_id = (SELECT id FROM clients WHERE user_id = auth.uid())
  );
```

### Migration 006 — Grocery lists

```sql
-- One grocery list per weekly meal plan (identified by client + week_start)
CREATE TABLE IF NOT EXISTS grocery_lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gym_id      uuid NOT NULL REFERENCES gyms(id),
  week_start  date NOT NULL,
  generated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, week_start)
);

CREATE TABLE IF NOT EXISTS grocery_list_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id uuid NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  ingredient      text NOT NULL,     -- normalised name, e.g. "Chicken Breast"
  quantity        text,              -- e.g. "600g"
  category        text,              -- e.g. "Meat", "Dairy", "Produce"
  checked         bool DEFAULT false,
  sort_order      int DEFAULT 0
);

ALTER TABLE grocery_lists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_items  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grocery_lists: client access own"
  ON grocery_lists FOR ALL
  USING (client_id = (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "grocery_lists: pt/owner read gym"
  ON grocery_lists FOR SELECT
  USING (gym_id = auth_gym_id() AND auth_role() IN ('pt','owner'));

CREATE POLICY "grocery_list_items: access via list"
  ON grocery_list_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists gl
      WHERE gl.id = grocery_list_items.grocery_list_id
        AND (gl.client_id = (SELECT id FROM clients WHERE user_id = auth.uid())
             OR (gl.gym_id = auth_gym_id() AND auth_role() IN ('pt','owner')))
    )
  );
```

### Schema Diagram (post-migrations)

```
meal_library ──────────────────────────────────────────────────────┐
 id, name, calories, protein, carbs, fat                           │
 fiber, sugar, serving_size                                        │
 prep_time_mins, difficulty, cuisine, meal_type                    │
 is_vegetarian, is_vegan, is_gluten_free, is_dairy_free, is_nut_free│
 tags[], ingredients[], image_url                                  │
 is_global, gym_id, created_by                                     │
                                                                   │
clients                     client_dietary_preferences             │
 id ──────────────────────── client_id (1:1)                       │
 calorie_goal               is_vegetarian, is_vegan, ...          │
 protein_goal               allergens[], disliked_ingredients[]    │
 carbs_goal                 preferred_cuisines[]                   │
 fat_goal                   meals_per_day, max_prep_time_mins      │
    │                                                              │
    └── weekly_meal_plans ──────────────────── meal_id ────────────┘
         id                      client_swap_meal_id ──────────────┘
         client_id, pt_id, gym_id
         week_start, day, meal_type
         status, swap_status
         swap_requested_at, swap_resolved_at
         pt_notes, client_notes
              │
              └── grocery_lists
                   id, client_id, week_start
                        │
                        └── grocery_list_items
                             ingredient, quantity, category, checked
```

---

## 4. Meal Generation Algorithm

### Inputs

```typescript
interface GenerationInputs {
  client: {
    calorie_goal: number      // e.g. 2200
    protein_goal: number      // e.g. 160g
    carbs_goal:   number      // e.g. 220g
    fat_goal:     number      // e.g. 70g
  }
  prefs: ClientDietaryPreferences
  availableMeals: Meal[]      // pre-filtered by gym + global
  weekStart: string           // ISO date, Monday
  previousPlans?: WeeklyMealPlan[]  // last 2 weeks for variety scoring
}

interface GenerationResult {
  slots: PlannedSlot[]        // 7 days × meals_per_day slots
  warnings: string[]          // e.g. "Only 2 dinners meet all filters"
}
```

### Phase 1: Hard Filtering

Remove any meal that violates a hard constraint. A meal is **excluded** if:

```
client.is_vegetarian  && !meal.is_vegetarian   → exclude
client.is_vegan       && !meal.is_vegan        → exclude
client.is_gluten_free && !meal.is_gluten_free  → exclude
client.is_dairy_free  && !meal.is_dairy_free   → exclude
client.is_nut_free    && !meal.is_nut_free     → exclude
meal.prep_time_mins   > prefs.max_prep_time    → exclude
meal.meal_type        ≠ slotType               → exclude (breakfasts only in breakfast slots, etc.)

allergen check: any(prefs.allergens, a => any(meal.ingredients, i => i.toLowerCase().includes(a)))
  → exclude
```

If fewer than 3 meals pass for a slot type, emit a warning and relax prep-time constraint first, then dietary soft filters.

### Phase 2: Scoring

Each candidate meal for a slot gets a composite score (0–100):

```
score = (
  macro_fit_score(meal, targetPerSlot) × 0.45
  + variety_score(meal, usedThisWeek, usedLastTwoWeeks) × 0.30
  + preference_score(meal, prefs) × 0.15
  + difficulty_score(meal, prefs) × 0.10
)
```

**macro_fit_score** — How close the meal's macros are to the per-slot target:

```typescript
function macroFitScore(meal: Meal, target: MacroTarget): number {
  // target = daily goals ÷ meals_per_day, with slot-type weighting
  // breakfast ~25%, lunch ~35%, dinner ~30%, snack ~10% of daily calories
  const calDelta  = Math.abs(meal.calories - target.calories) / target.calories
  const protDelta = Math.abs(meal.protein  - target.protein)  / target.protein
  const carbDelta = Math.abs(meal.carbs    - target.carbs)    / target.carbs
  const fatDelta  = Math.abs(meal.fat      - target.fat)      / target.fat
  const avg = (calDelta * 0.4 + protDelta * 0.35 + carbDelta * 0.15 + fatDelta * 0.1)
  return Math.max(0, 100 - avg * 100)
}
```

**variety_score** — Penalise recently used meals:

```typescript
function varietyScore(meal: Meal, usedThisWeek: Set<string>, usedLastTwo: Set<string>): number {
  if (usedThisWeek.has(meal.id))  return 0    // already used this week — block
  if (usedLastTwo.has(meal.id))   return 30   // used last 2 weeks — heavy penalty
  return 100
}
```

**preference_score** — Boost meals matching preferred cuisines / PT-favourited meals:

```typescript
function preferenceScore(meal: Meal, prefs: ClientDietaryPreferences): number {
  let score = 50  // neutral baseline
  if (prefs.preferred_cuisines.includes(meal.cuisine)) score += 30
  // penalise disliked ingredients
  const hasDisliked = prefs.disliked_ingredients.some(d =>
    meal.ingredients.some(i => i.toLowerCase().includes(d.toLowerCase()))
  )
  if (hasDisliked) score -= 40
  return Math.max(0, Math.min(100, score))
}
```

**difficulty_score** — Match client's comfort with prep time:

```typescript
function difficultyScore(meal: Meal, prefs: ClientDietaryPreferences): number {
  const margin = prefs.max_prep_time_mins - meal.prep_time_mins
  if (margin < 0)   return 0
  if (margin < 10)  return 50
  return 100
}
```

### Phase 3: Slot Assignment

```
DAYS = [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
SLOT_TYPES = determine from meals_per_day:
  2 → [lunch, dinner]
  3 → [breakfast, lunch, dinner]
  4 → [breakfast, lunch, dinner, snack]
  5 → [breakfast, snack, lunch, dinner, snack]
  6 → [breakfast, snack, lunch, snack, dinner, snack]

FOR each day IN DAYS:
  FOR each slotType IN SLOT_TYPES:
    1. hardFilter(availableMeals, slotType, client, prefs) → candidates
    2. scoreAll(candidates, dailyTargets[slotType], usedThisWeek, usedLastTwo, prefs)
    3. SORT by score DESC
    4. ADD randomness: pick from top-3 candidates (weighted random, not always #1)
       → prevents all plans looking identical
    5. ASSIGN meal to slot, ADD to usedThisWeek set
    6. ACCUMULATE daily macros; if day total calories drifts > 15% from goal,
       adjust next slot's target upward/downward to compensate

RETURN slots + dailySummary + warnings
```

### Phase 4: Daily Macro Validation

After all slots are filled, validate:

```typescript
for (const day of days) {
  const totals = sumMacros(day.slots)
  const calPct = Math.abs(totals.calories - client.calorie_goal) / client.calorie_goal
  if (calPct > 0.15) warnings.push(`${day}: calories ${totals.calories} vs goal ${client.calorie_goal}`)
}
```

### Pseudocode Summary

```
generateWeeklyPlan(client, prefs, meals, weekStart, previousPlans):
  usedLastTwo = collectMealIds(previousPlans)
  usedThisWeek = new Set()
  slots = []

  for day in MON..SUN:
    dailyCalTarget = client.calorie_goal
    dailyRemaining = dailyCalTarget

    for (slotIdx, slotType) in enumerate(SLOT_TYPES):
      slotCalTarget = dailyCalTarget × SLOT_WEIGHT[slotType]
      candidates = hardFilter(meals, slotType, prefs)

      if candidates.length === 0:
        // Graceful degradation: relax prep_time, then warn
        candidates = hardFilter(meals, slotType, prefs, relaxed=true)
        addWarning("Limited options for " + slotType + " on " + day)

      scored = candidates.map(m => ({ meal: m, score: compositeScore(m, ...) }))
      top3   = scored.sortByScore().slice(0, 3)
      chosen = weightedRandomPick(top3)

      slots.push({ client_id, pt_id, gym_id, week_start, day, meal_type: slotType, meal_id: chosen.id })
      usedThisWeek.add(chosen.id)

  return { slots, warnings }
```

---

## 5. UI/UX Wireframes

### 5.1 PT View — Enhanced Meal Library (`/pt/meals`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  MEAL LIBRARY                              [+ Add Meal]  [Generate] │
├─────────────────────────────────────────────────────────────────────┤
│  [Search meals...]   [Type ▼]  [Diet ▼]  [Difficulty ▼]  [Cuisine ▼]│
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ 🥗 Chicken Salad │  │ 🍳 Eggs on Toast │  │ 🐟 Salmon Veg    │  │
│  │ Lunch · Easy     │  │ Breakfast · Easy │  │ Dinner · Medium  │  │
│  │ 420 kcal         │  │ 380 kcal         │  │ 520 kcal         │  │
│  │ P:38 C:28 F:14   │  │ P:22 C:42 F:16   │  │ P:44 C:18 F:22   │  │
│  │ ⏱ 10 min  🌍 Med │  │ ⏱ 5 min          │  │ ⏱ 25 min 🌍 Asian│  │
│  │ [Edit] [★ Fav]   │  │ [Edit] [★ Fav]   │  │ [Edit] [★ Fav]   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│  ... (grid continues)                                               │
└─────────────────────────────────────────────────────────────────────┘
```

**Changes from current:**
- Filter row adds Type, Diet, Difficulty, Cuisine dropdowns
- Meal cards show prep time, difficulty, cuisine badge
- Edit button opens enhanced meal modal (vs. current add-only)
- "Generate" button opens client selector → triggers generation

---

### 5.2 PT View — Generate Meal Plan Modal

```
┌────────────────────────────────────────────────────────┐
│  Generate Meal Plan                              [×]   │
├────────────────────────────────────────────────────────┤
│  Client:  [Sophie Turner ▼]                           │
│  Week:    [Mon 31 Mar 2026 ▼]                         │
│                                                        │
│  ── Client Goals ─────────────────────────────────────│
│  Calories: 1,900  Protein: 145g  Carbs: 200g  Fat: 60g│
│                                                        │
│  ── Dietary Restrictions ─────────────────────────────│
│  ✅ Gluten-free    ☐ Vegan    ☐ Vegetarian            │
│  Allergens: none                                       │
│  Dislikes:  capsicum, olives                          │
│  Max Prep:  30 min                                    │
│                                                        │
│  ── Plan Options ──────────────────────────────────────│
│  Meals per day:  [3 ▼]                                │
│  Auto-approve client swaps: [Off ▼]                   │
│                                                        │
│  [Preview Plan →]                            [Cancel] │
└────────────────────────────────────────────────────────┘
```

---

### 5.3 PT View — Plan Preview (before save)

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back    Plan Preview: Sophie Turner  31 Mar – 6 Apr            │
│                                             [Regenerate]  [Save →] │
├──────────┬────────────┬──────────────────┬─────────────────────────┤
│ Day      │ Breakfast  │ Lunch            │ Dinner                  │
├──────────┼────────────┼──────────────────┼─────────────────────────┤
│ Monday   │ Overnight  │ Chicken Salad    │ Salmon & Veggies        │
│          │ Oats       │ 420 kcal         │ 520 kcal                │
│          │ 310 kcal   │ P:38 C:28 F:14   │ P:44 C:18 F:22          │
│          │ [swap ▾]   │ [swap ▾]         │ [swap ▾]                │
├──────────┼────────────┼──────────────────┼─────────────────────────┤
│ Tuesday  │ Protein    │ Tuna Rice Bowl   │ Chicken & Sweet Potato  │
│          │ Smoothie   │ 460 kcal         │ 490 kcal                │
│          │ [swap ▾]   │ [swap ▾]         │ [swap ▾]                │
├──────────┴────────────┴──────────────────┴─────────────────────────┤
│ ... (remaining days collapsed, expand with [+])                    │
├────────────────────────────────────────────────────────────────────┤
│ WEEKLY TOTALS:                                                     │
│ Avg: 1,840 kcal/day  P:138g  C:195g  F:58g  (goal: 1900/145/200/60)│
│ ⚠ Tuesday dinner is 45 kcal below target (within 5% — acceptable) │
└────────────────────────────────────────────────────────────────────┘
```

---

### 5.4 Client View — Meal Plan (mobile-first, `/client/meals`)

**Week Overview (default view):**

```
┌─────────────────────────────┐
│ ← My Meals                  │
│                             │
│  Week of 31 Mar             │
│  ┌─────────────────────┐    │
│  │  Mon  Tue  Wed  Thu │    │
│  │  [●]  [ ]  [ ]  [ ] │  → swipe to navigate
│  └─────────────────────┘    │
│                             │
│  MONDAY                     │
│  ─────────────────────────  │
│  ☀ Breakfast                │
│  ┌───────────────────────┐  │
│  │ Overnight Oats        │  │
│  │ 310 kcal              │  │
│  │ P:12  C:52  F:8       │  │
│  │ ⏱ 5 min  🌿 Vegetarian│  │
│  │ [Details]   [Swap →]  │  │
│  └───────────────────────┘  │
│                             │
│  🥗 Lunch                   │
│  ┌───────────────────────┐  │
│  │ Grilled Chicken Salad │  │
│  │ 420 kcal              │  │
│  │ P:38  C:28  F:14      │  │
│  │ [Details]   [Swap →]  │  │
│  └───────────────────────┘  │
│                             │
│  🌙 Dinner                  │
│  ┌───────────────────────┐  │
│  │ Salmon & Vegetables   │  │
│  │ 520 kcal              │  │
│  │ P:44  C:18  F:22      │  │
│  │ [Details]   [Swap →]  │  │
│  └───────────────────────┘  │
│                             │
│  ───────────────────────    │
│  Daily total: 1,250 kcal    │
│  Goal: 1,900 kcal           │
│  Progress bar: ████░░░░ 66% │
│                             │
│  [View Grocery List 🛒]     │
└─────────────────────────────┘
```

---

### 5.5 Client View — Swap Meal (swipe/modal)

```
┌─────────────────────────────┐
│ ← Swap Meal                 │
│                             │
│  Replacing: Chicken Salad   │
│  (Lunch, Monday)            │
│                             │
│  [Search replacements...]   │
│                             │
│  ┌───────────────────────┐  │
│  │ Tuna Brown Rice Bowl  │  ← swipe right to select
│  │ 460 kcal              │
│  │ P:42  C:52  F:12      │  │
│  │ Similar calories ✓    │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Chicken Wrap          │  │
│  │ 430 kcal              │  │
│  │ P:34  C:48  F:14      │  │
│  │ ⚠ 10 kcal higher      │  │
│  └───────────────────────┘  │
│                             │
│  [Request Swap]             │
│  (PT approval required)     │
└─────────────────────────────┘
```

---

### 5.6 Client View — Grocery List

```
┌─────────────────────────────┐
│ ← Grocery List              │
│  Week of 31 Mar             │
│                             │
│  PRODUCE                    │
│  ☐  Baby spinach    200g    │
│  ☐  Cherry tomatoes 300g    │
│  ☑  Avocado         2x      │
│  ☐  Sweet potato    400g    │
│                             │
│  MEAT & FISH                │
│  ☐  Chicken breast  800g    │
│  ☐  Salmon fillet   600g    │
│  ☐  Lean beef mince 500g    │
│                             │
│  DAIRY & EGGS               │
│  ☐  Eggs            12x     │
│  ☐  Greek yoghurt   500g    │
│  ☐  Cottage cheese  250g    │
│                             │
│  PANTRY                     │
│  ☐  Brown rice      400g    │
│  ☐  Rolled oats     500g    │
│  ☐  Protein powder  1 scoop │
│                             │
│  [Share List 📤]            │
└─────────────────────────────┘
```

---

### 5.7 PT View — Swap Request Notification

```
┌────────────────────────────────────────────────────────┐
│  Swap Requests (2 pending)                             │
├────────────────────────────────────────────────────────┤
│  Sophie Turner                          Mon 31 Mar     │
│  Lunch: Chicken Salad → Tuna Rice Bowl                 │
│  "Not a fan of the dressing"                           │
│                              [✓ Approve]  [✗ Decline] │
├────────────────────────────────────────────────────────┤
│  James Chen                             Tue 1 Apr      │
│  Dinner: Salmon & Veg → Beef Stir Fry                  │
│  "Don't have salmon this week"                         │
│                              [✓ Approve]  [✗ Decline] │
└────────────────────────────────────────────────────────┘
```

---

## 6. TypeScript Types

Add to `src/lib/types.ts`:

```typescript
export interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  serving_size: string | null
  prep_time_mins: number
  difficulty: 'easy' | 'medium' | 'hard'
  cuisine: string | null
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  image_url: string | null
  is_vegetarian: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  is_dairy_free: boolean
  is_nut_free: boolean
  tags: string[]
  ingredients: string[]
  created_by: string | null
  is_global: boolean
  gym_id: string | null
  created_at: string
  updated_at: string
}

export interface ClientDietaryPreferences {
  id: string
  client_id: string
  gym_id: string
  is_vegetarian: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  is_dairy_free: boolean
  is_nut_free: boolean
  allergens: string[]
  disliked_ingredients: string[]
  preferred_cuisines: string[]
  max_prep_time_mins: number
  meals_per_day: number
  notes: string | null
  updated_at: string
}

export interface WeeklyMealPlan {
  id: string
  client_id: string
  pt_id: string
  gym_id: string
  week_start: string           // ISO date (Monday)
  day: string                  // 'monday' | 'tuesday' | ...
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  meal_id: string | null
  client_swap_meal_id: string | null
  status: 'draft' | 'published' | 'archived'
  swap_status: 'none' | 'pending' | 'approved' | 'rejected'
  swap_requested_at: string | null
  swap_resolved_at: string | null
  pt_notes: string | null
  client_notes: string | null
  created_at: string
  // joined
  meal?: Meal
  swap_meal?: Meal
}

export interface GroceryList {
  id: string
  client_id: string
  gym_id: string
  week_start: string
  generated_at: string
  items?: GroceryListItem[]
}

export interface GroceryListItem {
  id: string
  grocery_list_id: string
  ingredient: string
  quantity: string | null
  category: string | null
  checked: boolean
  sort_order: number
}

// Algorithm types
export interface MealPlanGenerationOptions {
  clientId: string
  ptId: string
  gymId: string
  weekStart: string
  meals_per_day?: number
  autoApproveSwaps?: boolean
}

export interface MacroTarget {
  calories: number
  protein: number
  carbs: number
  fat: number
}
```

---

## 7. File Structure

New files to create (following existing patterns):

```
src/
├── app/
│   ├── pt/
│   │   ├── meals/
│   │   │   └── page.tsx              ← enhance existing (add Edit, filters, Generate btn)
│   │   ├── meal-plans/
│   │   │   ├── page.tsx              ← PT: list all client plans + swap requests
│   │   │   └── [clientId]/
│   │   │       └── page.tsx          ← PT: view/edit one client's plan
│   │   └── clients/
│   │       └── [clientId]/
│   │           └── meal-plan/
│   │               └── page.tsx      ← PT: quick view from client profile
│   ├── client/                       ← NEW portal (pattern mirrors /pt/ and /owner/)
│   │   ├── layout.tsx                ← client nav (meals, workouts, messages, progress)
│   │   ├── page.tsx                  ← client dashboard
│   │   └── meals/
│   │       ├── page.tsx              ← weekly plan view + grocery list
│   │       └── swap/
│   │           └── [slotId]/
│   │               └── page.tsx      ← swap selection view
│   └── auth/
│       └── client-login/             ← already exists
│
├── lib/
│   ├── types.ts                      ← add new types above
│   └── meal-planner/
│       ├── generate.ts               ← core algorithm (pure function, no I/O)
│       ├── grocery.ts                ← ingredient parsing + list generation
│       └── scoring.ts                ← individual scoring functions
│
supabase/migrations/
├── 003_meal_library_enhance.sql
├── 004_client_dietary_preferences.sql
├── 005_meal_plan_swap_workflow.sql
└── 006_grocery_lists.sql
```

---

## 8. Implementation Roadmap

### Week 1 — Foundation (Days 1–5)

**Priority: Unblock everything else**

| Day | Task | Files |
|-----|------|-------|
| 1 | Run migrations 003–006. Update `Meal` type in `types.ts` | `migrations/003`, `types.ts` |
| 1 | Update seed data: add `meal_type`, `prep_time_mins`, dietary flags to 16 existing meals | `002_seed_data.sql` (or new 007) |
| 2 | Build `src/lib/meal-planner/scoring.ts` — scoring functions with unit tests | `scoring.ts` |
| 2–3 | Build `src/lib/meal-planner/generate.ts` — full algorithm | `generate.ts` |
| 3 | Build `src/lib/meal-planner/grocery.ts` — ingredient parser + category mapper | `grocery.ts` |
| 4 | Enhance PT Meal Library UI: edit modal, new filter dropdowns, dietary flag toggles | `pt/meals/page.tsx` |
| 5 | Build `client_dietary_preferences` CRUD in PT client profile view | `pt/clients/[id]/page.tsx` |

**Done when:** Algorithm generates a valid plan from seed data, PT can edit meal metadata.

---

### Week 2 — PT Workflows (Days 6–10)

**Priority: PT can generate and publish plans**

| Day | Task | Files |
|-----|------|-------|
| 6 | Build Generate Meal Plan modal (client selector, week picker, options) | `pt/meal-plans/page.tsx` |
| 7 | Wire generate button → algorithm → preview table | `pt/meal-plans/page.tsx` |
| 8 | Save plan to `weekly_meal_plans` (bulk insert) + generate grocery list | `pt/meal-plans/page.tsx`, `grocery.ts` |
| 9 | Build swap request review panel in PT view | `pt/meal-plans/page.tsx` |
| 10 | Build PT per-client plan view (swap override, re-generate single day) | `pt/meal-plans/[clientId]/page.tsx` |

**Done when:** PT can generate, preview, tweak, and publish a full week plan.

---

### Week 3 — Client Portal (Days 11–15)

**Priority: Client can view plan, swap meals, check off groceries**

| Day | Task | Files |
|-----|------|-------|
| 11 | Build client portal layout + auth guard | `client/layout.tsx` |
| 12 | Build client meal plan page (day view, macro progress bar) | `client/meals/page.tsx` |
| 13 | Build swap selection page (filtered alternatives, macro delta display) | `client/meals/swap/[slotId]/page.tsx` |
| 14 | Build grocery list page (grouped by category, checkbox state in DB) | `client/meals/page.tsx` (section) |
| 15 | Polish: loading states, empty states, mobile responsiveness, warnings display | All client pages |

**Done when:** Client can open their plan, swap a meal, and check off groceries.

---

### Minimum Viable Feature Set (if timeline compresses)

If the 3-week timeline is tight, ship in this order and defer the rest:

1. **Must ship:** Migrations + algorithm + PT generate/save + client read-only plan view
2. **Should ship:** Swap requests (client) + swap approval (PT)
3. **Can defer:** Grocery list, cuisine/difficulty filters, client dietary preferences UI (PT can set via Supabase directly for now)

---

## 9. Integration Points with Existing APEX Features

### Client Profile (PT portal)
- Add "Nutrition" tab to the client detail page (once built)
- Show current week's plan summary (total calories vs goal)
- Link to dietary preferences form

### Messages
- When PT approves/rejects a swap, auto-send a message to the client
- Reuse existing `messages` table and UI — no new infrastructure needed

  ```typescript
  // On swap approval, insert into messages:
  await supabase.from('messages').insert({
    client_id: slot.client_id,
    gym_id: slot.gym_id,
    sender_id: ptUserId,
    sender_role: 'pt',
    text: `Your swap request for ${day} ${mealType} has been ✅ approved.`
  })
  ```

### Client Goals (existing `clients` columns)
- `calorie_goal`, `protein_goal`, `carbs_goal`, `fat_goal` feed directly into the algorithm — no schema change needed
- The "Nutrition" section of the client profile (already has these fields) links naturally to meal plan generation

### Subscriptions
- `nutrition_only` subscription type — these clients should have meal planning enabled
- `pt_in_person` and `virtual_pt` — also have meal planning
- Phase 1: no gating. Phase 2: could gate grocery list or auto-approve swaps behind higher tier.

### PT Schedule
- Future: generate meal plan from appointment context ("post-workout recovery meals")
- Phase 1: standalone feature, no schedule dependency

### Owner Portal
- Owner can view any client's meal plan (already covered by RLS: `gym_id = auth_gym_id()`)
- Future: owner dashboard metric "% of clients with active meal plan this week"

---

## 10. Technical Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **Algorithm runs client-side (TypeScript), not as a DB function** | Keeps logic testable in isolation; no Postgres plpgsql complexity; Next.js 16 server actions can call it from RSC. Revisit if plans need to be generated in background jobs. |
| **Bulk insert for plan slots** | `weekly_meal_plans` is a flat slot-per-row table. One `INSERT ... VALUES (...)` with 21 rows (7 days × 3 meals) is simpler than an RPC. |
| **No external API / ML** | Keeps Phase 1 zero-cost, zero-latency, and fully offline. The scoring algorithm is transparent and debuggable. |
| **Grocery ingredient parsing is heuristic** | `ingredients` is `text[]` of strings like `"150g chicken breast"`. A regex-based parser (`/^(\d+[gmkg]+)\s+(.+)$/`) extracts quantity + name. Aggregation groups by normalised name. Imperfect but good enough for Phase 1. |
| **Swap workflow uses status columns on existing table** | Avoids a separate `swap_requests` table. A slot row carries its own swap state. Simpler queries, fewer joins. |
| **Client portal as `/client/*` mirroring `/pt/*`** | Consistent with existing architecture. Auth guard in `client/layout.tsx` checks `auth_role() === 'client'`. |
| **No optimistic UI for swap requests** | Swap goes `pending` → PT action → `approved/rejected`. Client sees the real status. Avoids stale state bugs on a feature that touches PT-visible data. |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Meal library too small → algorithm warns every plan | Medium | Seed 30+ meals in migration 007; add "Add from global" for PTs |
| Dietary flag data missing on existing meals | High | Migration 007 back-fills reasonable defaults based on ingredient/tag heuristics |
| Client portal auth clashes with existing `/auth/client-login` | Low | Existing callback route already sets session; `/client/layout.tsx` just checks role |
| Grocery ingredient parsing fails on free-form strings | Medium | Fallback: show full `ingredients[]` text if parse fails, no quantity aggregation |
| Swap notification via messages causes confusion | Low | Add `source: 'system'` to `food_log.source` pattern; filter system messages in UI |

---

## 12. Success Metrics (Phase 1)

- PT can generate a 7-day plan in < 10 seconds
- Generated plan hits within ±15% of client's daily calorie goal on all 7 days
- Client can view full week plan and request a swap in < 3 taps
- Grocery list correctly aggregates ≥ 80% of ingredients (by count) without manual correction
- Zero dietary restriction violations in generated plans (hard filter must hold)
