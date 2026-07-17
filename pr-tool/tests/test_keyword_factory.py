from __future__ import annotations

import csv
import importlib.util
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


build_module = load_module("build_keyword_factory", ROOT / "scripts" / "build_keyword_factory.py")
import_module = load_module("import_keyword_metrics", ROOT / "scripts" / "import_keyword_metrics.py")


class KeywordFactoryTest(unittest.TestCase):
    def test_build_counts_and_integrity(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)
            manifest = build_module.build(output_dir)
            self.assertEqual(200, manifest["validation"]["counts"]["tools"])
            self.assertEqual(10, manifest["validation"]["counts"]["markets"])
            self.assertEqual(2000, manifest["validation"]["counts"]["tool_market_localizations"])
            self.assertEqual(1000, manifest["validation"]["counts"]["keyword_candidates"])
            self.assertEqual(0, manifest["validation"]["counts"]["keyword_metric_snapshots"])
            self.assertEqual(50, manifest["validation"]["counts"]["serp_assessments"])
            connection = sqlite3.connect(output_dir / "global-tool-opportunities-v1.sqlite3")
            try:
                priorities = dict(
                    connection.execute(
                        "SELECT research_priority, COUNT(*) FROM v_serp_research_priorities GROUP BY research_priority"
                    ).fetchall()
                )
                self.assertEqual(5, priorities["R0"])
                self.assertEqual(2, priorities["RECHECK_INTENT"])
                self.assertEqual(3, priorities["REJECT_INTENT"])
            finally:
                connection.close()

    def test_metric_import_dry_run_then_apply(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)
            build_module.build(output_dir)
            database = output_dir / "global-tool-opportunities-v1.sqlite3"
            csv_path = output_dir / "metrics.csv"
            with csv_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=import_module.TEMPLATE_COLUMNS)
                writer.writeheader()
                writer.writerow(
                    {
                        "market_code": "BR",
                        "keyword_text": "gerador de faturas",
                        "provider": "google_ads_keyword_ideas",
                        "collected_at": "2026-07-17T12:00:00Z",
                        "period_start": "2025-07-01",
                        "period_end": "2026-06-30",
                        "monthly_search_volume": "1000",
                        "cpc_micros": "2500000",
                        "ads_competition": "MEDIUM",
                        "ads_competition_index": "50",
                        "seo_difficulty": "",
                        "trend_index": "",
                        "data_status": "observed",
                        "source_url": "google-ads-export.csv",
                        "notes": "test fixture",
                    }
                )
            dry_run = import_module.import_metrics(database, csv_path, apply=False)
            self.assertEqual(1, dry_run.valid_rows)
            self.assertEqual(0, dry_run.inserted_rows)
            applied = import_module.import_metrics(database, csv_path, apply=True)
            self.assertEqual(1, applied.inserted_rows)
            connection = sqlite3.connect(database)
            try:
                count = connection.execute("SELECT COUNT(*) FROM keyword_metric_snapshots").fetchone()[0]
                self.assertEqual(1, count)
            finally:
                connection.close()

    def test_no_data_cannot_contain_numeric_metrics(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)
            build_module.build(output_dir)
            database = output_dir / "global-tool-opportunities-v1.sqlite3"
            csv_path = output_dir / "invalid.csv"
            with csv_path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=import_module.TEMPLATE_COLUMNS)
                writer.writeheader()
                writer.writerow(
                    {
                        "market_code": "BR",
                        "keyword_text": "gerador de faturas",
                        "provider": "google_ads_keyword_ideas",
                        "collected_at": "2026-07-17T12:00:00Z",
                        "period_start": "",
                        "period_end": "",
                        "monthly_search_volume": "10",
                        "cpc_micros": "",
                        "ads_competition": "",
                        "ads_competition_index": "",
                        "seo_difficulty": "",
                        "trend_index": "",
                        "data_status": "no_data",
                        "source_url": "google-ads-export.csv",
                        "notes": "test fixture",
                    }
                )
            result = import_module.import_metrics(database, csv_path, apply=False)
            self.assertEqual(1, len(result.errors))
            self.assertIn("no_data rows", result.errors[0]["message"])


if __name__ == "__main__":
    unittest.main()
