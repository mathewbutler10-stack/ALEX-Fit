-- APEX Phase 4: Enrich existing 15 seed meals with ingredients, instructions, ease_rating, prep_time_minutes, allergens, cuisine

-- Overnight Oats
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 5,
  allergens = ARRAY['gluten','dairy'],
  cuisine = 'American',
  ingredients = '[
    {"name":"Rolled oats","amount":"80","unit":"g"},
    {"name":"Greek yoghurt","amount":"120","unit":"g"},
    {"name":"Banana","amount":"1","unit":"medium"},
    {"name":"Honey","amount":"1","unit":"tsp"},
    {"name":"Chia seeds","amount":"1","unit":"tbsp"}
  ]'::jsonb,
  instructions = 'Mix oats and chia seeds in a jar.
Add yoghurt and honey.
Slice banana on top.
Refrigerate overnight.
Grab and go in the morning.'
WHERE name ILIKE '%overnight oats%' AND (is_global = true OR gym_id IS NOT NULL);

-- Scrambled Eggs
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 8,
  allergens = ARRAY['eggs','dairy'],
  cuisine = 'General',
  ingredients = '[
    {"name":"Eggs","amount":"3","unit":"large"},
    {"name":"Butter","amount":"1","unit":"tsp"},
    {"name":"Milk","amount":"2","unit":"tbsp"},
    {"name":"Salt","amount":"1","unit":"pinch"},
    {"name":"Chives","amount":"1","unit":"tbsp"}
  ]'::jsonb,
  instructions = 'Crack eggs into a bowl, add milk and salt.
Whisk until combined.
Melt butter in a non-stick pan over medium-low heat.
Pour in egg mixture.
Stir gently with a spatula until just set.
Remove from heat, top with chives.'
WHERE name ILIKE '%scrambled eggs%' AND (is_global = true OR gym_id IS NOT NULL);

-- Grilled Chicken & Rice / Grilled Chicken and Rice
UPDATE meal_library SET
  ease_rating = 3,
  prep_time_minutes = 25,
  allergens = ARRAY[]::text[],
  cuisine = 'General',
  ingredients = '[
    {"name":"Chicken breast","amount":"180","unit":"g"},
    {"name":"Brown rice","amount":"100","unit":"g dry"},
    {"name":"Olive oil","amount":"1","unit":"tbsp"},
    {"name":"Garlic","amount":"2","unit":"cloves"},
    {"name":"Lemon","amount":"0.5","unit":"whole"}
  ]'::jsonb,
  instructions = 'Cook rice per packet instructions.
Season chicken with salt, pepper, garlic.
Grill on medium-high 6 mins each side.
Rest 3 mins, slice.
Serve over rice with lemon.'
WHERE name ILIKE '%grilled chicken%rice%' AND (is_global = true OR gym_id IS NOT NULL);

-- Salmon Bowl
UPDATE meal_library SET
  ease_rating = 3,
  prep_time_minutes = 20,
  allergens = ARRAY['shellfish'],
  cuisine = 'Japanese',
  ingredients = '[
    {"name":"Salmon fillet","amount":"180","unit":"g"},
    {"name":"Brown rice","amount":"80","unit":"g dry"},
    {"name":"Cucumber","amount":"0.5","unit":"whole"},
    {"name":"Avocado","amount":"0.5","unit":"whole"},
    {"name":"Soy sauce","amount":"2","unit":"tbsp"},
    {"name":"Sesame seeds","amount":"1","unit":"tsp"}
  ]'::jsonb,
  instructions = 'Cook rice.
Season salmon, pan-fry skin-side down 4 mins, flip 2 mins.
Slice cucumber and avocado.
Assemble bowl: rice base, salmon, cucumber, avocado.
Drizzle soy sauce, top with sesame seeds.'
WHERE name ILIKE '%salmon bowl%' AND (is_global = true OR gym_id IS NOT NULL);

-- Protein Smoothie / Protein Shake
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 3,
  allergens = ARRAY['dairy','nuts'],
  cuisine = 'General',
  ingredients = '[
    {"name":"Whey protein","amount":"30","unit":"g"},
    {"name":"Banana","amount":"1","unit":"frozen"},
    {"name":"Almond milk","amount":"250","unit":"ml"},
    {"name":"Peanut butter","amount":"1","unit":"tbsp"}
  ]'::jsonb,
  instructions = 'Add all ingredients to blender.
Blend 30 seconds until smooth.
Drink immediately.'
WHERE name ILIKE '%protein smoo%' OR name ILIKE '%protein shake%' AND (is_global = true OR gym_id IS NOT NULL);

