// Raj Order Punch configuration
// TEMPORARY MODE works from Excel + party-master.json even when Supabase is unavailable.
// Later, paste your Supabase Project URL and ONLY the Publishable key below.
// NEVER put sb_secret_, service_role, database password, or any private key in this public file.
window.RAJ_CONFIG = {
  SUPABASE_URL: 'PASTE_YOUR_SUPABASE_PROJECT_URL_HERE',
  SUPABASE_PUBLISHABLE_KEY: 'PASTE_YOUR_SB_PUBLISHABLE_KEY_HERE',
  EXCEL_FILE: 'ALL PRODUCT MASTER.xlsx',
  PARTY_JSON_FILE: 'party-master.json'
};
