RAJ ORDER PUNCH - GITHUB READY
================================

Files to upload in the SAME GitHub repository/folder:
1. Raj_Order_Punch.html  (you may rename this to index.html for GitHub Pages)
2. ALL PRODUCT MASTER.xlsx

How it works
------------
- The webpage reads ALL PRODUCT MASTER.xlsx directly from the same folder.
- Universal Search searches the complete product data.
- Group is dynamically derived from GrpName.
  Examples: Appolo-Car -> Group Appolo, Ask-Cv -> Group Ask, Kbx-H -> Group Kbx.
- Sub Group keeps the original GrpName values from Excel.
- Cart quantities are saved in the browser using localStorage.
- Download Excel exports ONLY CODE and QTY.
- Sync Data re-downloads the Excel with cache-busting, so a replaced Excel can be reloaded without changing HTML.

Updating product data
---------------------
1. Keep the Excel filename EXACTLY: ALL PRODUCT MASTER.xlsx
2. Add/modify rows in the Excel.
3. Replace/upload the Excel in the same GitHub folder.
4. Open/refresh the deployed page and click Sync Data.
5. New Groups/Sub Groups are built automatically from the latest GrpName values.

GitHub Pages
------------
Recommended: rename Raj_Order_Punch.html to index.html before upload.
Then enable GitHub Pages for the branch/folder containing both files.

Important
---------
The HTML uses the official SheetJS browser library from:
https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js
Internet access is therefore required for Excel reading/export.
If you open the HTML directly from your computer (file://), browser security may block automatic Excel fetch. In that case the Sync Data button opens a file picker and you can select the Excel manually.


UPDATED UI NOTES
- Sub Group filter removed.
- Group filter appears first; Universal Search appears second.
- Product quantity defaults to 1, supports +/- and direct manual typing.
- Main groups are normalized dynamically (for example KBX variants => KBX; Luman variants => Luman).
