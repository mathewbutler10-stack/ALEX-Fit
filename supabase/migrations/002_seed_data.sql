-- =============================================================================
-- APEX PT Platform - Seed Data Migration 002
-- Inserts demo data using fixed UUIDs for referential consistency.
--
-- NOTE: The users table references auth.users (via FK). These seed rows will
-- only satisfy the FK constraint if the corresponding auth.users entries have
-- been created first (via the Supabase Auth dashboard or service-role API).
-- The ON CONFLICT DO NOTHING clauses make this script safe to re-run.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Fixed UUID constants (referenced throughout this file)
-- ---------------------------------------------------------------------------
-- gym_id:          'a1b2c3d4-0000-0000-0000-000000000001'
-- owner_user_id:   'a1b2c3d4-0000-0000-0000-000000000010'
-- pt1_user_id:     'a1b2c3d4-0000-0000-0000-000000000020'
-- pt2_user_id:     'a1b2c3d4-0000-0000-0000-000000000021'
-- pt1_id:          'a1b2c3d4-0000-0000-0000-000000000030'
-- pt2_id:          'a1b2c3d4-0000-0000-0000-000000000031'
-- client1_user_id: 'a1b2c3d4-0000-0000-0000-000000000040'
-- client2_user_id: 'a1b2c3d4-0000-0000-0000-000000000041'
-- client3_user_id: 'a1b2c3d4-0000-0000-0000-000000000042'
-- client4_user_id: 'a1b2c3d4-0000-0000-0000-000000000043'
-- client1_id:      'a1b2c3d4-0000-0000-0000-000000000050'
-- client2_id:      'a1b2c3d4-0000-0000-0000-000000000051'
-- client3_id:      'a1b2c3d4-0000-0000-0000-000000000052'
-- client4_id:      'a1b2c3d4-0000-0000-0000-000000000053'
-- plan1_id:        'a1b2c3d4-0000-0000-0000-000000000060'
-- plan2_id:        'a1b2c3d4-0000-0000-0000-000000000061'
-- plan3_id:        'a1b2c3d4-0000-0000-0000-000000000062'
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. GYM
-- ---------------------------------------------------------------------------

INSERT INTO gyms (id, name, abn, owner_id)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'FitLife Studio',
  '12 345 678 901',
  'a1b2c3d4-0000-0000-0000-000000000010'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. USERS
-- NOTE: These rows require matching records in auth.users to exist first.
--       Create the auth users via the Supabase dashboard before applying this
--       seed, then these inserts will succeed.
-- ---------------------------------------------------------------------------

