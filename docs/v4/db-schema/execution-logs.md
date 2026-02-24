CREATE TABLE execution_logs (  
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
    task_id VARCHAR(50) UNIQUE NOT NULL,  
      
    -- Timing  
    started_at TIMESTAMPTZ NOT NULL,  
    completed_at TIMESTAMPTZ,  
    duration_ms INTEGER,  
      
    -- Status  
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'aborted', 'retry')),  
    retry_count INTEGER DEFAULT 0,  
    abort_reason TEXT,  
      
    -- Financial  
    tokens_input INTEGER,  
    tokens_output INTEGER,  
    cost_usd DECIMAL(10, 4),  
    budget_limit_usd DECIMAL(10, 2),  
      
    -- ROI  
    estimated_human_hours DECIMAL(6, 2),  
    saved_human_hours DECIMAL(6, 2),  
    roi_ratio DECIMAL(6, 2),  
      
    -- Code metrics  
    files_created INTEGER DEFAULT 0,  
    files_modified INTEGER DEFAULT 0,  
    lines_added INTEGER DEFAULT 0,  
    lines_removed INTEGER DEFAULT 0,  
      
    -- Quality  
    type_errors_before INTEGER,  
    type_errors_after INTEGER,  
    security_flags TEXT[],  
    architect_approved BOOLEAN,  
      
    -- Git  
    branch_name VARCHAR(100),  
    merge_commit_hash VARCHAR(40),  
      
    -- Raw data  
    agent_breakdown JSONB,  
    full_log_path VARCHAR(255), -- ссылка на logs/task-{id}.log  
      
    created_at TIMESTAMPTZ DEFAULT NOW()  
);  
  
-- Индексы для аналитики  
CREATE INDEX idx_execution_logs_status ON execution_logs(status);  
CREATE INDEX idx_execution_logs_date ON execution_logs(started_at);  
CREATE INDEX idx_execution_logs_cost ON execution_logs(cost_usd);  