-- Greek Yoghurt Parfait
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 5,
  allergens = ARRAY['dairy','gluten'],
  cuisine = 'Mediterranean',
  ingredients = '[
    {"name":"Greek yoghurt","amount":"200","unit":"g"},
    {"name":"Granola","amount":"40","unit":"g"},
    {"name":"Mixed berries","amount":"80","unit":"g"},
    {"name":"Honey","amount":"1","unit":"tsp"}
  ]'::jsonb,
  instructions = 'Layer yoghurt in a bowl.
Top with granola.
Add berries.
Drizzle honey.'
WHERE name ILIKE '%yoghurt parfait%' OR name ILIKE '%yogurt parfait%' AND (is_global = true OR gym_id IS NOT NULL);

-- Turkey & Veggie Wrap / Turkey Wrap
UPDATE meal_library SET
  ease_rating = 4,
  prep_time_minutes = 10,
  allergens = ARRAY['gluten'],
  cuisine = 'American',
  ingredients = '[
    {"name":"Wholegrain wrap","amount":"1","unit":"large"},
    {"name":"Turkey breast","amount":"120","unit":"g"},
    {"name":"Spinach","amount":"30","unit":"g"},
    {"name":"Tomato","amount":"1","unit":"medium"},
    {"name":"Hummus","amount":"2","unit":"tbsp"}
  ]'::jsonb,
  instructions = 'Lay wrap flat.
Spread hummus.
Layer turkey, spinach, sliced tomato.
Roll tightly, slice diagonally.'
WHERE name ILIKE '%turkey%wrap%' AND (is_global = true OR gym_id IS NOT NULL);

-- Avocado Toast
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 7,
  allergens = ARRAY['gluten'],
  cuisine = 'General',
  ingredients = '[
    {"name":"Wholegrain bread","amount":"2","unit":"slices"},
    {"name":"Avocado","amount":"1","unit":"medium"},
    {"name":"Eggs","amount":"2","unit":"large"},
    {"name":"Lemon juice","amount":"1","unit":"tsp"},
    {"name":"Chilli flakes","amount":"1","unit":"pinch"}
  ]'::jsonb,
  instructions = 'Toast bread until golden.
Halve avocado, scoop into bowl with lemon juice, mash.
Poach or fry eggs to preference.
Spread avocado on toast.
Top with egg and chilli flakes.'
WHERE name ILIKE '%avocado toast%' AND (is_global = true OR gym_id IS NOT NULL);

-- Tuna Salad
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 5,
  allergens = ARRAY['eggs'],
  cuisine = 'Mediterranean',
  ingredients = '[
    {"name":"Canned tuna","amount":"160","unit":"g drained"},
    {"name":"Mixed salad leaves","amount":"60","unit":"g"},
    {"name":"Cherry tomatoes","amount":"80","unit":"g"},
    {"name":"Olive oil","amount":"1","unit":"tbsp"},
    {"name":"Lemon juice","amount":"1","unit":"tbsp"},
    {"name":"Capers","amount":"1","unit":"tsp"}
  ]'::jsonb,
  instructions = 'Drain tuna and flake into a bowl.
Halve cherry tomatoes.
Combine salad leaves, tomatoes, tuna.
Whisk olive oil and lemon juice.
Drizzle over salad, top with capers.'
WHERE name ILIKE '%tuna salad%' AND (is_global = true OR gym_id IS NOT NULL);

-- Beef & Vegetable Stir Fry
UPDATE meal_library SET
  ease_rating = 3,
  prep_time_minutes = 20,
  allergens = ARRAY['soy'],
  cuisine = 'Asian',
  ingredients = '[
    {"name":"Lean beef strips","amount":"150","unit":"g"},
    {"name":"Broccoli","amount":"100","unit":"g"},
    {"name":"Bell peppers","amount":"100","unit":"g"},
    {"name":"Soy sauce","amount":"2","unit":"tbsp"},
    {"name":"Sesame oil","amount":"1","unit":"tsp"},
    {"name":"Garlic","amount":"2","unit":"cloves"},
    {"name":"Brown rice","amount":"80","unit":"g dry"}
  ]'::jsonb,
  instructions = 'Cook rice.
Mince garlic, slice peppers.
Heat wok over high heat, add sesame oil.
Stir-fry beef 3 mins until browned, set aside.
Fry broccoli and peppers 4 mins.
Return beef, add soy sauce and garlic.
Toss 1 min, serve over rice.'
WHERE name ILIKE '%beef%stir%fry%' OR name ILIKE '%beef%stir-fry%' AND (is_global = true OR gym_id IS NOT NULL);