INSERT INTO users (id, email, role, full_name, gym_id)
VALUES
  -- Owner
  (
    'a1b2c3d4-0000-0000-0000-000000000010',
    'sarah.mitchell@fitlifestudio.com.au',
    'owner',
    'Sarah Mitchell',
    'a1b2c3d4-0000-0000-0000-000000000001'
  ),
  -- PT 1
  (
    'a1b2c3d4-0000-0000-0000-000000000020',
    'jake.thompson@fitlifestudio.com.au',
    'pt',
    'Jake Thompson',
    'a1b2c3d4-0000-0000-0000-000000000001'
  ),
  -- PT 2
  (
    'a1b2c3d4-0000-0000-0000-000000000021',
    'emma.rodriguez@fitlifestudio.com.au',
    'pt',
    'Emma Rodriguez',
    'a1b2c3d4-0000-0000-0000-000000000001'
  ),
  -- Client 1
  (
    'a1b2c3d4-0000-0000-0000-000000000040',
    'james.anderson@email.com',
    'client',
    'James Anderson',
    'a1b2c3d4-0000-0000-0000-000000000001'
  ),
  -- Client 2
  (
    'a1b2c3d4-0000-0000-0000-000000000041',
    'sophie.chen@email.com',
    'client',
    'Sophie Chen',
    'a1b2c3d4-0000-0000-0000-000000000001'
  ),
  -- Client 3
  (
    'a1b2c3d4-0000-0000-0000-000000000042',
    'michael.park@email.com',
    'client',
    'Michael Park',
    'a1b2c3d4-0000-0000-0000-000000000001'
  ),
  -- Client 4
  (
    'a1b2c3d4-0000-0000-0000-000000000043',
    'olivia.bennett@email.com',
    'client',
    'Olivia Bennett',
    'a1b2c3d4-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. PTs
-- ---------------------------------------------------------------------------

INSERT INTO pts (
  id, user_id, gym_id,
  specialisations, rating, payout_tier, payout_rate,
  max_clients, prefers_virtual, prefers_in_person, prefers_nutrition,
  bio, status
)
VALUES
  -- Jake Thompson - Gold tier (rating 4.6)
  (
    'a1b2c3d4-0000-0000-0000-000000000030',
    'a1b2c3d4-0000-0000-0000-000000000020',
    'a1b2c3d4-0000-0000-0000-000000000001',
    ARRAY['Strength Training', 'Weight Loss', 'HIIT'],
    4.6,
    'Gold',
    65.00,
    15,
    true,
    true,
    false,
    'Jake is a passionate personal trainer specialising in strength and high-intensity interval training. With over 6 years of experience he has helped hundreds of clients achieve their weight loss and performance goals.',
    'active'
  ),
  -- Emma Rodriguez - Silver tier (rating 4.3)
  (
    'a1b2c3d4-0000-0000-0000-000000000031',
    'a1b2c3d4-0000-0000-0000-000000000021',
    'a1b2c3d4-0000-0000-0000-000000000001',
    ARRAY['Nutrition', 'Yoga', 'Pilates', 'Flexibility'],
    4.3,
    'Silver',
    55.00,
    12,
    true,
    false,
    true,
    'Emma takes a holistic approach to fitness, blending nutrition coaching with yoga, Pilates and flexibility work. She believes lasting results come from building sustainable habits rather than quick fixes.',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. CLIENTS
-- ---------------------------------------------------------------------------

INSERT INTO clients (
  id, user_id, gym_id, assigned_pt_id,
  subscription_type,
  calorie_goal, protein_goal, carbs_goal, fat_goal,
  goals, at_risk
)
VALUES
  -- James Anderson - assigned to Jake (PT1)
  (
    'a1b2c3d4-0000-0000-0000-000000000050',
    'a1b2c3d4-0000-0000-0000-000000000040',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000030',
    'virtual_pt',
    2200, 165, 220, 75,
    'Lose 10kg and build lean muscle',
    false
  ),
  -- Sophie Chen - assigned to Jake (PT1)
  (
    'a1b2c3d4-0000-0000-0000-000000000051',
    'a1b2c3d4-0000-0000-0000-000000000041',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000030',
    'pt_in_person',
    1800, 135, 225, 60,
    'Train for a half-marathon',
    false
  ),
  -- Michael Park - assigned to Emma (PT2)
  (
    'a1b2c3d4-0000-0000-0000-000000000052',
    'a1b2c3d4-0000-0000-0000-000000000042',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000031',
    'nutrition_only',
    2400, 120, 300, 80,
    'Clean up diet and feel more energised',
    false
  ),
  -- Olivia Bennett - assigned to Emma (PT2), at_risk
  (
    'a1b2c3d4-0000-0000-0000-000000000053',
    'a1b2c3d4-0000-0000-0000-000000000043',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000031',
    'virtual_pt',
    2000, 150, 200, 65,
    'Build confidence and improve overall fitness',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. SUBSCRIPTION PLANS
-- ---------------------------------------------------------------------------

INSERT INTO subscription_plans (
  id, gym_id, name, description,
  monthly_price, quarterly_price, annual_price,
  currency, features, color, active
)
VALUES
  -- Plan 1: Virtual PT
  (
    'a1b2c3d4-0000-0000-0000-000000000060',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Virtual PT',
    'Full personal training experience delivered online — workouts, macros, and weekly check-ins from anywhere.',
    149.00,
    399.00,
    1499.00,
    'AUD',
    ARRAY[
      'Weekly check-ins',
      'Personalised workout plans',
      'Macro targets',
      'WhatsApp support',
      'Monthly progress review'
    ],
    '#4ADE80',
    true
  ),
  -- Plan 2: PT In Person
  (
    'a1b2c3d4-0000-0000-0000-000000000061',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'PT In Person',
    'Face-to-face training sessions with your dedicated PT, plus a full nutrition and progress tracking package.',
    299.00,
    799.00,
    2999.00,
    'AUD',
    ARRAY[
      '3 sessions/week',
      'Personalised meal plan',
      'Body composition tracking',
      'Priority messaging',
      'Quarterly fitness assessment'
    ],
    '#22D3EE',
    true
  ),
  -- Plan 3: Nutrition Only
  (
    'a1b2c3d4-0000-0000-0000-000000000062',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Nutrition Only',
    'Expert nutrition coaching with custom macro targets, weekly meal plans, and fortnightly check-ins.',
    99.00,
    269.00,
    999.00,
    'AUD',
    ARRAY[
      'Custom macro targets',
      'Weekly meal plan',
      'Recipe library',
      'Fortnightly check-in',
      'Supplement guidance'
    ],
    '#F97316',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. MEAL LIBRARY (16 meals, is_global=true)
-- ---------------------------------------------------------------------------

INSERT INTO meal_library (name, calories, protein, carbs, fat, tags, is_global, gym_id, created_by)
VALUES
  -- Breakfasts
  (
    'Overnight Oats',
    380, 15, 65, 8,
    ARRAY['breakfast', 'high-carb', 'meal-prep'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Eggs on Toast',
    320, 22, 28, 12,
    ARRAY['breakfast', 'high-protein'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Greek Yoghurt Parfait',
    290, 18, 45, 5,
    ARRAY['breakfast', 'low-fat', 'high-protein'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Protein Smoothie',
    340, 35, 30, 8,
    ARRAY['breakfast', 'high-protein', 'quick'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Avocado Toast',
    280, 9, 32, 14,
    ARRAY['breakfast', 'healthy-fat', 'vegan'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  -- Lunches
  (
    'Grilled Chicken Salad',
    420, 45, 20, 16,
    ARRAY['lunch', 'high-protein', 'low-carb'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Tuna Brown Rice Bowl',
    480, 42, 55, 8,
    ARRAY['lunch', 'high-protein', 'balanced'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Chicken Wrap',
    520, 38, 58, 14,
    ARRAY['lunch', 'high-protein', 'portable'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Quinoa Buddha Bowl',
    440, 22, 62, 12,
    ARRAY['lunch', 'vegetarian', 'balanced'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  -- Dinners
  (
    'Salmon & Veggies',
    520, 48, 22, 24,
    ARRAY['dinner', 'high-protein', 'omega-3'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Beef Stir Fry',
    580, 45, 52, 18,
    ARRAY['dinner', 'high-protein', 'balanced'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Chicken & Sweet Potato',
    490, 42, 48, 10,
    ARRAY['dinner', 'high-protein', 'clean'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Pasta Bolognese',
    640, 38, 82, 16,
    ARRAY['dinner', 'high-carb', 'comfort'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  -- Snacks
  (
    'Protein Bar',
    210, 20, 22, 6,
    ARRAY['snack', 'high-protein', 'portable'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Apple & Peanut Butter',
    240, 8, 30, 12,
    ARRAY['snack', 'healthy-fat', 'natural'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  ),
  (
    'Cottage Cheese & Berries',
    180, 18, 16, 4,
    ARRAY['snack', 'high-protein', 'low-fat'],
    true,
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000010'
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. WORKOUTS (5 workouts, is_global=true)
-- ---------------------------------------------------------------------------

INSERT INTO workouts (name, gym_id, focus, difficulty, description, exercises, is_global, created_by)
VALUES
  (
    'Full Body Blast',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Full Body',
    'intermediate',
    'A complete full-body session targeting all major muscle groups. Great as a standalone workout or the foundation of a weekly training split.',
    ARRAY[
      'Squat 4×12',
      'Bench Press 4×10',
      'Deadlift 3×8',
      'Pull-ups 3×8',
      'Shoulder Press 3×12',
      'Plank 3×45s'
    ],
    true,
    'a1b2c3d4-0000-0000-0000-000000000020'
  ),
  (
    'Upper Body Power',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Upper Body',
    'intermediate',
    'Focuses on building upper body strength and muscle mass across push and pull movement patterns.',
    ARRAY[
      'Bench Press 4×8',
      'Bent Row 4×10',
      'Shoulder Press 3×12',
      'Bicep Curl 3×15',
      'Tricep Dip 3×15',
      'Face Pull 3×15'
    ],
    true,
    'a1b2c3d4-0000-0000-0000-000000000020'
  ),
  (
    'Lower Body Strength',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Lower Body',
    'advanced',
    'A demanding lower body session built around compound lifts. Not for the faint-hearted — expect serious DOMS.',
    ARRAY[
      'Back Squat 5×5',
      'Romanian Deadlift 4×10',
      'Leg Press 3×15',
      'Lunges 3×12',
      'Calf Raises 4×20',
      'Glute Bridge 3×15'
    ],
    true,
    'a1b2c3d4-0000-0000-0000-000000000020'
  ),
  (
    'Core & Stability',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Core',
    'beginner',
    'A gentle introduction to core training, focusing on stability, posture and body awareness. Suitable for all fitness levels.',
    ARRAY[
      'Plank 3×60s',
      'Crunches 3×20',
      'Russian Twist 3×20',
      'Dead Bug 3×10',
      'Bird Dog 3×10',
      'Hollow Hold 3×30s'
    ],
    true,
    'a1b2c3d4-0000-0000-0000-000000000021'
  ),
  (
    'Cardio Conditioning',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Cardio',
    'beginner',
    'A fun interval-based cardio session that builds aerobic capacity without requiring any equipment.',
    ARRAY[
      'Warm-up jog 5min',
      'Intervals: 30s sprint/90s walk ×8',
      'Box Jumps 3×10',
      'Battle Ropes 3×30s',
      'Cool-down 5min'
    ],
    true,
    'a1b2c3d4-0000-0000-0000-000000000021'
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. APPOINTMENTS (5 sample, dates from 2026-03-30 onwards)
-- ---------------------------------------------------------------------------

INSERT INTO appointments (
  client_id, pt_id, gym_id,
  title, type, date, start_time, end_time,
  location, status
)
VALUES
  -- James + Jake: Virtual Session
  (
    'a1b2c3d4-0000-0000-0000-000000000050',
    'a1b2c3d4-0000-0000-0000-000000000030',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Virtual Session',
    'virtual',
    '2026-04-01',
    '09:00', '10:00',
    NULL,
    'confirmed'
  ),
  -- Sophie + Jake: In-Person Training
  (
    'a1b2c3d4-0000-0000-0000-000000000051',
    'a1b2c3d4-0000-0000-0000-000000000030',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'In-Person Training',
    'in_person',
    '2026-04-02',
    '07:00', '08:00',
    'FitLife Studio',
    'confirmed'
  ),
  -- James + Jake: Virtual Check-in
  (
    'a1b2c3d4-0000-0000-0000-000000000050',
    'a1b2c3d4-0000-0000-0000-000000000030',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Virtual Check-in',
    'virtual',
    '2026-04-08',
    '09:00', '09:30',
    NULL,
    'confirmed'
  ),
  -- Sophie + Jake: In-Person Training
  (
    'a1b2c3d4-0000-0000-0000-000000000051',
    'a1b2c3d4-0000-0000-0000-000000000030',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'In-Person Training',
    'in_person',
    '2026-04-09',
    '07:00', '08:00',
    'FitLife Studio',
    'confirmed'
  ),
  -- Olivia + Emma: Virtual Session (pending)
  (
    'a1b2c3d4-0000-0000-0000-000000000053',
    'a1b2c3d4-0000-0000-0000-000000000031',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Virtual Session',
    'virtual',
    '2026-04-03',
    '14:00', '15:00',
    NULL,
    'pending'
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. MESSAGES (2-3 per client thread)
-- ---------------------------------------------------------------------------

INSERT INTO messages (client_id, gym_id, sender_id, sender_role, text, created_at)
VALUES
  -- James Anderson thread
  (
    'a1b2c3d4-0000-0000-0000-000000000050',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000020',
    'pt',
    'Hey James! Great work this week — your squat form is really improving. Make sure you''re hitting your protein target before our next session on Wednesday.',
    '2026-03-28 09:15:00+10'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000050',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000040',
    'client',
    'Thanks Jake! I''ve been logging everything in the app. Hit 165g protein yesterday for the first time — feeling pretty good about it.',
    '2026-03-28 10:42:00+10'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000050',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000020',
    'pt',
    'That''s awesome, keep it up! I''ve updated your workout plan for next week — slightly higher volume on upper body. Check it out when you get a chance.',
    '2026-03-28 11:05:00+10'
  ),

  -- Sophie Chen thread
  (
    'a1b2c3d4-0000-0000-0000-000000000051',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000041',
    'client',
    'Hi Jake, just checking — are we still on for 7am Thursday? I have a work thing that might run over.',
    '2026-03-27 17:30:00+10'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000051',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000020',
    'pt',
    'All good Sophie, Thursday 7am is locked in. If anything changes just let me know before 6pm Wednesday and we can reschedule. See you then!',
    '2026-03-27 18:02:00+10'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000051',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000041',
    'client',
    'Perfect, I''ll be there. Also ran 8km on Sunday — new PB! The interval sessions are really paying off.',
    '2026-03-27 18:20:00+10'
  ),

  -- Michael Park thread
  (
    'a1b2c3d4-0000-0000-0000-000000000052',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000031',
    'pt',
    'Hi Michael! I''ve just uploaded your meal plan for next week. I''ve added a few higher-carb days around your gym sessions to help with energy levels. Let me know what you think!',
    '2026-03-26 14:00:00+10'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000052',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000042',
    'client',
    'Looks great Emma, thanks! One question — is there a swap option for the Salmon & Veggies dinner? Not a huge fish fan to be honest.',
    '2026-03-26 16:45:00+10'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000052',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000031',
    'pt',
    'Of course! Swap it for the Chicken & Sweet Potato — very similar macros. I''ll note that in your preferences so future plans reflect it.',
    '2026-03-26 17:10:00+10'
  ),

  -- Olivia Bennett thread
  (
    'a1b2c3d4-0000-0000-0000-000000000053',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000031',
    'pt',
    'Hey Olivia, just wanted to check in — I noticed you haven''t logged any workouts this week. Everything okay? No pressure, just want to make sure you''re feeling supported.',
    '2026-03-29 10:00:00+10'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000053',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000043',
    'client',
    'Hey Emma, sorry for going quiet. Had a rough week — anxiety has been pretty bad. I want to get back on track but it feels overwhelming.',
    '2026-03-29 13:22:00+10'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000053',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000031',
    'pt',
    'Thanks for sharing that with me — it takes courage. Let''s simplify things. Forget the plan for now and just do one 20-minute walk today. That''s it. We''ll build from there together.',
    '2026-03-29 14:05:00+10'
  )
ON CONFLICT DO NOTHING;

COMMIT;
