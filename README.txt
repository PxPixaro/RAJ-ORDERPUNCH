RAJ ORDER PUNCH - GOOGLE SHEETS TEMPORARY BACKEND

FILES
- index.html: Main Order Punch GUI
- admin.html: Excel -> Google Sheet master sync
- config.js: Paste Apps Script Web App URL here
- Code.gs: Paste into Google Apps Script
- ALL PRODUCT MASTER.xlsx: Current master file

ONE-TIME SETUP
1. Create a blank Google Sheet named: Raj Order Punch Database
2. In the Sheet: Extensions -> Apps Script
3. Delete default code and paste all Code.gs content. Save.
4. In Apps Script, select function setupDatabase and click Run once. Approve Google permissions.
5. Deploy -> New deployment -> Select type: Web app.
   Execute as: Me
   Who has access: Anyone
   Deploy. Copy the /exec Web App URL.
6. Open config.js and paste that URL in APPS_SCRIPT_URL.
7. Upload index.html, admin.html, config.js and ALL PRODUCT MASTER.xlsx to GitHub Pages repo root.
8. Open /admin.html -> choose Excel -> Test Google Backend -> Fresh Sync.
9. After SYNC COMPLETE, open index.html. Type 2+ letters in Party Master.

HOW STOCK WORKS
- Fresh Sync sets Google Sheet Products.Stock to the Stock values from Excel.
- Punch Order uses Apps Script LockService so simultaneous users are serialized.
- Stock can go below zero; negative/zero stock is shown red.
- Every punch writes Orders, OrderItems, and StockMovements.
- Other PCs receive stock changes automatically every ~60 seconds, or immediately with Refresh Data.

IMPORTANT
- This is a temporary/internal backend. The Apps Script Web App is publicly callable if someone knows its URL. Do not put passwords/secrets in config.js.
- Do NOT run Fresh Sync casually during active ordering because it replaces live stock with Excel Stock. Use Fresh Sync only when you intentionally want Excel stock to become the new baseline.
- If you edit Code.gs later, create/update a deployment so the Web App serves the latest version.