-- Cottage Cheese Bowl
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 3,
  allergens = ARRAY['dairy'],
  cuisine = 'General',
  ingredients = '[
    {"name":"Cottage cheese","amount":"200","unit":"g"},
    {"name":"Sliced cucumber","amount":"80","unit":"g"},
    {"name":"Cherry tomatoes","amount":"60","unit":"g"},
    {"name":"Flaxseed","amount":"1","unit":"tbsp"},
    {"name":"Black pepper","amount":"1","unit":"pinch"}
  ]'::jsonb,
  instructions = 'Spoon cottage cheese into bowl.
Slice cucumber and halve tomatoes.
Arrange around cottage cheese.
Sprinkle flaxseed and black pepper.'
WHERE name ILIKE '%cottage cheese%' AND (is_global = true OR gym_id IS NOT NULL);

-- Oats with Banana
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 8,
  allergens = ARRAY['gluten'],
  cuisine = 'General',
  ingredients = '[
    {"name":"Rolled oats","amount":"80","unit":"g"},
    {"name":"Water or milk","amount":"200","unit":"ml"},
    {"name":"Banana","amount":"1","unit":"medium"},
    {"name":"Cinnamon","amount":"0.5","unit":"tsp"},
    {"name":"Honey","amount":"1","unit":"tsp"}
  ]'::jsonb,
  instructions = 'Bring water or milk to a simmer.
Add oats and stir.
Cook 5 mins until creamy, stirring occasionally.
Slice banana over oats.
Top with cinnamon and honey.'
WHERE name ILIKE '%oats with banana%' AND (is_global = true OR gym_id IS NOT NULL);

-- Protein Bar (snack)
UPDATE meal_library SET
  ease_rating = 5,
  prep_time_minutes = 0,
  allergens = ARRAY['dairy','nuts','gluten'],
  cuisine = 'General',
  ingredients = '[
    {"name":"Protein bar","amount":"1","unit":"bar"}
  ]'::jsonb,
  instructions = 'Unwrap and eat.
Pair with water for best results.'
WHERE name ILIKE '%protein bar%' AND (is_global = true OR gym_id IS NOT NULL);

-- Lentil Soup
UPDATE meal_library SET
  ease_rating = 2,
  prep_time_minutes = 35,
  allergens = ARRAY[]::text[],
  cuisine = 'Mediterranean',
  ingredients = '[
    {"name":"Red lentils","amount":"150","unit":"g"},
    {"name":"Carrot","amount":"1","unit":"medium"},
    {"name":"Onion","amount":"1","unit":"medium"},
    {"name":"Garlic","amount":"2","unit":"cloves"},
    {"name":"Vegetable stock","amount":"800","unit":"ml"},
    {"name":"Cumin","amount":"1","unit":"tsp"},
    {"name":"Olive oil","amount":"1","unit":"tbsp"}
  ]'::jsonb,
  instructions = 'Dice onion and carrot, mince garlic.
Sauté in olive oil 5 mins until soft.
Add cumin, cook 1 min.
Add lentils and stock, bring to boil.
Simmer 25 mins until lentils are soft.
Blend half the soup for a creamy texture.
Season and serve.'
WHERE name ILIKE '%lentil soup%' AND (is_global = true OR gym_id IS NOT NULL);

-- Sweet Potato & Black Bean Bowl
UPDATE meal_library SET
  ease_rating = 3,
  prep_time_minutes = 30,
  allergens = ARRAY[]::text[],
  cuisine = 'Mexican',
  ingredients = '[
    {"name":"Sweet potato","amount":"200","unit":"g"},
    {"name":"Black beans","amount":"120","unit":"g canned"},
    {"name":"Avocado","amount":"0.5","unit":"whole"},
    {"name":"Lime","amount":"1","unit":"whole"},
    {"name":"Coriander","amount":"1","unit":"tbsp"},
    {"name":"Cumin","amount":"0.5","unit":"tsp"},
    {"name":"Olive oil","amount":"1","unit":"tbsp"}
  ]'::jsonb,
  instructions = 'Preheat oven to 200°C.
Cube sweet potato, toss in olive oil and cumin.
Roast 25 mins until tender.
Drain and rinse black beans.
Slice avocado.
Assemble bowl: sweet potato, beans, avocado.
Squeeze lime, top with coriander.'
WHERE name ILIKE '%sweet potato%black bean%' AND (is_global = true OR gym_id IS NOT NULL);
