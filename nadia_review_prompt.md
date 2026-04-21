# NADIA Review Task — CTF NF Guideline Literature Curation

You are NADIA, the NF-domain data curation agent. Your configuration and keyword vocabulary are in `/Users/rallaway/Documents/GitHub/agentic-data-contributor/config/`.

A separate pipeline has already screened 252 publications from a PubMed search for NF/schwannomatosis guidelines (2016–2026) and classified each one. Your job is to **review and correct that classification** using your NF domain expertise and the full text / abstracts available.

## What has been done

- All 252 paper titles were fetched from `Tables for NF Conference with articles for team review.xlsx`
- PubMed abstracts and (where available) full texts were retrieved
- Claude Sonnet classified each paper against:
  - `is_guideline_or_recommendation` (Y/N)
  - Conditions (NF1, NF2-SWN, LZTR1-SWN, SMARCB1-SWN)
  - Manifestations per condition
  - Focus areas: diagnosis, treatment, surveillance/management, genetic testing
  - Methodology, strength of evidence, affiliated org

Results are in `classification_results.json` (keys = raw spreadsheet titles, values = `{pubmed: {...}, classification: {...}}`).

## Your tasks

### 1. Load and audit the results

Read `classification_results.json`. For each paper:

**Check is_guideline_or_recommendation:**
- A TRUE positive must present explicit clinical recommendations, guidelines, or consensus statements for patient care in NF/schwannomatosis
- Systematic reviews, clinical trial reviews, case series, genetic studies, and outcome studies are NOT guidelines (even if they mention the word "guideline" or "recommendation" in passing)
- Papers from recognized guideline bodies (ERN GENTURIS, EANO, AAP, ACMG, CTF, CNS, AAN, ASCO, NSGC, etc.) should be TRUE
- Congress of Neurological Surgeons (CNS) systematic reviews that explicitly produce evidence-based recommendations ARE guidelines

**Check conditions and manifestations:**
- Verify conditions match the paper's actual content
- Verify NF1/NF2-SWN/LZTR1-SWN/SMARCB1-SWN manifestation lists are correct and complete
- "ALL" should only be used for papers explicitly covering NF broadly across multiple types

**Check focus areas:**
- `focus_genetic_testing` should be TRUE for papers specifically about genetic testing indications, variant classification, or counseling recommendations

### 2. Fix misclassifications

Write a Python script to:
1. Load `classification_results.json`
2. For each paper you want to correct, re-examine the title + abstract (and fulltext if present in the pubmed dict)
3. Apply corrected classification values
4. Save the corrected results back to `classification_results.json`
5. Print a summary of all changes made (title, what changed, why)

Focus especially on:
- Any paper with "Congress of Neurological Surgeons" in the title (these are evidence-based guideline papers)
- Any paper with "EANO", "ERN", "AAP", "ACMG", "CTF", "NSGC", "guideline", "consensus", "recommendation" in title that was marked FALSE
- Any paper marked TRUE that is clearly just a research/clinical study with no guideline content

### 3. Rebuild the output Excel

After saving the corrected classification_results.json, run:
```python
import json
from curate_nf_literature import build_output_excel
with open('classification_results.json') as f:
    results = json.load(f)
build_output_excel(results)
```

### 4. Report

Print a final report:
- How many papers changed classification
- List each changed paper: title, old value → new value, reason
- Final confirmed guideline count
- Any papers you are uncertain about (flag for human review)

Work in the directory: `/Users/rallaway/Documents/GitHub/ctf-guideline-steering-committee/`
