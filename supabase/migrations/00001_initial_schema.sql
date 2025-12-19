-- ============================================
-- Supabase Migration: Initial Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. WORKSPACES (Ìl¤˜t¤)
-- ============================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('marketing', 'sales', 'accounting', 'hr', 'project', 'custom')),
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);

-- ============================================
-- 2. SHEETS (Ü¸)
-- ============================================
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sheets_workspace_id ON sheets(workspace_id);

-- ============================================
-- 3. COLUMNS (ô)
-- ============================================
CREATE TABLE columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'checkbox', 'url', 'relation', 'formula')),
  ai_features JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_columns_sheet_id ON columns(sheet_id);

-- ai_features 0ô  €D \ h
CREATE OR REPLACE FUNCTION validate_ai_features(features JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  valid_features TEXT[] := ARRAY['autofill', 'lookup', 'analyze', 'recommend', 'generate', 'score'];
  feature TEXT;
BEGIN
  IF features IS NULL OR features = '[]'::jsonb THEN
    RETURN TRUE;
  END IF;

  FOR feature IN SELECT jsonb_array_elements_text(features)
  LOOP
    IF NOT (feature = ANY(valid_features)) THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE columns ADD CONSTRAINT check_ai_features
  CHECK (validate_ai_features(ai_features));

-- ============================================
-- 4. ROWS (‰)
-- ============================================
CREATE TABLE rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rows_sheet_id ON rows(sheet_id);

-- ============================================
-- 5. CELLS (@)
-- ============================================
CREATE TABLE cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  row_id UUID NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  value TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_confidence FLOAT CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(row_id, column_id)
);

CREATE INDEX idx_cells_row_id ON cells(row_id);
CREATE INDEX idx_cells_column_id ON cells(column_id);

-- ============================================
-- 6. AI_PATTERNS (Yµ (4)
-- ============================================
CREATE TABLE ai_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  success_rate FLOAT DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 1),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_patterns_workspace_id ON ai_patterns(workspace_id);

-- ============================================
-- 7. TEMPLATES (\¿)
-- ============================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_count INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category);

-- ============================================
-- TRIGGERS: updated_at Ù Åpt¸
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_cells_updated_at
  BEFORE UPDATE ON cells
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ai_patterns_updated_at
  BEFORE UPDATE ON ai_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) E
-- ============================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- WORKSPACES E
-- ----------------------------------------
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON workspaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
  ON workspaces FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------
-- SHEETS E
-- ----------------------------------------
CREATE POLICY "Users can view sheets in own workspaces"
  ON sheets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = sheets.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sheets in own workspaces"
  ON sheets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = sheets.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sheets in own workspaces"
  ON sheets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = sheets.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sheets in own workspaces"
  ON sheets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = sheets.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

-- ----------------------------------------
-- COLUMNS E
-- ----------------------------------------
CREATE POLICY "Users can view columns in own sheets"
  ON columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE sheets.id = columns.sheet_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create columns in own sheets"
  ON columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE sheets.id = columns.sheet_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update columns in own sheets"
  ON columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE sheets.id = columns.sheet_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete columns in own sheets"
  ON columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE sheets.id = columns.sheet_id
      AND workspaces.user_id = auth.uid()
    )
  );

-- ----------------------------------------
-- ROWS E
-- ----------------------------------------
CREATE POLICY "Users can view rows in own sheets"
  ON rows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE sheets.id = rows.sheet_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rows in own sheets"
  ON rows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE sheets.id = rows.sheet_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rows in own sheets"
  ON rows FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE sheets.id = rows.sheet_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rows in own sheets"
  ON rows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sheets
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE sheets.id = rows.sheet_id
      AND workspaces.user_id = auth.uid()
    )
  );

-- ----------------------------------------
-- CELLS E
-- ----------------------------------------
CREATE POLICY "Users can view cells in own rows"
  ON cells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rows
      JOIN sheets ON sheets.id = rows.sheet_id
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE rows.id = cells.row_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create cells in own rows"
  ON cells FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rows
      JOIN sheets ON sheets.id = rows.sheet_id
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE rows.id = cells.row_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cells in own rows"
  ON cells FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rows
      JOIN sheets ON sheets.id = rows.sheet_id
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE rows.id = cells.row_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cells in own rows"
  ON cells FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rows
      JOIN sheets ON sheets.id = rows.sheet_id
      JOIN workspaces ON workspaces.id = sheets.workspace_id
      WHERE rows.id = cells.row_id
      AND workspaces.user_id = auth.uid()
    )
  );

-- ----------------------------------------
-- AI_PATTERNS E
-- ----------------------------------------
CREATE POLICY "Users can view own ai_patterns"
  ON ai_patterns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = ai_patterns.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ai_patterns in own workspaces"
  ON ai_patterns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = ai_patterns.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own ai_patterns"
  ON ai_patterns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = ai_patterns.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own ai_patterns"
  ON ai_patterns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = ai_patterns.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

-- ----------------------------------------
-- TEMPLATES E (¨à x ¬©  }0  ¥)
-- ----------------------------------------
CREATE POLICY "Authenticated users can view all templates"
  ON templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- \¿ Ý1//­” D¤ í`\Ì  ¥ ( ¬©)
-- D”Ü ÄÄ admin E ” 
