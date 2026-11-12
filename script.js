// Square is the single checkout/booking destination. Do not create a local reservation.
const LEO_SQUARE_BOOKING_URL = 'https://app.squareup.com/appointments/book/zdpi3f3oegt2z6/LQR8EGEP7BJPE/start';
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('.book-trigger');
  if (!trigger) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.open(LEO_SQUARE_BOOKING_URL, '_blank', 'noopener,noreferrer');
}, true);
'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
menuButton?.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
}));
const filters = document.querySelectorAll('.filter');
const courses = document.querySelectorAll('.course');
filters.forEach(button => button.addEventListener('click', () => {
  const selected = button.dataset.filter;
  filters.forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  courses.forEach(course => {
    const categories = (course.dataset.category || '').split(/\s+/);
    course.hidden = selected !== 'all' && !categories.includes(selected);
  });
}));
// Missing photos get a readable visual placeholder until studio photos are added.
document.querySelectorAll('img[data-fallback]').forEach(img => {
  img.addEventListener('error', () => {
    const placeholder = document.createElement('div');
    placeholder.className = `${img.className} image-placeholder`;
    placeholder.textContent = img.dataset.fallback;
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', img.alt);
    img.replaceWith(placeholder);
  }, {once:true});
});

// Booking UI talks to the shared booking server; opening index.html directly is preview-only.
const dialog=document.querySelector('#booking-dialog');
const form=document.querySelector('#booking-form');
const dateSelect=document.querySelector('#booking-date');
const seatsInput=form.elements.seats;
const feedback=document.querySelector('#booking-feedback');
const status=document.querySelector('#seats-status');
let currentClass='';
let requestedCalendarDate='';
const labels={'paint-sip':'Paint & Sip','trading-cards':'Artist Trading Card Club','resin':'Resin Stained Glass','parent-kid':'Parent + Kid Art','junk-journal':'Junk Journal'};
const capacity={'paint-sip':25,'trading-cards':null,'resin':12,'parent-kid':25,'junk-journal':25};
const pricing={'paint-sip':[30,10],'trading-cards':[5,5],'resin':[40,15],'parent-kid':[50,20],'junk-journal':[25,10]};
const dollars=n=>'$'+n.toFixed(2);
const pricingNote=document.createElement('p');pricingNote.id='booking-price-breakdown';document.querySelector('#booking-description').after(pricingNote);
function updatePrice(){const p=pricing[currentClass];if(!p)return;const qty=Math.max(1,Number(seatsInput.value)||1);pricingNote.textContent=`${qty} seat(s): ${dollars(p[0]*qty)} total · ${dollars(p[1]*qty)} due now · ${dollars((p[0]-p[1])*qty)} balance. ${currentClass==='trading-cards'?'$5 cover paid in full.':'Deposit is non-refundable in cash; qualifying cancellations receive studio credit.'}`;}
seatsInput.addEventListener('input',updatePrice);
async function loadDates(){
  dateSelect.replaceChildren();status.textContent='Loading dates…';
  try{
    const response=await fetch('/api/sessions?classId='+encodeURIComponent(currentClass));
    if(!response.ok)throw new Error('Could not load sessions');
    const data=await response.json();
    if(!data.sessions.length){status.textContent='Dates for this class are not confirmed yet. Please check back.';dateSelect.disabled=true;form.querySelector('[type=submit]').disabled=true;return;}
    dateSelect.disabled=false;form.querySelector('[type=submit]').disabled=false;
    for(const s of data.sessions){const o=document.createElement('option');o.value=s.date;o.textContent=s.label+(s.remaining===null?' · Unlimited':` · ${s.remaining} seats left`);o.disabled=s.remaining===0;dateSelect.append(o);}
    const first=[...dateSelect.options].find(o=>!o.disabled);if(first)dateSelect.value=first.value;else form.querySelector('[type=submit]').disabled=true;
    if(requestedCalendarDate && [...dateSelect.options].some(o=>o.value===requestedCalendarDate&&!o.disabled))dateSelect.value=requestedCalendarDate;
    requestedCalendarDate='';
    updateSeats();updatePrice();
  }catch(e){status.textContent='Booking server is unavailable. Please try again later.';dateSelect.disabled=true;form.querySelector('[type=submit]').disabled=true;}
}
function updateSeats(){const option=dateSelect.selectedOptions[0];if(!option)return;const match=option.textContent.match(/ · (\d+) seats left$/);const remaining=match?Number(match[1]):null;status.textContent=remaining===null?'Unlimited spots available':`${remaining} seats remaining for this date`;seatsInput.max=remaining===null?100:Math.max(1,Math.min(remaining,25));seatsInput.value=Math.min(Number(seatsInput.value)||1,Number(seatsInput.max));updatePrice();}
dateSelect.addEventListener('change',updateSeats);
document.querySelectorAll('.book-trigger').forEach(button=>button.addEventListener('click',()=>{currentClass=button.dataset.class;requestedCalendarDate=button.dataset.date||'';form.reset();feedback.replaceChildren();form.querySelector('[type=submit]').disabled=false;document.querySelector('#booking-title').textContent=labels[currentClass];document.querySelector('#booking-description').textContent=capacity[currentClass]===null?'Open to all · No capacity limit':`Maximum ${capacity[currentClass]} attendees per session`;dialog.showModal();updatePrice();loadDates();}));
document.querySelector('#booking-close').addEventListener('click',()=>dialog.close());
form.addEventListener('submit',async e=>{e.preventDefault();feedback.replaceChildren();feedback.textContent='Saving your reservation…';const submit=form.querySelector('[type=submit]');submit.disabled=true;try{const body={classId:currentClass,date:dateSelect.value,name:form.elements.name.value,email:form.elements.email.value,seats:Number(seatsInput.value)};const response=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Booking failed');feedback.replaceChildren();
const message=document.createElement('span');message.textContent=`Booking request recorded. Reference: ${result.reference}. Payment has NOT been verified. Amount due now: ${dollars(result.depositDueCents/100)}; remaining balance: ${dollars(result.balanceCents/100)}. Contact the studio to confirm your place after paying.`;feedback.append(message);
if(result.paymentUrl){const pay=document.createElement('a');pay.href=result.paymentUrl;pay.target='_blank';pay.rel='noopener noreferrer';pay.className='button button-gold square-pay-link';pay.textContent='Pay '+dollars(result.depositDueCents/100)+' with Square ↗';feedback.append(document.createElement('br'),pay);const note=document.createElement('small');note.textContent='Square links are configured for a fixed price per attendee. For multiple seats, verify the total with the studio before paying; a single checkout may not collect the full amount. The remaining balance can be paid online through a separate studio-provided Square link or in person. Give the studio your reservation reference; payment matching and confirmation are manual.';feedback.append(document.createElement('br'),note);}
else{const note=document.createElement('small');note.textContent='The deposit payment link is not configured yet. Contact the studio; this booking request is not a paid confirmation.';feedback.append(document.createElement('br'),note);}
await loadDates();submit.disabled=true;}catch(error){feedback.textContent=error.message;submit.disabled=false;}});

