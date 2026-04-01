-- Migration 2024040103: Create grocery lists tables (SIMPLE VERSION)
-- Tables for auto-generated grocery lists from meal plans

BEGIN;

-- Create grocery_lists table (master list)
CREATE TABLE IF NOT EXISTS grocery_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE SET NULL,
  
  -- List metadata
  name text NOT NULL,
  status text CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
  week_start_date date,
  
  -- Statistics
  total_items integer DEFAULT 0,
  estimated_cost decimal(10,2),
  store_preference text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(client_id, week_start_date)
);

-- Create grocery_list_items table (individual items)
CREATE TABLE IF NOT EXISTS grocery_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id uuid NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  
  -- Item details
  name text NOT NULL,
  category text CHECK (category IN ('produce', 'protein', 'dairy', 'pantry', 'frozen', 'spices', 'other')) DEFAULT 'pantry',
  quantity decimal(10,3) NOT NULL,
  unit text NOT NULL,
  
  -- Source tracking
  meal_source_id uuid REFERENCES meal_library(id) ON DELETE SET NULL,
  meal_source_name text,
  
  -- Purchase tracking
  purchased boolean DEFAULT false,
  purchased_quantity decimal(10,3),
  purchased_unit text,
  purchased_price decimal(10,2),
  
  -- Alternative options
  alternative_names text[] DEFAULT '{}',
  brand_preference text,
  
  -- Metadata
  position integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_grocery_lists_client_id ON grocery_lists(client_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_meal_plan_id ON grocery_lists(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_week_start ON grocery_lists(week_start_date);
CREATE INDEX IF NOT EXISTS idx_grocery_list_items_list_id ON grocery_list_items(grocery_list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_list_items_category ON grocery_list_items(category);
CREATE INDEX IF NOT EXISTS idx_grocery_list_items_purchased ON grocery_list_items(purchased);

-- Enable Row Level Security
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_items ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies
CREATE POLICY "Enable access for authenticated users - grocery_lists" ON grocery_lists
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable access for authenticated users - grocery_list_items" ON grocery_list_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE TRIGGER grocery_lists_updated_at
  BEFORE UPDATE ON grocery_lists
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER grocery_list_items_updated_at
  BEFORE UPDATE ON grocery_list_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create trigger to update total_items count
CREATE OR REPLACE FUNCTION update_grocery_list_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE grocery_lists 
    SET total_items = total_items + 1
    WHERE id = NEW.grocery_list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE grocery_lists 
    SET total_items = total_items - 1
    WHERE id = OLD.grocery_list_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grocery_list_items_count_trigger
  AFTER INSERT OR DELETE ON grocery_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_grocery_list_item_count();

COMMIT;