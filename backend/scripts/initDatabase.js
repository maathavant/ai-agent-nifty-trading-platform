const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create and initialize the analytics database
const dbPath = path.join(__dirname, '..', 'analytics.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Initializing analytics database...');

// Create tables
const schema = `
-- Trading Suggestions Table
CREATE TABLE IF NOT EXISTS trading_suggestions (
    id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    signal TEXT NOT NULL,
    confidence INTEGER,
    target_price REAL,
    stop_loss REAL,
    reasoning TEXT,
    market_price REAL,
    timeframe TEXT,
    data_quality TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    market_conditions TEXT,
    technical_indicators TEXT,
    fundamental_data TEXT,
    expiry_time DATETIME,
    volatility_level TEXT
);

-- Actual Outcomes Table  
CREATE TABLE IF NOT EXISTS actual_outcomes (
    id TEXT PRIMARY KEY,
    suggestion_id TEXT NOT NULL,
    actual_price REAL NOT NULL,
    outcome TEXT,
    pnl REAL,
    success BOOLEAN,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    evaluation_method TEXT,
    additional_data TEXT,
    FOREIGN KEY (suggestion_id) REFERENCES trading_suggestions(id)
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    timeframe TEXT,
    success_rate REAL,
    total_signals INTEGER,
    successful_signals INTEGER,
    total_pnl REAL,
    avg_confidence REAL,
    accuracy_score REAL,
    risk_score REAL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System Analytics Table
CREATE TABLE IF NOT EXISTS system_analytics (
    id TEXT PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value REAL,
    metric_data TEXT,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Alerts Table
CREATE TABLE IF NOT EXISTS performance_alerts (
    id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity TEXT,
    title TEXT,
    message TEXT,
    agent_name TEXT,
    metric_name TEXT,
    threshold_value REAL,
    actual_value REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suggestions_agent ON trading_suggestions(agent_name);
CREATE INDEX IF NOT EXISTS idx_suggestions_timestamp ON trading_suggestions(timestamp);
CREATE INDEX IF NOT EXISTS idx_outcomes_suggestion ON actual_outcomes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_metrics_agent ON performance_metrics(agent_name);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON performance_alerts(is_active);
`;

// Execute schema
db.exec(schema, (err) => {
    if (err) {
        console.error('❌ Error creating database schema:', err);
        process.exit(1);
    } else {
        console.log('✅ Analytics database initialized successfully');
        
        // Insert some sample data if tables are empty
        db.get("SELECT COUNT(*) as count FROM trading_suggestions", (err, row) => {
            if (err) {
                console.error('Error checking data:', err);
            } else if (row.count === 0) {
                console.log('📊 No existing data found - database is ready for new suggestions');
            } else {
                console.log(`📊 Found ${row.count} existing trading suggestions`);
            }
            
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('🔒 Database connection closed');
                }
                process.exit(0);
            });
        });
    }
});