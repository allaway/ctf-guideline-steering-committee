# CTF Guideline Steering Committee — NF Literature Review

A tool for the [Children's Tumor Foundation (CTF)](https://www.ctf.org/) Guideline Steering Committee to curate, classify, and review NF/schwannomatosis clinical guideline literature.

**Live app:** [https://ctf-guideline-steering-committee.netlify.app/](https://ctf-guideline-steering-committee.netlify.app/)

---

## Overview

This project automates the classification of ~680 NF/schwannomatosis publications using the Claude API and PubMed, then surfaces the results in a web-based review interface for the steering committee.

**Pipeline (`curate_nf_literature.py`):**
- Reads publication titles from an Excel input file
- Fetches abstracts and metadata from PubMed (with optional full-text via Unpaywall)
- Classifies each paper with Claude across multiple dimensions (guideline type, NF condition, clinical focus, evidence strength, methodology, etc.)
- Writes results to a curated Excel output and a JSON file consumed by the web app

**Web app (`docs/`):**
- **Papers tab** — filterable, searchable table of all publications with per-paper classification details; reviewers can edit classifications and submit corrections
- **Dashboard tab** — summary charts breaking down the corpus by document type, condition, clinical focus, publication year, evidence strength, manifestation, and methodology
- Changes submitted through the UI are saved back to the source JSON via a Netlify serverless function

## Setup

```bash
pip install -r requirements.txt
```

Create `creds.yaml` (or a `.env` file) with:

```yaml
anthropic_api_key: sk-ant-...
ncbi_api_key: ...        # optional — raises PubMed rate limit
```

## Running the pipeline

```bash
python curate_nf_literature.py
```

Results are written to `NF_Guidelines_Curated.xlsx` and `classifications_web.json`. To rebuild the Excel from existing classifications without re-running Claude:

```bash
python rebuild_excel.py
```

## Deployment

The web app is a static site in `docs/` deployed via Netlify. On each push, Netlify copies `classifications_web.json` into `docs/` and serves the site. Classification edits submitted through the UI are persisted by a Netlify function in `netlify/functions/`.
