PRAGMA foreign_keys = ON;

CREATE TABLE sources (
    source_id TEXT PRIMARY KEY,
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_url TEXT,
    metric_scope TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    registered_at TEXT NOT NULL
);

CREATE TABLE markets (
    market_code TEXT PRIMARY KEY,
    country_name_en TEXT NOT NULL,
    country_name_zh TEXT NOT NULL,
    locale TEXT NOT NULL UNIQUE,
    language_code TEXT NOT NULL,
    currency_code TEXT NOT NULL,
    user_recommendation INTEGER NOT NULL CHECK (user_recommendation BETWEEN 1 AND 5),
    market_priority INTEGER NOT NULL CHECK (market_priority BETWEEN 1 AND 5),
    research_wave INTEGER NOT NULL CHECK (research_wave IN (1, 2)),
    search_engine TEXT NOT NULL DEFAULT 'Google',
    status TEXT NOT NULL CHECK (status IN ('active', 'backlog')),
    rationale TEXT NOT NULL DEFAULT ''
);

CREATE TABLE categories (
    category_code TEXT PRIMARY KEY,
    category_name_en TEXT NOT NULL,
    category_name_zh TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE tools (
    tool_slug TEXT PRIMARY KEY,
    tool_name_en TEXT NOT NULL,
    category_code TEXT NOT NULL REFERENCES categories(category_code),
    implementation_mode TEXT NOT NULL CHECK (
        implementation_mode IN ('static_client', 'server_processing', 'ai_api', 'hybrid')
    ),
    monetization_model TEXT NOT NULL,
    build_complexity INTEGER NOT NULL CHECK (build_complexity BETWEEN 1 AND 5),
    commercial_intent INTEGER NOT NULL CHECK (commercial_intent BETWEEN 1 AND 5),
    localization_leverage INTEGER NOT NULL CHECK (localization_leverage BETWEEN 1 AND 5),
    recurring_use INTEGER NOT NULL CHECK (recurring_use BETWEEN 1 AND 5),
    ai_fit INTEGER NOT NULL CHECK (ai_fit BETWEEN 1 AND 5),
    paid_fit INTEGER NOT NULL CHECK (paid_fit BETWEEN 1 AND 5),
    baseline_competition INTEGER NOT NULL CHECK (baseline_competition BETWEEN 1 AND 5),
    static_delivery_fit INTEGER NOT NULL CHECK (static_delivery_fit BETWEEN 1 AND 5),
    mvp_wave INTEGER CHECK (mvp_wave IN (1, 2)),
    status TEXT NOT NULL CHECK (status IN ('candidate', 'mvp', 'hold')),
    source_id TEXT NOT NULL REFERENCES sources(source_id),
    notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE tool_market_localizations (
    tool_slug TEXT NOT NULL REFERENCES tools(tool_slug),
    market_code TEXT NOT NULL REFERENCES markets(market_code),
    base_query TEXT,
    display_name TEXT,
    localization_status TEXT NOT NULL CHECK (
        localization_status IN (
            'pending', 'generated', 'editor_reviewed', 'native_verified', 'serp_verified', 'rejected'
        )
    ),
    source_id TEXT REFERENCES sources(source_id),
    reviewed_at TEXT,
    notes TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (tool_slug, market_code),
    CHECK (
        (localization_status = 'pending' AND base_query IS NULL)
        OR (localization_status <> 'pending' AND base_query IS NOT NULL)
    )
);

CREATE TABLE keyword_patterns (
    market_code TEXT NOT NULL REFERENCES markets(market_code),
    pattern_code TEXT NOT NULL,
    template TEXT NOT NULL,
    search_intent TEXT NOT NULL CHECK (
        search_intent IN ('transactional', 'commercial', 'informational', 'navigational')
    ),
    page_type TEXT NOT NULL CHECK (
        page_type IN ('tool_core', 'tool_variant', 'guide', 'comparison')
    ),
    priority_adjustment REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('candidate', 'native_verified', 'rejected')),
    PRIMARY KEY (market_code, pattern_code),
    CHECK (instr(template, '{base}') > 0)
);

CREATE TABLE keyword_candidates (
    keyword_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_slug TEXT NOT NULL,
    market_code TEXT NOT NULL,
    pattern_code TEXT NOT NULL,
    keyword_text TEXT NOT NULL,
    normalized_keyword TEXT NOT NULL,
    search_intent TEXT NOT NULL,
    page_type TEXT NOT NULL,
    candidate_status TEXT NOT NULL CHECK (
        candidate_status IN ('generated', 'editor_reviewed', 'native_verified', 'serp_verified', 'rejected')
    ),
    heuristic_score REAL NOT NULL CHECK (heuristic_score BETWEEN 0 AND 100),
    heuristic_priority TEXT NOT NULL CHECK (heuristic_priority IN ('P0', 'P1', 'P2', 'P3')),
    generation_method TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(source_id),
    generated_at TEXT NOT NULL,
    UNIQUE (market_code, normalized_keyword),
    FOREIGN KEY (tool_slug, market_code)
        REFERENCES tool_market_localizations(tool_slug, market_code),
    FOREIGN KEY (market_code, pattern_code)
        REFERENCES keyword_patterns(market_code, pattern_code)
);

CREATE TABLE keyword_metric_snapshots (
    metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword_id INTEGER NOT NULL REFERENCES keyword_candidates(keyword_id),
    provider TEXT NOT NULL REFERENCES sources(source_id),
    collected_at TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT,
    monthly_search_volume INTEGER,
    cpc_micros INTEGER,
    ads_competition TEXT,
    ads_competition_index INTEGER,
    seo_difficulty REAL,
    trend_index REAL,
    data_status TEXT NOT NULL CHECK (
        data_status IN ('observed', 'no_data', 'partial', 'error')
    ),
    source_url TEXT,
    raw_record_hash TEXT,
    notes TEXT NOT NULL DEFAULT '',
    UNIQUE (keyword_id, provider, collected_at),
    CHECK (monthly_search_volume IS NULL OR monthly_search_volume >= 0),
    CHECK (cpc_micros IS NULL OR cpc_micros >= 0),
    CHECK (seo_difficulty IS NULL OR (seo_difficulty BETWEEN 0 AND 100)),
    CHECK (trend_index IS NULL OR (trend_index BETWEEN 0 AND 100))
);

CREATE TABLE competitors (
    competitor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword_id INTEGER NOT NULL REFERENCES keyword_candidates(keyword_id),
    rank_position INTEGER NOT NULL CHECK (rank_position BETWEEN 1 AND 100),
    domain TEXT NOT NULL,
    result_url TEXT NOT NULL,
    result_type TEXT NOT NULL,
    title TEXT,
    observed_at TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(source_id),
    UNIQUE (keyword_id, rank_position, observed_at)
);

CREATE TABLE serp_assessments (
    tool_slug TEXT NOT NULL REFERENCES tools(tool_slug),
    market_code TEXT NOT NULL REFERENCES markets(market_code),
    query_text TEXT NOT NULL,
    intent_fit INTEGER NOT NULL CHECK (intent_fit BETWEEN 1 AND 5),
    competition_strength INTEGER NOT NULL CHECK (competition_strength BETWEEN 1 AND 5),
    localization_gap INTEGER NOT NULL CHECK (localization_gap BETWEEN 1 AND 5),
    representative_domain TEXT,
    representative_url TEXT,
    representative_title TEXT,
    observation TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(source_id),
    PRIMARY KEY (tool_slug, market_code),
    CHECK (
        (representative_url IS NULL AND representative_domain IS NULL)
        OR (representative_url IS NOT NULL AND representative_domain IS NOT NULL)
    )
);

CREATE TABLE public_query_signals (
    signal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_code TEXT NOT NULL REFERENCES markets(market_code),
    tool_slug TEXT NOT NULL REFERENCES tools(tool_slug),
    query_text TEXT NOT NULL,
    suggestion_count INTEGER NOT NULL CHECK (suggestion_count BETWEEN 0 AND 10),
    exact_query_present INTEGER NOT NULL CHECK (exact_query_present IN (0, 1)),
    intent_clarity INTEGER NOT NULL CHECK (intent_clarity BETWEEN 1 AND 5),
    scenario_signal TEXT NOT NULL DEFAULT '',
    decision TEXT NOT NULL CHECK (
        decision IN ('PROMOTE', 'CLUSTER', 'RECHECK', 'REWORD', 'HOLD')
    ),
    suggestions TEXT NOT NULL DEFAULT '',
    observation TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES sources(source_id),
    UNIQUE (market_code, query_text, observed_at)
);

CREATE INDEX idx_keywords_tool_market
    ON keyword_candidates(tool_slug, market_code);
CREATE INDEX idx_keywords_priority
    ON keyword_candidates(heuristic_priority, heuristic_score DESC);
CREATE INDEX idx_metrics_keyword_collected
    ON keyword_metric_snapshots(keyword_id, collected_at DESC);
CREATE INDEX idx_competitors_keyword
    ON competitors(keyword_id, rank_position);
CREATE INDEX idx_serp_assessments_priority
    ON serp_assessments(market_code, competition_strength, localization_gap);
CREATE INDEX idx_public_query_signals_decision
    ON public_query_signals(decision, intent_clarity DESC, suggestion_count DESC);

CREATE VIEW v_keyword_opportunities AS
WITH latest_metric AS (
    SELECT kms.*,
           ROW_NUMBER() OVER (
               PARTITION BY kms.keyword_id
               ORDER BY kms.collected_at DESC, kms.metric_id DESC
           ) AS row_num
    FROM keyword_metric_snapshots kms
)
SELECT
    kc.keyword_id,
    kc.keyword_text,
    kc.tool_slug,
    t.tool_name_en,
    t.category_code,
    kc.market_code,
    m.country_name_en,
    m.locale,
    m.research_wave,
    kc.search_intent,
    kc.page_type,
    kc.candidate_status,
    l.localization_status,
    kc.heuristic_score,
    kc.heuristic_priority,
    lm.provider AS metric_provider,
    lm.collected_at AS metric_collected_at,
    lm.monthly_search_volume,
    lm.cpc_micros,
    lm.ads_competition,
    lm.ads_competition_index,
    lm.seo_difficulty,
    lm.trend_index,
    lm.data_status AS metric_status
FROM keyword_candidates kc
JOIN tools t ON t.tool_slug = kc.tool_slug
JOIN markets m ON m.market_code = kc.market_code
JOIN tool_market_localizations l
  ON l.tool_slug = kc.tool_slug AND l.market_code = kc.market_code
LEFT JOIN latest_metric lm
  ON lm.keyword_id = kc.keyword_id AND lm.row_num = 1;

CREATE VIEW v_tool_market_coverage AS
SELECT
    t.tool_slug,
    t.tool_name_en,
    t.category_code,
    m.market_code,
    m.country_name_en,
    m.research_wave,
    l.base_query,
    l.localization_status,
    COUNT(kc.keyword_id) AS keyword_count,
    SUM(CASE WHEN kc.candidate_status IN ('native_verified', 'serp_verified') THEN 1 ELSE 0 END)
        AS verified_keyword_count
FROM tools t
CROSS JOIN markets m
JOIN tool_market_localizations l
  ON l.tool_slug = t.tool_slug AND l.market_code = m.market_code
LEFT JOIN keyword_candidates kc
  ON kc.tool_slug = t.tool_slug AND kc.market_code = m.market_code
GROUP BY
    t.tool_slug, t.tool_name_en, t.category_code,
    m.market_code, m.country_name_en, m.research_wave,
    l.base_query, l.localization_status;

CREATE VIEW v_serp_research_priorities AS
SELECT
    sa.tool_slug,
    t.tool_name_en,
    sa.market_code,
    m.country_name_en,
    sa.query_text,
    sa.intent_fit,
    sa.competition_strength,
    sa.localization_gap,
    ROUND((
        t.commercial_intent * 0.25
        + sa.localization_gap * 0.25
        + t.static_delivery_fit * 0.15
        + sa.intent_fit * 0.20
        + (6 - sa.competition_strength) * 0.15
    ) / 5 * 100, 2) AS serp_research_score,
    CASE
        WHEN sa.intent_fit <= 1 THEN 'REJECT_INTENT'
        WHEN sa.intent_fit <= 3 THEN 'RECHECK_INTENT'
        WHEN (
            t.commercial_intent * 0.25
            + sa.localization_gap * 0.25
            + t.static_delivery_fit * 0.15
            + sa.intent_fit * 0.20
            + (6 - sa.competition_strength) * 0.15
        ) / 5 * 100 >= 75 THEN 'R0'
        WHEN (
            t.commercial_intent * 0.25
            + sa.localization_gap * 0.25
            + t.static_delivery_fit * 0.15
            + sa.intent_fit * 0.20
            + (6 - sa.competition_strength) * 0.15
        ) / 5 * 100 >= 60 THEN 'R1'
        ELSE 'R2'
    END AS research_priority,
    sa.representative_domain,
    sa.representative_url,
    sa.representative_title,
    sa.observation,
    sa.observed_at,
    sa.source_id
FROM serp_assessments sa
JOIN tools t ON t.tool_slug = sa.tool_slug
JOIN markets m ON m.market_code = sa.market_code;