// Three-month studio calendar, populated from the same server records as booking.
const monthButtons=document.querySelectorAll('.calendar-month');
const calendarGrid=document.querySelector('#calendar-grid');
const calendarTitle=document.querySelector('#calendar-title');
const calendarNotice=document.querySelector('#calendar-notice');
const calendarLabels={'paint-sip':'Paint & Sip','trading-cards':'Trading Card Club','parent-kid':'Parent + Kid','resin':'Resin Glass','junk-journal':'Junk Journal'};
async function renderCalendar(month){
  const [year,monthNum]=month.split('-').map(Number);
  const start=new Date(Date.UTC(year,monthNum-1,1));
  calendarTitle.textContent=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(start);
  monthButtons.forEach(b=>{const selected=b.dataset.month===month;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
  calendarGrid.replaceChildren();
  let data={events:[],fridayRotationConfirmed:false};
  try{const response=await fetch('/api/calendar?month='+month);if(!response.ok)throw Error();data=await response.json();calendarNotice.textContent=data.fridayRotationConfirmed?'Select a class date to book. Availability is updated when you open the reservation form.':'Friday rotation not confirmed: Resin Stained Glass and Junk Journal dates are shown as pending until the studio confirms which Friday begins the rotation.';}
  catch(e){calendarNotice.textContent='Calendar booking data unavailable. Start the website server with node server.js to view live dates and book.';}
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for(const day of days){const label=document.createElement('div');label.className='calendar-weekday';label.textContent=day;calendarGrid.append(label);}
  const offset=start.getUTCDay();
  for(let i=0;i<offset;i++){const blank=document.createElement('div');blank.className='calendar-day empty';blank.setAttribute('aria-hidden','true');calendarGrid.append(blank);}
  const count=new Date(Date.UTC(year,monthNum,0)).getUTCDate();
  for(let day=1;day<=count;day++){
    const date=month+'-'+String(day).padStart(2,'0');
    const cell=document.createElement('div');cell.className='calendar-day';
    const number=document.createElement('strong');number.textContent=String(day);cell.append(number);
    const events=data.events.filter(event=>event.date===date);
    for(const event of events){
      const button=document.createElement('button');button.type='button';button.className='calendar-event event-'+event.classId;
      button.textContent=calendarLabels[event.classId]+' · '+(event.remaining===null?'Open':event.remaining===0?'Full':event.remaining+' left');
      button.title=event.name+' · '+event.time;button.disabled=event.remaining===0;
      button.addEventListener('click',()=>{const trigger=document.querySelector('.book-trigger[data-class="'+event.classId+'"]');if(trigger){trigger.dataset.date=date;trigger.click();delete trigger.dataset.date;}});
      cell.append(button);
    }
    const weekday=new Date(date+'T12:00:00Z').getUTCDay();
    if(weekday===5&&!data.fridayRotationConfirmed){const pending=document.createElement('span');pending.className='calendar-pending';pending.textContent='Friday workshop · TBD';cell.append(pending);}
    calendarGrid.append(cell);
  }
}
monthButtons.forEach(button=>button.addEventListener('click',()=>renderCalendar(button.dataset.month)));
if(calendarGrid)renderCalendar('2026-12');

// Cancellation form: releases reserved seats; credit eligibility is subject to studio verification.
const cancelForm=document.querySelector('#cancel-form');
cancelForm?.addEventListener('submit',async event=>{
 event.preventDefault();const feedback=document.querySelector('#cancel-feedback');feedback.textContent='Processing cancellation…';
 const button=cancelForm.querySelector('[type=submit]');button.disabled=true;
 try{
  const response=await fetch('/api/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference:cancelForm.elements.reference.value,email:cancelForm.elements.email.value})});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Cancellation failed');
  feedback.textContent=result.message+(result.voucherCode?' Voucher reference (pending activation): '+result.voucherCode:'');
  cancelForm.reset();
  const selected=document.querySelector('.calendar-month.active');if(selected)renderCalendar(selected.dataset.month);
 }catch(error){feedback.textContent=error.message;}finally{button.disabled=false;}
});
