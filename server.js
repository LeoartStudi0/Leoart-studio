'use strict';
// Node.js 20+; no third-party packages required. Store bookings outside public folder.
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const ROOT=__dirname, DB=path.join(ROOT,'..','booking-data.json');
const PORT=Number(process.env.PORT||3000);
// Optional Square-hosted checkout links. Create one per class in Square Dashboard.
// IMPORTANT: payment completion is not automatically verified or reconciled here.
// Square links must charge the deposit per attendee (ATC club: full $5 cover).
// IMPORTANT: A fixed-price link cannot safely calculate multi-seat totals. Staff must verify
// the amount paid against depositDueCents; use Square's API for automatic exact totals.
const PAYMENT_LINKS={
 'paint-sip':process.env.SQUARE_LINK_PAINT_SIP||'',
 'trading-cards':process.env.SQUARE_LINK_TRADING_CARDS||'',
 'resin':process.env.SQUARE_LINK_RESIN||'',
 'parent-kid':process.env.SQUARE_LINK_PARENT_KID||'',
 'junk-journal':process.env.SQUARE_LINK_JUNK_JOURNAL||''
};
function paymentUrl(id){const raw=PAYMENT_LINKS[id];if(!raw)return null;try{const u=new URL(raw);return u.protocol==='https:' && (u.hostname==='square.link'||u.hostname==='checkout.square.site')?u.href:null;}catch{return null;}}

