#!/usr/bin/env python3
"""Build the Keyword Factory v1 SQLite database and audit-friendly CSV exports."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sqlite3
import unicodedata
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "data" / "keyword-factory" / "schema.sql"
SERP_AUDIT_PATH = ROOT / "data" / "keyword-factory" / "wave1-serp-audit.csv"
PUBLIC_QUERY_SIGNALS_PATH = ROOT / "data" / "keyword-factory" / "wave1-public-query-signals.csv"
DEFAULT_OUTPUT_DIR = ROOT / "outputs" / "keyword-factory-v1"
BUILD_TIMESTAMP = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


CATEGORIES = [
    ("developer", "Developer Tools", "开发者", "Formatting, testing, encoding and code utilities"),
    ("document_pdf", "Document & PDF", "文档与 PDF", "PDF and document creation or transformation"),
    ("image_design", "Image & Design", "图片与设计", "Image optimization, conversion and lightweight design"),
    ("business_finance", "Business & Finance", "商业与财务", "Small-business documents, calculators and operations"),
    ("career_hr", "Career & HR", "职业与人力", "Job seeking, recruiting and workplace utilities"),
    ("marketing_seo", "Marketing & SEO", "营销与 SEO", "Acquisition, analytics and content distribution tools"),
    ("writing_ai", "Writing & AI", "写作与 AI", "AI-assisted and deterministic writing utilities"),
    ("social_communication", "Social & Communication", "社交与沟通", "Messaging, social publishing and link utilities"),
    ("media", "Audio & Video", "音视频", "Audio and video transformation or production"),
    ("calculators_converters", "Calculators & Converters", "计算与转换", "General calculators, measurements and conversions"),
]


CATEGORY_DEFAULTS = {
    "developer": dict(mode="static_client", monetization="ads", complexity=2, commercial=3, localization=3, recurring=4, ai=2, paid=2, competition=4, static_fit=5),
    "document_pdf": dict(mode="static_client", monetization="freemium", complexity=3, commercial=4, localization=4, recurring=3, ai=2, paid=4, competition=5, static_fit=4),
    "image_design": dict(mode="static_client", monetization="freemium", complexity=3, commercial=4, localization=4, recurring=3, ai=3, paid=3, competition=5, static_fit=4),
    "business_finance": dict(mode="hybrid", monetization="freemium", complexity=3, commercial=5, localization=5, recurring=4, ai=3, paid=5, competition=4, static_fit=3),
    "career_hr": dict(mode="hybrid", monetization="freemium", complexity=3, commercial=5, localization=5, recurring=3, ai=4, paid=4, competition=4, static_fit=3),
    "marketing_seo": dict(mode="hybrid", monetization="subscription", complexity=3, commercial=5, localization=4, recurring=4, ai=4, paid=5, competition=5, static_fit=3),
    "writing_ai": dict(mode="ai_api", monetization="subscription", complexity=3, commercial=4, localization=5, recurring=4, ai=5, paid=4, competition=5, static_fit=1),
    "social_communication": dict(mode="static_client", monetization="ads", complexity=2, commercial=3, localization=5, recurring=4, ai=3, paid=2, competition=4, static_fit=5),
    "media": dict(mode="server_processing", monetization="freemium", complexity=4, commercial=4, localization=3, recurring=3, ai=3, paid=4, competition=5, static_fit=2),
    "calculators_converters": dict(mode="static_client", monetization="ads", complexity=2, commercial=3, localization=4, recurring=3, ai=1, paid=2, competition=3, static_fit=5),
}


TOOL_NAMES = {
    "developer": [
        "JSON Formatter", "JSON Validator", "XML Formatter", "YAML Formatter", "SQL Formatter",
        "HTML Formatter", "CSS Minifier", "JavaScript Minifier", "UUID Generator", "Cron Generator",
        "Cron Expression Parser", "Regex Tester", "JWT Decoder", "Base64 Encoder Decoder", "URL Encoder Decoder",
        "Hash Generator", "HMAC Generator", "Timestamp Converter", "Lorem Ipsum Generator", "Code Diff Checker",
    ],
    "document_pdf": [
        "PDF Compressor", "PDF Merger", "PDF Splitter", "PDF to Image Converter", "Image to PDF Converter",
        "PDF to Word Converter", "Word to PDF Converter", "PDF Page Rotator", "PDF Page Remover", "PDF Watermark Tool",
        "PDF Password Protector", "PDF Password Remover", "PDF Metadata Editor", "PDF Page Numbering Tool", "PDF Form Filler",
        "Document Scanner", "OCR Text Extractor", "Markdown to PDF Converter", "HTML to PDF Converter", "EPUB to PDF Converter",
    ],
    "image_design": [
        "Image Compressor", "Image Resizer", "Image Cropper", "Image Converter", "JPG to PNG Converter",
        "PNG to JPG Converter", "WebP Converter", "SVG Converter", "HEIC to JPG Converter", "Background Remover",
        "Photo Collage Maker", "Meme Generator", "Favicon Generator", "App Icon Generator", "Color Palette Generator",
        "Gradient Generator", "Image Watermark Tool", "EXIF Metadata Remover", "Passport Photo Maker", "Screenshot Beautifier",
    ],
    "business_finance": [
        "Invoice Generator", "Invoice Template Maker", "Receipt Generator", "Quote Generator", "Purchase Order Generator",
        "Business Card Maker", "Profit Margin Calculator", "Break Even Calculator", "ROI Calculator", "VAT Calculator",
        "Sales Tax Calculator", "Loan Payment Calculator", "Compound Interest Calculator", "Currency Converter", "IBAN Validator",
        "SWIFT Code Checker", "PayPal Fee Calculator", "Stripe Fee Calculator", "Freelance Rate Calculator", "Timesheet Calculator",
    ],
    "career_hr": [
        "Resume Builder", "CV Builder", "Cover Letter Generator", "Resume Summary Generator", "Resume Bullet Generator",
        "Job Description Generator", "Interview Question Generator", "Salary Calculator", "Hourly to Salary Calculator", "Notice Period Calculator",
        "Overtime Calculator", "PTO Calculator", "Working Days Calculator", "Attendance Calculator", "Employee Cost Calculator",
        "LinkedIn Headline Generator", "Professional Bio Generator", "Reference Letter Generator", "Resignation Letter Generator", "Offer Letter Generator",
    ],
    "marketing_seo": [
        "Meta Tag Generator", "SERP Preview Tool", "Keyword Density Checker", "Word Counter", "UTM Builder",
        "QR Code Generator", "Sitemap Generator", "Robots.txt Generator", "Schema Markup Generator", "Open Graph Generator",
        "Twitter Card Generator", "Redirect Checker", "Broken Link Checker", "Domain Age Checker", "DNS Lookup Tool",
        "Whois Lookup Tool", "Email Subject Line Tester", "Headline Analyzer", "Ad Copy Generator", "Product Description Generator",
    ],
    "writing_ai": [
        "Grammar Checker", "Spell Checker", "Paraphrasing Tool", "Text Summarizer", "Article Rewriter",
        "Email Writer", "Cold Email Generator", "Blog Title Generator", "Blog Outline Generator", "FAQ Generator",
        "Sentence Rewriter", "Tone Changer", "Text Expander", "Text Shortener", "AI Humanizer",
        "Story Generator", "Poem Generator", "Essay Outline Generator", "Citation Generator", "Plagiarism Checker",
    ],
    "social_communication": [
        "WhatsApp Link Generator", "WhatsApp QR Generator", "Instagram Caption Generator", "Instagram Bio Generator", "Hashtag Generator",
        "YouTube Title Generator", "YouTube Description Generator", "TikTok Caption Generator", "Facebook Post Generator", "Tweet Generator",
        "Social Media Calendar Generator", "Short Link Generator", "Link in Bio Builder", "Email Signature Generator", "Contact Card Generator",
        "Character Counter", "Emoji Picker", "Fancy Text Generator", "Unicode Text Converter", "Random Comment Picker",
    ],
    "media": [
        "Video Compressor", "Video Trimmer", "Video Merger", "Video to GIF Converter", "GIF to Video Converter",
        "Audio Compressor", "Audio Trimmer", "Audio Merger", "MP3 Converter", "WAV to MP3 Converter",
        "Video to MP3 Converter", "Voice Recorder", "Screen Recorder", "Webcam Recorder", "Subtitle Generator",
        "Subtitle Converter", "Teleprompter", "Podcast Name Generator", "Podcast Description Generator", "BPM Tap Counter",
    ],
    "calculators_converters": [
        "Unit Converter", "Length Converter", "Weight Converter", "Temperature Converter", "Area Converter",
        "Volume Converter", "Speed Converter", "Data Storage Converter", "Time Zone Converter", "Age Calculator",
        "Date Difference Calculator", "Percentage Calculator", "Average Calculator", "Ratio Calculator", "Fraction Calculator",
        "BMI Calculator", "Calorie Calculator", "Tip Calculator", "Random Number Generator", "Password Generator",
    ],
}


MVP_WAVE_1 = {
    "invoice-generator",
    "pdf-compressor",
    "image-compressor",
    "image-resizer",
    "qr-code-generator",
    "character-counter",
    "whatsapp-link-generator",
    "resume-builder",
    "json-formatter",
    "password-generator",
}


TOOL_OVERRIDES = {
    "invoice-generator": dict(mode="static_client", complexity=2, static_fit=5, competition=4),
    "pdf-compressor": dict(complexity=3, static_fit=4, competition=5),
    "image-compressor": dict(complexity=2, static_fit=5, competition=5),
    "image-resizer": dict(complexity=1, static_fit=5, competition=4),
    "qr-code-generator": dict(complexity=1, static_fit=5, competition=5),
    "character-counter": dict(complexity=1, static_fit=5, competition=4, commercial=2, paid=1),
    "whatsapp-link-generator": dict(complexity=1, static_fit=5, localization=5, competition=3, commercial=4),
    "resume-builder": dict(complexity=3, static_fit=3, localization=5, commercial=5, paid=5),
    "json-formatter": dict(complexity=1, static_fit=5, recurring=5, competition=5),
    "password-generator": dict(complexity=1, static_fit=5, competition=5, recurring=4),
}


MARKETS = [
    ("BR", "Brazil", "巴西", "pt-BR", "pt", "BRL", 5, 5, 1, "active", "Existing pt-BR site and strong localization fit"),
    ("JP", "Japan", "日本", "ja-JP", "ja", "JPY", 5, 5, 1, "active", "High-value local-language search market"),
    ("KR", "South Korea", "韩国", "ko-KR", "ko", "KRW", 5, 5, 1, "active", "Digital-first market with strong local-language intent"),
    ("ID", "Indonesia", "印度尼西亚", "id-ID", "id", "IDR", 5, 5, 1, "active", "Large mobile-first audience and localization leverage"),
    ("VN", "Vietnam", "越南", "vi-VN", "vi", "VND", 5, 5, 1, "active", "Fast-growing digital market and local-language opportunity"),
    ("DE", "Germany", "德国", "de-DE", "de", "EUR", 5, 4, 2, "backlog", "High commercial value; stronger competition and compliance needs"),
    ("FR", "France", "法国", "fr-FR", "fr", "EUR", 4, 4, 2, "backlog", "Large local-language market"),
    ("ES", "Spain", "西班牙", "es-ES", "es", "EUR", 4, 4, 2, "backlog", "Reusable Spanish assets with regional caveats"),
    ("TH", "Thailand", "泰国", "th-TH", "th", "THB", 5, 4, 2, "backlog", "Distinct script and local search behavior"),
    ("TR", "Turkey", "土耳其", "tr-TR", "tr", "TRY", 4, 4, 2, "backlog", "Large local-language audience and currency-sensitive monetization"),
]


LOCALIZED_HEAD_TERMS = {
    "invoice-generator": {"BR": "gerador de faturas", "JP": "請求書 作成", "KR": "인보이스 생성기", "DE": "Rechnung erstellen", "FR": "générateur de facture", "ES": "generador de facturas", "ID": "generator invoice", "VN": "tạo hóa đơn", "TH": "สร้างใบแจ้งหนี้", "TR": "fatura oluşturucu"},
    "pdf-compressor": {"BR": "comprimir PDF", "JP": "PDF 圧縮", "KR": "PDF 압축", "DE": "PDF komprimieren", "FR": "compresser PDF", "ES": "comprimir PDF", "ID": "kompres PDF", "VN": "nén PDF", "TH": "บีบอัด PDF", "TR": "PDF sıkıştırma"},
    "image-compressor": {"BR": "comprimir imagem", "JP": "画像 圧縮", "KR": "이미지 압축", "DE": "Bild komprimieren", "FR": "compresser image", "ES": "comprimir imagen", "ID": "kompres gambar", "VN": "nén ảnh", "TH": "บีบอัดรูปภาพ", "TR": "resim sıkıştırma"},
    "image-resizer": {"BR": "redimensionar imagem", "JP": "画像 サイズ変更", "KR": "이미지 크기 조절", "DE": "Bildgröße ändern", "FR": "redimensionner image", "ES": "redimensionar imagen", "ID": "ubah ukuran gambar", "VN": "thay đổi kích thước ảnh", "TH": "ปรับขนาดรูปภาพ", "TR": "resim boyutlandırma"},
    "qr-code-generator": {"BR": "gerador de QR Code", "JP": "QRコード 作成", "KR": "QR 코드 생성기", "DE": "QR-Code erstellen", "FR": "générateur de QR code", "ES": "generador de código QR", "ID": "generator kode QR", "VN": "tạo mã QR", "TH": "สร้าง QR Code", "TR": "QR kod oluşturucu"},
    "character-counter": {"BR": "contador de caracteres", "JP": "文字数 カウント", "KR": "글자 수 세기", "DE": "Zeichen zählen", "FR": "compteur de caractères", "ES": "contador de caracteres", "ID": "penghitung karakter", "VN": "đếm ký tự", "TH": "นับตัวอักษร", "TR": "karakter sayacı"},
    "whatsapp-link-generator": {"BR": "gerador de link WhatsApp", "JP": "WhatsApp リンク 作成", "KR": "WhatsApp 링크 생성", "DE": "WhatsApp Link erstellen", "FR": "générateur de lien WhatsApp", "ES": "generador de enlace WhatsApp", "ID": "buat link WhatsApp", "VN": "tạo link WhatsApp", "TH": "สร้างลิงก์ WhatsApp", "TR": "WhatsApp link oluşturucu"},
    "resume-builder": {"BR": "criador de currículo", "JP": "履歴書 作成", "KR": "이력서 작성", "DE": "Lebenslauf erstellen", "FR": "créateur de CV", "ES": "creador de currículum", "ID": "pembuat CV", "VN": "tạo CV", "TH": "สร้างเรซูเม่", "TR": "CV oluşturucu"},
    "json-formatter": {"BR": "formatador JSON", "JP": "JSON 整形", "KR": "JSON 포맷터", "DE": "JSON formatieren", "FR": "formateur JSON", "ES": "formateador JSON", "ID": "formatter JSON", "VN": "định dạng JSON", "TH": "จัดรูปแบบ JSON", "TR": "JSON biçimlendirici"},
    "password-generator": {"BR": "gerador de senhas", "JP": "パスワード 生成", "KR": "비밀번호 생성기", "DE": "Passwort Generator", "FR": "générateur de mot de passe", "ES": "generador de contraseñas", "ID": "generator kata sandi", "VN": "tạo mật khẩu", "TH": "สร้างรหัสผ่าน", "TR": "şifre oluşturucu"},
}


PATTERNS = {
    "BR": [("core", "{base}", "transactional", "tool_core", 0), ("free", "{base} grátis", "transactional", "tool_variant", -1), ("online", "{base} online", "transactional", "tool_variant", 1), ("free_online", "{base} grátis online", "transactional", "tool_variant", 0), ("no_signup", "{base} sem cadastro", "transactional", "tool_variant", 1), ("best", "melhor {base}", "commercial", "comparison", 0), ("fast", "{base} rápido", "transactional", "tool_variant", 0), ("easy", "{base} fácil", "transactional", "tool_variant", 0), ("mobile", "{base} para celular", "transactional", "tool_variant", 0), ("how_to", "como usar {base}", "informational", "guide", -2)],
    "JP": [("core", "{base}", "transactional", "tool_core", 0), ("free", "{base} 無料", "transactional", "tool_variant", 0), ("free_prefix", "無料 {base}", "transactional", "tool_variant", -1), ("online", "{base} オンライン", "transactional", "tool_variant", 1), ("browser", "{base} ブラウザ", "transactional", "tool_variant", 0), ("no_signup", "{base} 登録不要", "transactional", "tool_variant", 1), ("mobile", "{base} スマホ", "transactional", "tool_variant", 0), ("easy", "簡単 {base}", "transactional", "tool_variant", 0), ("how_to", "{base} 使い方", "informational", "guide", -2), ("best", "おすすめ {base}", "commercial", "comparison", 0)],
    "KR": [("core", "{base}", "transactional", "tool_core", 0), ("free", "무료 {base}", "transactional", "tool_variant", 0), ("free_suffix", "{base} 무료", "transactional", "tool_variant", -1), ("online", "{base} 온라인", "transactional", "tool_variant", 1), ("site", "{base} 사이트", "commercial", "comparison", 0), ("no_signup", "{base} 회원가입 없이", "transactional", "tool_variant", 1), ("mobile", "{base} 모바일", "transactional", "tool_variant", 0), ("easy", "간편 {base}", "transactional", "tool_variant", 0), ("how_to", "{base} 사용법", "informational", "guide", -2), ("best", "추천 {base}", "commercial", "comparison", 0)],
    "DE": [("core", "{base}", "transactional", "tool_core", 0), ("free", "{base} kostenlos", "transactional", "tool_variant", 0), ("free_prefix", "kostenlos {base}", "transactional", "tool_variant", -1), ("online", "{base} online", "transactional", "tool_variant", 1), ("free_online", "{base} kostenlos online", "transactional", "tool_variant", 0), ("no_signup", "{base} ohne Anmeldung", "transactional", "tool_variant", 1), ("browser", "{base} im Browser", "transactional", "tool_variant", 0), ("easy", "einfach {base}", "transactional", "tool_variant", 0), ("mobile", "{base} mobil", "transactional", "tool_variant", 0), ("tool", "{base} Tool", "commercial", "comparison", 0)],
    "FR": [("core", "{base}", "transactional", "tool_core", 0), ("free", "{base} gratuit", "transactional", "tool_variant", 0), ("online", "{base} en ligne", "transactional", "tool_variant", 1), ("free_online", "{base} gratuit en ligne", "transactional", "tool_variant", 0), ("no_signup", "{base} sans inscription", "transactional", "tool_variant", 1), ("tool", "outil {base}", "commercial", "comparison", 0), ("easy", "{base} facile", "transactional", "tool_variant", 0), ("fast", "{base} rapide", "transactional", "tool_variant", 0), ("mobile", "{base} mobile", "transactional", "tool_variant", 0), ("best", "meilleur {base}", "commercial", "comparison", 0)],
    "ES": [("core", "{base}", "transactional", "tool_core", 0), ("free", "{base} gratis", "transactional", "tool_variant", 0), ("online", "{base} online", "transactional", "tool_variant", 1), ("free_online", "{base} gratis online", "transactional", "tool_variant", 0), ("no_signup", "{base} sin registro", "transactional", "tool_variant", 1), ("tool", "herramienta {base}", "commercial", "comparison", 0), ("easy", "{base} fácil", "transactional", "tool_variant", 0), ("fast", "{base} rápido", "transactional", "tool_variant", 0), ("mobile", "{base} móvil", "transactional", "tool_variant", 0), ("best", "mejor {base}", "commercial", "comparison", 0)],
    "ID": [("core", "{base}", "transactional", "tool_core", 0), ("free", "{base} gratis", "transactional", "tool_variant", 0), ("online", "{base} online", "transactional", "tool_variant", 1), ("free_online", "{base} gratis online", "transactional", "tool_variant", 0), ("no_signup", "{base} tanpa daftar", "transactional", "tool_variant", 1), ("how_to", "cara {base}", "informational", "guide", -2), ("app", "aplikasi {base}", "commercial", "comparison", 0), ("fast", "{base} cepat", "transactional", "tool_variant", 0), ("easy", "{base} mudah", "transactional", "tool_variant", 0), ("mobile", "{base} di HP", "transactional", "tool_variant", 0)],
    "VN": [("core", "{base}", "transactional", "tool_core", 0), ("free", "{base} miễn phí", "transactional", "tool_variant", 0), ("online", "{base} online", "transactional", "tool_variant", 1), ("free_online", "{base} miễn phí online", "transactional", "tool_variant", 0), ("no_signup", "{base} không cần đăng ký", "transactional", "tool_variant", 1), ("tool", "công cụ {base}", "commercial", "comparison", 0), ("fast", "{base} nhanh", "transactional", "tool_variant", 0), ("easy", "{base} dễ dùng", "transactional", "tool_variant", 0), ("mobile", "{base} trên điện thoại", "transactional", "tool_variant", 0), ("how_to", "cách {base}", "informational", "guide", -2)],
    "TH": [("core", "{base}", "transactional", "tool_core", 0), ("free", "{base} ฟรี", "transactional", "tool_variant", 0), ("online", "{base} ออนไลน์", "transactional", "tool_variant", 1), ("free_online", "{base} ฟรี ออนไลน์", "transactional", "tool_variant", 0), ("no_signup", "{base} ไม่ต้องสมัคร", "transactional", "tool_variant", 1), ("tool", "เครื่องมือ {base}", "commercial", "comparison", 0), ("easy", "{base} ง่ายๆ", "transactional", "tool_variant", 0), ("fast", "{base} รวดเร็ว", "transactional", "tool_variant", 0), ("mobile", "{base} บนมือถือ", "transactional", "tool_variant", 0), ("how_to", "วิธี {base}", "informational", "guide", -2)],
    "TR": [("core", "{base}", "transactional", "tool_core", 0), ("free", "ücretsiz {base}", "transactional", "tool_variant", 0), ("online", "online {base}", "transactional", "tool_variant", 1), ("free_online", "ücretsiz online {base}", "transactional", "tool_variant", 0), ("no_signup", "üyeliksiz {base}", "transactional", "tool_variant", 1), ("tool", "{base} aracı", "commercial", "comparison", 0), ("easy", "kolay {base}", "transactional", "tool_variant", 0), ("fast", "hızlı {base}", "transactional", "tool_variant", 0), ("mobile", "mobil {base}", "transactional", "tool_variant", 0), ("how_to", "{base} nasıl yapılır", "informational", "guide", -2)],
}


SOURCES = [
    ("user_strategy_chat", "User-provided TrustMRR / Keyword Factory conversation", "user_provided", "https://chatgpt.com/share/6a59f54f-b9a0-83ec-98b9-79999c283241", "strategy", "Initial scale, markets and Keyword Factory thesis"),
    ("editorial_seed_20260717", "Keyword Factory editorial seed v1", "editorial", None, "tool catalog and localized candidates", "Model-assisted candidates; not native or SERP verified"),
    ("google_ads_keyword_ideas", "Google Ads KeywordPlanIdeaService", "official_api", "https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas", "keyword ideas, volume, CPC, ads competition", "Preferred first-party metrics source when authorized"),
    ("google_trends", "Google Trends", "official_tool", "https://support.google.com/trends/answer/4359550", "relative search interest", "Relative index only; not absolute search volume"),
    ("ahrefs_multilingual_seo", "Ahrefs multilingual SEO guide", "methodology", "https://ahrefs.com/blog/multilingual-seo/", "localization methodology", "Region and language must be researched together"),
    ("public_serp_audit_20260717", "Wave 1 public SERP audit", "public_web_research", None, "50 core tool-market queries", "Representative result review; not a substitute for Google Ads volume, CPC, or SEO difficulty"),
    ("google_autocomplete_20260717", "Wave 1 Google Autocomplete observations", "official_public_endpoint", "https://suggestqueries.google.com/complete/search", "16 seed queries and returned predictions", "Demand and intent proxy only; suggestion counts are not search volume and are not comparable as absolute demand"),
]


@dataclass(frozen=True)
class Tool:
    slug: str
    name: str
    category: str
    mode: str
    monetization: str
    complexity: int
    commercial: int
    localization: int
    recurring: int
    ai: int
    paid: int
    competition: int
    static_fit: int
    mvp_wave: int | None
    status: str


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def normalize_keyword(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def build_tools() -> list[Tool]:
    tools: list[Tool] = []
    for category, names in TOOL_NAMES.items():
        if len(names) != 20:
            raise ValueError(f"{category} must contain exactly 20 tools, got {len(names)}")
        for name in names:
            slug = slugify(name)
            attrs = dict(CATEGORY_DEFAULTS[category])
            attrs.update(TOOL_OVERRIDES.get(slug, {}))
            is_mvp = slug in MVP_WAVE_1
            tools.append(
                Tool(
                    slug=slug,
                    name=name,
                    category=category,
                    mode=attrs["mode"],
                    monetization=attrs["monetization"],
                    complexity=attrs["complexity"],
                    commercial=attrs["commercial"],
                    localization=attrs["localization"],
                    recurring=attrs["recurring"],
                    ai=attrs["ai"],
                    paid=attrs["paid"],
                    competition=attrs["competition"],
                    static_fit=attrs["static_fit"],
                    mvp_wave=1 if is_mvp else None,
                    status="mvp" if is_mvp else "candidate",
                )
            )
    slugs = [tool.slug for tool in tools]
    if len(tools) != 200 or len(slugs) != len(set(slugs)):
        raise ValueError("Tool catalog must contain exactly 200 unique slugs")
    if MVP_WAVE_1 - set(slugs):
        raise ValueError(f"Missing MVP tools: {sorted(MVP_WAVE_1 - set(slugs))}")
    return tools


def heuristic_score(tool: Tool, market_priority: int, adjustment: float) -> float:
    raw = (
        tool.commercial * 0.22
        + tool.localization * 0.18
        + tool.recurring * 0.12
        + tool.paid * 0.12
        + market_priority * 0.14
        + tool.static_fit * 0.10
        + (6 - tool.complexity) * 0.07
        + (6 - tool.competition) * 0.05
    )
    return round(max(0, min(100, raw / 5 * 100 + adjustment)), 2)


def priority(score: float) -> str:
    if score >= 80:
        return "P0"
    if score >= 65:
        return "P1"
    if score >= 50:
        return "P2"
    return "P3"


def insert_seed_data(connection: sqlite3.Connection, tools: list[Tool]) -> None:
    connection.executemany(
        "INSERT INTO sources VALUES (?, ?, ?, ?, ?, ?, ?)",
        [(*source, BUILD_TIMESTAMP) for source in SOURCES],
    )
    connection.executemany(
        "INSERT INTO categories VALUES (?, ?, ?, ?)",
        CATEGORIES,
    )
    connection.executemany(
        """INSERT INTO markets(
            market_code, country_name_en, country_name_zh, locale, language_code,
            currency_code, user_recommendation, market_priority, research_wave,
            status, rationale
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        MARKETS,
    )
    connection.executemany(
        """INSERT INTO tools(
            tool_slug, tool_name_en, category_code, implementation_mode,
            monetization_model, build_complexity, commercial_intent,
            localization_leverage, recurring_use, ai_fit, paid_fit,
            baseline_competition, static_delivery_fit, mvp_wave, status,
            source_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            (
                tool.slug, tool.name, tool.category, tool.mode, tool.monetization,
                tool.complexity, tool.commercial, tool.localization, tool.recurring,
                tool.ai, tool.paid, tool.competition, tool.static_fit, tool.mvp_wave,
                tool.status, "editorial_seed_20260717", "Initial opportunity catalog",
            )
            for tool in tools
        ],
    )

    localization_rows = []
    for tool in tools:
        for market in MARKETS:
            market_code = market[0]
            base_query = LOCALIZED_HEAD_TERMS.get(tool.slug, {}).get(market_code)
            status = "editor_reviewed" if base_query else "pending"
            source_id = "editorial_seed_20260717" if base_query else None
            note = "Requires native and SERP validation" if base_query else "Awaiting localized head term"
            localization_rows.append(
                (tool.slug, market_code, base_query, base_query, status, source_id, None, note)
            )
    connection.executemany(
        "INSERT INTO tool_market_localizations VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        localization_rows,
    )

    pattern_rows = []
    for market_code, patterns in PATTERNS.items():
        for pattern_code, template, intent, page_type, adjustment in patterns:
            pattern_rows.append(
                (market_code, pattern_code, template, intent, page_type, adjustment, "candidate")
            )
    connection.executemany(
        "INSERT INTO keyword_patterns VALUES (?, ?, ?, ?, ?, ?, ?)",
        pattern_rows,
    )

    tools_by_slug = {tool.slug: tool for tool in tools}
    market_priority = {market[0]: market[7] for market in MARKETS}
    keyword_rows = []
    for tool_slug, localized_by_market in LOCALIZED_HEAD_TERMS.items():
        tool = tools_by_slug[tool_slug]
        for market_code, base_query in localized_by_market.items():
            for pattern_code, template, intent, page_type, adjustment in PATTERNS[market_code]:
                keyword = " ".join(template.format(base=base_query).split())
                score = heuristic_score(tool, market_priority[market_code], adjustment)
                keyword_rows.append(
                    (
                        tool_slug, market_code, pattern_code, keyword,
                        normalize_keyword(keyword), intent, page_type, "editor_reviewed",
                        score, priority(score), "localized_head_term_plus_market_pattern",
                        "editorial_seed_20260717", BUILD_TIMESTAMP,
                    )
                )
    connection.executemany(
        """INSERT INTO keyword_candidates(
            tool_slug, market_code, pattern_code, keyword_text, normalized_keyword,
            search_intent, page_type, candidate_status, heuristic_score,
            heuristic_priority, generation_method, source_id, generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        keyword_rows,
    )

    with SERP_AUDIT_PATH.open(encoding="utf-8-sig", newline="") as handle:
        audit_rows = list(csv.DictReader(handle))
    if len(audit_rows) != 50:
        raise ValueError(f"SERP audit must contain exactly 50 rows, got {len(audit_rows)}")
    connection.executemany(
        """INSERT INTO serp_assessments(
            tool_slug, market_code, query_text, intent_fit, competition_strength,
            localization_gap, representative_domain, representative_url,
            representative_title, observation, observed_at, source_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            (
                row["tool_slug"], row["market_code"], row["query_text"],
                int(row["intent_fit"]), int(row["competition_strength"]),
                int(row["localization_gap"]), row["representative_domain"] or None,
                row["representative_url"] or None, row["representative_title"] or None,
                row["observation"], row["observed_at"], "public_serp_audit_20260717",
            )
            for row in audit_rows
        ],
    )

    with PUBLIC_QUERY_SIGNALS_PATH.open(encoding="utf-8-sig", newline="") as handle:
        public_signal_rows = list(csv.DictReader(handle))
    if len(public_signal_rows) != 16:
        raise ValueError(
            f"Public query signals must contain exactly 16 rows, got {len(public_signal_rows)}"
        )
    connection.executemany(
        """INSERT INTO public_query_signals(
            market_code, tool_slug, query_text, suggestion_count,
            exact_query_present, intent_clarity, scenario_signal, decision,
            suggestions, observation, observed_at, source_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            (
                row["market_code"], row["tool_slug"], row["query_text"],
                int(row["suggestion_count"]), int(row["exact_query_present"]),
                int(row["intent_clarity"]), row["scenario_signal"], row["decision"],
                row["suggestions"], row["observation"], row["observed_at"],
                "google_autocomplete_20260717",
            )
            for row in public_signal_rows
        ],
    )
    connection.execute(
        """UPDATE tool_market_localizations
           SET localization_status = CASE
               WHEN EXISTS (
                   SELECT 1 FROM serp_assessments sa
                   WHERE sa.tool_slug = tool_market_localizations.tool_slug
                     AND sa.market_code = tool_market_localizations.market_code
                     AND sa.intent_fit = 1
               ) THEN 'rejected'
               ELSE 'serp_verified'
           END,
               source_id = 'public_serp_audit_20260717',
               reviewed_at = ?,
               notes = CASE
                   WHEN EXISTS (
                       SELECT 1 FROM serp_assessments sa
                       WHERE sa.tool_slug = tool_market_localizations.tool_slug
                         AND sa.market_code = tool_market_localizations.market_code
                         AND sa.intent_fit = 1
                   ) THEN 'Core query rejected after public SERP intent review'
                   ELSE 'Core query reviewed in public SERP sample; native review still pending'
               END
           WHERE EXISTS (
               SELECT 1 FROM serp_assessments sa
               WHERE sa.tool_slug = tool_market_localizations.tool_slug
                 AND sa.market_code = tool_market_localizations.market_code
           )""",
        (BUILD_TIMESTAMP,),
    )
    connection.execute(
        """UPDATE keyword_candidates
           SET candidate_status = CASE
               WHEN EXISTS (
                   SELECT 1 FROM serp_assessments sa
                   WHERE sa.tool_slug = keyword_candidates.tool_slug
                     AND sa.market_code = keyword_candidates.market_code
                     AND sa.intent_fit = 1
               ) THEN 'rejected'
               ELSE 'serp_verified'
           END,
               source_id = 'public_serp_audit_20260717'
           WHERE pattern_code = 'core'
             AND EXISTS (
                 SELECT 1 FROM serp_assessments sa
                 WHERE sa.tool_slug = keyword_candidates.tool_slug
                   AND sa.market_code = keyword_candidates.market_code
             )"""
    )


def export_query(connection: sqlite3.Connection, output_path: Path, query: str) -> int:
    cursor = connection.execute(query)
    rows = cursor.fetchall()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow([column[0] for column in cursor.description])
        writer.writerows(rows)
    return len(rows)


def validate(connection: sqlite3.Connection) -> dict[str, object]:
    foreign_key_errors = connection.execute("PRAGMA foreign_key_check").fetchall()
    integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
    counts = {
        table: connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        for table in [
            "tools", "markets", "tool_market_localizations", "keyword_patterns",
            "keyword_candidates", "keyword_metric_snapshots", "competitors",
            "serp_assessments",
            "public_query_signals",
        ]
    }
    missing_metric_violations = connection.execute(
        """SELECT COUNT(*) FROM v_keyword_opportunities
           WHERE metric_provider IS NULL
             AND (monthly_search_volume IS NOT NULL OR cpc_micros IS NOT NULL
                  OR seo_difficulty IS NOT NULL)"""
    ).fetchone()[0]
    invalid_keyword_status = connection.execute(
        """SELECT COUNT(*) FROM keyword_candidates kc
           JOIN tool_market_localizations l
             ON l.tool_slug = kc.tool_slug AND l.market_code = kc.market_code
           WHERE l.localization_status = 'pending'"""
    ).fetchone()[0]
    if integrity != "ok" or foreign_key_errors:
        raise ValueError(f"Database integrity failed: {integrity}, {foreign_key_errors}")
    if counts != {
        "tools": 200,
        "markets": 10,
        "tool_market_localizations": 2000,
        "keyword_patterns": 100,
        "keyword_candidates": 1000,
        "keyword_metric_snapshots": 0,
        "competitors": 0,
        "serp_assessments": 50,
        "public_query_signals": 16,
    }:
        raise ValueError(f"Unexpected row counts: {counts}")
    if missing_metric_violations or invalid_keyword_status:
        raise ValueError("Data trust constraints failed")
    return {
        "integrity_check": integrity,
        "foreign_key_errors": len(foreign_key_errors),
        "counts": counts,
        "metric_without_source_violations": missing_metric_violations,
        "keyword_on_pending_localization_violations": invalid_keyword_status,
    }


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build(output_dir: Path) -> dict[str, object]:
    output_dir.mkdir(parents=True, exist_ok=True)
    database_path = output_dir / "global-tool-opportunities-v1.sqlite3"
    if database_path.exists():
        database_path.unlink()
    connection = sqlite3.connect(database_path)
    try:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        tools = build_tools()
        insert_seed_data(connection, tools)
        connection.commit()
        validation = validate(connection)
        export_counts = {
            "tools.csv": export_query(connection, output_dir / "tools.csv", "SELECT * FROM tools ORDER BY category_code, tool_name_en"),
            "markets.csv": export_query(connection, output_dir / "markets.csv", "SELECT * FROM markets ORDER BY research_wave, market_priority DESC, market_code"),
            "localizations.csv": export_query(connection, output_dir / "localizations.csv", "SELECT * FROM tool_market_localizations ORDER BY tool_slug, market_code"),
            "keywords.csv": export_query(connection, output_dir / "keywords.csv", "SELECT * FROM v_keyword_opportunities ORDER BY heuristic_score DESC, market_code, tool_slug, keyword_id"),
            "priority-shortlist.csv": export_query(connection, output_dir / "priority-shortlist.csv", "SELECT * FROM v_keyword_opportunities WHERE research_wave = 1 AND heuristic_priority IN ('P0', 'P1') ORDER BY heuristic_score DESC, market_code, tool_slug LIMIT 200"),
            "sources.csv": export_query(connection, output_dir / "sources.csv", "SELECT * FROM sources ORDER BY source_id"),
            "serp-audit.csv": export_query(connection, output_dir / "serp-audit.csv", "SELECT * FROM v_serp_research_priorities ORDER BY serp_research_score DESC, market_code, tool_slug"),
            "public-query-signals.csv": export_query(connection, output_dir / "public-query-signals.csv", "SELECT * FROM public_query_signals ORDER BY CASE decision WHEN 'PROMOTE' THEN 1 WHEN 'CLUSTER' THEN 2 WHEN 'RECHECK' THEN 3 WHEN 'REWORD' THEN 4 ELSE 5 END, intent_clarity DESC, suggestion_count DESC, market_code, tool_slug"),
        }
    finally:
        connection.close()

    manifest = {
        "name": "Global Tool Opportunities Database v1",
        "built_at": BUILD_TIMESTAMP,
        "database": database_path.name,
        "database_sha256": sha256(database_path),
        "schema": str(SCHEMA_PATH.relative_to(ROOT)),
        "validation": validation,
        "exports": export_counts,
        "completion_note": "200 tools and 10 markets are cataloged; 1,000 MVP keyword candidates are generated; 50 core queries have public SERP assessments; 16 focused queries have public autocomplete observations; real search volume, CPC and SEO difficulty remain uncollected.",
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()
    manifest = build(args.output_dir.resolve())
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
