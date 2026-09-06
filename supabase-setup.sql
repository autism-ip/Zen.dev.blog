-- ============================================================
--  raindrop_tokens 表结构 + 安全策略
--  安全模型: 该表仅由服务端 service client 访问。
--  生产数据库需在 Supabase Dashboard SQL Editor 重新执行本文件，
--  以收紧既有策略（替换旧的 anon 全开放 policy 并回收授权）。
-- ============================================================

-- Create the raindrop_tokens table for storing encrypted OAuth tokens
CREATE TABLE IF NOT EXISTS raindrop_tokens (
    id TEXT PRIMARY KEY,
    encrypted_data TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_raindrop_tokens_updated_at ON raindrop_tokens(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE raindrop_tokens ENABLE ROW LEVEL SECURITY;

-- Drop the legacy wide-open policy (re-run safe), then lock the table down:
-- only service_role may operate. service_role holds BYPASSRLS and bypasses RLS,
-- while anon/authenticated are denied by the policy AND by revoked grants.
DROP POLICY IF EXISTS "Allow all operations on raindrop_tokens" ON raindrop_tokens;

CREATE POLICY "Allow service_role only on raindrop_tokens" ON raindrop_tokens
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- service_role keeps full access; anon/authenticated are stripped entirely
GRANT ALL ON raindrop_tokens TO service_role;
REVOKE ALL ON raindrop_tokens FROM anon;
REVOKE ALL ON raindrop_tokens FROM authenticated;