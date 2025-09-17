-- Analytics Database Schema for Trading System Performance Tracking
-- Creates tables for storing suggestions, actuals, and performance metrics

-- Table for storing trading suggestions from all agents
CREATE TABLE IF NOT EXISTS trading_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suggestion_id VARCHAR(36) UNIQUE NOT NULL, -- UUID
    agent_name VARCHAR(50) NOT NULL,
    signal VARCHAR(10) NOT NULL, -- BUY, SELL, HOLD
    confidence INTEGER NOT NULL, -- 0-100
    target_price DECIMAL(10,2),
    stop_loss DECIMAL(10,2),
    reasoning TEXT,
    market_price DECIMAL(10,2) NOT NULL, -- Price at time of suggestion
    timeframe VARCHAR(20) NOT NULL, -- 15min, 1hour, 1day, etc.
    data_quality VARCHAR(10), -- HIGH, MEDIUM, LOW
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- When suggestion expires
    
    -- Additional metadata
    market_conditions TEXT, -- JSON string of market conditions
    technical_indicators TEXT, -- JSON string of technical data
    fundamental_data TEXT, -- JSON string of fundamental analysis
    global_sentiment VARCHAR(20),
    volatility_level VARCHAR(10),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED
    is_backtested BOOLEAN DEFAULT FALSE
);

-- Table for recording actual market movements and outcomes
CREATE TABLE IF NOT EXISTS actual_outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suggestion_id VARCHAR(36) NOT NULL,
    outcome_type VARCHAR(20) NOT NULL, -- PRICE_MOVEMENT, SIGNAL_VALIDATION, EXPIRY
    
    -- Price data
    actual_price DECIMAL(10,2) NOT NULL,
    price_change DECIMAL(10,4), -- Percentage change
    price_direction VARCHAR(10), -- UP, DOWN, FLAT
    
    -- Time data
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_elapsed INTEGER, -- Minutes since suggestion
    
    -- Outcome assessment
    is_correct BOOLEAN, -- Whether prediction was right
    accuracy_score DECIMAL(5,2), -- 0-100 accuracy score
    profit_loss DECIMAL(10,4), -- Theoretical P&L percentage
    
    -- Market context at outcome time
    market_volatility DECIMAL(5,2),
    volume_data TEXT, -- JSON string
    
    FOREIGN KEY (suggestion_id) REFERENCES trading_suggestions(suggestion_id)
);

-- Table for aggregated performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name VARCHAR(50) NOT NULL,
    metric_period VARCHAR(20) NOT NULL, -- DAILY, WEEKLY, MONTHLY
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Basic counts
    total_suggestions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    incorrect_predictions INTEGER DEFAULT 0,
    
    -- Accuracy metrics
    overall_accuracy DECIMAL(5,2) DEFAULT 0, -- Percentage
    buy_signal_accuracy DECIMAL(5,2) DEFAULT 0,
    sell_signal_accuracy DECIMAL(5,2) DEFAULT 0,
    hold_signal_accuracy DECIMAL(5,2) DEFAULT 0,
    
    -- Confidence analysis
    avg_confidence DECIMAL(5,2) DEFAULT 0,
    high_confidence_accuracy DECIMAL(5,2) DEFAULT 0, -- >80% confidence
    medium_confidence_accuracy DECIMAL(5,2) DEFAULT 0, -- 50-80%
    low_confidence_accuracy DECIMAL(5,2) DEFAULT 0, -- <50%
    
    -- Performance metrics
    avg_profit_loss DECIMAL(10,4) DEFAULT 0,
    total_profit_loss DECIMAL(10,4) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    avg_holding_time INTEGER DEFAULT 0, -- Minutes
    
    -- Risk metrics
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    volatility DECIMAL(5,2) DEFAULT 0,
    
    -- Data quality impact
    high_quality_accuracy DECIMAL(5,2) DEFAULT 0,
    medium_quality_accuracy DECIMAL(5,2) DEFAULT 0,
    low_quality_accuracy DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for system-wide analytics
