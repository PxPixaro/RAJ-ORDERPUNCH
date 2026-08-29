RAJ ORDER PUNCH — SUPABASE PROJECT
=================================

FILES
-----
index.html                  Main order-punch website
admin.html                  Excel -> Supabase Product/Stock/Party sync page
config.js                   Supabase URL + Publishable Key
ALL PRODUCT MASTER.xlsx     Updated workbook (Product Master + Party Master)
SECURITY_UPGRADE.sql        Optional hardening notes for admin sync

ONE REQUIRED STEP
-----------------
Open config.js and replace:
PASTE_YOUR_SB_PUBLISHABLE_KEY_HERE
with your Supabase Publishable key beginning with:
sb_publishable_

Never put sb_secret_, service_role, or database password in this project.

FIRST-TIME DATA SYNC
--------------------
1. Put all files in the same GitHub repository/folder.
2. Open admin.html from your deployed site.
3. Choose ALL PRODUCT MASTER.xlsx.
4. Click "Sync Excel -> Supabase".
5. Wait until Products and Parties both show DONE.
6. Open index.html and click Refresh Data.

NORMAL DAILY USE
----------------
- Select Party Master party.
- Use Group or Universal Search.
- @group works: @kbx KX525, @luman lamp, @kbx.
- QTY defaults to 1 and can be typed manually.
- Cart keeps exact add order, not alphabetical order.
- New cart item auto-scrolls into view.
- Stock shown is Supabase live stock when available.
- Stock 0 or negative is shown RED.
- Negative stock ordering is allowed.
- Punch Order & Download Excel calls punch_order() first.
- Only after successful backend punch does it download CODE + QTY Excel.
- Order history can be filtered by Party + Date.

UPDATING MASTER / STOCK LATER
-----------------------------
1. Update Product Master / Stock / Party Master in Excel.
2. Replace ALL PRODUCT MASTER.xlsx in GitHub with the updated file.
3. Open admin.html and run Sync again.
4. Product codes are upserted. New products are added.
5. Excel Stock overwrites current Supabase stock at master-sync time.
6. After that, each punched order deducts from Supabase live stock.

IMPORTANT STOCK RULE
--------------------
Do NOT run master stock sync casually during live ordering unless the Excel Stock
is intentionally the new physical stock baseline. A stock sync overwrites live stock.

SECURITY
--------
Your current SQL setup grants sync_products and sync_parties to anon. That is okay
for a private/prototype rollout, but anyone who knows the RPC can technically call it.
Do not publicly expose admin.html long-term without Supabase Auth / admin restriction.
SECURITY_UPGRADE.sql contains the starting hardening steps.

GITHUB PAGES
------------
Keep index.html, admin.html, config.js, and ALL PRODUCT MASTER.xlsx in the same folder.
For GitHub Pages, index.html opens as the website root automatically.

FAST PARTY SEARCH UPDATE
------------------------
The main page no longer downloads all Party Master names at startup.
Party search is server-side: type at least 2 letters and only matching parties are fetched from Supabase.
For best search speed, run PERFORMANCE_UPGRADE.sql once in Supabase SQL Editor.
This update also avoids rendering the huge native Party <select>, which caused browser lag/black dropdown overlays.
