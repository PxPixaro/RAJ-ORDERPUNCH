/**
 * RAJ ORDER PUNCH - Google Sheets backend
 * Bind this script to the "Raj Order Punch Database" Google Sheet.
 * Run setupDatabase() once, then Deploy > New deployment > Web app.
 * Execute as: Me. Who has access: Anyone.
 */

const SHEETS = {
  PRODUCTS: 'Products', PARTIES: 'Parties', ORDERS: 'Orders',
  ITEMS: 'OrderItems', MOVES: 'StockMovements', SETTINGS: 'Settings'
};
const PRODUCT_HEADERS = ['Document','GrpName','Code','Name','Unit','HSNCode','GST','MRP','HO_Rate','Stock'];
const PARTY_HEADERS = ['Party ID','Party Name'];
const ORDER_HEADERS = ['Order ID','Party ID','Party Name','Order Date','Created At','Item Count','Total Qty'];
const ITEM_HEADERS = ['Order ID','Line No','Product Code','Product Name','Qty','Stock Before','Stock After'];
const MOVE_HEADERS = ['Timestamp','Order ID','Product Code','Qty','Stock Before','Stock After'];
const SETTINGS_HEADERS = ['Key','Value'];

function setupDatabase(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error('Open this Apps Script from the Raj Order Punch Database Google Sheet.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  ensureSheet_(ss,SHEETS.PRODUCTS,PRODUCT_HEADERS);
  ensureSheet_(ss,SHEETS.PARTIES,PARTY_HEADERS);
  ensureSheet_(ss,SHEETS.ORDERS,ORDER_HEADERS);
  ensureSheet_(ss,SHEETS.ITEMS,ITEM_HEADERS);
  ensureSheet_(ss,SHEETS.MOVES,MOVE_HEADERS);
  ensureSheet_(ss,SHEETS.SETTINGS,SETTINGS_HEADERS);
  setSetting_('setup_at',new Date().toISOString());
  return 'READY - Database sheets created.';
}

function doGet(e){
  let res;
  try{res=handleGet_(e||{parameter:{}})}catch(err){res={ok:false,error:String(err&&err.message||err)}}
  const cb=String((e&&e.parameter&&e.parameter.callback)||'').replace(/[^A-Za-z0-9_$]/g,'');
  if(cb){
    const body=cb+'('+safeJson_(res)+');';
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(safeJson_(res)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  const requestId=String((e&&e.parameter&&e.parameter.requestId)||'');
  let res;
  try{
    const action=String((e&&e.parameter&&e.parameter.action)||'');
    const payload=JSON.parse(String((e&&e.parameter&&e.parameter.payload)||'{}'));
    res=handlePost_(action,payload);
  }catch(err){res={ok:false,error:String(err&&err.message||err)}}
  const msg=safeJson_({source:'RAJ_GAS',requestId:requestId,response:res});
  return HtmlService.createHtmlOutput('<!doctype html><html><body><script>window.parent.postMessage('+msg+',"*");<\/script></body></html>');
}

function handleGet_(e){
  const p=e.parameter||{}, action=String(p.action||'health');
  if(action==='health') return health_();
  if(action==='partySearch') return partySearch_(String(p.q||''),Number(p.limit||30));
  if(action==='allStocks') return allStocks_();
  if(action==='stockChanges') return stockChanges_(String(p.since||''));
  if(action==='history') return history_(String(p.partyId||''),String(p.date||''));
  throw new Error('Unknown GET action: '+action);
}

function handlePost_(action,p){
  if(action==='beginSync') return beginSync_(p);
  if(action==='syncProducts') return syncProducts_(p);
  if(action==='syncParties') return syncParties_(p);
  if(action==='finishSync') return finishSync_(p);
  if(action==='punchOrder') return punchOrder_(p);
  throw new Error('Unknown POST action: '+action);
}

function ss_(){
  const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id) throw new Error('Run setupDatabase() once from Apps Script editor first.');
  return SpreadsheetApp.openById(id);
}
function ensureSheet_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getMaxColumns()<headers.length)sh.insertColumnsAfter(sh.getMaxColumns(),headers.length-sh.getMaxColumns());sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');sh.setFrozenRows(1);return sh}
function sh_(name){const sh=ss_().getSheetByName(name);if(!sh)throw new Error('Missing sheet '+name+'. Run setupDatabase().');return sh}
function safeJson_(o){return JSON.stringify(o).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')}
function setSetting_(k,v){const sh=sh_(SHEETS.SETTINGS),last=sh.getLastRow();if(last>=2){const vals=sh.getRange(2,1,last-1,2).getValues();for(let i=0;i<vals.length;i++){if(String(vals[i][0])===k){sh.getRange(i+2,2).setValue(v);return}}}sh.appendRow([k,v])}
function partyId_(name){const b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(name).trim().toUpperCase(),Utilities.Charset.UTF_8);return 'P_'+b.slice(0,10).map(x=>(x+256).toString(16).slice(-2)).join('')}
function isoNow_(){return new Date().toISOString()}
function dateLocal_(){return Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Kolkata','yyyy-MM-dd')}

function health_(){const ss=ss_();return {ok:true,name:ss.getName(),productRows:Math.max(0,sh_(SHEETS.PRODUCTS).getLastRow()-1),partyRows:Math.max(0,sh_(SHEETS.PARTIES).getLastRow()-1),serverTime:isoNow_()}}
function beginSync_(p){
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{
    const ss=ss_();[[SHEETS.PRODUCTS,PRODUCT_HEADERS],[SHEETS.PARTIES,PARTY_HEADERS]].forEach(([n,h])=>{const sh=ensureSheet_(ss,n,h);if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getMaxColumns()).clearContent()});
    setSetting_('sync_started_at',isoNow_());setSetting_('expected_products',Number(p.productCount||0));setSetting_('expected_parties',Number(p.partyCount||0));
    return {ok:true,message:'Fresh sync started'};
  }finally{lock.releaseLock()}
}
function syncProducts_(p){const rows=Array.isArray(p.rows)?p.rows:[],offset=Math.max(0,Number(p.offset||0));if(!rows.length)return{ok:true,written:0};const vals=rows.map(r=>PRODUCT_HEADERS.map(h=>h==='Stock'?Number(r[h]||0):String(r[h]??'')));const sh=sh_(SHEETS.PRODUCTS);sh.getRange(offset+2,1,vals.length,PRODUCT_HEADERS.length).setValues(vals);return{ok:true,written:vals.length,next:offset+vals.length}}
function syncParties_(p){const names=Array.isArray(p.rows)?p.rows:[],offset=Math.max(0,Number(p.offset||0));if(!names.length)return{ok:true,written:0};const vals=names.map(x=>{const n=String(typeof x==='string'?x:(x.party_name||x['Party Name']||'')).trim();return[partyId_(n),n]}).filter(r=>r[1]);const sh=sh_(SHEETS.PARTIES);if(vals.length)sh.getRange(offset+2,1,vals.length,2).setValues(vals);return{ok:true,written:vals.length,next:offset+vals.length}}
function finishSync_(p){setSetting_('sync_finished_at',isoNow_());setSetting_('product_count',Number(p.productCount||0));setSetting_('party_count',Number(p.partyCount||0));SpreadsheetApp.flush();return health_()}

function partySearch_(q,limit){q=String(q||'').trim().toLowerCase();limit=Math.min(50,Math.max(1,limit||30));if(q.length<2)return{ok:true,parties:[]};const sh=sh_(SHEETS.PARTIES),n=sh.getLastRow()-1;if(n<=0)return{ok:true,parties:[]};const vals=sh.getRange(2,1,n,2).getDisplayValues(),starts=[],contains=[];for(const r of vals){const name=String(r[1]||''),low=name.toLowerCase();if(low.startsWith(q))starts.push({id:r[0],party_name:name});else if(low.includes(q))contains.push({id:r[0],party_name:name});if(starts.length>=limit)break}const out=starts.concat(contains).slice(0,limit);return{ok:true,parties:out}}
function allStocks_(){const sh=sh_(SHEETS.PRODUCTS),n=sh.getLastRow()-1;if(n<=0)return{ok:true,stocks:[],serverTime:isoNow_()};const codes=sh.getRange(2,3,n,1).getDisplayValues(),stocks=sh.getRange(2,10,n,1).getValues();const out=[];for(let i=0;i<n;i++){const c=String(codes[i][0]||'').trim();if(c)out.push({code:c,stock:Number(stocks[i][0]||0)})}return{ok:true,stocks:out,serverTime:isoNow_()}}
function stockChanges_(since){const t=Date.parse(since||'');if(!isFinite(t))return{ok:true,changes:[],serverTime:isoNow_()};const sh=sh_(SHEETS.MOVES),n=sh.getLastRow()-1;if(n<=0)return{ok:true,changes:[],serverTime:isoNow_()};const vals=sh.getRange(2,1,n,6).getValues(),m={};for(const r of vals){const ts=r[0] instanceof Date?r[0].getTime():Date.parse(r[0]);if(ts>t)m[String(r[2])]=Number(r[5]||0)}return{ok:true,changes:Object.keys(m).map(code=>({code,stock:m[code]})),serverTime:isoNow_()}}

function punchOrder_(p){
  const partyId=String(p.partyId||''),partyName=String(p.partyName||'').trim(),items=Array.isArray(p.items)?p.items:[];
  if(!partyId||!partyName)throw new Error('Party is required');if(!items.length)throw new Error('Cart is empty');
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{
    const psh=sh_(SHEETS.PRODUCTS),n=psh.getLastRow()-1;if(n<=0)throw new Error('Products sheet is empty. Run Admin Sync.');
    const codes=psh.getRange(2,3,n,1).getDisplayValues(),names=psh.getRange(2,4,n,1).getDisplayValues(),stocks=psh.getRange(2,10,n,1).getValues(),idx={};for(let i=0;i<n;i++){const c=String(codes[i][0]||'').trim();if(c)idx[c]=i}
    const orderId=Utilities.getUuid(),now=new Date(),orderDate=Utilities.formatDate(now,Session.getScriptTimeZone()||'Asia/Kolkata','yyyy-MM-dd'),itemRows=[],moveRows=[],stockOut=[];let totalQty=0;
    for(let j=0;j<items.length;j++){
      const code=String(items[j].code||'').trim(),qty=Math.max(1,Math.floor(Number(items[j].qty)||1)),i=idx[code];if(i===undefined)throw new Error('Product code not found: '+code);
      const before=Number(stocks[i][0]||0),after=before-qty;stocks[i][0]=after;totalQty+=qty;psh.getRange(i+2,10).setValue(after);
      itemRows.push([orderId,j+1,code,String(names[i][0]||''),qty,before,after]);moveRows.push([now,orderId,code,qty,before,after]);stockOut.push({code:code,stock:after});
    }
    sh_(SHEETS.ORDERS).appendRow([orderId,partyId,partyName,orderDate,now,items.length,totalQty]);
    if(itemRows.length)sh_(SHEETS.ITEMS).getRange(sh_(SHEETS.ITEMS).getLastRow()+1,1,itemRows.length,ITEM_HEADERS.length).setValues(itemRows);
    if(moveRows.length)sh_(SHEETS.MOVES).getRange(sh_(SHEETS.MOVES).getLastRow()+1,1,moveRows.length,MOVE_HEADERS.length).setValues(moveRows);
    SpreadsheetApp.flush();return{ok:true,orderId:orderId,stocks:stockOut,serverTime:isoNow_()};
  }finally{lock.releaseLock()}
}

function history_(partyId,date){
  if(!partyId||!date)return{ok:true,orders:[]};const osh=sh_(SHEETS.ORDERS),on=osh.getLastRow()-1;if(on<=0)return{ok:true,orders:[]};const ovals=osh.getRange(2,1,on,7).getValues(),orders=[],ids={};
  for(const r of ovals){if(String(r[1])===partyId&&String(r[3])===date){const o={id:String(r[0]),order_date:String(r[3]),created_at:(r[4] instanceof Date?r[4].toISOString():String(r[4])),items:[]};orders.push(o);ids[o.id]=o}}
  if(!orders.length)return{ok:true,orders:[]};const ish=sh_(SHEETS.ITEMS),inn=ish.getLastRow()-1;if(inn>0){const vals=ish.getRange(2,1,inn,7).getValues();for(const r of vals){const o=ids[String(r[0])];if(o)o.items.push({line_no:Number(r[1]),product_code:String(r[2]),product_name:String(r[3]),qty:Number(r[4]),stock_before:Number(r[5]),stock_after:Number(r[6])})}}
  orders.sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));orders.forEach(o=>o.items.sort((a,b)=>a.line_no-b.line_no));return{ok:true,orders:orders};
}
