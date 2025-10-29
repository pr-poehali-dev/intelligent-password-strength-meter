CREATE TABLE IF NOT EXISTS compromised_passwords (
    id SERIAL PRIMARY KEY,
    password_hash VARCHAR(64) NOT NULL UNIQUE,
    breach_count INTEGER DEFAULT 1,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(255),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_password_hash ON compromised_passwords(password_hash);
CREATE INDEX idx_breach_count ON compromised_passwords(breach_count DESC);
CREATE INDEX idx_severity ON compromised_passwords(severity);

COMMENT ON TABLE compromised_passwords IS 'Список скомпрометированных паролей с информацией об утечках';
COMMENT ON COLUMN compromised_passwords.password_hash IS 'SHA-256 хеш пароля';
COMMENT ON COLUMN compromised_passwords.breach_count IS 'Количество раз, когда пароль встречался в утечках';
COMMENT ON COLUMN compromised_passwords.first_seen IS 'Дата первого обнаружения в утечках';
COMMENT ON COLUMN compromised_passwords.last_seen IS 'Дата последнего обнаружения в утечках';
COMMENT ON COLUMN compromised_passwords.source IS 'Источник утечки';
COMMENT ON COLUMN compromised_passwords.severity IS 'Уровень критичности: low, medium, high, critical';