CREATE TABLE IF NOT EXISTS system_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    
    -- Overall system performance
    total_suggestions INTEGER DEFAULT 0,
    system_accuracy DECIMAL(5,2) DEFAULT 0,
    best_performing_agent VARCHAR(50),
    worst_performing_agent VARCHAR(50),
    
    -- Market conditions
    market_trend VARCHAR(20), -- BULLISH, BEARISH, SIDEWAYS
    average_volatility DECIMAL(5,2) DEFAULT 0,
    trading_volume BIGINT DEFAULT 0,
    
    -- Economic indicators
    nifty_open DECIMAL(10,2),
    nifty_close DECIMAL(10,2),
    nifty_high DECIMAL(10,2),
    nifty_low DECIMAL(10,2),
    daily_change DECIMAL(5,2),
    
    -- System health
    api_success_rate DECIMAL(5,2) DEFAULT 0,
    data_quality_score DECIMAL(5,2) DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0, -- Milliseconds
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for real-time alerts and notifications
CREATE TABLE IF NOT EXISTS performance_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type VARCHAR(30) NOT NULL, -- ACCURACY_DROP, HIGH_CONFIDENCE_FAIL, SYSTEM_ERROR
    severity VARCHAR(10) NOT NULL, -- HIGH, MEDIUM, LOW
    agent_name VARCHAR(50),
    message TEXT NOT NULL,
    threshold_value DECIMAL(10,4),
    actual_value DECIMAL(10,4),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_suggestions_agent_date ON trading_suggestions(agent_name, created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_signal ON trading_suggestions(signal, created_at);
CREATE INDEX IF NOT EXISTS idx_outcomes_suggestion ON actual_outcomes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_date ON actual_outcomes(recorded_at);
CREATE INDEX IF NOT EXISTS idx_metrics_agent_period ON performance_metrics(agent_name, metric_period, period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON system_analytics(date);
CREATE INDEX IF NOT EXISTS idx_alerts_type_severity ON performance_alerts(alert_type, severity, is_resolved);

-- Views for common queries
CREATE VIEW IF NOT EXISTS agent_performance_summary AS
SELECT 
    agent_name,
    COUNT(*) as total_suggestions,
    AVG(confidence) as avg_confidence,
    COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / COUNT(*) as accuracy_rate,
    AVG(ao.profit_loss) as avg_profit_loss,
    MAX(ts.created_at) as last_suggestion
FROM trading_suggestions ts
LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
WHERE ts.created_at >= date('now', '-30 days')
GROUP BY agent_name;

CREATE VIEW IF NOT EXISTS daily_performance AS
SELECT 
    DATE(ts.created_at) as date,
    COUNT(*) as suggestions_count,
    AVG(confidence) as avg_confidence,
    COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / COUNT(*) as accuracy_rate,
    COUNT(CASE WHEN ts.signal = 'BUY' THEN 1 END) as buy_signals,
    COUNT(CASE WHEN ts.signal = 'SELL' THEN 1 END) as sell_signals,
    COUNT(CASE WHEN ts.signal = 'HOLD' THEN 1 END) as hold_signals
FROM trading_suggestions ts
LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
GROUP BY DATE(ts.created_at)
ORDER BY date DESC;

CREATE VIEW IF NOT EXISTS confidence_accuracy_analysis AS
SELECT 
    CASE 
        WHEN confidence >= 80 THEN 'High (80-100%)'
        WHEN confidence >= 60 THEN 'Medium (60-79%)'
        WHEN confidence >= 40 THEN 'Low (40-59%)'
        ELSE 'Very Low (<40%)'
    END as confidence_range,
    COUNT(*) as total_suggestions,
    COUNT(CASE WHEN ao.is_correct = 1 THEN 1 END) * 100.0 / COUNT(*) as accuracy_rate,
    AVG(confidence) as avg_confidence_in_range
FROM trading_suggestions ts
LEFT JOIN actual_outcomes ao ON ts.suggestion_id = ao.suggestion_id
WHERE ts.created_at >= date('now', '-30 days')
GROUP BY 
    CASE 
        WHEN confidence >= 80 THEN 'High (80-100%)'
        WHEN confidence >= 60 THEN 'Medium (60-79%)'
        WHEN confidence >= 40 THEN 'Low (40-59%)'
        ELSE 'Very Low (<40%)'
    END
ORDER BY avg_confidence_in_range DESC;