const CLASSES={
 'paint-sip':{name:'Paint & Sip',capacity:25,priceCents:3000,depositCents:1000,day:2,time:'5:00–6:30 PM'},
 'trading-cards':{name:'Artist Trading Card Club',capacity:null,priceCents:500,depositCents:500,day:3,time:'Time TBD'},
 'resin':{name:'Resin Stained Glass',capacity:12,priceCents:4000,depositCents:1500,day:5,time:'5:30–8:30 PM',alternating:true},
 'parent-kid':{name:'Parent + Kid Art',capacity:25,priceCents:5000,depositCents:2000,day:6,time:'12:00–2:00 PM'},
 'junk-journal':{name:'Junk Journal',capacity:25,priceCents:2500,depositCents:1000,day:5,time:'6:00–7:00 PM',alternating:true}
};
// IMPORTANT: Set RESIN_FIRST_FRIDAY to a confirmed Friday YYYY-MM-DD. Junk Journal runs opposite Fridays.
const ANCHOR=process.env.RESIN_FIRST_FRIDAY||'2026-12-04';
function dateUTC(str){if(!/^\d{4}-\d{2}-\d{2}$/.test(str))return null;const d=new Date(str+'T12:00:00Z');return Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==str?null:d;}
const anchor=dateUTC(ANCHOR);if(anchor&&anchor.getUTCDay()!==5)throw Error('RESIN_FIRST_FRIDAY must be a Friday');
function validDate(id,str){const d=dateUTC(str),c=CLASSES[id];if(!c||!d||d.getUTCDay()!==c.day)return false;const now=new Date(),today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),12));if(d<today)return false;if(id==='trading-cards'){const n=Math.floor((d.getUTCDate()-1)/7)+1;return n===3;}if(c.alternating){if(!anchor)return false;const weeks=Math.round((d-anchor)/604800000);return id==='resin'?weeks%2===0:weeks%2!==0;}return true;}
function load(){try{return JSON.parse(fs.readFileSync(DB,'utf8'))}catch(e){if(e.code==='ENOENT')return [];throw e;}}
function save(data){const tmp=DB+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2),{mode:0o600});fs.renameSync(tmp,DB);}
function used(data,id,date){return data.filter(x=>x.status!=='cancelled'&&x.classId===id&&x.date===date).reduce((sum,x)=>sum+x.seats,0)}
function sessions(id){const c=CLASSES[id];if(!c)return null;const now=new Date(),out=[];for(let i=0;i<110;i++){const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+i,12)),str=d.toISOString().slice(0,10);if(validDate(id,str)){const count=used(load(),id,str),remaining=c.capacity===null?null:Math.max(0,c.capacity-count);out.push({date:str,label:new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(d)+' · '+c.time,remaining});if(out.length>=12)break;}}return out;}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
// The deadline is 48 hours before the class start in the studio's Utah timezone.
// Times below are local wall-clock times; dates in this calendar are winter (MST, UTC-7).
const START_HOUR={'paint-sip':[17,0],'resin':[17,30],'parent-kid':[12,0],'junk-journal':[18,0]};
function deadlineFor(booking){
 const parts=START_HOUR[booking.classId];if(!parts)return null; // Trading Card Club start time not yet announced.
 const [h,m]=parts;
 const start=new Date(booking.date+'T'+String(h+7).padStart(2,'0')+':'+String(m).padStart(2,'0')+':00Z');
 return new Date(start.getTime()-48*3600000);
}
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(req.method==='GET'&&url.pathname==='/api/sessions'){const id=url.searchParams.get('classId');const s=sessions(id);return json(res,s?200:404,s?{sessions:s}:{error:'Unknown class'});}
if(req.method==='GET'&&url.pathname==='/api/calendar'){
 const month=url.searchParams.get('month');
 if(!['2026-12','2027-01','2027-02'].includes(month))return json(res,400,{error:'Unsupported month'});
 const [y,m]=month.split('-').map(Number), days=new Date(Date.UTC(y,m,0)).getUTCDate(),events=[];
 const records=load();
 for(let day=1;day<=days;day++){
   const date=month+'-'+String(day).padStart(2,'0'),d=dateUTC(date);
   for(const id of Object.keys(CLASSES)){
     if(!validDate(id,date))continue;
     const c=CLASSES[id],remaining=c.capacity===null?null:Math.max(0,c.capacity-used(records,id,date));
     events.push({date,classId:id,name:c.name,time:c.time,remaining});
   }
 }
 return json(res,200,{month,events,fridayRotationConfirmed:!!anchor});
}
if(req.method==='POST'&&url.pathname==='/api/cancel'){
 let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>5000)req.destroy()});
 req.on('end',()=>{try{
  const x=JSON.parse(raw);
  if(typeof x.reference!=='string'||typeof x.email!=='string')return json(res,400,{error:'Enter a valid booking reference and email.'});
  const data=load(),b=data.find(v=>v.reference===x.reference.trim().toUpperCase()&&v.email.toLowerCase()===x.email.trim().toLowerCase());
  if(!b)return json(res,404,{error:'No matching reservation was found. Please check the reference and email.'});
  if(b.status==='cancelled')return json(res,409,{error:'This reservation has already been cancelled.'});
  const deadline=deadlineFor(b);
  if(!deadline)return json(res,409,{error:'The club start time has not been confirmed. Please contact the studio to cancel or arrange a voucher.'});
  const now=new Date();if(now>=new Date(deadline.getTime()+48*3600000))return json(res,409,{error:'This class has already started. Please contact the studio.'});
  const eligible=now<=deadline;
  b.status='cancelled';b.cancelledAt=now.toISOString();b.voucherStatus=eligible?'pending_payment_verification':'not_eligible_late_cancellation';
  b.voucherAmountCents=null; // Must be set by staff after reconciling all Square and in-studio payments.
  b.voucherCode=eligible?'LEO-'+crypto.randomBytes(6).toString('hex').toUpperCase():null;
  // Twelve calendar months from cancellation, preserving local calendar day when possible.
  const expires=new Date(now); const targetMonth=expires.getUTCMonth()+12;
  expires.setUTCDate(1);expires.setUTCMonth(targetMonth);
  const lastDay=new Date(Date.UTC(expires.getUTCFullYear(),expires.getUTCMonth()+1,0)).getUTCDate();
  expires.setUTCDate(Math.min(now.getUTCDate(),lastDay));
  b.voucherExpiresAt=eligible?expires.toISOString():null;
  save(data);
  return json(res,200,{cancelled:true,eligible,voucherCode:eligible?b.voucherCode:null,voucherStatus:b.voucherStatus,voucherExpiresAt:b.voucherExpiresAt,message:eligible?'Your reservation is cancelled. After the studio verifies all payments received for this reservation (deposit and any additional balance), it can issue a voucher for the entire verified amount paid toward future classes. The code is pending staff activation and expires 12 months after the cancellation date. Any unused verified credit remains available until expiration.':'Your reservation is cancelled. This was within 48 hours of class start, so no voucher is issued under the proposed policy.'});
 }catch(e){return json(res,400,{error:'Unable to process cancellation.'});}});return;
}
if(req.method==='POST'&&url.pathname==='/api/bookings'){let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>10000)req.destroy()});req.on('end',()=>{try{const x=JSON.parse(raw),c=CLASSES[x.classId];if(!c||!validDate(x.classId,x.date))return json(res,400,{error:'Please select a valid available class date.'});if(typeof x.name!=='string'||!x.name.trim()||x.name.length>100||typeof x.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)||x.email.length>200||!Number.isInteger(x.seats)||x.seats<1||x.seats>25)return json(res,400,{error:'Please check your name, email and seat count (1–25).'});const data=load();if(c.capacity!==null&&used(data,x.classId,x.date)+x.seats>c.capacity)return json(res,409,{error:'Not enough seats remain for this date. Please choose fewer seats or another date.'});const reference=crypto.randomBytes(5).toString('hex').toUpperCase();data.push({reference,classId:x.classId,date:x.date,name:x.name.trim(),email:x.email.trim(),seats:x.seats,priceCents:c.priceCents,depositCents:c.depositCents,totalCents:c.priceCents*x.seats,depositDueCents:c.depositCents*x.seats,balanceCents:(c.priceCents-c.depositCents)*x.seats,status:'pending_deposit',createdAt:new Date().toISOString()});save(data);json(res,201,{reference,priceCents:c.priceCents,totalCents:c.priceCents*x.seats,depositDueCents:c.depositCents*x.seats,balanceCents:(c.priceCents-c.depositCents)*x.seats,paymentUrl:paymentUrl(x.classId),paymentStatus:'deposit_pending_manual_verification',balancePaymentOptions:['online','in_studio']});}catch(e){json(res,400,{error:'Could not process this booking.'});}});return;}
if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});const rel=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const file=path.resolve(ROOT,'.'+rel);if(!file.startsWith(ROOT+path.sep))return json(res,403,{error:'Forbidden'});fs.stat(file,(err,stat)=>{if(err||!stat.isFile())return json(res,404,{error:'Not found'});res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);});});
server.listen(PORT,()=>console.log(`Leo.art running at http://localhost:${PORT}`));
