#!/usr/bin/env python3
"""Rebuild NF_Guidelines_Curated.xlsx from classifications_web.json."""
import json
from curate_nf_literature import build_output_excel_v2

with open("classifications_web.json") as f:
    results = json.load(f)
build_output_excel_v2(results)
