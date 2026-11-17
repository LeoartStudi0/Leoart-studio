'use strict';
// Public booking is handled by Square. The displayed calendar is informational only.
const SQUARE_URL='https://app.squareup.com/appointments/book/zdpi3f3oegt2z6/LQR8EGEP7BJPE/start';
const nav=document.querySelector('#main-nav');
const menu=document.querySelector('.menu-toggle');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{const selected=button.dataset.filter;document.querySelectorAll('.filter').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});document.querySelectorAll('.course').forEach(course=>{course.hidden=selected!=='all'&&!(course.dataset.category||'').split(/\s+/).includes(selected)})}));
document.querySelectorAll('img[data-fallback]').forEach(img=>img.addEventListener('error',()=>{const p=document.createElement('div');p.className=(img.className||'')+' image-placeholder';p.textContent=img.dataset.fallback;p.setAttribute('role','img');p.setAttribute('aria-label',img.alt);img.replaceWith(p)},{once:true}));
document.querySelectorAll('.book-trigger').forEach(button=>button.addEventListener('click',()=>window.open(SQUARE_URL,'_blank','noopener,noreferrer')));
const tabs=[...document.querySelectorAll('.calendar-month')],grid=document.querySelector('#calendar-grid'),title=document.querySelector('#calendar-title'),notice=document.querySelector('#calendar-notice');
const eventInfo={
 'paint-sip':{label:'Paint & Sip',time:'5:00–6:30 PM'},
 'trading-cards':{label:'ATC Club',time:'Time TBD'},
 'parent-kid':{label:'Parent + Kid',time:'12:00–2:00 PM'},
 'resin':{label:'Resin Glass',time:'5:30–8:30 PM'},
 'junk-journal':{label:'Junk Journal',time:'6:00–7:00 PM'}
};
function eventsForDate(date){const d=new Date(date+'T12:00:00Z'),day=d.getUTCDay(),out=[];if(day===2)out.push('paint-sip');if(day===6)out.push('parent-kid');if(day===3&&Math.floor((d.getUTCDate()-1)/7)===2)out.push('trading-cards');if(day===5){const anchor=Date.UTC(2026,11,4),weeks=Math.round((d.getTime()-anchor)/604800000);if(weeks>=0)out.push(weeks%2===0?'resin':'junk-journal')}return out}
function renderCalendar(month){if(!grid||!title)return;const [year,m]=month.split('-').map(Number),first=new Date(Date.UTC(year,m-1,1));title.textContent=first.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});tabs.forEach(b=>{b.classList.toggle('active',b.dataset.month===month);b.setAttribute('aria-pressed',String(b.dataset.month===month))});grid.replaceChildren();['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(x=>{const el=document.createElement('div');el.className='calendar-weekday';el.textContent=x;grid.append(el)});for(let i=0;i<first.getUTCDay();i++){const blank=document.createElement('div');blank.className='calendar-day empty';blank.setAttribute('aria-hidden','true');grid.append(blank)}
const count=new Date(Date.UTC(year,m,0)).getUTCDate();for(let day=1;day<=count;day++){const cell=document.createElement('div');cell.className='calendar-day';const n=document.createElement('strong');n.textContent=String(day);cell.append(n);const date=month+'-'+String(day).padStart(2,'0');for(const id of eventsForDate(date)){const info=eventInfo[id],b=document.createElement('button');b.type='button';b.className='calendar-event event-'+id;b.textContent=info.label;b.title=info.label+' · '+info.time+' · Book through Square';b.setAttribute('aria-label',info.label+', '+date+', '+info.time+'. Open Square booking.');b.addEventListener('click',()=>window.open(SQUARE_URL,'_blank','noopener,noreferrer'));cell.append(b)}grid.append(cell)}if(notice)notice.textContent='December 2026–February 2027 recurring class schedule. Resin begins December 4; Junk Journal begins December 11. Check Square to confirm availability and complete a booking.'}
tabs.forEach(b=>b.addEventListener('click',()=>renderCalendar(b.dataset.month)));renderCalendar('2026-12');
// GitHub Pages cannot operate the legacy server-side cancellation form.
// Requests are handled directly by the studio/Square until a dedicated backend is deployed.
const cancelForm=document.querySelector('#cancel-form');if(cancelForm){const p=document.createElement('p');p.textContent='To cancel or request studio credit, contact Leo.art directly with your Square confirmation. The studio verifies payments and applies the 48-hour policy manually.';cancelForm.replaceWith(p)}
const bookingDialog=document.querySelector('#booking-dialog');bookingDialog?.remove();
