-- Migration 2024040100: Create restricted exec_sql function
-- Safe, audited SQL execution function for migrations only

BEGIN;

-- Create audit log table for tracking SQL executions
CREATE TABLE IF NOT EXISTS sql_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  sql_hash text NOT NULL,
  sql_preview text,
  success boolean NOT NULL,
  message text,
  execution_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sql_audit_log_created_at ON sql_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sql_audit_log_user_id ON sql_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sql_audit_log_sql_hash ON sql_audit_log(sql_hash);

-- Restricted exec_sql function
-- Only allows specific migration operations, logs everything, blocks dangerous SQL
CREATE OR REPLACE FUNCTION exec_sql_restricted(
  sql_text text,
  OUT success boolean,
  OUT message text
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_execution_time_ms integer;
  v_sql_hash text;
  v_sql_preview text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  v_start_time := clock_timestamp();
  v_sql_hash := md5(sql_text);
  v_sql_preview := left(sql_text, 200); -- First 200 chars for preview
  
  -- Log attempt
  INSERT INTO sql_audit_log (user_id, sql_hash, sql_preview, success, message)
  VALUES (v_user_id, v_sql_hash, v_sql_preview, false, 'Execution started');
  
  -- ===== SECURITY CHECKS =====
  
  -- 1. Only allow specific patterns (migrations, table creation, column addition)
  IF NOT (
    sql_text LIKE '-- Migration 2024%' OR
    sql_text LIKE 'CREATE TABLE%' OR
    sql_text LIKE 'ALTER TABLE%ADD COLUMN%' OR
    sql_text LIKE 'CREATE INDEX%' OR
    sql_text LIKE 'CREATE OR REPLACE FUNCTION%' OR
    sql_text LIKE 'COMMENT ON%' OR
    sql_text LIKE 'GRANT % TO %' OR
    sql_text LIKE 'CREATE POLICY%' OR
    sql_text LIKE 'CREATE TRIGGER%'
  ) THEN
    success := false;
    message := 'SQL pattern not allowed - must be migration operation';
    
    v_end_time := clock_timestamp();
    v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    UPDATE sql_audit_log 
    SET success = false, message = message, execution_time_ms = v_execution_time_ms
    WHERE id = (SELECT id FROM sql_audit_log WHERE sql_hash = v_sql_hash ORDER BY created_at DESC LIMIT 1);
    
    RETURN;
  END IF;
  
  -- 2. Block dangerous operations (case-insensitive)
  IF sql_text ~* '(DROP\s+TABLE|DELETE\s+FROM|TRUNCATE\s+TABLE|ALTER\s+TABLE.*DROP|UPDATE.*WHERE.*1=1|--\s*dangerous)' THEN
    success := false;
    message := 'Dangerous operation blocked by security policy';
    
    v_end_time := clock_timestamp();
    v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    UPDATE sql_audit_log 
    SET success = false, message = message, execution_time_ms = v_execution_time_ms
    WHERE id = (SELECT id FROM sql_audit_log WHERE sql_hash = v_sql_hash ORDER BY created_at DESC LIMIT 1);
    
    RETURN;
  END IF;
  
  -- 3. Block operations on sensitive tables
  IF sql_text ~* '(auth\.|storage\.|realtime\.|pg_|sql_audit_log)' THEN
    success := false;
    message := 'Operation on protected system table blocked';
    
    v_end_time := clock_timestamp();
    v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    UPDATE sql_audit_log 
    SET success = false, message = message, execution_time_ms = v_execution_time_ms
    WHERE id = (SELECT id FROM sql_audit_log WHERE sql_hash = v_sql_hash ORDER BY created_at DESC LIMIT 1);
    
    RETURN;
  END IF;
  
  -- ===== EXECUTE SQL =====
  BEGIN
    EXECUTE sql_text;
    
    success := true;
    message := 'Executed successfully';
    
    v_end_time := clock_timestamp();
    v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    -- Update audit log with success
    UPDATE sql_audit_log 
    SET success = true, message = message, execution_time_ms = v_execution_time_ms
    WHERE id = (SELECT id FROM sql_audit_log WHERE sql_hash = v_sql_hash ORDER BY created_at DESC LIMIT 1);
    
  EXCEPTION WHEN OTHERS THEN
    success := false;
    message := 'SQL execution error: ' || SQLERRM;
    
    v_end_time := clock_timestamp();
    v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    UPDATE sql_audit_log 
    SET success = false, message = message, execution_time_ms = v_execution_time_ms
    WHERE id = (SELECT id FROM sql_audit_log WHERE sql_hash = v_sql_hash ORDER BY created_at DESC LIMIT 1);
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql_restricted TO authenticated;

-- Create a simpler alias for backward compatibility
CREATE OR REPLACE FUNCTION exec_sql(
  sql_text text,
  OUT success boolean,
  OUT message text
)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT * INTO success, message FROM exec_sql_restricted(sql_text);
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;

-- Enable RLS on audit log table
ALTER TABLE sql_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own executions
CREATE POLICY "sql_audit_log: users see own" ON sql_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Owners can see all audit logs
CREATE POLICY "sql_audit_log: owners see all" ON sql_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner' 
      AND u.status = 'active'
    )
  );

COMMENT ON FUNCTION exec_sql_restricted IS 'Restricted SQL execution for migrations only. Blocks dangerous operations, logs everything.';
COMMENT ON FUNCTION exec_sql IS 'Alias for exec_sql_restricted for backward compatibility.';

COMMIT;