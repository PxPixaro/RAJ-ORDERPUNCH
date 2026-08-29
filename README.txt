RAJ ORDER PUNCH — TEMPORARY EXCEL MODE (UNIVERSAL PARTY SEARCH)

FILES TO UPLOAD TO GITHUB REPO ROOT:
- index.html
- config.js
- ALL PRODUCT MASTER.xlsx
- party-master.json

OPTIONAL / FOR LATER SUPABASE RESTORE:
- admin.html
- SECURITY_UPGRADE.sql
- PERFORMANCE_UPGRADE.sql

CURRENT TEMPORARY BEHAVIOR:
1. Product Master loads from ALL PRODUCT MASTER.xlsx.
2. Party Master loads from lightweight party-master.json (15k+ parties) for faster search.
3. There is NO alphabet A/B/C/D filter.
4. Party search is universal across the full party text. Examples: Rajkot, DM, Agency, Shrinath.
5. All parties are loaded into browser memory, but only up to 250 matching rows are rendered at once to keep the UI fast.
6. If party-master.json is missing, index.html automatically falls back to the Excel Party Master sheet.
7. Punch & Download exports only CODE and QTY and automatically clears the cart after successful download.
8. Temporary stock comes from Excel. Supabase live stock/history can be restored later.

WHEN SUPABASE IS FIXED:
Edit config.js and paste:
- SUPABASE_URL = your project URL
- SUPABASE_PUBLISHABLE_KEY = your sb_publishable_... key
Never use a secret/service_role key in GitHub Pages.

WHEN PARTY MASTER CHANGES:
The included party-master.json corresponds to the included Excel file. If Party Master changes later, regenerate/update party-master.json or temporarily remove it so the app falls back to the Party Master sheet in Excel.

FIXED BUILD:
- Party universal search runtime bug fixed (partySearchSeq/partySearchTimer declared).
- Search checks the complete party-master.json list, not just rendered dropdown rows.
- Multi-word/compact matching improved: e.g. "DM agency" can match "D M Auto Agency Rajkot".
- Dropdown renders only the first 250 matches for speed; the search itself scans all parties.
