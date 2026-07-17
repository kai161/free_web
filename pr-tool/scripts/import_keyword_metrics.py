#!/usr/bin/env python3
"""Validate and import keyword metric snapshots into the Keyword Factory database."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sqlite3
import unicodedata
from dataclasses import dataclass
from pathlib import Path


TEMPLATE_COLUMNS = [
    "market_code",
    "keyword_text",
    "provider",
    "collected_at",
    "period_start",
    "period_end",
    "monthly_search_volume",
    "cpc_micros",
    "ads_competition",
    "ads_competition_index",
    "seo_difficulty",
    "trend_index",
    "data_status",
    "source_url",
    "notes",
]

ALLOWED_DATA_STATUS = {"observed", "no_data", "partial", "error"}


@dataclass(frozen=True)
class ImportResult:
    mode: str
    total_rows: int
    valid_rows: int
    inserted_rows: int
    errors: list[dict[str, object]]

    def as_dict(self) -> dict[str, object]:
        return {
            "mode": self.mode,
            "total_rows": self.total_rows,
            "valid_rows": self.valid_rows,
            "inserted_rows": self.inserted_rows,
            "errors": self.errors,
        }


def normalize_keyword(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def optional_int(value: str, field: str) -> int | None:
    if not value.strip():
        return None
    parsed = int(value)
    if parsed < 0:
        raise ValueError(f"{field} must be >= 0")
    return parsed


def optional_float(value: str, field: str) -> float | None:
    if not value.strip():
        return None
    parsed = float(value)
    if not 0 <= parsed <= 100:
        raise ValueError(f"{field} must be between 0 and 100")
    return parsed


def raw_record_hash(row: dict[str, str]) -> str:
    payload = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def write_template(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        csv.writer(handle).writerow(TEMPLATE_COLUMNS)


def validate_headers(fieldnames: list[str] | None) -> None:
    if fieldnames is None:
        raise ValueError("CSV is missing a header row")
    missing = [column for column in TEMPLATE_COLUMNS if column not in fieldnames]
    extra = [column for column in fieldnames if column not in TEMPLATE_COLUMNS]
    if missing or extra:
        raise ValueError(f"CSV header mismatch; missing={missing}, extra={extra}")


def import_metrics(database_path: Path, csv_path: Path, apply: bool = False) -> ImportResult:
    connection = sqlite3.connect(database_path)
    connection.execute("PRAGMA foreign_keys = ON")
    errors: list[dict[str, object]] = []
    valid: list[tuple[object, ...]] = []
    total_rows = 0
    try:
        providers = {
            row[0]
            for row in connection.execute("SELECT source_id FROM sources").fetchall()
        }
        keyword_lookup = {
            (market_code, normalized_keyword): keyword_id
            for keyword_id, market_code, normalized_keyword in connection.execute(
                "SELECT keyword_id, market_code, normalized_keyword FROM keyword_candidates"
            ).fetchall()
        }
        with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            validate_headers(reader.fieldnames)
            for line_number, row in enumerate(reader, start=2):
                total_rows += 1
                try:
                    market_code = row["market_code"].strip().upper()
                    keyword_text = row["keyword_text"].strip()
                    provider = row["provider"].strip()
                    collected_at = row["collected_at"].strip()
                    data_status = row["data_status"].strip()
                    if not market_code or not keyword_text or not provider or not collected_at:
                        raise ValueError("market_code, keyword_text, provider and collected_at are required")
                    if provider not in providers:
                        raise ValueError(f"provider is not registered in sources: {provider}")
                    if data_status not in ALLOWED_DATA_STATUS:
                        raise ValueError(f"invalid data_status: {data_status}")
                    keyword_id = keyword_lookup.get((market_code, normalize_keyword(keyword_text)))
                    if keyword_id is None:
                        raise ValueError("keyword_text + market_code does not match a candidate")

                    monthly_search_volume = optional_int(row["monthly_search_volume"], "monthly_search_volume")
                    cpc_micros = optional_int(row["cpc_micros"], "cpc_micros")
                    ads_competition_index = optional_int(row["ads_competition_index"], "ads_competition_index")
                    if ads_competition_index is not None and ads_competition_index > 100:
                        raise ValueError("ads_competition_index must be between 0 and 100")
                    seo_difficulty = optional_float(row["seo_difficulty"], "seo_difficulty")
                    trend_index = optional_float(row["trend_index"], "trend_index")
                    metrics = [
                        monthly_search_volume,
                        cpc_micros,
                        ads_competition_index,
                        seo_difficulty,
                        trend_index,
                    ]
                    if data_status == "observed" and all(value is None for value in metrics):
                        raise ValueError("observed rows require at least one metric")
                    if data_status == "no_data" and any(value is not None for value in metrics):
                        raise ValueError("no_data rows must not contain numeric metrics")
                    valid.append(
                        (
                            keyword_id,
                            provider,
                            collected_at,
                            row["period_start"].strip() or None,
                            row["period_end"].strip() or None,
                            monthly_search_volume,
                            cpc_micros,
                            row["ads_competition"].strip() or None,
                            ads_competition_index,
                            seo_difficulty,
                            trend_index,
                            data_status,
                            row["source_url"].strip() or None,
                            raw_record_hash(row),
                            row["notes"].strip(),
                        )
                    )
                except (ValueError, TypeError) as error:
                    errors.append({"line": line_number, "message": str(error)})

        inserted_rows = 0
        if apply and not errors:
            connection.executemany(
                """INSERT INTO keyword_metric_snapshots(
                    keyword_id, provider, collected_at, period_start, period_end,
                    monthly_search_volume, cpc_micros, ads_competition,
                    ads_competition_index, seo_difficulty, trend_index, data_status,
                    source_url, raw_record_hash, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                valid,
            )
            connection.commit()
            inserted_rows = len(valid)
        else:
            connection.rollback()
        return ImportResult(
            mode="apply" if apply else "dry-run",
            total_rows=total_rows,
            valid_rows=len(valid),
            inserted_rows=inserted_rows,
            errors=errors,
        )
    finally:
        connection.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", nargs="?", type=Path)
    parser.add_argument("csv", nargs="?", type=Path)
    parser.add_argument("--apply", action="store_true", help="Insert rows; default is dry-run")
    parser.add_argument("--write-template", type=Path, help="Write a header-only import template")
    args = parser.parse_args()

    if args.write_template:
        write_template(args.write_template.resolve())
        print(json.dumps({"template": str(args.write_template.resolve())}, ensure_ascii=False))
        return
    if args.database is None or args.csv is None:
        parser.error("database and csv are required unless --write-template is used")
    result = import_metrics(args.database.resolve(), args.csv.resolve(), apply=args.apply)
    print(json.dumps(result.as_dict(), ensure_ascii=False, indent=2))
    if result.errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

