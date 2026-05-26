// Generate 180×180 PNG apple-touch-icon — three overlapping car silhouettes:
// BMW X5 (back, faintest) · Audi A6 (middle) · Porsche 911 (front, brightest)
(function(){
  var c=document.createElement('canvas'),ctx=c.getContext('2d');
  c.width=c.height=180;

  // Background — gradient rounded rect
  var g=ctx.createLinearGradient(0,0,0,180);
  g.addColorStop(0,'#131420');g.addColorStop(1,'#07080d');
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(38,0);ctx.lineTo(142,0);ctx.quadraticCurveTo(180,0,180,38);
  ctx.lineTo(180,142);ctx.quadraticCurveTo(180,180,142,180);
  ctx.lineTo(38,180);ctx.quadraticCurveTo(0,180,0,142);
  ctx.lineTo(0,38);ctx.quadraticCurveTo(0,0,38,0);ctx.closePath();ctx.fill();

  var gl=132; // ground line (wheel centre y)

  // ── BMW X5 — SUV, tallest roofline ───────────────
  function x5(x){
    x.beginPath();
    x.moveTo(18,gl);x.lineTo(18,112);
    x.lineTo(34,90);x.lineTo(48,67);x.lineTo(63,57);
    x.lineTo(120,57);x.lineTo(141,66);x.lineTo(156,88);
    x.lineTo(162,110);x.lineTo(162,gl);
    x.arc(130,gl,23,0,Math.PI,true);x.lineTo(73,gl);
    x.arc(50,gl,23,0,Math.PI,true);x.closePath();
  }

  // ── Audi A6 — classic 3-box sedan, trunk notch ───
  function a6(x){
    x.beginPath();
    x.moveTo(18,gl);x.lineTo(18,115);
    x.lineTo(24,106);x.lineTo(38,101); // trunk notch
    x.lineTo(51,86);x.lineTo(63,69);x.lineTo(78,63);
    x.lineTo(114,63);x.lineTo(134,70);x.lineTo(149,88);
    x.lineTo(159,111);x.lineTo(162,gl);
    x.arc(128,gl,21,0,Math.PI,true);x.lineTo(71,gl);
    x.arc(50,gl,21,0,Math.PI,true);x.closePath();
  }

  // ── Porsche 911 — fastback, rear engine hump ─────
  function p911(x){
    x.beginPath();
    x.moveTo(18,gl);x.lineTo(18,122);
    x.lineTo(27,113);x.lineTo(37,107); // rear engine hump
    x.lineTo(51,86);x.lineTo(80,73);x.lineTo(118,73);
    x.lineTo(136,80);x.lineTo(151,96);
    x.lineTo(160,113);x.lineTo(162,122);x.lineTo(162,gl);
    x.arc(128,gl,19,0,Math.PI,true);x.lineTo(71,gl);
    x.arc(50,gl,21,0,Math.PI,true); // wider rear arch
    x.closePath();
  }

  // Layer back→front with increasing opacity; overlapping areas compound brighter
  ctx.fillStyle='rgba(108,143,255,0.27)'; x5(ctx);  ctx.fill();
  ctx.fillStyle='rgba(108,143,255,0.47)'; a6(ctx);  ctx.fill();
  ctx.fillStyle='rgba(108,143,255,0.82)'; p911(ctx);ctx.fill();

  // Subtle outline on 911 to define its edges against the other layers
  ctx.strokeStyle='rgba(160,195,255,0.45)';ctx.lineWidth=1.5;
  p911(ctx);ctx.stroke();

  var png=c.toDataURL('image/png');
  var l=document.getElementById('ati');if(l)l.href=png;
  // Force favicon cache bust: remove old link, insert fresh one
  var f=document.getElementById('fav');
  if(f)f.parentNode.removeChild(f);
  var nf=document.createElement('link');
  nf.rel='icon';nf.type='image/png';nf.href=png;
  document.head.appendChild(nf);
})();

// ─── FUEL TYPES ──────────────────────────────────────────────
const FUEL_TYPES = {
  petrol: [
    {id:'p95',   cs:'Natural 95',    en:'Regular 95'},
    {id:'p95p',  cs:'Natural 95+',   en:'Premium 95+'},
    {id:'p98',   cs:'Natural 98',    en:'Super 98'},
    {id:'p100',  cs:'Natural 100',   en:'Super 100'},
  ],
  diesel: [
    {id:'d',    cs:'Diesel',            en:'Diesel'},
    {id:'dp',   cs:'Diesel Premium',    en:'Diesel Premium'},
  ],
  lpg:      [{id:'lpg', cs:'LPG',       en:'LPG'}],
  electric: [{id:'elec',cs:'Elektřina', en:'Electric (kWh)'}],
  hybrid:   [{id:'p95', cs:'Natural 95',en:'Regular 95'},{id:'elec',cs:'Elektřina',en:'Electric'}],
  phev:     [{id:'p95', cs:'Natural 95',en:'Regular 95'},{id:'elec',cs:'Elektřina',en:'Electric'}],
};

function getFuelOptions(carId) {
  const car = getCar(carId);
  const ft = car?.fuelType || 'petrol';
  const base = ft === 'hybrid' || ft === 'phev' ? [...(FUEL_TYPES.petrol), ...(FUEL_TYPES.electric)]
    : FUEL_TYPES[ft] || FUEL_TYPES.petrol;
  return base;
}

// ─── STATE ───────────────────────────────────────────────────
let state = {
  lang:'cs', currentPage:'fleet', currentCarId:null,
  editingRecordId:null, editingCarId:null, editingFuelId:null,
  editReturnPage:'fleet', openSection:'basic', wizardStep:1,
  sortField:'date', sortDir:-1, fuelSortField:'date', fuelSortDir:-1,
  filterCat:'', search:'', fuelSearch:'', carSearch:'',
  page:1, fuelPage:1, pageSize:25,
  selectedRecordId:null,
  selectedColor:'#e8c547',
  settings:{ tireReminders:true, theme:'dark' },
  analyticsCarId:null,  // null = all active | '__all__' = all incl. inactive | carId = single car
  analyticsTab:'overview', // 'overview' | 'compare'
  remindersCarId:null,   // null = all active | carId = single car
  cars:[], records:[], reminders:[], fuels:[]
};

const CATEGORIES = {
  cs:['Nákup vozidla','Administrativa','Provozní náplně','Servis a opravy','Pneumatiky a kola','Vybavení a vzhled'],
  en:['Vehicle purchase','Administration','Fluids & consumables','Service & repairs','Tyres & wheels','Equipment & appearance']
};
const CAT_COLORS = {
  'Nákup vozidla':       '#f59e0b', 'Vehicle purchase':          '#f59e0b',
  'Administrativa':      '#6366f1', 'Administration':             '#6366f1',
  'Provozní náplně':     '#22c55e', 'Fluids & consumables':       '#22c55e',
  'Servis a opravy':     '#ef4444', 'Service & repairs':          '#ef4444',
  'Pneumatiky a kola':   '#8b5cf6', 'Tyres & wheels':             '#8b5cf6',
  'Vybavení a vzhled':   '#3b82f6', 'Equipment & appearance':     '#3b82f6',
};

const FUEL_TYPE_LABELS = {
  petrol:{cs:'Benzín',en:'Petrol'}, diesel:{cs:'Diesel',en:'Diesel'}, lpg:{cs:'LPG',en:'LPG'},
  electric:{cs:'Elektro',en:'Electric'}, hybrid:{cs:'Hybrid',en:'Hybrid'}, phev:{cs:'PHEV',en:'PHEV'}
};

const T = {
  cs:{
    dashboard:'Přehled',records:'Záznamy',analytics:'Analytika',reminders:'Připomínky',fuel:'Tankování',
    total_spent:'Celkové výdaje',total_records:'Počet záznamů',cost_per_km:'Cena za km',current_odo:'Aktuální km',km_this_year:'Letos ujeto',
    recent:'Poslední záznamy',no_car:'Vyberte vozidlo',no_records:'Žádné záznamy',
    new_record:'Nový záznam',edit_record:'Upravit záznam',
    date:'Datum',odo:'Tachometr',desc:'Popis',cat:'Kategorie',qty:'Množství',unit_price:'Jedn. cena',
    total_price:'Celkem',note:'Poznámka',save:'Uložit',cancel:'Zrušit',car:'Vozidlo',
    spending_by_cat:'Výdaje podle kategorie',monthly_spending:'Měsíční výdaje',
    reminders_title:'Připomínky a termíny',stk_expires:'STK vyprší',insurance_expires:'POV vyprší',
    emission_expires:'Emise vyprší',
    oil_due:'Výměna oleje za',km_left:'km',overdue:'PROŠLÉ',due_soon:'BRZY',ok:'V pořádku',
    no_reminders:'Žádné připomínky',export_ok:'Data exportována',import_ok:'Data importována',
    confirm_delete:'Opravdu smazat tento záznam?',confirm_delete_car:'Opravdu smazat toto vozidlo a všechny jeho záznamy?',
    required_field:'Povinné pole',all_cats:'Všechny kategorie',search_placeholder:'Hledat...',
    add_reminder:'Přidat připomínku',days:'dní',
    fuel_log:'Deník tankování',liters:'Litry',price_per_liter:'Průměrná cena/l',full_tank:'Plná nádrž',
    consumption:'Spotřeba',avg_consumption:'Průměrná spotřeba',total_fueled:'Celkem natankováno',
    total_fuel_cost:'Celkem za palivo',fuel_type:'Typ paliva',
    active:'Aktivní',inactive:'Neaktivní',
    stk:'STK',emission:'Emise',pov:'POV',insurance:'Pojištění',
  },
  en:{
    dashboard:'Dashboard',records:'Records',analytics:'Analytics',reminders:'Reminders',fuel:'Fuel log',
    total_spent:'Total spent',total_records:'Total records',cost_per_km:'Cost per km',current_odo:'Odometer',km_this_year:'This year',
    recent:'Recent records',no_car:'Select a vehicle',no_records:'No records yet',
    new_record:'New record',edit_record:'Edit record',
    date:'Date',odo:'Odometer',desc:'Description',cat:'Category',qty:'Qty',unit_price:'Unit price',
    total_price:'Total',note:'Note',save:'Save',cancel:'Cancel',car:'Vehicle',
    spending_by_cat:'Spending by category',monthly_spending:'Monthly spending',
    reminders_title:'Reminders & deadlines',stk_expires:'STK expires',insurance_expires:'Insurance expires',
    emission_expires:'Emission check expires',
    oil_due:'Oil change in',km_left:'km',overdue:'OVERDUE',due_soon:'DUE SOON',ok:'OK',
    no_reminders:'No reminders',export_ok:'Data exported',import_ok:'Data imported',
    confirm_delete:'Really delete this record?',confirm_delete_car:'Really delete this vehicle and all its records?',
    required_field:'Required field',all_cats:'All categories',search_placeholder:'Search...',
    add_reminder:'Add reminder',days:'days',
    fuel_log:'Fuel log',liters:'Litres',price_per_liter:'Avg price/l',full_tank:'Full tank',
    consumption:'Consumption',avg_consumption:'Avg. consumption',total_fueled:'Total fuelled',
    total_fuel_cost:'Total fuel cost',fuel_type:'Fuel type',
    active:'Active',inactive:'Inactive',
    stk:'STK',emission:'Emissions',pov:'Liability ins.',insurance:'Insurance',
  }
};

function t(k){return T[state.lang][k]||k}
function fmtMoney(v){return new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',minimumFractionDigits:2}).format(v||0)}
function fmtDate(d){
  if(!d)return'';
  const dt=new Date(d+'T12:00:00');
  // cs-CZ locale adds spaces around dots — we remove them: "5. 9. 2024" → "5.9.2024"
  return dt.toLocaleDateString('cs-CZ').replace(/\s/g,'');
}


// ─── DATE TRIPLE INPUT HELPERS ───────────────────────────────
// Zapíše ISO datum (YYYY-MM-DD) do trojice inputů s prefixem
function setDateTriple(prefix, iso){
  const m=iso?iso.match(/^(\d{4})-(\d{2})-(\d{2})$/):null;
  document.getElementById(prefix+'-d').value=m?parseInt(m[3]):'';
  document.getElementById(prefix+'-m').value=m?parseInt(m[2]):'';
  document.getElementById(prefix+'-y').value=m?m[1]:'';
}
// Přečte trojici inputů a vrátí ISO datum nebo ''
function getDateTriple(prefix){
  const d=document.getElementById(prefix+'-d').value;
  const m=document.getElementById(prefix+'-m').value;
  const y=document.getElementById(prefix+'-y').value;
  if(!d&&!m&&!y)return'';
  if(!d||!m||!y)return null; // neúplné
  const iso=`${y.padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const dt=new Date(iso+'T12:00:00');
  return isNaN(dt.getTime())?null:iso;
}

// ── DATEPICKER LOGIC ─────────────────────────────────────────
function setupDatePickers() {
  const iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

  document.querySelectorAll('.date-triple').forEach(wrap => {
    // Prevent double init
    if (wrap.querySelector('.date-picker-btn')) return;

    // Create hidden native input
    const picker = document.createElement('input');
    picker.type = 'date';
    picker.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0;top:0;left:0;opacity:0;pointer-events:none;';
    picker.tabIndex = -1;

    // Create trigger button
    const btn = document.createElement('button');
    btn.className = 'date-picker-btn';
    btn.type = 'button';
    btn.innerHTML = iconSvg;
    btn.tabIndex = -1; // skip tab nav
    btn.title = state.lang === 'cs' ? 'Vybrat datum' : 'Pick date';

    wrap.appendChild(picker);
    wrap.appendChild(btn);

    // Button click -> open picker
    btn.onclick = (e) => {
      e.preventDefault();
      // Sync picker with current inputs before opening
      const prefix = wrap.id.replace('-wrap', '');
      const currentIso = getDateTriple(prefix);
      // If valid date, set it. If empty/invalid, default to today
      const today = new Date().toISOString().slice(0, 10);
      try {
        picker.value = currentIso || today;
      } catch (err) {
        picker.value = today;
      }

      // Position hidden input so native calendar opens ABOVE the trigger.
      // Browser opens calendar below the input by default, so we place the
      // hidden input ~300px above the trigger — calendar then lands just above it.
      const rect = wrap.getBoundingClientRect();
      const calH = 310; // approx native calendar height (px)
      const top = rect.top >= calH
        ? rect.top - calH          // enough room above → calendar appears above trigger
        : rect.bottom;             // too close to top → fall back to below
      picker.style.cssText = `position:fixed;top:${top}px;left:${rect.left}px;`
        + `width:${rect.width}px;height:0;opacity:0;pointer-events:none;z-index:9999;`;

      // Open native picker
      try {
        if (picker.showPicker) picker.showPicker();
        else picker.click();
      } catch (e) {
        picker.click();
      }
    };

    // Picker change -> update inputs
    picker.oninput = () => { // oninput fires immediately on selection in some browsers
      if (picker.value) {
        const prefix = wrap.id.replace('-wrap', '');
        setDateTriple(prefix, picker.value);
      }
    };
    picker.onchange = picker.oninput; // fallback
  });
}

// Auto-focus: po vyplnění dne skočí na měsíc, po měsíci na rok
// Guard pomocí data atributu — listener se přidá jen jednou na každý element
function initDateTripleNav(prefix){
  const dEl=document.getElementById(prefix+'-d');
  const mEl=document.getElementById(prefix+'-m');
  const yEl=document.getElementById(prefix+'-y');
  if(!dEl||!mEl||!yEl) return;
  if(dEl.dataset.navInit) return; // již inicializováno
  dEl.dataset.navInit='1';
  mEl.dataset.navInit='1';
  // inputmode: numeric klávesnice na mobilech (bez +/– šipek jako type=number)
  [dEl,mEl,yEl].forEach(el=>el.setAttribute('inputmode','numeric'));
  dEl.addEventListener('input',()=>{if(dEl.value.length>=2)mEl.focus();});
  mEl.addEventListener('input',()=>{if(mEl.value.length>=2)yEl.focus();});
}


function fmtNum(n,dec=0){return new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:dec,maximumFractionDigits:dec}).format(n||0)}
// uid: kryptograficky bezpečné s fallbackem pro starší prohlížeče
function uid(){
  try{
    if(typeof crypto!=='undefined' && crypto.randomUUID) return 'u_'+crypto.randomUUID().replace(/-/g,'');
    if(typeof crypto!=='undefined' && crypto.getRandomValues){
      const a=new Uint8Array(12);crypto.getRandomValues(a);
      return 'u_'+Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
    }
  }catch(e){}
  return '_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36);
}
// esc: HTML-escape uživatelských dat při interpolaci do innerHTML / atributů.
// Vrací prázdný řetězec pro null/undefined; všechny ostatní hodnoty stringifikuje.
const _ESC_MAP={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;','=':'&#61;'};
function esc(s){return s==null?'':String(s).replace(/[&<>"'`=]/g,c=>_ESC_MAP[c]);}
// safeId: validuje řetězec použitelný v onclick="fn('${id}')" atributu (bez uvozovek/lomítek/HTML znaků).
// Pokud ID není bezpečné, vrací prázdný řetězec — volající má fallback ošetřit.
function safeId(id){return /^[A-Za-z0-9_\-]{1,64}$/.test(id||'') ? id : '';}

// ── Car color dot helper ──────────────────────────────────────
// Barvy které potřebují ring místo glow (tmavé / nevýrazné na tmavém pozadí)
const DOT_RING_COLORS = new Set(['#7a5230','#c8956a','#e8e4d8','#2a2a2a','#aaaaaa','#888','#aaa']);
// Vrací true pokud je hex barva příliš tmavá na tmavém pozadí (luminance < ~31 %)
function _isColorDark(hex){
  const h=(hex||'').replace('#','').toLowerCase();
  if(!/^[0-9a-f]{3,6}$/.test(h)) return false;
  const f=h.length===3?h.split('').map(x=>x+x).join(''):h;
  const r=parseInt(f.slice(0,2),16),g=parseInt(f.slice(2,4),16),b=parseInt(f.slice(4,6),16);
  return (r*299+g*587+b*114)/1000 < 80;
}
function carDotClass(color){
  const c=(color||'#888').toLowerCase();
  return DOT_RING_COLORS.has(c)||_isColorDark(c)
    ? 'car-color-dot-ring' : 'car-color-dot-glow';
}
// cssClass = třída elementu (fleet-card-dot / csw-dot / car-header-dot / car-dot)
function carDotHtml(color, cssClass){
  const c = color||'#888';
  const variant = carDotClass(c);
  // --dot-color CSS proměnná umožňuje glow v barvě tečky bez inline JS
  return `<span class="${cssClass} ${variant}" style="background:${c};--dot-color:${c}"></span>`;
}

function getCar(id){return state.cars.find(c=>c.id===id)}
function getCarRecords(carId){return state.records.filter(r=>r.carId===carId)}
function getCarFuels(carId){return state.fuels.filter(f=>f.carId===carId)}
// Sdílená funkce — spotřeba metodou plné nádrže (použita v tankování i analytice)
// Segmenty kratší než MIN_SEGMENT_KM nebo s hodnotou > MAX_CONSUMPTION jsou přeskočeny
// jako chybná data (duplicitní záznam, špatně zadaný odometr apod.)
const _MIN_SEG_KM = 5;       // minimální délka segmentu v km
const _MAX_CONS   = 40;      // sanity cap l/100km — nad tím jde téměř jistě o chybu zadání
function calcConsumptions(carId){
  const allFuels=getCarFuels(carId);
  // Pouze plné nádrže s platným odometrem > 0
  const fullFuels=[...allFuels].filter(f=>f.fullTank&&f.odo>0).sort((a,b)=>a.odo-b.odo);
  const result=[];
  for(let i=1;i<fullFuels.length;i++){
    const kmDiff=fullFuels[i].odo-fullFuels[i-1].odo;
    if(kmDiff<_MIN_SEG_KM) continue; // příliš krátký segment → přeskočit
    const liters=allFuels.filter(f=>f.odo>fullFuels[i-1].odo&&f.odo<=fullFuels[i].odo)
                         .reduce((s,f)=>s+(f.liters||0),0);
    if(liters<=0) continue;
    const val=liters/kmDiff*100;
    if(val>_MAX_CONS) continue; // nesmyslně vysoká hodnota → chyba dat, přeskočit
    result.push({odo:fullFuels[i].odo,val});
  }
  return result;
}
function avgConsumptionVal(carId){
  // Vážený průměr (správná metoda plné nádrže): celkem litrů ÷ celkem km
  // mezi první a poslední plnou nádrží — odolné vůči krátkým segmentům.
  const allFuels=getCarFuels(carId);
  const fullFuels=[...allFuels].filter(f=>f.fullTank&&f.odo>0).sort((a,b)=>a.odo-b.odo);
  if(fullFuels.length<2) return 0;
  const firstOdo=fullFuels[0].odo;
  const lastOdo=fullFuels[fullFuels.length-1].odo;
  const kmTotal=lastOdo-firstOdo;
  if(kmTotal<_MIN_SEG_KM) return 0;
  const litersTotal=allFuels.filter(f=>f.odo>firstOdo&&f.odo<=lastOdo)
                            .reduce((s,f)=>s+(f.liters||0),0);
  return litersTotal>0?litersTotal/kmTotal*100:0;
}
function getMaxOdo(carId){
  const recs=getCarRecords(carId); const fuels=getCarFuels(carId);
  const all=[...(getCar(carId)?[getCar(carId).startOdo||0]:[]),...recs.map(r=>r.odo||0),...fuels.map(f=>f.odo||0)];
  return all.length?Math.max(...all):0;
}
function getTotalCost(carId){return getCarRecords(carId).reduce((s,r)=>s+(r.qty||1)*(r.price||0),0)}
function getTotalFuelCost(carId){return getCarFuels(carId).reduce((s,f)=>s+(f.cost||0),0)}
function getTotalLiters(carId){return getCarFuels(carId).reduce((s,f)=>s+(f.liters||0),0)}
function getServiceCost(carId){return getCarRecords(carId).filter(r=>r.cat!=='Nákup vozidla').reduce((s,r)=>s+(r.qty||1)*(r.price||0),0)}
function getPurchaseCost(carId){return getCarRecords(carId).filter(r=>r.cat==='Nákup vozidla').reduce((s,r)=>s+(r.qty||1)*(r.price||0),0)}
function getKmDriven(carId){const car=getCar(carId);return car?getMaxOdo(carId)-(car.startOdo||0):0}
function getKmThisYear(carId){
  const car=getCar(carId);if(!car) return 0;
  const year=new Date().getFullYear().toString();
  const allWithOdo=[
    ...getCarRecords(carId).filter(r=>r.date&&(r.odo||0)>0).map(r=>({date:r.date,odo:r.odo})),
    ...getCarFuels(carId).filter(f=>f.date&&(f.odo||0)>0).map(f=>({date:f.date,odo:f.odo})),
  ];
  const inYear=allWithOdo.filter(x=>x.date.startsWith(year)).map(x=>x.odo);
  if(!inYear.length) return 0;
  const maxInYear=Math.max(...inYear);
  const before=allWithOdo.filter(x=>x.date<year+'-01-01').map(x=>x.odo);
  const startOdo=before.length?Math.max(...before):(car.startOdo||0);
  return Math.max(0,maxInYear-startOdo);
}
function getCostPerKm(carId){
  const km=getKmDriven(carId);
  if(km<=0) return 0;
  return (getServiceCost(carId)+getTotalFuelCost(carId))/km;
}
function getFuelCostPerKm(carId){
  const km=getKmDriven(carId);
  if(km<=0) return 0;
  return getTotalFuelCost(carId)/km;
}
function getAvgPricePerLiter(carId){
  const liters=getTotalLiters(carId);
  if(liters<=0) return 0;
  return getTotalFuelCost(carId)/liters;
}

function getCatDisplay(cat){
  const li=CATEGORIES.cs.indexOf(cat); const en=CATEGORIES.en.indexOf(cat);
  if(state.lang==='cs'){if(li>=0)return cat; if(en>=0)return CATEGORIES.cs[en]; return cat;}
  else{if(en>=0)return cat; if(li>=0)return CATEGORIES.en[li]; return cat;}
}
function normalizeCat(cat){const i=CATEGORIES.en.indexOf(cat);return i>=0?CATEGORIES.cs[i]:cat}

// Mapování starých/CSV kategorií na nové
function mapCatToNew(cat){
  if(!cat) return 'Servis a opravy';
  const v = cat.trim().toLowerCase();
  // Nákup vozidla
  if(v.includes('nákup') || v.includes('vehicle purchase') || v.includes('purchase')) return 'Nákup vozidla';
  // Administrativa
  if(['pojištění','insurance','pov','stk','mot','inspection','poplatky','fees',
      'přepis','evidenč','pokuta','fine','administrative','administrativa'].some(k=>v.includes(k))) return 'Administrativa';
  // Provozní náplně
  if(['olej','oil','chladič','coolant','ostřikovač','washer','brzdová kapalina','brake fluid',
      'náplň','fluid','provozní'].some(k=>v.includes(k))) return 'Provozní náplně';
  // Pneumatiky a kola
  if(['pneumatik','tyre','tire','kol','wheel','disk','přezutí','vyvážení','geometrie','alignment'].some(k=>v.includes(k))) return 'Pneumatiky a kola';
  // Vybavení a vzhled
  if(['vybavení','equipment','koberec','carpet','roletka','autokosmetika','lak','paint',
      'interiér','interior','doplněk','accessory','karoserie','bodywork'].some(k=>v.includes(k))) return 'Vybavení a vzhled';
  // Servis a opravy — vše ostatní
  return 'Servis a opravy';
}

function fuelTypeLabel(id){
  for(const group of Object.values(FUEL_TYPES)){
    const f=group.find(x=>x.id===id);
    if(f)return state.lang==='cs'?f.cs:f.en;
  }
  return id;
}

// ─── DATA ────────────────────────────────────────────────────
// Bezpečné parsování JSON s ochranou proti prototype-pollution
// a omezením velikosti řetězců/polí (mitigace DoS).
const MAX_STR_LEN=4000;
const MAX_ARR_LEN=50000;
const FORBIDDEN_KEYS={'__proto__':1,'constructor':1,'prototype':1};
function safeJsonParse(text){
  if(typeof text!=='string') return null;
  if(text.length>20*1024*1024) throw new Error('Input too large');
  return JSON.parse(text,(k,v)=>{
    if(FORBIDDEN_KEYS[k]) return undefined;
    if(typeof v==='string'&&v.length>MAX_STR_LEN) return v.slice(0,MAX_STR_LEN);
    return v;
  });
}
function sanitizeImported(d){
  if(!d||typeof d!=='object') return {cars:[],records:[],fuels:[],reminders:[]};
  const out={
    cars:Array.isArray(d.cars)?d.cars.slice(0,MAX_ARR_LEN):[],
    records:Array.isArray(d.records)?d.records.slice(0,MAX_ARR_LEN):[],
    fuels:Array.isArray(d.fuels)?d.fuels.slice(0,MAX_ARR_LEN):[],
    reminders:Array.isArray(d.reminders)?d.reminders.slice(0,MAX_ARR_LEN):[],
  };
  // Drop entries that are not plain objects or have invalid id
  const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
  const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_\-]{1,64}$/.test(id);
  const fixId=o=>{ if(!validId(o.id)) o.id=uid(); return o; };
  out.cars=out.cars.filter(isObj).map(fixId);
  out.records=out.records.filter(isObj).map(fixId);
  out.fuels=out.fuels.filter(isObj).map(fixId);
  out.reminders=out.reminders.filter(isObj).map(fixId);
  // settings & lang — pouze pokud jsou platné typy
  if(isObj(d.settings)) out.settings=d.settings;
  if(typeof d.lang==='string'&&(d.lang==='cs'||d.lang==='en')) out.lang=d.lang;
  return out;
}
function loadData(){
  try{
    const d=localStorage.getItem('mycars_v3');
    if(d){
      const p=sanitizeImported(safeJsonParse(d));
      state.cars=p.cars;state.records=p.records;state.reminders=p.reminders;state.fuels=p.fuels;
      if(p.settings)Object.assign(state.settings,p.settings);
      if(p.lang)state.lang=p.lang;
    }
    if(state.cars.length)state.currentCarId=state.cars[0].id;
  }catch(e){console.warn('Chyba při načítání dat',e);}
  // Apply saved theme
  applyTheme();
}
function saveData(){
  try{
    localStorage.setItem('mycars_v3',JSON.stringify({cars:state.cars,records:state.records,reminders:state.reminders,fuels:state.fuels,settings:state.settings,lang:state.lang,savedAt:new Date().toISOString()}));
    return true;
  }catch(e){
    // QuotaExceededError nebo jiná storage chyba — nesmí shodit aplikaci.
    console.error('saveData failed:',e);
    const cs=state.lang==='cs';
    const isQuota=e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014);
    showToast(isQuota
      ?(cs?'Úložiště je plné — exportujte data a smažte staré záznamy':'Storage full — export data and delete old records')
      :(cs?'Chyba ukládání dat':'Data save failed'),
      'error');
    return false;
  }
}

// Vrátí odhadované využití localStorage pro aktuální klÍč — synchronní (rychlá) varianta.
// (Použité bajty počítáme jako length × 2, protože localStorage je interně UTF-16.)
function getStorageUsageSync(){
  try{
    const raw=localStorage.getItem('mycars_v3')||'';
    const used=raw.length*2; // approx bytes
    const limit=5*1024*1024; // typický limit prohlížeče 5 MB
    return {used,limit,pct:Math.min(100,used/limit*100)};
  }catch{return {used:0,limit:5*1024*1024,pct:0};}
}

// ─── LANG ────────────────────────────────────────────────────
function applyTheme(){
  const t = state.settings.theme || 'dark';
  document.documentElement.classList.toggle('theme-bright', t === 'bright');
  document.documentElement.classList.toggle('theme-glass',  t === 'glass');
  // Update meta theme-color for browser chrome
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content = t === 'bright' ? '#ffffff' : t === 'glass' ? '#0d0a1e' : '#0f1018';
}

function setTheme(t){
  state.settings.theme=t;
  saveData();
  applyTheme();
  renderPage(); // refresh toggle UI in settings
}

function setLang(l){
  state.lang=l;
  saveData();
  document.getElementById('sidebar-subtitle').textContent=l==='cs'?'Evidence vozidel':'Vehicle tracker';
  document.title=l==='cs'?'MyCars — Evidence vozidel':'MyCars — Vehicle tracker';
  document.querySelectorAll('[data-cs]').forEach(el=>{
    const val=el.getAttribute('data-'+l);
    if(val) el.textContent=val;
  });
  document.querySelectorAll('[data-title-cs]').forEach(el=>{
    const val=el.getAttribute('data-title-'+l);
    if(val) el.title=val;
  });
  const tog=document.getElementById('c-status-toggle');
  if(tog) updateStatusToggleLabel(tog.checked);
  const lbl=document.getElementById('c-status-label');
  if(lbl) lbl.textContent=l==='cs'?'Stav':'Status';
  renderAll();
}

// ─── RENDER ──────────────────────────────────────────────────
function renderAll(){
  // Sync nav highlight with current page
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('nav-'+state.currentPage)?.classList.add('active');
  renderCarSwitcher();
  renderPage();
}

function renderCarsList(){
  const el=document.getElementById('cars-list');
  const sorted=[...state.cars].sort((a,b)=>{
    const aActive=a.status!=='inactive';const bActive=b.status!=='inactive';
    if(aActive!==bActive) return aActive?-1:1;
    return `${a.make||''} ${a.model||''}`.localeCompare(`${b.make||''} ${b.model||''}`,'cs');
  });
  el.innerHTML=sorted.map(car=>{
    const sid=safeId(car.id);
    return `
    <div class="car-item ${car.id===state.currentCarId?'active':''} ${car.status==='inactive'?'inactive-car':''}" data-action="selectCar" data-id="${sid}">
      ${carDotHtml(car.color, 'car-dot')}
      <span class="car-name">${esc(car.make||'')} ${esc(car.model||car.name||'')}
        <small>${car.plate?esc(car.plate)+' · ':''} ${fmtNum(getMaxOdo(car.id))} km</small>
      </span>
      <button class="row-btn" data-action="openCarModal" data-id="${sid}" data-stop-propagation="1" title="${state.lang==='cs'?'Upravit vozidlo':'Edit vehicle'}"><span class="edit-icon">✏</span></button>
    </div>`;
  }).join('')||`<div style="padding:8px 10px;color:var(--text3);font-size:.78rem;">${esc(t('no_car'))}</div>`;
}

function selectCar(id){
  state.currentCarId=id;
  state.analyticsCarId=id; // analytics defaultně na vybrané auto
  state.page=1;state.fuelPage=1;
  state.filterCat='';state.search='';state.fuelSearch='';
  closeSidebarOnMobile();
  if(state.currentPage==='fleet') showPage('dashboard');
  else renderAll();
}

function toggleSidebar(){
  const sb=document.getElementById('sidebar');
  const ov=document.getElementById('sidebar-overlay');
  const isOpen=sb.classList.toggle('open');
  ov.classList.toggle('active', isOpen);
}
function closeSidebarOnMobile(){
  if(window.innerWidth<=768){
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
  }
}

// ─── MOBILE SEARCH OVERLAY ───────────────────────────────────
function toggleSearchOverlay(){
  const overlay = document.getElementById('search-overlay');
  const btn     = document.getElementById('search-toggle');
  const input   = document.getElementById('search-overlay-input');
  const isOpen  = overlay.classList.toggle('open');
  btn.classList.toggle('active', isOpen);
  if(isOpen){
    // Sync current search value from desktop input
    const desktopVal = document.getElementById('topbar-search').value;
    input.value = desktopVal;
    setTimeout(()=>input.focus(), 50);
  } else {
    // Clear search when overlay closes
    clearSearchOverlay();
  }
}

function clearSearchOverlay(){
  const overlay = document.getElementById('search-overlay');
  const btn     = document.getElementById('search-toggle');
  const input   = document.getElementById('search-overlay-input');
  overlay.classList.remove('open');
  btn.classList.remove('active');
  input.value = '';
  // Also clear the desktop input and reset search
  document.getElementById('topbar-search').value = '';
  handleGlobalSearch('');
}

function syncDesktopSearch(val){
  // Keep desktop input in sync so state is consistent
  document.getElementById('topbar-search').value = val;
}

// Close search overlay on Escape key
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    const overlay = document.getElementById('search-overlay');
    if(overlay && overlay.classList.contains('open')) clearSearchOverlay();
  }
});


// ─── CAR SWITCHER DROPDOWN ───────────────────────────────────
function renderCarSwitcher(){
  const bar=document.getElementById('car-switcher');
  if(!bar) return;
  const page=state.currentPage;
  const hideOn=['fleet','settings','vehicle-edit','vehicle-wizard'];
  if(hideOn.includes(page)){bar.style.display='none';return;}

  const cs=state.lang==='cs';
  const sort=(arr)=>arr.sort((a,b)=>`${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`,'cs'));
  const activeCars=sort(state.cars.filter(c=>c.status!=='inactive'));
  const inactiveCars=sort(state.cars.filter(c=>c.status==='inactive'));

  const isCtx=['analytics','reminders'].includes(page);
  const ctxVal=page==='analytics'?state.analyticsCarId:state.remindersCarId;
  const selFn=page==='analytics'?'selectAnalyticsCar':'selectRemindersCar';

  // Min cars to show on regular pages
  if(!isCtx && state.cars.filter(c=>c.status!=='inactive').length<2){
    bar.style.display='none';return;
  }
  if(!state.cars.length){bar.style.display='none';return;}

  bar.style.display='block';

  // Trigger label
  let tDot,tName,tPlate='';
  if(isCtx){
    if(!ctxVal){
      tDot='var(--accent)'; tName=cs?`Všechna aktivní (${activeCars.length})`:`All active (${activeCars.length})`;
    } else if(ctxVal==='__all__'){
      tDot='var(--text2)'; tName=cs?`Všechna vozidla (${state.cars.length})`:`All vehicles (${state.cars.length})`;
    } else {
      const c=getCar(ctxVal); tDot=c?.color||'#888'; tName=`${c?.make||''} ${c?.model||''}`.trim(); tPlate=c?.plate||'';
    }
  } else {
    const c=getCar(state.currentCarId);
    if(c){tDot=c.color||'#888'; tName=`${c.make||''} ${c.model||''}`.trim(); tPlate=c.plate||'';}
    else{tDot='var(--text2)'; tName=cs?'Vybrat vozidlo':'Select vehicle';}
  }
  // triggerLabel — tečka: pokud je to barva auta, použij carDotHtml; jinak plain span pro systémové barvy
  const isCarColor = tDot && !tDot.startsWith('var(');
  const triggerDot = isCarColor
    ? carDotHtml(tDot, 'csw-dot')
    : `<span class="csw-dot" style="background:${tDot}"></span>`;
  const triggerLabel=`${triggerDot}<span class="csw-make">${esc(tName)}</span>${tPlate?`<span class="csw-plate">${esc(tPlate)}</span>`:''}` ;

  // Menu items
  const makeCar=(c,extraCls,action)=>{
    const isAct=isCtx?(c.id===ctxVal):(c.id===state.currentCarId);
    return `<div class="csw-menu-item ${extraCls} ${isAct?'active':''}" data-action="${action}" data-id="${safeId(c.id)}">`
      +carDotHtml(c.color||'#888', 'csw-dot')
      +`<span class="csw-make">${esc(`${c.make||''} ${c.model||''}`.trim())}</span>`
      +(c.plate?`<span class="csw-plate">${esc(c.plate)}</span>`:'')
      +`</div>`;
  };

  let menuHtml='';
  if(isCtx){
    // Aggregate options at top
    const allActAct=!ctxVal;
    const allAct=ctxVal==='__all__';
    menuHtml+=`<div class="csw-menu-item ${allActAct?'active':''}" data-action="${selFn}" data-id="__all__active">`
      +`<span class="csw-dot" style="background:var(--accent)"></span>`
      +`<span class="csw-make">${cs?`Všechna aktivní (${activeCars.length})`:`All active (${activeCars.length})`}</span></div>`;
    if(inactiveCars.length){
      menuHtml+=`<div class="csw-menu-item ${allAct?'active':''}" data-action="${selFn}" data-id="__all__">`
        +`<span class="csw-dot" style="background:var(--text2)"></span>`
        +`<span class="csw-make">${cs?`Všechna vozidla (${state.cars.length})`:`All vehicles (${state.cars.length})`}</span></div>`;
    }
    menuHtml+='<div class="csw-menu-sep"></div>';
    if(activeCars.length){
      menuHtml+=`<div class="csw-menu-label">${cs?'Aktivní':'Active'}</div>`;
      menuHtml+=activeCars.map(c=>makeCar(c,'',selFn)).join('');
    }
    if(inactiveCars.length){
      menuHtml+='<div class="csw-menu-sep"></div>';
      menuHtml+=`<div class="csw-menu-label">${cs?'Neaktivní':'Inactive'}</div>`;
      menuHtml+=inactiveCars.map(c=>makeCar(c,'csw-inactive',selFn)).join('');
    }
  } else {
    if(activeCars.length){
      menuHtml+=`<div class="csw-menu-label">${cs?'Aktivní':'Active'}</div>`;
      menuHtml+=activeCars.map(c=>makeCar(c,'','switchCar')).join('');
    }
    if(inactiveCars.length){
      menuHtml+='<div class="csw-menu-sep"></div>';
      menuHtml+=`<div class="csw-menu-label">${cs?'Neaktivní':'Inactive'}</div>`;
      menuHtml+=inactiveCars.map(c=>makeCar(c,'csw-inactive','switchCar')).join('');
    }
  }

  // CSS proměnná --csw-car-color pro left border triggeru — jen pro barvy aut, ne systémové
  const triggerColorStyle = isCarColor ? `style="--csw-car-color:${tDot}"` : '';

  bar.innerHTML=`<span class="csw-bar-label">${cs?'Vozidlo':'Vehicle'}</span>`
    +`<div class="csw-dropdown" id="csw-dropdown">`
    +`<button class="csw-trigger" id="csw-trigger" ${triggerColorStyle} data-action="toggleCswMenu" aria-haspopup="listbox" aria-expanded="false">`
    +triggerLabel+`<span class="csw-arrow">▾</span></button>`
    +`<div class="csw-menu" id="csw-menu" style="display:none" role="listbox">${menuHtml}</div>`
    +`</div>`;
}

function toggleCswMenu(){
  const menu=document.getElementById('csw-menu');
  const trigger=document.getElementById('csw-trigger');
  const bd=document.getElementById('csw-backdrop');
  if(!menu||!trigger) return;
  const isOpen=menu.style.display==='none';
  menu.style.display=isOpen?'block':'none';
  trigger.classList.toggle('open',isOpen);
  trigger.setAttribute('aria-expanded',String(isOpen));
  if(bd) bd.classList.toggle('open',isOpen);
}

function closeCswMenu(){
  const menu=document.getElementById('csw-menu');
  const trigger=document.getElementById('csw-trigger');
  const bd=document.getElementById('csw-backdrop');
  if(menu) menu.style.display='none';
  if(trigger){trigger.classList.remove('open');trigger.setAttribute('aria-expanded','false');}
  if(bd) bd.classList.remove('open');
}

function selectAnalyticsCar(val){
  state.analyticsCarId=val==='__all__active'?null:val;
  // Also sync currentCarId when a real car is picked (helps navigation to other pages)
  if(val&&val!=='__all__active'&&val!=='__all__') state.currentCarId=val;
  closeCswMenu();
  renderCarSwitcher();
  renderPage();
}
function selectRemindersCar(val){
  state.remindersCarId=val==='__all__active'?null:val;
  if(val&&val!=='__all__active'&&val!=='__all__') state.currentCarId=val;
  closeCswMenu();
  renderCarSwitcher();
  renderPage();
}

function setAnalyticsTab(tab){
  state.analyticsTab=tab;
  renderPage();
}

function switchCar(id){
  closeCswMenu();
  state.currentCarId=id;
  state.page=1;state.fuelPage=1;
  state.filterCat='';state.search='';state.fuelSearch='';
  renderCarSwitcher();
  renderPage();
}

function handleGlobalSearch(val){
  state.carSearch = val;
  if(state.currentPage !== 'fleet') showPage('fleet');
  else renderFleet();
}

function showPage(page){
  state.currentPage=page;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('nav-'+page)?.classList.add('active');
  const onSettings = page==='settings';
  const onFleet = page==='fleet';
  const onEdit = page==='vehicle-edit' || page==='vehicle-wizard';
  const fuelBtn=document.getElementById('add-fuel-btn');
  const recBtn=document.getElementById('add-record-btn');
  const searchWrap=document.querySelector('.topbar-search-wrap');
  
  if(fuelBtn) fuelBtn.style.display=(onSettings||onFleet||onEdit)?'none':'';
  if(recBtn) recBtn.style.display=(onSettings||onFleet||onEdit)?'none':'';
  if(searchWrap) searchWrap.style.visibility=(onSettings||onEdit)?'hidden':'visible';

  closeSidebarOnMobile();
  renderCarSwitcher();
  renderPage();
}

function renderPage(){
  const car=getCar(state.currentCarId);
  const cs=state.lang==='cs';
  const page=state.currentPage;
  const pageNames={
    fleet:cs?'Přehled vozů':'Fleet',
    dashboard:t('dashboard'),records:t('records'),fuel:t('fuel'),
    analytics:t('analytics'),reminders:t('reminders'),
    settings:cs?'Nastavení':'Settings',
    'vehicle-edit':cs?'Upravit vozidlo':'Edit vehicle',
    'vehicle-wizard':cs?'Nové vozidlo':'New vehicle'
  };
  const pageName=pageNames[page]||page;
  const activeCars=state.cars.filter(c=>c.status!=='inactive');

  let subtitle='';
  if(page==='analytics'){
    const v=state.analyticsCarId;
    if(!v) subtitle=cs?`Všechna aktivní (${activeCars.length})`:`All active (${activeCars.length})`;
    else if(v==='__all__') subtitle=cs?`Všechna vozidla (${state.cars.length})`:`All vehicles (${state.cars.length})`;
    else{ const c=getCar(v); subtitle=c?`${c.make||''} ${c.model||''}`.trim():''; }
  } else if(page==='reminders'){
    const v=state.remindersCarId;
    if(!v) subtitle=cs?`Všechna aktivní (${activeCars.length})`:`All active (${activeCars.length})`;
    else{ const c=getCar(v); subtitle=c?`${c.make||''} ${c.model||''}`.trim():''; }
  } else if(page==='vehicle-edit'){
    const editCar=getCar(state.editingCarId);
    subtitle=editCar?`${editCar.make||''} ${editCar.model||''}`.trim():'';
  } else if(!['settings','fleet','vehicle-wizard'].includes(page)&&car){
    subtitle=`${car.make||''} ${car.model||car.name||''} ${car.plate?'('+car.plate+')':''}`.trim();
  }

  document.getElementById('page-title').innerHTML=
    esc(pageName)+(subtitle?` <span>— ${esc(subtitle)}</span>`:'');

  const pages={fleet:renderFleet,dashboard:renderDashboard,records:renderRecords,fuel:renderFuelPage,analytics:renderAnalytics,reminders:renderRemindersPage,settings:renderSettings,'vehicle-edit':renderCarEditPage,'vehicle-wizard':renderVehicleWizard};
  const contentEl = document.getElementById('content');
  contentEl.innerHTML='';
  contentEl.classList.remove('page-in');
  void contentEl.offsetWidth; // restart CSS animation
  contentEl.classList.add('page-in');
  pages[page]?.();
}


// ─── HELPERS — shared between edit page & wizard ─────────────

// Fill all form fields from a car object (same logic as old openCarModal)
function fillCarForm(car){
  const cs = state.lang==='cs';
  // Basic
  document.getElementById('c-make').value  = car?.make||'';
  document.getElementById('c-model').value = car?.model||'';
  document.getElementById('c-year').value  = car?.year||'';
  document.getElementById('c-plate').value = car?.plate||'';
  document.getElementById('c-vin').value   = car?.vin||'';
  document.getElementById('c-fueltype').value = car?.fuelType||'';
  document.getElementById('c-startodo').value = car?.startOdo||'';
  document.getElementById('c-note').value     = car?.note||'';
  // Dates basic
  setDateTriple('c-acquired',      car?.acquired||'');
  setDateTriple('c-decommissioned',car?.decommissioned||'');
  // Status toggle
  const isActive = (car?.status||'active')==='active';
  const tog = document.getElementById('c-status-toggle');
  if(tog){ tog.checked = isActive; updateStatusToggleLabel(isActive); tog.onchange=()=>updateStatusToggleLabel(tog.checked); }
  // Docs
  setDateTriple('c-stk',    car?.stk||'');    setVal('c-stk-warn',    car?.stkWarn??30);
  setDateTriple('c-emission',car?.emission||'');setVal('c-emission-warn',car?.emissionWarn??30);
  setDateTriple('c-pov',    car?.pov||'');    setVal('c-pov-warn',    car?.povWarn??30);
  setDateTriple('c-ins',    car?.insurance||'');setVal('c-ins-warn',  car?.insuranceWarn??30);
  setDateTriple('c-assist', car?.assist||''); setVal('c-assist-warn', car?.assistWarn??30);
  // Service
  setVal('c-oil-interval', car?.oilInterval||'');
  setVal('c-oil-last',     car?.oilLastKm||'');
  setVal('c-oil-warn',     car?.oilWarn??1000);
  setVal('c-oil-type',     car?.oilType||'');
  setVal('c-coolant-type', car?.coolantType||'');
  // Color swatches
  state.selectedColor = car?.color||'#e8c547';
  document.querySelectorAll('.color-swatch').forEach(s=>{
    s.classList.toggle('selected', s.dataset.color===state.selectedColor);
    s.onclick=()=>{ state.selectedColor=s.dataset.color; document.querySelectorAll('.color-swatch').forEach(x=>x.classList.remove('selected')); s.classList.add('selected'); };
  });
  // Tyres (rendered via renderTyreTab, filled after render)
  const tyreTab = document.getElementById('car-tab-tyres');
  if(tyreTab) renderTyreTab(car);
  // Date pickers & nav
  setupDatePickers();
  document.querySelectorAll('.date-triple').forEach(wrap=>{
    const prefix=wrap.id.replace('-wrap','');
    initDateTripleNav(prefix);
  });
  // Drivetrain — nastavit hodnoty přepínačů a servisních polí (HTML je již vygenerováno builderem)
  const autoEl=document.getElementById('c-has-automatic');
  const x4El=document.getElementById('c-has-4x4');
  if(autoEl){ autoEl.checked=_carEditDrivetrain.hasAutomatic; }
  if(x4El){ x4El.checked=_carEditDrivetrain.has4x4; }
  // saveCarEditDrivetrain voláme jen pokud jsou přepínače v DOM (základní sekce je otevřena)
  if(autoEl||x4El) saveCarEditDrivetrain();
  setVal('c-gearbox-oil-interval', car?.gearboxOilInterval||'');
  setVal('c-gearbox-oil-last',     car?.gearboxOilLastKm||'');
  setVal('c-gearbox-oil-warn',     car?.gearboxOilWarn??1000);
  setVal('c-4x4-oil-interval',     car?.xferOilInterval||'');
  setVal('c-4x4-oil-last',         car?.xferOilLastKm||'');
  setVal('c-4x4-oil-warn',         car?.xferOilWarn??1000);
}

function setVal(id, val){
  const el=document.getElementById(id);
  if(el) el.value=val;
}

// Summary text for accordion header when section is closed
function sectionSummary(section, car){
  if(!car) return '';
  const cs=state.lang==='cs';
  if(section==='basic'){
    const parts=[car.make,car.model,car.year?'('+car.year+')':'',car.plate].filter(Boolean);
    if(car.hasAutomatic) parts.push(cs?'Automat':'Auto');
    if(car.has4x4) parts.push('4×4');
    return parts.join(' ');
  }
  if(section==='docs'){
    const today=new Date(); today.setHours(0,0,0,0);
    const dates=[{n:'STK',d:car.stk,w:car.stkWarn},{n:cs?'Emise':'Emiss.',d:car.emission,w:car.emissionWarn},{n:'POV',d:car.pov,w:car.povWarn}];
    const due=dates.filter(x=>{ if(!x.d) return false; const diff=Math.round((new Date(x.d+'T12:00:00')-today)/86400000); return diff<(x.w||30); });
    if(due.length) return due.map(x=>x.n).join(', ');
    const next=dates.filter(x=>x.d).sort((a,b)=>a.d.localeCompare(b.d))[0];
    return next?next.n+' '+fmtDate(next.d):'';
  }
  if(section==='service'){
    const parts=[];
    if(car.oilInterval) parts.push((cs?'Olej ':'Oil ')+fmtNum(car.oilInterval)+' km');
    if(car.oilType) parts.push(car.oilType);
    if(car.hasAutomatic&&car.gearboxOilInterval) parts.push((cs?'Převodovka ':'Gearbox ')+fmtNum(car.gearboxOilInterval)+' km');
    if(car.has4x4&&car.xferOilInterval) parts.push('4×4 '+fmtNum(car.xferOilInterval)+' km');
    return parts.join(' · ');
  }
  if(section==='tyres'){
    const t=car.tyres;
    if(!t) return '';
    const s=car.tyreAllSeason?tyreSummary(t.allseason):tyreSummary(t.summer);
    return typeof s==='string'?s:(s?.front||'');
  }
  return '';
}

function toggleEditSection(name){
  if(window.innerWidth>=1200) return; // Desktop: all sections always visible via CSS grid
  state.openSection = state.openSection===name ? null : name;
  // Re-render edit page to reflect new open state
  renderCarEditPage();
  // After re-render, scroll opened section into view
  if(state.openSection){
    setTimeout(()=>{
      const el=document.getElementById('section-'+state.openSection);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    }, 50);
  }
}

// ─── VEHICLE EDIT PAGE ─────────────────────────────────────────
function renderCarEditPage(){
  const el = document.getElementById('content');
  const car = getCar(state.editingCarId);
  if(!car){ showPage(state.editReturnPage||'fleet'); return; }
  const cs = state.lang==='cs';

  const sections=[
    {id:'basic',   title:cs?'Základní informace':'Basic info',
      form: buildBasicSectionForm(cs)},
    {id:'docs',    title:cs?'Dokumenty & termíny':'Documents & dates',  form:"\n<div class='form-grid'>\n  <div class='form-section-label'>STK – Technická prohlídka</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-stk-wrap'>\n      <input type='number' class='dt-d' id='c-stk-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-stk-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-stk-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-stk-warn' value='30'></div>\n  <div class='form-section-label'>Emise – Měření emisí</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-emission-wrap'>\n      <input type='number' class='dt-d' id='c-emission-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-emission-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-emission-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-emission-warn' value='30'></div>\n  <div class='form-section-label'>POV – Povinné ručení</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-pov-wrap'>\n      <input type='number' class='dt-d' id='c-pov-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-pov-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-pov-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-pov-warn' value='30'></div>\n  <div class='form-section-label'>Havarijní pojištění (volitelné)</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-ins-wrap'>\n      <input type='number' class='dt-d' id='c-ins-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-ins-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-ins-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-ins-warn' value='30'></div>\n  <div class='form-section-label'>Asistenční služby (volitelné)</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-assist-wrap'>\n      <input type='number' class='dt-d' id='c-assist-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-assist-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-assist-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-assist-warn' value='30'></div>\n</div>"},
    {id:'service', title:cs?'Servis':'Service',
      form: buildServiceSectionForm(cs, _carEditDrivetrain.hasAutomatic, _carEditDrivetrain.has4x4)},
    {id:'tyres',   title:cs?'Pneumatiky':'Tyres',
      form:`<div id="car-tab-tyres"></div>`},
  ];

  const accordionHtml = sections.map(sec=>{
    const isOpen = state.openSection===sec.id;
    const summary = sectionSummary(sec.id, car);
    return `<div class="edit-section" id="section-${sec.id}">
      <div class="edit-section-head" data-action="toggleEditSection" data-id="${sec.id}">
        <span class="edit-section-title">${sec.title}</span>
        ${!isOpen&&summary?`<span class="edit-section-summary">${summary}</span>`:''}
        <span class="edit-section-chevron${isOpen?' open':''}">▶</span>
      </div>
      <div class="edit-section-body${isOpen?' open':''}">
        ${sec.form}
      </div>
    </div>`;
  }).join('');

  el.innerHTML=`
    <div class="edit-accordion-outer">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;flex-wrap:wrap;">
        ${carDotHtml(car.color||'#888','car-header-dot')}
        <div>
          <div style="font-size:1.15rem;font-weight:700;letter-spacing:-.02em">${esc(car.make)} ${esc(car.model)} ${car.year?'('+esc(car.year)+')':''}</div>
          <div style="font-size:.78rem;color:var(--text2);font-family:var(--font-mono)">${esc(car.plate||'—')} · ${fmtNum(getMaxOdo(car.id))} km</div>
        </div>
      </div>
      <div class="edit-accordion">${accordionHtml}</div>
    </div>
    <div class="edit-sticky-bar">
      <button class="btn btn-danger" data-action="deleteCar" style="padding:9px 14px">
        ${cs?'Smazat':'Delete'}
      </button>
      <div class="edit-sticky-spacer"></div>
      <button class="btn btn-ghost" data-action="cancelCarEdit">
        ${cs?'Zrušit':'Cancel'}
      </button>
      <button class="btn btn-primary" data-action="saveCar">
        ${cs?'Uložit':'Save'}
      </button>
    </div>`;

  // Fill form values & init tyre tab
  fillCarForm(car);
}

function cancelCarEdit(){
  showPage(state.editReturnPage||'fleet');
}

// ─── VEHICLE WIZARD (nové vozidlo) ────────────────────────────
function renderVehicleWizard(){
  const el = document.getElementById('content');
  const cs = state.lang==='cs';
  const step = state.wizardStep||1;
  const steps=[
    {label:cs?'Základní':'Basic'},
    {label:cs?'Dokumenty':'Docs'},
    {label:cs?'Servis':'Service'},
    {label:cs?'Pneumatiky':'Tyres'},
  ];

  // Progress bar
  const progressHtml = `<div style="margin-bottom:6px">
    <div class="wizard-progress">
      ${steps.map((s,i)=>{
        const n=i+1;
        const cls=n<step?'done':n===step?'active':'pending';
        return (i>0?`<div class="wizard-line${n<=step?' done':''}"></div>`:'')
          +`<div class="wizard-dot ${cls}">${n<step?'✓':n}</div>`;
      }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:6px">
      ${steps.map(s=>`<div class="wizard-step-label">${s.label}</div>`).join('')}
    </div>
  </div>`;

  const stepTitles=[
    cs?'Základní informace':'Basic information',
    cs?'Dokumenty & termíny':'Documents & dates',
    cs?'Servis':'Service info',
    cs?'Pneumatiky':'Tyres',
  ];
  const stepSubs=[
    cs?'Vyplňte značku, model a typ paliva (povinné)':'Enter make, model and fuel type (required)',
    cs?'Termíny platnosti dokumentů (volitelné)':'Document expiry dates (optional)',
    cs?'Olejové intervaly a poznámky (volitelné)':'Oil intervals and notes (optional)',
    cs?'Parametry pneumatik (volitelné)':'Tyre parameters (optional)',
  ];
  const stepForms=[
    buildBasicSectionForm(cs),
    "\n<div class='form-grid'>\n  <div class='form-section-label'>STK – Technická prohlídka</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-stk-wrap'>\n      <input type='number' class='dt-d' id='c-stk-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-stk-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-stk-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-stk-warn' value='30'></div>\n  <div class='form-section-label'>Emise – Měření emisí</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-emission-wrap'>\n      <input type='number' class='dt-d' id='c-emission-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-emission-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-emission-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-emission-warn' value='30'></div>\n  <div class='form-section-label'>POV – Povinné ručení</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-pov-wrap'>\n      <input type='number' class='dt-d' id='c-pov-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-pov-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-pov-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-pov-warn' value='30'></div>\n  <div class='form-section-label'>Havarijní pojištění (volitelné)</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-ins-wrap'>\n      <input type='number' class='dt-d' id='c-ins-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-ins-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-ins-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-ins-warn' value='30'></div>\n  <div class='form-section-label'>Asistenční služby (volitelné)</div>\n  <div class='form-group'><label class='form-label'>Platnost do</label>\n    <div class='date-triple' id='c-assist-wrap'>\n      <input type='number' class='dt-d' id='c-assist-d' placeholder='DD' min='1' max='31'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-assist-m' placeholder='MM' min='1' max='12'>\n      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-assist-y' placeholder='RRRR' min='1900' max='2099'>\n    </div>\n  </div>\n  <div class='form-group'><label class='form-label'>Varovat (dní předem)</label><input type='number' class='form-input' id='c-assist-warn' value='30'></div>\n</div>",
    buildServiceSectionForm(cs, _wizardDraftData['_hasAutomatic']||false, _wizardDraftData['_has4x4']||false),
    `<div id="car-tab-tyres"></div>`,
  ];

  el.innerHTML=`
    <div class="wizard-wrap">
      ${progressHtml}
      <div class="wizard-header">
        <div class="wizard-header-title">${stepTitles[step-1]}</div>
        <div class="wizard-header-sub">${stepSubs[step-1]}</div>
      </div>
      <div class="wizard-body">
        ${stepForms[step-1]}
      </div>
    </div>
    <div class="wizard-sticky">
      <span class="wizard-step-info">${cs?'Krok':'Step'} ${step} ${cs?'z':'of'} ${steps.length}</span>
      ${step>1?`<button class="btn btn-ghost" data-action="wizardBack">← ${cs?'Zpět':'Back'}</button>`:''}
      ${step<steps.length
        ?`<button class="btn btn-primary" data-action="wizardNext">${cs?'Další':'Next'} →</button>`
        :`<button class="btn btn-primary" data-action="saveCar">${cs?'Vytvořit vozidlo':'Create vehicle'}</button>`}
    </div>`;

  // For step 1 pre-fill nothing (new car); for step 4 render tyre tab
  if(step===4) renderTyreTab(null);
  setupDatePickers();
  document.querySelectorAll('.date-triple').forEach(wrap=>{
    const prefix=wrap.id.replace('-wrap','');
    initDateTripleNav(prefix);
  });
  // Re-init color swatches
  state.selectedColor = state.selectedColor||'#e8c547';
  document.querySelectorAll('.color-swatch').forEach(s=>{
    s.classList.toggle('selected', s.dataset.color===state.selectedColor);
    s.onclick=()=>{ state.selectedColor=s.dataset.color; document.querySelectorAll('.color-swatch').forEach(x=>x.classList.remove('selected')); s.classList.add('selected'); };
  });
  // Status toggle init
  const tog=document.getElementById('c-status-toggle');
  if(tog){ if(!tog.dataset.init){tog.checked=true; updateStatusToggleLabel(true); tog.dataset.init='1';} tog.onchange=()=>updateStatusToggleLabel(tog.checked); }
}

function wizardNext(){
  // Validate step 1 required fields
  if(state.wizardStep===1){
    const make=document.getElementById('c-make')?.value.trim();
    const model=document.getElementById('c-model')?.value.trim();
    const fuel=document.getElementById('c-fueltype')?.value;
    if(!make||!model||!fuel){
      showToast(state.lang==='cs'?'Vyplňte značku, model a typ paliva':'Enter make, model and fuel type','error');
      return;
    }
  }
  // Persist values between steps via state._wizardDraft
  _saveWizardDraft();
  state.wizardStep = Math.min(4, (state.wizardStep||1)+1);
  renderVehicleWizard();
  _loadWizardDraft();
  document.getElementById('content-scroll').scrollTop=0;
}

function wizardBack(){
  _saveWizardDraft();
  state.wizardStep = Math.max(1, (state.wizardStep||1)-1);
  renderVehicleWizard();
  _loadWizardDraft();
  document.getElementById('content-scroll').scrollTop=0;
}

// Draft persists wizard form values between step transitions
let _wizardDraftData = {};
// Stav přepínačů pohonu při editaci vozidla (perzistuje mezi přepínáním záložek)
let _carEditDrivetrain = {hasAutomatic:false, has4x4:false};

function _saveWizardDraft(){
  const ids=['c-make','c-model','c-year','c-plate','c-vin','c-fueltype','c-startodo','c-note',
    'c-stk-warn','c-emission-warn','c-pov-warn','c-ins-warn','c-assist-warn',
    'c-oil-interval','c-oil-last','c-oil-warn','c-oil-type','c-coolant-type',
    'c-gearbox-oil-interval','c-gearbox-oil-last','c-gearbox-oil-warn',
    'c-4x4-oil-interval','c-4x4-oil-last','c-4x4-oil-warn'];
  ids.forEach(id=>{ const el=document.getElementById(id); if(el) _wizardDraftData[id]=el.value; });
  // Date triples
  ['c-acquired','c-decommissioned','c-stk','c-emission','c-pov','c-ins','c-assist'].forEach(p=>{
    _wizardDraftData[p]=getDateTriple(p);
  });
  _wizardDraftData['_color']=state.selectedColor;
  const tog=document.getElementById('c-status-toggle');
  if(tog) _wizardDraftData['_status']=tog.checked;
  const autoEl=document.getElementById('c-has-automatic');
  const x4El=document.getElementById('c-has-4x4');
  if(autoEl) _wizardDraftData['_hasAutomatic']=autoEl.checked;
  if(x4El) _wizardDraftData['_has4x4']=x4El.checked;
}

function _loadWizardDraft(){
  const d=_wizardDraftData;
  if(!Object.keys(d).length) return;
  const ids=['c-make','c-model','c-year','c-plate','c-vin','c-fueltype','c-startodo','c-note',
    'c-stk-warn','c-emission-warn','c-pov-warn','c-ins-warn','c-assist-warn',
    'c-oil-interval','c-oil-last','c-oil-warn','c-oil-type','c-coolant-type'];
  ids.forEach(id=>{ const el=document.getElementById(id); if(el&&d[id]!==undefined) el.value=d[id]; });
  ['c-acquired','c-decommissioned','c-stk','c-emission','c-pov','c-ins','c-assist'].forEach(p=>{
    if(d[p]!==undefined) setDateTriple(p,d[p]||'');
  });
  if(d['_color']){ state.selectedColor=d['_color']; document.querySelectorAll('.color-swatch').forEach(s=>{ s.classList.toggle('selected',s.dataset.color===state.selectedColor); }); }
  const tog=document.getElementById('c-status-toggle');
  if(tog&&d['_status']!==undefined){ tog.checked=d['_status']; updateStatusToggleLabel(tog.checked); }
  // Drivetrain — nastavit hodnoty (HTML generuje buildBasicSectionForm / buildServiceSectionForm)
  setVal('c-gearbox-oil-interval', parseInt(d['c-gearbox-oil-interval'])||'');
  setVal('c-gearbox-oil-last',     parseInt(d['c-gearbox-oil-last'])||'');
  setVal('c-gearbox-oil-warn',     parseInt(d['c-gearbox-oil-warn'])||1000);
  setVal('c-4x4-oil-interval',     parseInt(d['c-4x4-oil-interval'])||'');
  setVal('c-4x4-oil-last',         parseInt(d['c-4x4-oil-last'])||'');
  setVal('c-4x4-oil-warn',         parseInt(d['c-4x4-oil-warn'])||1000);
  const autoElW=document.getElementById('c-has-automatic');
  const x4ElW=document.getElementById('c-has-4x4');
  if(autoElW&&d['_hasAutomatic']!==undefined){ autoElW.checked=d['_hasAutomatic']; }
  if(x4ElW&&d['_has4x4']!==undefined){ x4ElW.checked=d['_has4x4']; }
  // saveCarEditDrivetrain voláme jen pokud jsou přepínače v DOM (krok 0 — základní info)
  if(autoElW||x4ElW) saveCarEditDrivetrain();
}

// ─── FLEET DASHBOARD ─────────────────────────────────────────
function renderFleet(){
  const el=document.getElementById('content');
  const cs=state.lang==='cs';
  const sortCars = arr => arr.sort((a,b)=>`${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`,'cs'));
  
  // Filtering logic for global search
  let filtered = state.cars;
  if(state.carSearch) {
    const q = state.carSearch.toLowerCase();
    filtered = filtered.filter(c => 
      (c.make||'').toLowerCase().includes(q) || 
      (c.model||'').toLowerCase().includes(q) || 
      (c.plate||'').toLowerCase().includes(q) ||
      (c.vin||'').toLowerCase().includes(q)
    );
  }

  const activeCars=sortCars(filtered.filter(c=>c.status!=='inactive'));
  const inactiveCars=sortCars(filtered.filter(c=>c.status==='inactive'));
  const allFleetCars=[...activeCars,...inactiveCars];

  if(!allFleetCars.length){
    if(state.carSearch){
      el.innerHTML=`<div class="empty"><div class="empty-icon">— —</div>
        <p>${cs?'Žádná vozidla neodpovídají hledání':'No vehicles match your search'}</p>
        <button class="btn btn-ghost" data-action="clearSearchInput" style="margin-top:16px;">${cs?'Zrušit hledání':'Clear search'}</button>
      </div>`;
    }else{
      el.innerHTML=`<div class="empty"><div class="empty-icon">— —</div>
        <p>${cs?'Žádná aktivní vozidla. Přidejte první vozidlo.':'No active vehicles. Add your first vehicle.'}</p>
        <button class="btn btn-primary" style="margin-top:16px;" data-action="openCarModal">${cs?'Přidat vozidlo':'Add vehicle'}</button>
      </div>`;
    }
    return;
  }

  const today=new Date();today.setHours(0,0,0,0);

  function docStatus(date,warnDays){
    if(!date) return 'none';
    const diff=Math.round((new Date(date+'T12:00:00')-today)/86400000);
    return diff<0?'due':diff<(warnDays||30)?'warn':'ok';
  }
  function docLabel(name,date,warnDays,tooltip){
    if(!date) return `<span class="fleet-doc-pill none" title="${tooltip||''}">${name}</span>`;
    const sc=docStatus(date,warnDays);
    const diff=Math.round((new Date(date+'T12:00:00')-today)/86400000);
    const detail=diff<0?`−${Math.abs(diff)}d`:`+${diff}d`;
    return `<span class="fleet-doc-pill ${sc}" title="${tooltip||''} ${state.lang==='cs'?'(vyprší za':'(expires in'} ${diff} ${t('days')})">${name} <span style="opacity:.8">${detail}</span></span>`;
  }

  const cardsMap={};
  allFleetCars.forEach(car=>{
    cardsMap[car.id]=(car=>{
    const isActive=car.status!=='inactive';
    const maxOdo=getMaxOdo(car.id);
    const fuels=getCarFuels(car.id);
    const lastFuel=fuels.length?[...fuels].sort((a,b)=>b.date.localeCompare(a.date))[0]:null;
    const avgC=avgConsumptionVal(car.id);

    // Oil km remaining
    let oilHtml='';
    if(isActive&&car.oilInterval&&car.oilLastKm){
      const left=(car.oilLastKm+car.oilInterval)-maxOdo;
      const sc=left<=0?'due':left<=(car.oilWarn||1000)?'warn':'ok';
      const label=left<=0
        ?`${cs?'Prošlé o':'Overdue by'} ${fmtNum(Math.abs(left))} km`
        :`${fmtNum(left)} km`;
      oilHtml=`<div class="fleet-row">
        <span class="fleet-row-label">${cs?'Olej motor.':'Engine oil'}</span>
        <span class="fleet-row-val ${sc}">${label}</span>
      </div>`;
    }
    // Olej v převodovce
    if(isActive&&car.hasAutomatic&&car.gearboxOilInterval&&car.gearboxOilLastKm){
      const left=(car.gearboxOilLastKm+car.gearboxOilInterval)-maxOdo;
      const sc=left<=0?'due':left<=(car.gearboxOilWarn||1000)?'warn':'ok';
      const label=left<=0?`${cs?'Prošlé o':'Overdue by'} ${fmtNum(Math.abs(left))} km`:`${fmtNum(left)} km`;
      oilHtml+=`<div class="fleet-row">
        <span class="fleet-row-label">${cs?'Převodovka':'Gearbox'}</span>
        <span class="fleet-row-val ${sc}">${label}</span>
      </div>`;
    }
    // Olej ve čtyřkolce
    if(isActive&&car.has4x4&&car.xferOilInterval&&car.xferOilLastKm){
      const left=(car.xferOilLastKm+car.xferOilInterval)-maxOdo;
      const sc=left<=0?'due':left<=(car.xferOilWarn||1000)?'warn':'ok';
      const label=left<=0?`${cs?'Prošlé o':'Overdue by'} ${fmtNum(Math.abs(left))} km`:`${fmtNum(left)} km`;
      oilHtml+=`<div class="fleet-row">
        <span class="fleet-row-label">${cs?'Čtyřkolka':'4×4'}</span>
        <span class="fleet-row-val ${sc}">${label}</span>
      </div>`;
    }

    // Last fuel
    let fuelHtml='';
    if(isActive&&lastFuel){
      const diff=Math.round((today-new Date(lastFuel.date+'T12:00:00'))/86400000);
      const when=diff===0?(cs?'dnes':'today'):diff===1?(cs?'včera':'yesterday'):`${diff} ${cs?'dní':'days'}`;
      fuelHtml=`<div class="fleet-row">
        <span class="fleet-row-label">${cs?'Tankování':'Last refuel'}</span>
        <span class="fleet-row-val">${when} · ${fmtNum(lastFuel.liters,1)} l</span>
      </div>`;
    }

    // Doc pills — only show docs that have a date set
    const docHtml=`<div class="fleet-doc-row">
      ${car.stk?docLabel('STK',car.stk,car.stkWarn,cs?'Státní technická kontrola':'Technical Inspection'):''}
      ${car.pov?docLabel('POV',car.pov,car.povWarn,cs?'Povinné ručení':'Liability Insurance'):''}
      ${car.emission?docLabel(cs?'Emise':'Emiss.',car.emission,car.emissionWarn,cs?'Měření emisí':'Emission Check'):''}
      ${car.insurance?docLabel(cs?'Havar':'Comp.',car.insurance,car.insuranceWarn,cs?'Havarjní pojištění':'Comprehensive Insurance'):''}
      ${car.assist?docLabel(cs?'Asist':'Assist',car.assist,car.assistWarn,cs?'Asistenční služby':'Roadside Assistance'):''}
      ${car.hasAutomatic?`<span class="fleet-doc-pill" style="background:var(--amber-dim);color:var(--amber);border-color:transparent">${cs?'Automat':'Auto'}</span>`:''}
      ${car.has4x4?`<span class="fleet-doc-pill" style="background:var(--amber-dim);color:var(--amber);border-color:transparent">4×4</span>`:''}
    </div>`;

    // Overall alert level — only for active cars
    const docStatuses=isActive?[
      docStatus(car.stk,car.stkWarn),docStatus(car.pov,car.povWarn),
      docStatus(car.emission,car.emissionWarn),docStatus(car.insurance,car.insuranceWarn),
      docStatus(car.assist,car.assistWarn)
    ]:[];
    const oilLeft=isActive&&car.oilInterval&&car.oilLastKm?(car.oilLastKm+car.oilInterval)-maxOdo:999999;
    const oilSc=oilLeft<=0?'due':oilLeft<=(car.oilWarn||1000)?'warn':'ok';
    const gearboxLeft=isActive&&car.hasAutomatic&&car.gearboxOilInterval&&car.gearboxOilLastKm?(car.gearboxOilLastKm+car.gearboxOilInterval)-maxOdo:999999;
    const gearboxSc=gearboxLeft<=0?'due':gearboxLeft<=(car.gearboxOilWarn||1000)?'warn':'ok';
    const xferLeft=isActive&&car.has4x4&&car.xferOilInterval&&car.xferOilLastKm?(car.xferOilLastKm+car.xferOilInterval)-maxOdo:999999;
    const xferSc=xferLeft<=0?'due':xferLeft<=(car.xferOilWarn||1000)?'warn':'ok';
    const allStatuses=isActive?[...docStatuses,oilSc,gearboxSc,xferSc]:[];
    const cardAccent=!isActive?'var(--border)':allStatuses.includes('due')?'var(--red)':allStatuses.includes('warn')?'var(--amber)':'var(--border)';

    return `<div class="fleet-card" style="border-color:${cardAccent}" data-action="selectCar" data-id="${safeId(car.id)}">
      <div class="fleet-card-header">
        ${carDotHtml(car.color||'#888', 'fleet-card-dot')}
        <div class="fleet-card-title">
          <div class="fleet-card-name">${esc(car.make||'')} ${esc(car.model||'')} ${car.year?'('+esc(car.year)+')':''}</div>
          <div class="fleet-card-sub">${esc(car.plate||'—')}</div>
        </div>
        <span class="fleet-card-km">${fmtNum(maxOdo)} km</span>
      </div>
      <div class="fleet-card-body">
        ${docHtml}
        ${oilHtml}
        ${fuelHtml}
        ${avgC>0?`<div class="fleet-row">
          <span class="fleet-row-label">${cs?'Průměrná spotřeba':'Avg consumption'}</span>
          <span class="fleet-row-val">${fmtNum(avgC,1)} l/100 km</span>
        </div>`:''}
      </div>
      <div class="fleet-card-footer" style="${!isActive?'opacity:.6':''}"> 
        <span class="status-badge ${car.status||'active'}">${car.status==='inactive'?(cs?'Neaktivní':'Inactive'):(cs?'Aktivní':'Active')}</span>
        <button class="btn btn-ghost" style="font-size:.78rem;padding:6px 12px;min-height:36px;" data-action="openCarModal" data-id="${safeId(car.id)}" data-stop-propagation="1" title="${cs?'Upravit vozidlo':'Edit vehicle'}">${cs?'Upravit':'Edit'}</button>
      </div>
    </div>`;
  })(car);
  });

  // ── Fleet highlight statistics ───────────────────
  const allActive=state.cars.filter(c=>c.status!=='inactive');
  const fleetTotalCost=allActive.reduce((s,c)=>s+getServiceCost(c.id)+getTotalFuelCost(c.id)+getPurchaseCost(c.id),0);
  const fleetTotalKm=allActive.reduce((s,c)=>s+getKmDriven(c.id),0);
  // Nejvýdajnější vůz (servis+palivo+nákup)
  const costByCar=allActive.map(c=>({car:c,cost:getServiceCost(c.id)+getTotalFuelCost(c.id)+getPurchaseCost(c.id)}))
    .sort((a,b)=>b.cost-a.cost);
  const topCar=costByCar[0];
  // Průměrná cena za km (vážená — celkové náklady / celkové km, bez nákupu)
  const fleetRunCost=allActive.reduce((s,c)=>s+getServiceCost(c.id)+getTotalFuelCost(c.id),0);
  const fleetCostPerKm=fleetTotalKm>0?fleetRunCost/fleetTotalKm:0;

  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <div></div>
      <button class="btn btn-ghost" data-action="openCarModal" style="font-size:.82rem;">
        + ${cs?'Přidat vozidlo':'Add vehicle'}
      </button>
    </div>
    ${''}
    ${activeCars.length?`<div class="section-title" style="margin-bottom:12px;">${cs?'Aktivní vozidla':'Active vehicles'}</div><div class="fleet-grid" style="margin-bottom:28px;">${activeCars.map(c=>cardsMap[c.id]).join('')}</div>`:''}
    ${inactiveCars.length?`<div class="section-title" style="margin-bottom:12px;color:var(--text2)">${cs?'Neaktivní vozidla':'Inactive vehicles'}</div><div class="fleet-grid">${inactiveCars.map(c=>cardsMap[c.id]).join('')}</div>`:''}`;
}

// ─── DASHBOARD ───────────────────────────────────────────────
function renderDashboard(){
  const el=document.getElementById('content');
  const car=getCar(state.currentCarId);
  if(!car){el.innerHTML=`<div class="empty"><div class="empty-icon">— —</div><p>${t('no_car')}</p></div>`;return;}

  const recs=getCarRecords(car.id);
  const fuels=getCarFuels(car.id);
  const cs=state.lang==='cs';
  // Výpočty — všechny přes sdílené helper funkce (stejná logika jako Analytics)
  const maxOdo=getMaxOdo(car.id);
  const kmDriven=getKmDriven(car.id);
  const total=getServiceCost(car.id)+getTotalFuelCost(car.id)+getPurchaseCost(car.id);
  const costPerKm=getCostPerKm(car.id);          // BEZ nákupu vozidla
  const avgConsumption=avgConsumptionVal(car.id); // metoda plné nádrže
  const kmThisYear=getKmThisYear(car.id);

  const alerts=buildAlerts(car);
  // Přidat automatické připomínky přezutí do alertů dashboardu
  getAutoReminders(car).filter(r=>r.id.includes('tire')).forEach(r=>{
    alerts.push({level:r.sc==='due'?'danger':'warn', title:r.name, detail:r.detail});
  });
  const alertsHtml=alerts.length?`<div class="alerts-list">${alerts.map(a=>`
    <div class="alert-item ${a.level}">
      <span class="alert-icon"></span>
      <span class="alert-text"><strong>${esc(a.title)}</strong><small>${esc(a.detail)}</small></span>
    </div>`).join('')}</div>`:'';

  // Doc cards
  const today=new Date();today.setHours(0,0,0,0);
  function docCard(label,date,warnDays,tooltip){
    if(!date)return`<div class="doc-card" title="${tooltip||''}"><div class="doc-label">${label}</div><div class="doc-date" style="color:var(--text3)">—</div></div>`;
    const d=new Date(date+'T12:00:00');const diff=Math.round((d-today)/86400000);
    const cls=diff<0?'due':diff<(warnDays||30)?'warn':'ok';
    const meta=diff<0?`<span style="color:var(--red)">${Math.abs(diff)} ${t('days')} ${state.lang==='cs'?'prošlé':'overdue'}</span>`:`${diff} ${t('days')}`;
    return`<div class="doc-card ${cls}" title="${tooltip||''} — ${state.lang==='cs'?'vyprší':'expires'}: ${fmtDate(date)}"><div class="doc-label">${label}</div><div class="doc-date">${fmtDate(date)}</div><div class="doc-meta">${meta}</div></div>`;
  }

  const lastFuel=fuels.length?[...fuels].sort((a,b)=>b.date.localeCompare(a.date)||b.odo-a.odo)[0]:null;
  const recent=[...recs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

  el.innerHTML=`
    ${alertsHtml}
    <div class="car-header">
      ${carDotHtml(car.color||'#888', 'car-header-dot')}
      <div class="car-header-info">
        <div class="car-header-name">${esc(car.make||'')} ${esc(car.model||'')} ${car.year?'('+esc(car.year)+')':''}</div>
        <div class="car-header-meta">
          ${[
            car.plate?`<strong>${esc(car.plate)}</strong>`:'',
            car.vin?`VIN: ${esc(car.vin)}`:'',
            car.fuelType?esc(FUEL_TYPE_LABELS[car.fuelType]?.[state.lang]||car.fuelType):'',
            fmtNum(maxOdo)+' km',
            car.acquired?(cs?'od':'since')+' '+fmtDate(car.acquired):'',
            car.decommissioned?(cs?'vyřazeno':'decom.')+' '+fmtDate(car.decommissioned):'',
          ].filter(Boolean).join(' · ')}
          <span class="status-badge ${car.status||'active'}" style="margin-left:8px;">${car.status==='inactive'?t('inactive'):t('active')}</span>
          ${car.hasAutomatic?`<span class="cat-badge" style="background:rgba(108,143,255,.12);color:var(--accent);margin-left:6px">${cs?'Automat':'Auto'}</span>`:''}
          ${car.has4x4?`<span class="cat-badge" style="background:rgba(52,211,153,.12);color:var(--green);margin-left:4px">4×4</span>`:''}
          ${(car.oilType||car.coolantType)?`<span style="display:block;margin-top:4px;color:var(--text3)">${[
            car.oilType?(cs?'Olej: ':'Oil: ')+esc(car.oilType):'',
            car.coolantType?(cs?'Chladivo: ':'Coolant: ')+esc(car.coolantType):'',
          ].filter(Boolean).join(' · ')}</span>`:''}
        </div>
      </div>
      <button class="row-btn" data-action="openCarModal" data-id="${safeId(car.id)}" style="width:36px;height:36px;flex-shrink:0;" title="${state.lang==='cs'?'Upravit vozidlo':'Edit vehicle'}"><span class="edit-icon">✏</span></button>
    </div>

    <div class="doc-row" style="${car.status==='inactive'?'display:none':'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:22px'}">
      ${car.status==='inactive'?'':`
      ${docCard(t('stk'),car.stk,car.stkWarn,cs?'Státní technická kontrola':'Technical Inspection')}
      ${docCard(t('emission'),car.emission,car.emissionWarn,cs?'Měření emisí':'Emission Check')}
      ${docCard(t('pov'),car.pov,car.povWarn,cs?'Povinné ručení':'Liability Insurance')}
      ${car.insurance?docCard(state.lang==='cs'?'Havarijní poj.':'Comp. ins.',car.insurance,car.insuranceWarn,state.lang==='cs'?'Havarijní pojištění':'Comprehensive Insurance'):''}
      ${car.assist?docCard(state.lang==='cs'?'Asistence':'Assistance',car.assist,car.assistWarn,state.lang==='cs'?'Asistenční služby':'Roadside Assistance'):''}
      `}
    </div>

    <div class="stats-grid">
      <div class="stat-card yellow"><div class="stat-label">${t('total_spent')}</div><div class="stat-value small">${fmtMoney(total)}</div></div>
      <div class="stat-card blue"><div class="stat-label">${t('current_odo')}</div><div class="stat-value">${fmtNum(maxOdo)}</div><div class="stat-sub">km</div></div>
      <div class="stat-card" style="border-top:2px solid var(--green)"><div class="stat-label">${t('km_this_year')}</div><div class="stat-value">${fmtNum(kmThisYear)}</div><div class="stat-sub">km · ${new Date().getFullYear()}</div></div>
      <div class="stat-card green"><div class="stat-label">${t('cost_per_km')}</div><div class="stat-value small">${fmtMoney(costPerKm)}</div><div class="stat-sub">${fmtNum(kmDriven)} km</div></div>
      <div class="stat-card orange"><div class="stat-label">${t('avg_consumption')}</div><div class="stat-value small">${avgConsumption>0?fmtNum(avgConsumption,1)+' l/100km':'—'}</div></div>
      <div class="stat-card" style="border-top:2px solid var(--green)">
        <div class="stat-label">${state.lang==='cs'?'Poslední tankování':'Last refuel'}</div>
        ${lastFuel?`
          <div class="stat-value small">${fmtDate(lastFuel.date)}</div>
          <div class="stat-sub">${fmtNum(lastFuel.odo)} km · ${fmtNum(lastFuel.liters,1)} l · ${fmtMoney(lastFuel.cost)}</div>
          <div class="stat-sub" style="margin-top:2px;">${fuelTypeLabel(lastFuel.fuelTypeId)}${lastFuel.fullTank?' · <span style="color:var(--green)">'+(state.lang==='cs'?'plná nádrž':'full tank')+'</span>':''}</div>
        `:`<div class="stat-value small" style="color:var(--text3)">—</div>`}
      </div>
    </div>

    ${(()=>{
      const hasTyres = car.tyres && (car.tyres.summer||car.tyres.winter||car.tyres.allseason);
      if(!hasTyres) return '';
      const cs2=state.lang==='cs';
      // Renderuje jeden řádek nebo dva (přední / zadní) pro danou sadu
      const row=(label,data)=>{
        if(!data) return '';
        const s=tyreSummary(data);
        if(!s) return '';
        // tyreSummary vrátí string (same) nebo {front,rear} (různé nápravy)
        if(typeof s === 'string'){
          return `<div style="display:flex;align-items:baseline;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:.78rem;color:var(--text2);width:100px;flex-shrink:0">${label}</span>
            <span style="font-size:.82rem;font-family:var(--font-mono);color:var(--text)">${s}</span>
          </div>`;
        }
        // Různé nápravy — dva podřádky
        const axleRow=(axleLabel,val)=>val?`
          <div style="display:flex;align-items:baseline;gap:10px;padding:4px 0 4px 16px;border-bottom:1px solid var(--border)">
            <span style="font-size:.75rem;color:var(--text3);width:74px;flex-shrink:0">${axleLabel}</span>
            <span style="font-size:.82rem;font-family:var(--font-mono);color:var(--text)">${val}</span>
          </div>`:'';
        return `<div style="display:flex;align-items:baseline;gap:10px;padding:6px 0 2px;border-bottom:none">
            <span style="font-size:.78rem;color:var(--text2);width:100px;flex-shrink:0">${label}</span>
          </div>`
          + axleRow(cs2?'Přední':'Front', s.front)
          + axleRow(cs2?'Zadní':'Rear',  s.rear);
      };
      const rows = car.tyreAllSeason
        ? row(cs2?'Celoroční':'All-season', car.tyres.allseason)
        : [row(cs2?'Letní':'Summer', car.tyres.summer), row(cs2?'Zimní':'Winter', car.tyres.winter)].join('');
      if(!rows) return '';
      return `<div class="section-title" style="margin-top:6px">${cs2?'Pneumatiky':'Tyres'}</div>
        <div class="table-wrap" style="padding:4px 16px;margin-bottom:22px">${rows}</div>`;
    })()}

    <div class="section-title">${t('recent')}</div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>${t('date')}</th><th>${t('odo')}</th><th>${t('desc')}</th><th>${t('cat')}</th><th class="td-right">${t('total_price')}</th></tr></thead>
      <tbody>${recent.length?recent.map(r=>`
        <tr>
          <td class="td-mono td-muted">${fmtDate(r.date)}</td>
          <td class="td-mono td-muted">${fmtNum(r.odo)}</td>
          <td>${esc(r.desc)}</td>
          <td><span class="cat-badge" style="background:${CAT_COLORS[r.cat]||'#555'}22;color:${CAT_COLORS[r.cat]||'#aaa'}">${esc(getCatDisplay(r.cat))}</span></td>
          <td class="td-right td-mono">${fmtMoney((r.qty||1)*(r.price||0))}</td>
        </tr>`).join(''):`<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:24px">${t('no_records')}</td></tr>`}
      </tbody>
    </table></div></div>`;
}

function buildAlerts(car){
  const alerts=[];const today=new Date();today.setHours(0,0,0,0);
  function chkDate(label,date,warnDays){
    if(!date)return;
    const d=new Date(date+'T12:00:00');const diff=Math.round((d-today)/86400000);
    if(diff<0)alerts.push({level:'danger',title:label,detail:fmtDate(date)+' ('+Math.abs(diff)+' '+t('days')+')'});
    else if(diff<(warnDays||30))alerts.push({level:'warn',title:label,detail:fmtDate(date)+' ('+diff+' '+t('days')+')'});
  }
  chkDate(t('stk_expires'),car.stk,car.stkWarn);
  chkDate(t('emission_expires'),car.emission,car.emissionWarn);
  chkDate(t('insurance_expires'),car.pov,car.povWarn);
  chkDate(car.insurance?(state.lang==='cs'?'Havarijní pojištění':'Comp. insurance'):null,car.insurance,car.insuranceWarn);
  chkDate(car.assist?(state.lang==='cs'?'Asistenční služby':'Roadside assistance'):null,car.assist,car.assistWarn);
  const maxOdo=getMaxOdo(car.id);
  if(car.oilInterval&&car.oilLastKm){
    const left=(car.oilLastKm+car.oilInterval)-maxOdo;
    if(left<=0)alerts.push({level:'danger',title:state.lang==='cs'?'Výměna oleje':'Oil change',detail:`${Math.abs(left)} km ${state.lang==='cs'?'prošlé':'overdue'}`});
    else if(left<=(car.oilWarn||1000))alerts.push({level:'warn',title:state.lang==='cs'?'Výměna oleje':'Oil change',detail:`${t('oil_due')} ${fmtNum(left)} km`});
  }
  // Výměna oleje v převodovce (automatická převodovka)
  if(car.hasAutomatic&&car.gearboxOilInterval&&car.gearboxOilLastKm){
    const left=(car.gearboxOilLastKm+car.gearboxOilInterval)-maxOdo;
    const warnKm=car.gearboxOilWarn||1000;
    if(left<=0)alerts.push({level:'danger',title:state.lang==='cs'?'Výměna oleje v převodovce':'Gearbox oil change',detail:`${Math.abs(left)} km ${state.lang==='cs'?'prošlé':'overdue'}`});
    else if(left<=warnKm)alerts.push({level:'warn',title:state.lang==='cs'?'Výměna oleje v převodovce':'Gearbox oil change',detail:`${t('oil_due')} ${fmtNum(left)} km`});
  }
  // Výměna oleje ve čtyřkolce (pohon 4×4)
  if(car.has4x4&&car.xferOilInterval&&car.xferOilLastKm){
    const left=(car.xferOilLastKm+car.xferOilInterval)-maxOdo;
    const warnKm=car.xferOilWarn||1000;
    if(left<=0)alerts.push({level:'danger',title:state.lang==='cs'?'Výměna oleje ve čtyřkolce':'4×4 oil change',detail:`${Math.abs(left)} km ${state.lang==='cs'?'prošlé':'overdue'}`});
    else if(left<=warnKm)alerts.push({level:'warn',title:state.lang==='cs'?'Výměna oleje ve čtyřkolce':'4×4 oil change',detail:`${t('oil_due')} ${fmtNum(left)} km`});
  }
  state.reminders.filter(r=>r.carId===car.id).forEach(rem=>{
    if(rem.type==='km'){
      const left=(rem.lastDone||0)+(rem.interval||0)-maxOdo;
      if(left<=0)alerts.push({level:'danger',title:rem.name,detail:`${Math.abs(left)} km ${state.lang==='cs'?'prošlé':'overdue'}`});
      else if(left<=(rem.warnAt||1000))alerts.push({level:'warn',title:rem.name,detail:`${fmtNum(left)} ${t('km_left')}`});
    }else if(rem.type==='date'&&rem.date){
      const d=new Date(rem.date+'T12:00:00');const diff=Math.round((d-today)/86400000);
      if(diff<0)alerts.push({level:'danger',title:rem.name,detail:fmtDate(rem.date)});
      else if(diff<30)alerts.push({level:'warn',title:rem.name,detail:fmtDate(rem.date)+' ('+diff+' '+t('days')+')'});
    }
  });
  return alerts;
}

// ─── RECORDS PAGE ────────────────────────────────────────────
function renderRecords(){
  const el=document.getElementById('content');
  const car=getCar(state.currentCarId);
  if(!car){el.innerHTML=`<div class="empty"><div class="empty-icon">— —</div><p>${t('no_car')}</p></div>`;return;}
  const allRecs=getCarRecords(car.id);
  let recs=allRecs;
  if(state.filterCat)recs=recs.filter(r=>r.cat===state.filterCat);
  if(state.search){const q=state.search.toLowerCase();recs=recs.filter(r=>r.desc.toLowerCase().includes(q)||getCatDisplay(r.cat).toLowerCase().includes(q)||(r.note||'').toLowerCase().includes(q));}
  recs=[...recs].sort((a,b)=>{
    let av=a[state.sortField],bv=b[state.sortField];
    if(state.sortField==='total'){av=(a.qty||1)*(a.price||0);bv=(b.qty||1)*(b.price||0);}
    if(av<bv)return-state.sortDir;if(av>bv)return state.sortDir;return 0;
  });
  const total=recs.length;const pages=Math.ceil(total/state.pageSize)||1;
  state.page=Math.min(state.page,pages);
  const paged=recs.slice((state.page-1)*state.pageSize,state.page*state.pageSize);
  const cats=[...new Set(allRecs.map(r=>r.cat))];
  const sa=f=>state.sortField===f?(state.sortDir>0?'↑':'↓'):'';
  const cs=state.lang==='cs';

  // Stat karty — počítáme ze VŠECH záznamů (bez filtru)
  const totalCost=allRecs.reduce((s,r)=>s+(r.qty||1)*(r.price||0),0);
  const maxRec=allRecs.filter(r=>r.cat!=='Nákup vozidla').reduce((m,r)=>{const v=(r.qty||1)*(r.price||0);return v>m.v?{v,r}:m},{v:0,r:null});
  const lastRec=[...allRecs].sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
  const topCatMap={};allRecs.forEach(r=>{const v=(r.qty||1)*(r.price||0);topCatMap[r.cat]=(topCatMap[r.cat]||0)+v;});
  const topCat=Object.entries(topCatMap).sort((a,b)=>b[1]-a[1])[0];

  el.innerHTML=`
  <div class="records-layout">
  <div class="records-master">
    <div class="stats-grid" style="margin-bottom:18px;">
      <div class="stat-card yellow" title="${cs?'Součet všech servisních výdajů (bez paliva)':'Sum of all service expenses (excl. fuel)'}">
        <div class="stat-label">${cs?'Celkem za záznamy':'Total (records)'}</div>
        <div class="stat-value small">${fmtMoney(totalCost)}</div>
        <div class="stat-sub">${cs?'Bez paliva':'Excl. fuel'}</div>
      </div>
      <div class="stat-card blue" title="${cs?'Celkový počet servisních záznamů pro toto vozidlo':'Total number of service records for this vehicle'}">
        <div class="stat-label">${cs?'Počet záznamů':'Record count'}</div>
        <div class="stat-value">${allRecs.length}</div>
        <div class="stat-sub">${cs?'Celkem položek':'Total items'}</div>
      </div>
      <div class="stat-card red" title="${cs?'Nejvyšší jednorázový výdaj v historii záznamů':'Highest single expense in records history'}">
        <div class="stat-label">${cs?'Nejvyšší výdaj':'Highest expense'}</div>
        <div class="stat-value small">${maxRec.r?fmtMoney(maxRec.v):'—'}</div>
        <div class="stat-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${maxRec.r?esc(maxRec.r.desc):''}</div>
      </div>
      <div class="stat-card" style="border-top:2px solid var(--blue)" title="${cs?'Datum a stav tachometru posledního servisního záznamu':'Date and odometer of the most recent service record'}">
        <div class="stat-label">${cs?'Poslední záznam':'Last record'}</div>
        <div class="stat-value small">${lastRec?fmtDate(lastRec.date):'—'}</div>
        <div class="stat-sub">${lastRec&&lastRec.odo?fmtNum(lastRec.odo)+' km':''}</div>
      </div>
      <div class="stat-card" style="border-top:2px solid var(--accent)" title="${cs?'Kategorie s nejvyššími celkovými výdaji':'Category with the highest total spend'}">
        <div class="stat-label">${cs?'Nejčastější kategorie':'Top category'}</div>
        <div class="stat-value small" style="font-size:.9rem;">${topCat?esc(getCatDisplay(topCat[0])):'—'}</div>
        <div class="stat-sub">${topCat?fmtMoney(topCat[1]):''}</div>
      </div>
    </div>

    <div class="table-wrap">
    <div class="table-header">
      <span class="table-header-title">${t('records')} <span style="color:var(--text3);font-size:.8rem;">(${total})</span></span>
      <input class="search-input" placeholder="${t('search_placeholder')}" value="${esc(state.search||'')}" data-oninput="setRecordsSearch">
      <select class="filter-select" data-onchange="setFilterCat">
        <option value="">${t('all_cats')}</option>
        ${cats.map(c=>`<option value="${esc(c)}" ${state.filterCat===c?'selected':''}>${esc(getCatDisplay(c))}</option>`).join('')}
      </select>
    </div>
    <div class="table-scroll"><table><thead><tr>
      <th data-action="sortBy" data-col="date">${t('date')} ${sa('date')}</th>
      <th data-action="sortBy" data-col="odo">${t('odo')} ${sa('odo')}</th>
      <th data-action="sortBy" data-col="desc">${t('desc')} ${sa('desc')}</th>
      <th data-action="sortBy" data-col="cat">${t('cat')} ${sa('cat')}</th>
      <th class="td-right" data-action="sortBy" data-col="qty">${t('qty')} ${sa('qty')}</th>
      <th class="td-right" data-action="sortBy" data-col="price">${t('unit_price')} ${sa('price')}</th>
      <th class="td-right" data-action="sortBy" data-col="total">${t('total_price')} ${sa('total')}</th>
      <th></th>
    </tr></thead><tbody>
    ${paged.length?paged.map(r=>{
      const sid=safeId(r.id);
      return `<tr data-rid="${esc(r.id)}" data-action="selectRecord" data-id="${sid}" class="${state.selectedRecordId===r.id?'record-selected':''}">
      <td class="td-mono td-muted">${fmtDate(r.date)}</td>
      <td class="td-mono td-muted">${fmtNum(r.odo)}</td>
      <td>${esc(r.desc)}${r.note?`<br><small style="color:var(--text3)">${esc(r.note)}</small>`:''}</td>
      <td><span class="cat-badge" style="background:${CAT_COLORS[r.cat]||'#555'}22;color:${CAT_COLORS[r.cat]||'#aaa'}">${esc(getCatDisplay(r.cat))}</span></td>
      <td class="td-right td-mono">${fmtNum(r.qty,r.qty%1?2:0)}</td>
      <td class="td-right td-mono">${fmtMoney(r.price)}</td>
      <td class="td-right td-mono">${fmtMoney((r.qty||1)*(r.price||0))}</td>
      <td><div class="row-actions">
        <button class="row-btn" data-action="selectRecord" data-id="${sid}" data-stop-propagation="1" title="${state.lang==='cs'?'Upravit záznam':'Edit record'}"><span class="edit-icon">✏</span></button>
        <button class="row-btn del" data-action="deleteRecord" data-id="${sid}" title="${state.lang==='cs'?'Smazat záznam':'Delete record'}">✕</button>
      </div></td>
    </tr>`;
    }).join(''):`<tr><td colspan="8"><div style="text-align:center;padding:32px 20px;color:var(--text3)">
      <div style="margin-bottom:12px">${t('no_records')}</div>
      <button class="btn btn-primary" data-action="openRecordModal">${cs?'Přidat první záznam':'Add first record'}</button>
    </div></td></tr>`}
    </tbody></table></div>
    <div class="pagination"><span class="flex1">${t('total_records')}: ${total}</span>
      <button class="page-btn" data-action="changePage" data-dir="-1" ${state.page<=1?'disabled':''}>‹</button>
      <span>${state.page} / ${pages}</span>
      <button class="page-btn" data-action="changePage" data-dir="1" ${state.page>=pages?'disabled':''}>›</button>
    </div>
  </div>
  </div>
  <div class="records-detail" id="records-detail"></div>
  </div>`;
  if(state.selectedRecordId) renderRecordDetail();
}
function sortBy(f){if(state.sortField===f)state.sortDir*=-1;else{state.sortField=f;state.sortDir=-1;}renderRecords();}
function changePage(d){state.page+=d;renderRecords();}

// ─── RECORDS DETAIL PANEL ───────────────────────────────────────────
function selectRecord(id){
  // On narrow screens keep using the modal; on wide screens use the inline panel
  if(window.innerWidth<1200){openRecordModal(id);return;}
  state.selectedRecordId=id;
  document.querySelectorAll('.records-master tbody tr').forEach(tr=>{
    tr.classList.toggle('record-selected',tr.dataset.rid===id);
  });
  renderRecordDetail();
}

function closeRecordDetail(){
  state.selectedRecordId=null;
  document.querySelectorAll('.records-master tbody tr').forEach(tr=>tr.classList.remove('record-selected'));
  const panel=document.getElementById('records-detail');
  if(panel) panel.innerHTML=recordDetailEmptyHtml();
}

function recordDetailEmptyHtml(){
  const cs=state.lang==='cs';
  return`<div class="records-detail-empty">
    <div class="records-detail-empty-icon">←</div>
    <div style="font-size:.9rem;color:var(--text2)">${cs?'Vyberte záznam ze seznamu':'Select a record from the list'}</div>
    <div style="font-size:.78rem">${cs?'Klikněte na řádek pro detail a editaci':'Click a row to view details and edit'}</div>
  </div>`;
}

function renderRecordDetail(){
  const panel=document.getElementById('records-detail');
  if(!panel) return;
  const id=state.selectedRecordId;
  if(!id){panel.innerHTML=recordDetailEmptyHtml();return;}
  const rec=state.records.find(r=>r.id===id);
  if(!rec){state.selectedRecordId=null;panel.innerHTML=recordDetailEmptyHtml();return;}
  const cs=state.lang==='cs';
  panel.innerHTML=`
    <div class="records-detail-head">
      <div class="records-detail-title">${cs?'Detail záznamu':'Record detail'}</div>
      <button class="modal-close" data-action="closeRecordDetail" title="${cs?'Zavřít':'Close'}">&#x2715;</button>
    </div>
    <div class="records-detail-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">${t('date')}</label>
          <div class="date-triple" id="ri-date-wrap">
            <input type="number" class="dt-d" id="ri-date-d" placeholder="DD" min="1" max="31">
            <span class="dt-sep">.</span>
            <input type="number" class="dt-m" id="ri-date-m" placeholder="MM" min="1" max="12">
            <span class="dt-sep">.</span>
            <input type="number" class="dt-y" id="ri-date-y" placeholder="RRRR" min="1900" max="2099">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('odo')}</label>
          <input type="number" class="form-input" id="ri-odo">
        </div>
        <div class="form-group full">
          <label class="form-label required">${t('desc')}</label>
          <input type="text" class="form-input" id="ri-desc" maxlength="200">
        </div>
        <div class="form-group full">
          <label class="form-label required">${t('cat')}</label>
          <select class="form-select" id="ri-cat">
            ${CATEGORIES[state.lang].map((c,i)=>`<option value="${CATEGORIES.cs[i]}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">${t('qty')}</label>
          <input type="number" class="form-input" id="ri-qty" step="0.01" min="0.01">
        </div>
        <div class="form-group">
          <label class="form-label">${t('unit_price')}</label>
          <input type="number" class="form-input" id="ri-price" step="0.01">
        </div>
        <div class="form-group full">
          <label class="form-label">${cs?'Poznámka':'Note'}</label>
          <textarea class="form-textarea" id="ri-note" maxlength="2000"></textarea>
        </div>
      </div>
      <div id="ri-errors" style="margin-top:10px"></div>
    </div>
    <div class="records-detail-foot">
      <button class="btn btn-danger" data-action="deleteRecord" data-id="${safeId(rec.id)}" style="margin-right:auto">${cs?'Smazat':'Delete'}</button>
      <button class="btn btn-ghost" data-action="closeRecordDetail">${cs?'Zrušit':'Cancel'}</button>
      <button class="btn btn-primary" data-action="saveRecordInline">${t('save')}</button>
    </div>`;
  // Fill values after DOM is ready (avoids HTML-escaping issues)
  setDateTriple('ri-date',rec.date||'');
  document.getElementById('ri-odo').value=rec.odo||'';
  document.getElementById('ri-desc').value=rec.desc||'';
  const catSel=document.getElementById('ri-cat');
  if(catSel) catSel.value=rec.cat||'';
  document.getElementById('ri-qty').value=rec.qty??1;
  document.getElementById('ri-price').value=rec.price??'';
  document.getElementById('ri-note').value=rec.note||'';
  initDateTripleNav('ri-date');
}

function saveRecordInline(){
  const errors=[];
  const date=getDateTriple('ri-date');
  const odo=parseFloat(document.getElementById('ri-odo').value)||0;
  const desc=document.getElementById('ri-desc').value.trim();
  const cat=document.getElementById('ri-cat').value;
  const qty=parseFloat(document.getElementById('ri-qty').value);
  const price=parseFloat(document.getElementById('ri-price').value)||0;
  const note=document.getElementById('ri-note').value.trim();
  if(!date)errors.push(t('date')+': neplatné nebo neúpolné datum');
  if(!desc)errors.push(t('desc')+': '+t('required_field'));
  if(!cat)errors.push(t('cat')+': '+(state.lang==='cs'?'vyberte kategorii':'please select a category'));
  if(isNaN(qty)||qty<=0)errors.push(t('qty')+': '+t('required_field'));
  if(errors.length){document.getElementById('ri-errors').innerHTML=errors.map(e=>`<div class="form-error">${e}</div>`).join('');return;}
  const id=state.selectedRecordId;
  const idx=state.records.findIndex(r=>r.id===id);
  if(idx<0) return;
  state.records[idx]={...state.records[idx],date,odo,desc,cat,qty,price,note,updatedAt:new Date().toISOString()};
  saveData();
  showToast(t('save'),'success');
  renderRecords(); // re-renders list; calls renderRecordDetail() at end because selectedRecordId is still set
}

// ─── FUEL PAGE ───────────────────────────────────────────────
function renderFuelPage(){
  const el=document.getElementById('content');
  const car=getCar(state.currentCarId);
  if(!car){el.innerHTML=`<div class="empty"><div class="empty-icon">— —</div><p>${t('no_car')}</p></div>`;return;}

  let fuels=[...getCarFuels(car.id)];
  if(state.fuelSearch){const q=state.fuelSearch.toLowerCase();fuels=fuels.filter(f=>fuelTypeLabel(f.fuelTypeId).toLowerCase().includes(q)||(f.note||'').toLowerCase().includes(q));}
  fuels.sort((a,b)=>{
    let av=a[state.fuelSortField],bv=b[state.fuelSortField];
    if(state.fuelSortField==='ppl'&&a.liters>0&&b.liters>0){av=a.cost/a.liters;bv=b.cost/b.liters;}
    if(av<bv)return-state.fuelSortDir;if(av>bv)return state.fuelSortDir;return 0;
  });

  // Consumption — sdílená funkce (stejný výpočet jako v analytice)
  const consumptions=calcConsumptions(car.id);
  const avgC=avgConsumptionVal(car.id);
  const totalLiters=getTotalLiters(car.id);
  const totalFuelCost=getTotalFuelCost(car.id);
  const ppl=totalLiters>0?totalFuelCost/totalLiters:0;

  const total=fuels.length;const pages=Math.ceil(total/state.pageSize)||1;
  state.fuelPage=Math.min(state.fuelPage,pages);
  const paged=fuels.slice((state.fuelPage-1)*state.pageSize,state.fuelPage*state.pageSize);
  const sa=f=>state.fuelSortField===f?(state.fuelSortDir>0?'↑':'↓'):'';

  el.innerHTML=`
    <div class="fuel-stats">
      <div class="stat-card green"><div class="stat-label">${t('total_fueled')}</div><div class="stat-value">${fmtNum(totalLiters,1)}</div><div class="stat-sub">litrů</div></div>
      <div class="stat-card yellow"><div class="stat-label">${t('total_fuel_cost')}</div><div class="stat-value small">${fmtMoney(totalFuelCost)}</div></div>
      <div class="stat-card blue"><div class="stat-label">${t('price_per_liter')}</div><div class="stat-value small">${ppl>0?fmtNum(ppl,2)+' Kč/l':'—'}</div></div>
      <div class="stat-card orange"><div class="stat-label">${t('avg_consumption')}</div><div class="stat-value small">${avgC>0?fmtNum(avgC,1)+' l/100km':'—'}</div><div class="stat-sub">${consumptions.length} ${state.lang==='cs'?'měření':'measurements'}</div></div>
    </div>
    <div class="table-wrap">
      <div class="table-header">
        <span class="table-header-title">${t('fuel_log')} <span style="color:var(--text3);font-size:.8rem;">(${total})</span></span>
        <input class="search-input" placeholder="${t('search_placeholder')}" value="${esc(state.fuelSearch||'')}" data-oninput="setFuelSearch">
        <button class="btn btn-fuel" data-action="openFuelModal" style="padding:5px 12px;" title="${state.lang==='cs'?'Přidat nové tankování':'Add new fuel entry'}">${state.lang==='cs'?'Nové tankování':'New fuel entry'}</button>
      </div>
      <div class="table-scroll"><table><thead><tr>
        <th data-action="fuelSortBy" data-col="date">${t('date')} ${sa('date')}</th>
        <th data-action="fuelSortBy" data-col="odo">${t('odo')} ${sa('odo')}</th>
        <th>${t('fuel_type')}</th>
        <th class="td-right" data-action="fuelSortBy" data-col="liters">${t('liters')} ${sa('liters')}</th>
        <th class="td-right" data-action="fuelSortBy" data-col="cost">${t('total_price')} ${sa('cost')}</th>
        <th class="td-right" data-action="fuelSortBy" data-col="ppl">${t('price_per_liter')} ${sa('ppl')}</th>
        <th>${t('full_tank')}</th>
        <th>${t('consumption')}</th>
        <th></th>
      </tr></thead><tbody>
      ${paged.length?paged.map(f=>{
        const ppl=f.liters>0?f.cost/f.liters:0;
        const cons=consumptions.find(c=>c.odo===f.odo);
        const fid=safeId(f.id);
        return`<tr>
          <td class="td-mono td-muted">${fmtDate(f.date)}</td>
          <td class="td-mono td-muted">${fmtNum(f.odo)}</td>
          <td><span class="fuel-badge">${esc(fuelTypeLabel(f.fuelTypeId))}</span></td>
          <td class="td-right td-mono">${fmtNum(f.liters,2)} l</td>
          <td class="td-right td-mono">${fmtMoney(f.cost)}</td>
          <td class="td-right td-mono">${ppl>0?fmtNum(ppl,2)+' Kč/l':'—'}</td>
          <td>${f.fullTank?'<span class="full-tank-dot"></span>':'<span class="partial-tank-dot"></span>'}</td>
          <td class="td-mono" style="color:${cons?'var(--text2)':'var(--text3)'}">${cons?fmtNum(cons.val,1)+' l/100km':'—'}</td>
          <td><div class="row-actions">
            <button class="row-btn" data-action="openFuelModal" data-id="${fid}" title="${state.lang==='cs'?'Upravit tankování':'Edit fuel entry'}"><span class="edit-icon">✏</span></button>
            <button class="row-btn del" data-action="deleteFuel" data-id="${fid}" title="${state.lang==='cs'?'Smazat tankování':'Delete fuel entry'}">✕</button>
          </div></td>
        </tr>`;}).join(''):`<tr><td colspan="9"><div style="text-align:center;padding:32px 20px;color:var(--text3)">
          <div style="margin-bottom:12px">${t('no_records')}</div>
          <button class="btn btn-fuel" data-action="openFuelModal">${cs?'Nahrát první tankování':'Add first fuel entry'}</button>
        </div></td></tr>`}
      </tbody></table></div>
      <div class="pagination"><span class="flex1">${total} ${state.lang==='cs'?'záznamů':'records'}</span>
        <button class="page-btn" data-action="changeFuelPage" data-dir="-1" ${state.fuelPage<=1?'disabled':''}>‹</button>
        <span>${state.fuelPage} / ${pages}</span>
        <button class="page-btn" data-action="changeFuelPage" data-dir="1" ${state.fuelPage>=pages?'disabled':''}>›</button>
      </div>
    </div>`;
}
function fuelSortBy(f){if(state.fuelSortField===f)state.fuelSortDir*=-1;else{state.fuelSortField=f;state.fuelSortDir=-1;}renderFuelPage();}
function changeFuelPage(d){state.fuelPage+=d;renderFuelPage();}

// ─── ANALYTICS ───────────────────────────────────────────────
function renderAnalytics(){
  const el=document.getElementById('content');
  const cs=state.lang==='cs';

  // Vehicle picker
  const allActiveCars=state.cars.filter(c=>c.status!=='inactive');
  if(!allActiveCars.length&&!state.cars.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">— —</div><p>${t('no_car')}</p></div>`;return;
  }
  // Normalize analyticsCarId
  if(state.analyticsCarId&&state.analyticsCarId!=='__all__'&&!getCar(state.analyticsCarId)) state.analyticsCarId=null;
  const selectedCars=state.analyticsCarId==='__all__'
    ?state.cars
    :state.analyticsCarId?[getCar(state.analyticsCarId)].filter(Boolean):allActiveCars;

  // Tab bar — vložíme před obsah; compare tab jen pokud máme ≥2 auta celkem
  const canCompare=state.cars.length>=2;
  const tab=state.analyticsTab||'overview';
  const tabBarHtml=`<div class="analytics-tabs">
    <button class="analytics-tab${tab==='overview'?' active':''}" data-action="setAnalyticsTab" data-tab="overview">${cs?'Přehled':'Overview'}</button>
    ${canCompare?`<button class="analytics-tab${tab==='compare'?' active':''}" data-action="setAnalyticsTab" data-tab="compare">${cs?'Porovnání':'Compare'}</button>`:''}
  </div>`;

  // Route na správný obsah
  if(tab==='compare'&&canCompare){
    renderAnalyticsCompareContent(el, tabBarHtml, cs);
    return;
  }

  // Agregace dat přes vybraná vozidla
  const recs=selectedCars.flatMap(c=>getCarRecords(c.id));
  const fuels=selectedCars.flatMap(c=>getCarFuels(c.id));
  if(!recs.length&&!fuels.length){
    el.innerHTML=tabBarHtml+`<div class="empty"><div class="empty-icon">— —</div><p>${t('no_records')}</p><div style="display:flex;gap:10px;justify-content:center;margin-top:16px;"><button class="btn btn-ghost" data-action="openRecordModal">${cs?'Přidat záznam':'Add record'}</button><button class="btn btn-fuel" data-action="openFuelModal">${cs?'Přidat tankování':'Add fuel entry'}</button></div></div>`;return;
  }

  // Výpočty — agregované přes vybraná vozidla
  const purchaseCost=selectedCars.reduce((s,c)=>s+getPurchaseCost(c.id),0);
  const serviceCost=selectedCars.reduce((s,c)=>s+getServiceCost(c.id),0);
  const fuelCost=selectedCars.reduce((s,c)=>s+getTotalFuelCost(c.id),0);
  const total=purchaseCost+serviceCost+fuelCost;
  const totalWithoutPurchase=serviceCost+fuelCost;
  // km — pro jedno auto přesně, pro více aut suma
  const kmDriven=selectedCars.reduce((s,c)=>s+getKmDriven(c.id),0);
  const kmThisYear=selectedCars.reduce((s,c)=>s+getKmThisYear(c.id),0);
  const totalLiters=selectedCars.reduce((s,c)=>s+getTotalLiters(c.id),0);
  // Průměrná cena za litr
  const avgPricePerLiter=totalLiters>0?fuelCost/totalLiters:0;
  // Průměrná spotřeba — pro jedno auto přesnou metodou plné nádrže, pro více aut vážený průměr
  const singleCarId=(state.analyticsCarId&&state.analyticsCarId!=='__all__')?state.analyticsCarId:null;
  const avgC=singleCarId
    ?avgConsumptionVal(singleCarId)
    :(kmDriven>0&&totalLiters>0?totalLiters/kmDriven*100:0);
  const consumptions=singleCarId?calcConsumptions(singleCarId):[];

  // Měsíční data
  // Měsíční servis (bez nákupu vozidla)
  const byMonthService={};
  recs.filter(r=>r.cat!=='Nákup vozidla').forEach(r=>{if(!r.date)return;const m=r.date.slice(0,7);byMonthService[m]=(byMonthService[m]||0)+(r.qty||1)*(r.price||0);});
  // Měsíční palivo
  const byMonthFuel={};
  fuels.forEach(f=>{if(!f.date)return;const m=f.date.slice(0,7);byMonthFuel[m]=(byMonthFuel[m]||0)+(f.cost||0);});
  // Celkem za měsíc = servis + palivo (BEZ nákupu vozidla) — pro škálování grafu i viditelný součet
  const byMonthAll={};
  Object.keys({...byMonthService,...byMonthFuel}).forEach(m=>{
    byMonthAll[m]=(byMonthService[m]||0)+(byMonthFuel[m]||0);
  });

  const months=Object.keys(byMonthAll).sort().slice(-12);
  const maxMonth=Math.max(...months.map(m=>byMonthAll[m]),1);
  const visibleTotal=months.reduce((s,m)=>s+(byMonthAll[m]||0),0);

  // Unikátní měsíce pro průměry
  const allMonths=new Set([...Object.keys(byMonthService),...Object.keys(byMonthFuel)]);
  const monthCount=allMonths.size||1;
  const avgServicePerMonth=serviceCost/monthCount;
  const avgFuelPerMonth=fuelCost/monthCount;

  // Kategorie (bez nákupu vozidla — ten jde samostatně)
  const byCat={};
  recs.filter(r=>r.cat!=='Nákup vozidla').forEach(r=>{const c=r.cat||'Ostatní';byCat[c]=(byCat[c]||0)+(r.qty||1)*(r.price||0);});
  if(fuels.length){const fk=cs?'Palivo':'Fuel';byCat[fk]=(byCat[fk]||0)+fuelCost;}
  const sortedCats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const maxCat=sortedCats[0]?.[1]||1;

  el.innerHTML=tabBarHtml+`
    <div class="two-col">
      <div>
        <div class="section-title">${t('spending_by_cat')}</div>
        <div class="chart-wrap"><div class="cat-chart">
          ${sortedCats.map(([cat,val])=>`<div class="cat-row">
            <span class="cat-row-name" title="${esc(getCatDisplay(cat))}">${esc(getCatDisplay(cat))}</span>
            <div class="cat-bar-wrap"><div class="cat-bar-fill" style="width:${(val/maxCat*100).toFixed(1)}%;background:${CAT_COLORS[cat]||'var(--blue)'}"></div></div>
            <span class="cat-row-val">${fmtMoney(val)}</span>
          </div>`).join('')}
        </div></div>
      </div>
      <div>
        <div class="section-title">${t('monthly_spending')}</div>
        <div class="chart-wrap">
          <div class="bar-chart-header">
            <div class="bar-chart-legend">
              <span class="bar-chart-leg"><span style="width:10px;height:10px;border-radius:2px;background:var(--red);opacity:.85;display:inline-block"></span>${cs?'Servis':'Service'}</span>
              <span class="bar-chart-leg"><span style="width:10px;height:10px;border-radius:2px;background:var(--accent);opacity:.85;display:inline-block"></span>${cs?'Palivo':'Fuel'}</span>
              <span class="bar-chart-leg"><span style="width:16px;border-top:1.5px dashed var(--accent);opacity:.5;display:inline-block"></span>${cs?'Průměr':'Avg'}</span>
            </div>
            <span class="bar-chart-total">${cs?'Servis+palivo (12m)':'Service+fuel (12m)'}: ${fmtMoney(visibleTotal)}</span>
          </div>
          ${(()=>{
            if(!months.length) return '<div style="padding:32px;text-align:center;color:var(--text3)">'+t('no_records')+'</div>';

            // Auto-scale: nice round ceiling
            const niceMax=(v)=>{
              if(v<=0) return 1000;
              const mag=Math.pow(10,Math.floor(Math.log10(v)));
              const steps=[1,2,2.5,5,10];
              for(const s of steps){ const c=Math.ceil(v/(mag*s))*mag*s; if(c/v>=1.0&&c/v<=1.6) return c; }
              return Math.ceil(v/mag)*mag;
            };
            const chartMax=niceMax(maxMonth);
            const tickCount=4;
            const ticks=Array.from({length:tickCount+1},(_,i)=>Math.round(chartMax/tickCount*i));
            const fmtTick=v=>v>=1000?(v/1000).toFixed(v%1000===0?0:1)+'k':String(v);

            // Average (excl purchase)
            const avgPerMonth=monthCount>0?Math.round((serviceCost+fuelCost)/monthCount):0;
            // Scale avgPct for absolute positioning in 150px container vs 128px grid area
            const avgPct=(avgPerMonth/chartMax*(150-22)/150*100).toFixed(1);

            const gridHtml=ticks.slice(1).reverse().map(()=>'<div class="bar-chart-gridline"></div>').join('');
            const yHtml=ticks.slice().reverse().map(v=>'<div class="bar-chart-ylabel">'+fmtTick(v)+'</div>').join('');

            const barsHtml=months.map(m=>{
              const sv=byMonthService[m]||0;
              const fv=byMonthFuel[m]||0;
              const tot=byMonthAll[m]||0;
              const barPct=(tot/chartMax*100).toFixed(1);
              const sPct=tot>0?(sv/tot*100).toFixed(1):0;
              const fPct=tot>0?(fv/tot*100).toFixed(1):0;
              const monthRecs=recs.filter(r=>r.date?.slice(0,7)===m&&r.cat!=='Nákup vozidla');
              const topItems=[...monthRecs].sort((a,b)=>(b.qty||1)*(b.price||0)-(a.qty||1)*(a.price||0)).slice(0,3);
              const itemLines=topItems.map(r=>'&nbsp;· '+esc(r.desc.length>24?r.desc.slice(0,24)+'…':r.desc)+': '+fmtMoney((r.qty||1)*(r.price||0))).join('<br>');
              const tip='<strong>'+m.slice(5,7)+'/'+m.slice(0,4)+':&nbsp;'+fmtMoney(tot)+'</strong><br>'
                +(sv>0?'<span style="color:var(--red)">'+(cs?'Servis':'Service')+': '+fmtMoney(sv)+'</span><br>'+(itemLines?itemLines+'<br>':''):'')
                +(fv>0?'<span style="color:var(--accent)">'+(cs?'Palivo':'Fuel')+': '+fmtMoney(fv)+'</span>':'');
              return '<div class="bar-col" data-action="toggleChartTooltip">'
                +'<div class="bar-tooltip">'+tip+'</div>'
                +'<div class="bar-stack" style="height:'+barPct+'%;width:100%">'
                +(sv>0?'<div class="bar-segment" style="height:'+sPct+'%;background:var(--red);opacity:.82"></div>':'')
                +(fv>0?'<div class="bar-segment" style="height:'+fPct+'%;background:var(--accent);opacity:.85"></div>':'')
                +'</div>'
                +'<span class="bar-label">'+m.slice(5,7)+'/'+m.slice(2,4)+'</span>'
                +'</div>';
            }).join('');

            return '<div class="bar-chart-outer">'
              +'<div class="bar-chart-yaxis">'+yHtml+'</div>'
              +'<div class="bar-chart-inner">'
              +'<div class="bar-chart-gridlines">'+gridHtml+'</div>'
              +'<div class="bar-chart-avgline" style="bottom:calc(22px + '+avgPct+'%)">'
              +'<span class="bar-chart-avglabel">⌀&nbsp;'+fmtTick(avgPerMonth)+(cs?'/m':'/mo')+'</span>'
              +'</div>'
              +'<div class="bar-chart">'+barsHtml+'</div>'
              +'</div>'
              +'</div>';
          })()}
        </div>
      </div>
    </div>

    <div class="section-title" style="margin-top:26px">${singleCarId?(cs?'Vozidlo':'Vehicle'):(cs?'Vozidla':'Vehicles')}</div>
    <div class="stats-grid" style="margin-bottom:26px">
      ${singleCarId?`<div class="stat-card blue" title="${cs?'Aktuální stav tachometru':'Current odometer reading'}">
        <div class="stat-label">${cs?'Stav tachometru':'Odometer'}</div>
        <div class="stat-value small">${fmtNum(getMaxOdo(singleCarId))}</div>
        <div class="stat-sub">km</div>
      </div>`:``}
      ${!singleCarId?`<div class="stat-card blue" title="${cs?'Počet vozidel zahrnutých do výpočtu':'Number of vehicles included in the calculation'}">
        <div class="stat-label">${cs?'Vozidel':'Vehicles'}</div>
        <div class="stat-value small">${selectedCars.length}</div>
        <div class="stat-sub">${cs?'Ve výběru':'Selected'}</div>
      </div>`:``}
      <div class="stat-card" style="border-top:2px solid var(--blue)" title="${cs?'Celkový počet km ujetých od počátečního stavu tachometru':'Total km driven since starting odometer'}">
        <div class="stat-label">${cs?'Celkem ujeto':'Total driven'}</div>
        <div class="stat-value small">${fmtNum(kmDriven)}</div>
        <div class="stat-sub">km${!singleCarId?` · ${cs?'suma':'sum'}`:''}</div>
      </div>
      <div class="stat-card" style="border-top:2px solid var(--green)" title="${cs?'Počet km ujetých v aktuálním kalendářním roce':'Kilometres driven in the current calendar year'}">
        <div class="stat-label">${t('km_this_year')}</div>
        <div class="stat-value small">${fmtNum(kmThisYear)}</div>
        <div class="stat-sub">km · ${new Date().getFullYear()}${!singleCarId?` · ${cs?'suma':'sum'}`:''}</div>
      </div>
      <div class="stat-card" style="border-top:2px solid var(--amber)" title="${cs?'Průměrný roční nájezd: celkem ujeto ÷ počet let (aktivní měsíce ÷ 12)':'Average annual mileage: total km ÷ years (active months ÷ 12)'}">
        <div class="stat-label">${cs?'Průměr km / rok':'Avg km / year'}</div>
        <div class="stat-value small">${fmtNum(monthCount>0?Math.round(kmDriven/(monthCount/12)):0)}</div>
        <div class="stat-sub">km</div>
      </div>
    </div>

    <div class="section-title">${cs?'Náklady':'Costs'}</div>
    <div class="stats-grid" style="margin-bottom:26px">
      <div class="stat-card yellow" title="${cs?'Součet všech výdajů: servis + palivo + nákup vozidla':'Sum of all expenses: service + fuel + vehicle purchase'}">
        <div class="stat-label">${t('total_spent')}</div>
        <div class="stat-value small">${fmtMoney(total)}</div>
        <div class="stat-sub">${cs?'Vč. nákupu vozidla':'Incl. vehicle purchase'}</div>
      </div>
      ${purchaseCost>0?`<div class="stat-card" style="border-top:2px solid var(--accent2)" title="${cs?'Pořizovací cena vozidla (kategorie Nákup vozidla)':'Vehicle purchase price (category Vehicle purchase)'}">
        <div class="stat-label">${cs?'Nákup vozidla':'Vehicle purchase'}</div>
        <div class="stat-value small">${fmtMoney(purchaseCost)}</div>
        <div class="stat-sub">${cs?'Pořizovací cena':'Acquisition cost'}</div>
      </div>`:''}

      <div class="stat-card green" title="${cs?'Cena za ujetý km bez nákupu vozidla: (servis + palivo) ÷ km':'Cost per driven km excl. vehicle purchase: (service + fuel) ÷ km'}">
        <div class="stat-label">${t('cost_per_km')}</div>
        <div class="stat-value small">${fmtMoney(kmDriven>0?totalWithoutPurchase/kmDriven:0)}</div>
        <div class="stat-sub">${fmtNum(kmDriven)} km${singleCarId?` · ${cs?'bez nákupu':'excl. purchase'}`:` · ${cs?'suma km':'total km'}`}</div>
      </div>
      <div class="stat-card blue" title="${cs?'Průměrné celkové výdaje (servis + palivo + nákup) za kalendářní měsíc':'Average total expenses (service + fuel + purchase) per calendar month'}">
        <div class="stat-label">${cs?'Průměr / měsíc':'Avg / month'}</div>
        <div class="stat-value small">${fmtMoney(monthCount?total/monthCount:0)}</div>
        <div class="stat-sub">${cs?'Vč. nákupu vozidla':'Incl. vehicle purchase'}</div>
      </div>
    </div>

    <div class="section-title">${cs?'Servis':'Service'}</div>
    <div class="stats-grid" style="margin-bottom:26px">
      <div class="stat-card" style="border-top:2px solid var(--red)" title="${cs?'Celkové náklady na servis a opravy (bez nákupu vozidla a paliva)':'Total service and repair costs (excl. vehicle purchase and fuel)'}">
        <div class="stat-label">${cs?'Celkem servis':'Total service'}</div>
        <div class="stat-value small">${fmtMoney(serviceCost)}</div>
        <div class="stat-sub">${cs?'Bez nákupu a paliva':'Excl. purchase & fuel'}</div>
      </div>
      <div class="stat-card" style="border-top:2px solid var(--blue)" title="${cs?'Průměrné náklady na servis (bez nákupu vozidla a paliva) za kalendářní měsíc':'Average service costs per calendar month'}">
        <div class="stat-label">${cs?'Servis / měsíc':'Service / month'}</div>
        <div class="stat-value small">${fmtMoney(avgServicePerMonth)}</div>
        <div class="stat-sub">${cs?'Průměr bez paliva':'Avg excl. fuel'}</div>
      </div>
      <div class="stat-card" style="border-top:2px solid var(--red)" title="${cs?'Náklady na servis vztažené na ujetý km: servis ÷ km':'Service cost per driven km: service ÷ km'}">
        <div class="stat-label">${cs?'Servis za km':'Service cost/km'}</div>
        <div class="stat-value small">${fmtMoney(kmDriven>0?serviceCost/kmDriven:0)}</div>
        <div class="stat-sub">${cs?'Servis ÷ km':'Service ÷ km'}</div>
      </div>
    </div>

    <div class="section-title">${cs?'Palivo':'Fuel'}</div>
    <div class="stats-grid" style="margin-bottom:0">
      <div class="stat-card" style="border-top:2px solid var(--accent)" title="${cs?'Celkové náklady na palivo':'Total fuel costs'}">
        <div class="stat-label">${cs?'Celkem palivo':'Total fuel'}</div>
        <div class="stat-value small">${fmtMoney(fuelCost)}</div>
        <div class="stat-sub">${fmtNum(totalLiters,0)} l ${cs?'celkem':'total'}</div>
      </div>
      <div class="stat-card" style="border-top:2px solid var(--accent)" title="${cs?'Průměrné náklady na palivo za kalendářní měsíc':'Average fuel costs per calendar month'}">
        <div class="stat-label">${cs?'Palivo / měsíc':'Fuel / month'}</div>
        <div class="stat-value small">${fmtMoney(avgFuelPerMonth)}</div>
        <div class="stat-sub">${cs?'Průměr za tankování':'Avg fuel spend'}</div>
      </div>
      <div class="stat-card" style="border-top:2px solid var(--green)" title="${cs?'Cena za km pouze z nákladů na palivo — palivo ÷ ujetých km':'Fuel-only cost per km — total fuel spend ÷ driven km'}">
        <div class="stat-label">${cs?'Cena za km (palivo)':'Fuel cost/km'}</div>
        <div class="stat-value small">${fmtMoney(kmDriven>0?fuelCost/kmDriven:0)}</div>
        <div class="stat-sub">${cs?'Pouze palivo':'Fuel only'}</div>
      </div>
      <div class="stat-card orange" title="${singleCarId?(cs?'Průměrná spotřeba vypočtená z plných natankování (metoda plné nádrže)':'Average consumption calculated from full fill-ups (full tank method)'):(cs?'Vážený průměr spotřeby: celkem litrů ÷ celkem km přes vybraná vozidla':'Weighted avg consumption: total litres ÷ total km across selected vehicles')}">
        <div class="stat-label">${t('avg_consumption')}</div>
        <div class="stat-value small">${avgC>0?fmtNum(avgC,1)+' l/100km':'—'}</div>
        <div class="stat-sub">${singleCarId?fuels.length+' '+(cs?'záznamů tankování':'fuel entries'):fmtNum(totalLiters,0)+' l / '+fmtNum(kmDriven)+' km'}</div>
      </div>
      ${avgPricePerLiter>0?`<div class="stat-card" style="border-top:2px solid var(--green)" title="${cs?'Průměrná cena za litr: celkové náklady na palivo ÷ celkový počet litrů':'Average price per litre: total fuel spend ÷ total litres'}">
        <div class="stat-label">${cs?'Cena za litr':'Price / litre'}</div>
        <div class="stat-value small">${fmtNum(avgPricePerLiter,2)} Kč/l</div>
        <div class="stat-sub">${fmtNum(totalLiters,0)} l ${cs?'celkem':'total'}</div>
      </div>`:''}
    </div>`;
  // Smart tooltip positioning — runs after DOM is painted
  requestAnimationFrame(positionChartTooltips);
}

// ─── ANALYTICS — POROVNÁNÍ VOZIDEL ───────────────────────────
function renderAnalyticsCompareContent(el, tabBarHtml, cs){
  // Vybereme auta k porovnání: respektujeme výběr v car switcheru.
  // null = všechna aktivní, '__all__' = všechna vč. neaktivních, carId = jen to jedno (=> hint)
  const allActive=state.cars.filter(c=>c.status!=='inactive');
  const comparePool=state.analyticsCarId==='__all__'
    ?state.cars
    :state.analyticsCarId&&state.analyticsCarId!=='__all__'
      ?state.cars  // uživatel vybral jedno auto → stejně porovnáme všechna (hint níže)
      :allActive;

  if(comparePool.length<2){
    el.innerHTML=tabBarHtml+`<div class="empty"><div class="empty-icon">⇌</div><p>${cs?'Pro porovnání potřebujete alespoň 2 vozidla.':'Add at least 2 vehicles to use comparison.'}</p></div>`;
    return;
  }

  // Pokud uživatel vybral jedno konkrétní auto, zobrazíme hint
  const singleSelectedHint=(state.analyticsCarId&&state.analyticsCarId!=='__all__'&&state.analyticsCarId!==null)
    ?`<div style="font-size:.78rem;color:var(--text3);margin-bottom:16px;padding:10px 14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)">`
     +(cs?'Porovnání zobrazuje všechna vozidla. Pro výběr skupiny použijte přepínač vozidla výše.':'Comparison shows all vehicles. Use the vehicle switcher above to limit to active / all.')
     +`</div>`
    :'';

  // Spočítáme metriky pro každé auto — hodnota null = data nejsou k dispozici
  const carStats=comparePool.map(car=>{
    const km=getKmDriven(car.id);
    const svcCost=getServiceCost(car.id);
    const fuelCost=getTotalFuelCost(car.id);
    const totalCost=svcCost+fuelCost;
    const liters=getTotalLiters(car.id);
    const avgC=avgConsumptionVal(car.id);
    const fuels=getCarFuels(car.id);
    // Počet aktivních měsíců = unikátní YYYY-MM ve všech záznamech a tankováních
    const allDates=[...getCarRecords(car.id).map(r=>r.date),...fuels.map(f=>f.date)].filter(Boolean);
    const monthCount=new Set(allDates.map(d=>d.slice(0,7))).size||1;
    // Nájezd za posledních 12 měsíců
    const _cutoff=new Date(); _cutoff.setFullYear(_cutoff.getFullYear()-1);
    const _cutoffStr=_cutoff.toISOString().slice(0,10);
    const _odoEntries=[
      ...getCarRecords(car.id).filter(r=>r.odo&&r.date).map(r=>({date:r.date,odo:+r.odo})),
      ...fuels.filter(f=>f.odo&&f.date).map(f=>({date:f.date,odo:+f.odo}))
    ].sort((a,b)=>a.date.localeCompare(b.date));
    const _maxOdoAll=_odoEntries.length?Math.max(..._odoEntries.map(e=>e.odo)):0;
    const _before=_odoEntries.filter(e=>e.date<_cutoffStr);
    const _odoAt12Start=_before.length?Math.max(..._before.map(e=>e.odo)):(getCar(car.id)?.startOdo||0);
    const km12m=(_maxOdoAll>0&&_maxOdoAll>_odoAt12Start)?_maxOdoAll-_odoAt12Start:null;
    return{
      car,
      km:                km>0?km:null,
      totalCost:         totalCost>0?totalCost:null,
      costPerKm:         km>0&&totalCost>0?totalCost/km:null,
      fuelCostPerKm:     km>0&&fuelCost>0?fuelCost/km:null,
      avgConsumption:    avgC>0?avgC:null,
      avgCostPerMonth:   totalCost>0?totalCost/monthCount:null,
      avgServicePerMonth: svcCost>0?svcCost/monthCount:null,
      avgPricePerLiter:  liters>0&&fuelCost>0?fuelCost/liters:null,
      km12m,
    };
  });

  // Helper: sestaví ranking kartu pro jednu metriku
  // lowerIsBetter=true → nejnižší hodnota = zelená (lepší)
  // lowerIsBetter=false → neutrální (informativní), výšší = teplá barva
  function buildRankingCard(titleCs, titleEn, hintCs, hintEn, getValue, formatVal, lowerIsBetter){
    const title=cs?titleCs:titleEn;

    // Rozděl na auta s daty a bez
    const withData=carStats.filter(s=>getValue(s)!=null).sort((a,b)=>{
      const va=getValue(a), vb=getValue(b);
      return lowerIsBetter?(va-vb):(vb-va); // best first
    });
    const noData=carStats.filter(s=>getValue(s)==null);

    if(!withData.length) return ''; // metrika nemá žádná data → kartu nezobrazíme

    const maxVal=Math.max(...withData.map(s=>getValue(s)));

    const rowsHtml=withData.map((s,i)=>{
      const val=getValue(s);
      const barPct=maxVal>0?(val/maxVal*100).toFixed(1):0;
      // Barevná třída: best = první, worst = poslední (jen pokud ≥2 auta s daty)
      let cls='cmp-mid';
      if(withData.length>=2){
        if(i===0) cls='cmp-best';
        else if(i===withData.length-1) cls='cmp-worst';
      } else {
        cls='cmp-best';
      }
      const rankLabel=i===0?'#1':`#${i+1}`;
      const plate=s.car.plate?`<span class="cmp-row-plate">${esc(s.car.plate)}</span>`:'';
      const carName=esc(`${s.car.make||''} ${s.car.model||''}`.trim()||s.car.id);
      return `<div class="cmp-row ${cls}">
        <span class="cmp-rank">${rankLabel}</span>
        ${carDotHtml(s.car.color||null,'cmp-dot')}
        <span class="cmp-row-name" title="${carName}${s.car.plate?' · '+esc(s.car.plate):''}">${carName}${plate}</span>
        <div class="cmp-bar-wrap"><div class="cmp-bar-fill" style="width:${barPct}%"></div></div>
        <span class="cmp-row-val">${formatVal(val)}</span>
      </div>`;
    }).join('');

    // Auta bez dat na konci, šedě
    const naRowsHtml=noData.map(s=>{
      const carName=esc(`${s.car.make||''} ${s.car.model||''}`.trim()||s.car.id);
      const plate=s.car.plate?`<span class="cmp-row-plate">${esc(s.car.plate)}</span>`:'';
      return `<div class="cmp-row cmp-na">
        <span class="cmp-rank">—</span>
        ${carDotHtml(s.car.color||null,'cmp-dot')}
        <span class="cmp-row-name">${carName}${plate}</span>
        <span class="cmp-row-val">—</span>
      </div>`;
    }).join('');

    return `<div class="cmp-card">
      <div class="cmp-card-title">${esc(title)}</div>
      ${rowsHtml}${naRowsHtml}
    </div>`;
  }

  // Definice metrik — pořadí = vizuální pořadí karet
  const fmtKm=v=>`${fmtNum(v)} km`;
  const fmtCzkKm=v=>`${fmtNum(v,2)} Kč/km`;
  const fmtConsumption=v=>`${fmtNum(v,1)} l/100km`;
  const fmtCzk=v=>fmtMoney(v);
  const fmtLiter=v=>`${fmtNum(v,2)} Kč/l`;

  const rankingCardsHtml=[
    buildRankingCard('Průměrná spotřeba','Avg. consumption',
      'nižší = lepší','lower = better',
      s=>s.avgConsumption, fmtConsumption, true),
    buildRankingCard('Cena za km (vše)','Cost per km (total)',
      'nižší = lepší · servis + palivo','lower = better · service + fuel',
      s=>s.costPerKm, fmtCzkKm, true),
    buildRankingCard('Cena za km (palivo)','Fuel cost per km',
      'nižší = lepší','lower = better',
      s=>s.fuelCostPerKm, fmtCzkKm, true),
    buildRankingCard('Průměrná cena za litr','Avg. price per litre',
      'nižší = lepší','lower = better',
      s=>s.avgPricePerLiter, fmtLiter, true),
    buildRankingCard('Celkové průměrné náklady / měsíc','Total avg. cost / month',
      '','',
      s=>s.avgCostPerMonth, fmtCzk, true),
    buildRankingCard('Průměrné náklady za servis','Avg. service cost / month',
      '','',
      s=>s.avgServicePerMonth, fmtCzk, true),
    buildRankingCard('Celkové náklady','Total costs',
      'servis + palivo · bez nákupu','service + fuel · excl. purchase',
      s=>s.totalCost, fmtCzk, true),
    buildRankingCard('Celkový nájezd','Total mileage',
      'informativní','informational',
      s=>s.km, fmtKm, false),
    buildRankingCard('Nájezd za posledních 12 měsíců','Mileage (last 12 months)',
      'informativní','informational',
      s=>s.km12m, fmtKm, false),
  ].filter(Boolean).join('');

  // ── Srovnávací tabulka (detail) ──────────────────────────
  // Sloupce = metriky, řádky = auta
  const tableCols=[
    {key:'km',         labelCs:'Nájezd',          labelEn:'Mileage',        fmt:fmtKm,          lower:false},
    {key:'totalCost',  labelCs:'Náklady celkem',   labelEn:'Total costs',    fmt:fmtCzk,         lower:true},
    {key:'costPerKm',  labelCs:'Kč/km (vše)',      labelEn:'Cost/km (all)',  fmt:fmtCzkKm,       lower:true},
    {key:'fuelCostPerKm',labelCs:'Kč/km (palivo)', labelEn:'Fuel cost/km',  fmt:fmtCzkKm,       lower:true},
    {key:'avgConsumption',labelCs:'l/100km',        labelEn:'l/100km',       fmt:fmtConsumption, lower:true},
    {key:'avgCostPerMonth',labelCs:'Kč/měsíc',     labelEn:'Cost/month',    fmt:fmtCzk,         lower:true},
    {key:'avgServicePerMonth',labelCs:'Servis/měsíc', labelEn:'Service/month', fmt:fmtCzk,       lower:true},
  ];

  // Pro každý sloupec najdi min/max (jen z aut s daty)
  const colMinMax=tableCols.map(col=>{
    const vals=carStats.map(s=>s[col.key]).filter(v=>v!=null);
    return{min:vals.length?Math.min(...vals):null, max:vals.length?Math.max(...vals):null};
  });

  const _sk=_cmpTableSort.key, _sd=_cmpTableSort.dir;
  const _arrow=k=>_sk===k?(_sd===1?' ▲':' ▼'):'';
  const theadHtml='<tr>'
    +`<th data-action="cmpTableSort" data-key="_name">${cs?'Vozidlo':'Vehicle'}${_arrow('_name')}</th>`
    +tableCols.map(col=>`<th data-action="cmpTableSort" data-key="${col.key}">${cs?col.labelCs:col.labelEn}${_arrow(col.key)}</th>`).join('')
    +'</tr>';

  // Seřazení řádků dle aktivního sloupce
  const sortedPool=_sk==null?[...comparePool]:[...comparePool].sort((a,b)=>{
    if(_sk==='_name'){
      const na=`${a.make||''} ${a.model||''}`.trim().toLowerCase();
      const nb=`${b.make||''} ${b.model||''}`.trim().toLowerCase();
      return _sd*(na<nb?-1:na>nb?1:0);
    }
    const sa=carStats.find(x=>x.car.id===a.id);
    const sb=carStats.find(x=>x.car.id===b.id);
    const va=sa?sa[_sk]:null, vb=sb?sb[_sk]:null;
    if(va==null&&vb==null) return 0;
    if(va==null) return 1;
    if(vb==null) return -1;
    return _sd*(va-vb);
  });

  const tbodyHtml=sortedPool.map(car=>{
    const s=carStats.find(x=>x.car.id===car.id);
    const carName=`${car.make||''} ${car.model||''}`.trim()||car.id;
    const cellsHtml=tableCols.map((col,ci)=>{
      const val=s?s[col.key]:null;
      if(val==null) return `<td class="cell-na">—</td>`;
      const mm=colMinMax[ci];
      let cls='';
      if(mm.min!=null&&mm.max!=null&&mm.min!==mm.max){
        const isBest=col.lower?(val===mm.min):(val===mm.max);
        const isWorst=col.lower?(val===mm.max):(val===mm.min);
        if(isBest) cls='cell-best';
        else if(isWorst) cls='cell-worst';
      }
      return `<td class="${cls}">${col.fmt(val)}</td>`;
    }).join('');
    return `<tr><td>${carDotHtml(car.color||null,'cmp-dot')}${esc(carName)}${car.plate?` <span style="font-size:.7rem;color:var(--text3);font-family:var(--font-mono)">${esc(car.plate)}</span>`:''}</td>${cellsHtml}</tr>`;
  }).join('');

  const tableHtml=`<div class="cmp-table-section">
    <div class="section-title">${cs?'Tabulka porovnání':'Comparison table'}</div>
    <div class="cmp-table-wrap">
      <table class="cmp-table">
        <thead>${theadHtml}</thead>
        <tbody>${tbodyHtml}</tbody>
      </table>
    </div>
  </div>`;

  el.innerHTML=tabBarHtml
    +singleSelectedHint
    +`<div class="section-title" style="margin-bottom:16px">${cs?'Pořadí podle metriky':'Ranking by metric'}</div>`
    +`<div class="cmp-grid">${rankingCardsHtml}</div>`
    +tableHtml;
}

// Position bar tooltips so they never overflow the chart container
function toggleChartTooltip(col){
  const allCols=document.querySelectorAll('.bar-col');
  const wasOpen=col.classList.contains('pinned');
  // Close all
  allCols.forEach(c=>c.classList.remove('pinned'));
  // If it wasn't open, open just this one
  if(!wasOpen) col.classList.add('pinned');
}

function positionChartTooltips(){
  const chartInner=document.querySelector('.bar-chart-inner');
  if(!chartInner) return;
  const cols=chartInner.querySelectorAll('.bar-col');
  const viewportW=window.innerWidth;
  cols.forEach(col=>{
    const tip=col.querySelector('.bar-tooltip');
    if(!tip) return;
    tip.style.visibility='hidden';
    tip.style.display='block';
    const tipW=tip.offsetWidth;
    tip.style.display='';
    tip.style.visibility='';
    const cr=col.getBoundingClientRect();
    const centerX=cr.left+cr.width/2;
    tip.classList.remove('tip-left','tip-center','tip-right');
    if(centerX-tipW/2 < 8) tip.classList.add('tip-left');
    else if(centerX+tipW/2 > viewportW-8) tip.classList.add('tip-right');
    else tip.classList.add('tip-center');
  });
}

// ─── REMINDERS PAGE ──────────────────────────────────────────
// ─── AUTO-GENERATED REMINDERS ────────────────────────────────
// Dynamicky generované připomínky — nevyžadují ukládání do state
function getAutoReminders(car){
  const cs=state.lang==='cs';
  const today=new Date();today.setHours(0,0,0,0);
  const reminders=[];

  function dateRem(name,isoDate,warnDays=30){
    if(!isoDate) return;
    const d=new Date(isoDate+'T12:00:00');
    const diff=Math.round((d-today)/86400000);
    const sc=diff<0?'due':diff<warnDays?'warn':'ok';
    const detail=diff<0
      ?`${Math.abs(diff)} ${t('days')} ${cs?'prošlé':'overdue'}`
      :`${diff} ${t('days')}`;
    reminders.push({id:'auto_'+name+'_'+car.id, carId:car.id, name,
      sc, st:diff<0?t('overdue'):diff<warnDays?t('due_soon'):t('ok'),
      detail, meta:fmtDate(isoDate), auto:true});
  }

  dateRem(cs?'STK':'MOT', car.stk, car.stkWarn||30);
  dateRem(cs?'Emise':'Emissions', car.emission, car.emissionWarn||30);
  dateRem(cs?'Pojištění POV':'Liability ins.', car.pov, car.povWarn||30);
  dateRem(cs?'Havarijní pojištění':'Comprehensive ins.', car.insurance, car.insuranceWarn||30);
  dateRem(cs?'Asistenční služby':'Roadside assistance', car.assist, car.assistWarn||30);

  // Přezutí pneumatik — pouze pokud je zapnuto v nastavení a vozidlo je aktivní
  if(state.settings.tireReminders && car.status!=='inactive'){
    const year=today.getFullYear();
    // Letní přezutí: upozornit 30 dní před 31.3.
    const summerDeadline=new Date(year, 2, 31); // 31.3.
    const winterDeadline=new Date(year, 10, 1); // 1.11.
    // Pokud jsme v zimním období (1.11.–31.3.), upozornit na letní přezutí
    const inWinter=today.getMonth()>=10||today.getMonth()<=2; // Nov–Mar
    // Příští letní přezutí
    let nextSummer=new Date(year, 2, 31);
    if(today>nextSummer) nextSummer=new Date(year+1, 2, 31);
    const diffSummer=Math.round((nextSummer-today)/86400000);
    if(diffSummer<=30){
      const sc=diffSummer<0?'due':diffSummer<7?'warn':'warn';
      const summerRaw=car.tyres?.summer?tyreSummary(car.tyres.summer):'';
      const summerSize=typeof summerRaw==='object'?summerRaw.front:summerRaw;
      const summerName=(cs?'Přezutí na letní':'Switch to summer')+(summerSize?` — ${summerSize}`:'');
      reminders.push({id:'auto_tire_summer_'+car.id, carId:car.id,
        name:summerName,
        sc, st:diffSummer<0?t('overdue'):t('due_soon'),
        detail:diffSummer<0?`${Math.abs(diffSummer)} ${t('days')} ${cs?'prošlé':'overdue'}`:`${diffSummer} ${t('days')}`,
        meta:cs?'Termín: 31. 3.':'Deadline: 31 Mar', auto:true});
    }
    // Příští zimní přezutí
    let nextWinter=new Date(year, 10, 1);
    if(today>nextWinter) nextWinter=new Date(year+1, 10, 1);
    const diffWinter=Math.round((nextWinter-today)/86400000);
    if(diffWinter<=30){
      const sc=diffWinter<0?'due':'warn';
      const winterRaw=car.tyres?.winter?tyreSummary(car.tyres.winter):'';
      const winterSize=typeof winterRaw==='object'?winterRaw.front:winterRaw;
      const winterName=(cs?'Přezutí na zimní':'Switch to winter')+(winterSize?` — ${winterSize}`:'');
      reminders.push({id:'auto_tire_winter_'+car.id, carId:car.id,
        name:winterName,
        sc, st:diffWinter<0?t('overdue'):t('due_soon'),
        detail:diffWinter<0?`${Math.abs(diffWinter)} ${t('days')} ${cs?'prošlé':'overdue'}`:`${diffWinter} ${t('days')}`,
        meta:cs?'Termín: 1. 11.':'Deadline: 1 Nov', auto:true});
    }
  }

  // Výměna oleje v převodovce (automatická převodovka)
  if(car.hasAutomatic&&car.gearboxOilInterval&&car.gearboxOilLastKm){
    const maxOdo=getMaxOdo(car.id);
    const left=(car.gearboxOilLastKm+car.gearboxOilInterval)-maxOdo;
    const warnKm=car.gearboxOilWarn||1000;
    if(left<=0||left<=warnKm){
      const sc=left<=0?'due':'warn';
      reminders.push({id:'auto_gearbox_oil_'+car.id, carId:car.id,
        name:cs?'Výměna oleje v převodovce':'Gearbox oil change',
        sc, st:left<=0?t('overdue'):t('due_soon'),
        detail:left<=0?`${fmtNum(Math.abs(left))} km ${cs?'prošlé':'overdue'}`:`${fmtNum(left)} km ${t('km_left')}`,
        meta:`${fmtNum(car.gearboxOilLastKm)} + ${fmtNum(car.gearboxOilInterval)} km`, auto:true});
    }
  }
  // Výměna oleje ve čtyřkolce (pohon 4×4)
  if(car.has4x4&&car.xferOilInterval&&car.xferOilLastKm){
    const maxOdo=getMaxOdo(car.id);
    const left=(car.xferOilLastKm+car.xferOilInterval)-maxOdo;
    const warnKm=car.xferOilWarn||1000;
    if(left<=0||left<=warnKm){
      const sc=left<=0?'due':'warn';
      reminders.push({id:'auto_4x4_oil_'+car.id, carId:car.id,
        name:cs?'Výměna oleje ve čtyřkolce':'4×4 oil change',
        sc, st:left<=0?t('overdue'):t('due_soon'),
        detail:left<=0?`${fmtNum(Math.abs(left))} km ${cs?'prošlé':'overdue'}`:`${fmtNum(left)} km ${t('km_left')}`,
        meta:`${fmtNum(car.xferOilLastKm)} + ${fmtNum(car.xferOilInterval)} km`, auto:true});
    }
  }

  return reminders.filter(r=>r.sc!=='ok'); // Zobrazit pouze warn a due
}

function renderRemindersPage(){
  const el=document.getElementById('content');
  const cs=state.lang==='cs';

  // No inline picker — uses title-bar picker injected by renderPage()
  const pickedCar=state.remindersCarId?getCar(state.remindersCarId):null;
  const allActiveCarsRem=state.cars.filter(c=>c.status!=='inactive');
  const reminderCars=pickedCar?[pickedCar]:allActiveCarsRem;
  const manualReminders=reminderCars.flatMap(c=>state.reminders.filter(r=>r.carId===c.id));
  const maxOdo=pickedCar?getMaxOdo(pickedCar.id):0;
  const today=new Date();today.setHours(0,0,0,0);
  const autoReminders=reminderCars.flatMap(c=>getAutoReminders(c));

  function renderReminderCard(rem, isAuto=false){
    let sc=rem.sc||'ok', st=rem.st||t('ok'), detail=rem.detail||'';
    if(!isAuto){
      const remCarOdo=rem.carId?getMaxOdo(rem.carId):maxOdo;
      if(rem.type==='km'){
        const left=(rem.lastDone||0)+(rem.interval||0)-remCarOdo;
        if(left<=0){sc='due';st=t('overdue');}else if(left<=(rem.warnAt||1000)){sc='warn';st=t('due_soon');}else{sc='ok';st=t('ok');}
        detail=left<=0?`${fmtNum(Math.abs(left))} km ${cs?'prošlé':'overdue'}`:
               `${fmtNum(left)} km ${t('km_left')}`;
      }else if(rem.type==='date'&&rem.date){
        const d=new Date(rem.date+'T12:00:00');const diff=Math.round((d-today)/86400000);
        if(diff<0){sc='due';st=t('overdue');}else if(diff<30){sc='warn';st=t('due_soon');}else{sc='ok';st=t('ok');}
        detail=diff<0?`${Math.abs(diff)} ${t('days')} ${cs?'prošlé':'overdue'}`:`${diff} ${t('days')}`;
      }
    }
    const carName=getCar(rem.carId);
    const carLabel=carName?`${carName.make||''} ${carName.model||''}`.trim():'';
    return`<div class="reminder-card ${sc}">
      ${isAuto?`<div class="reminder-name">${esc(carLabel)}</div>`
              :`<div class="reminder-name">${esc(carLabel)}</div>`}
      <div class="reminder-val">${esc(rem.name)}</div>
      <div class="reminder-meta">${isAuto?esc(rem.meta):(rem.type==='km'?`${fmtNum(rem.lastDone||0)} + ${fmtNum(rem.interval||0)} km`:fmtDate(rem.date))}</div>
      <div class="reminder-meta">${esc(detail)}</div>
      <div class="reminder-status ${sc}">${esc(st)}</div>
      ${!isAuto?`<button class="row-btn del" data-action="deleteReminder" data-id="${safeId(rem.id)}" style="opacity:1;margin-top:8px;" title="${cs?'Smazat připomínku':'Delete reminder'}">✕</button>`:''}
    </div>`;
  }

  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <span class="section-title" style="margin:0;flex:1;">${t('reminders_title')}</span>
      <button class="btn btn-primary" data-action="openReminderModal">${t('add_reminder')}</button>
    </div>

    ${autoReminders.length?`
      <div class="section-title">${cs?'Automatické připomínky':'Automatic reminders'}</div>
      <div class="reminders-grid" style="margin-bottom:24px;">
        ${autoReminders.map(r=>renderReminderCard(r,true)).join('')}
      </div>`:''}

    <div class="section-title">${cs?'Vlastní připomínky':'Custom reminders'}</div>
    ${!manualReminders.length
      ?`<div class="empty" style="padding:28px 20px;"><div class="empty-icon">— —</div><p>${t('no_reminders')}</p><button class="btn btn-primary" data-action="openReminderModal" style="margin-top:16px;">${cs?'Přidat připomínku':'Add reminder'}</button></div>`
      :`<div class="reminders-grid">${manualReminders.map(r=>renderReminderCard(r,false)).join('')}</div>`}`;
}

// ─── MODALS ──────────────────────────────────────────────────
function openModal(id){
  document.getElementById(id).classList.add('open');
  // Auto-focus navigace pro triple date inputy
  document.getElementById(id).querySelectorAll('.date-triple').forEach(wrap=>{
    const prefix=wrap.id.replace('-wrap','');
    initDateTripleNav(prefix);
  });
}
function closeModal(id){document.getElementById(id).classList.remove('open')}

function openRecordModal(recordId){
  state.editingRecordId=recordId||null;
  const rec=recordId?state.records.find(r=>r.id===recordId):null;
  document.getElementById('record-modal-title').textContent=rec?t('edit_record'):t('new_record');
  const carSel=document.getElementById('r-car');
  carSel.innerHTML=state.cars.map(c=>`<option value="${esc(c.id)}" ${(rec?rec.carId:state.currentCarId)===c.id?'selected':''}>${esc(c.make||'')} ${esc(c.model||c.name||'')} ${c.plate?'('+esc(c.plate)+')':''}</option>`).join('');
  const catSel=document.getElementById('r-cat');
  // Nový záznam: první položka je prázdný placeholder, uživatel musí vybrat
  // Editace: předvybrána stávající kategorie záznamu
  const placeholderOpt = rec
    ? ''
    : `<option value="" disabled selected hidden>${state.lang==='cs'?'— Vyberte kategorii —':'— Select category —'}</option>`;
  catSel.innerHTML = placeholderOpt +
    CATEGORIES[state.lang].map((c,i)=>`<option value="${CATEGORIES.cs[i]}" ${rec&&rec.cat===CATEGORIES.cs[i]?'selected':''}>${c}</option>`).join('');
  const today=new Date().toISOString().slice(0,10);
  setDateTriple('r-date', rec?.date||today);
  document.getElementById('r-odo').value=rec?.odo||getMaxOdo(state.currentCarId)||'';
  document.getElementById('r-desc').value=rec?.desc||'';
  document.getElementById('r-qty').value=rec?.qty??1;
  document.getElementById('r-price').value=rec?.price??'';
  document.getElementById('r-note').value=rec?.note||'';
  document.getElementById('record-errors').innerHTML='';
  openModal('record-modal');
}

function saveRecord(){
  const errors=[];
  const date=getDateTriple('r-date');
  const odo=parseFloat(document.getElementById('r-odo').value);
  const desc=document.getElementById('r-desc').value.trim();
  const cat=document.getElementById('r-cat').value;
  const carId=document.getElementById('r-car').value;
  const qty=parseFloat(document.getElementById('r-qty').value);
  const price=parseFloat(document.getElementById('r-price').value)||0;
  const note=document.getElementById('r-note').value.trim();
  if(!date)errors.push(t('date')+': neplatné nebo neúplné datum');
  if(!desc)errors.push(t('desc')+': '+t('required_field'));
  if(!cat)errors.push(t('cat')+': '+(state.lang==='cs'?'vyberte kategorii':'please select a category'));
  if(isNaN(qty)||qty<=0)errors.push(t('qty')+': '+t('required_field'));
  if(errors.length){document.getElementById('record-errors').innerHTML=errors.map(e=>`<div class="form-error">${e}</div>`).join('');return;}
  if(state.editingRecordId){
    const idx=state.records.findIndex(r=>r.id===state.editingRecordId);
    state.records[idx]={...state.records[idx],date,odo,desc,cat,carId,qty,price,note,updatedAt:new Date().toISOString()};
  }else{
    state.records.push({id:uid(),carId,date,odo,desc,cat,qty,price,note,createdAt:new Date().toISOString()});
  }
  saveData();closeModal('record-modal');showToast(t('save'),'success');renderAll();
}

function deleteRecord(id){
  if(!confirm(t('confirm_delete')))return;
  if(state.selectedRecordId===id) state.selectedRecordId=null;
  state.records=state.records.filter(r=>r.id!==id);saveData();renderAll();
}

// ─── FUEL MODAL ──────────────────────────────────────────────
function openFuelModal(fuelId){
  state.editingFuelId=fuelId||null;
  const f=fuelId?state.fuels.find(x=>x.id===fuelId):null;
  document.getElementById('fuel-modal-title').textContent=f?(state.lang==='cs'?'Upravit tankování':'Edit fuel entry'):(state.lang==='cs'?'tankování':'Add fuel');
  const carSel=document.getElementById('f-car');
  carSel.innerHTML=state.cars.map(c=>`<option value="${esc(c.id)}" ${(f?f.carId:state.currentCarId)===c.id?'selected':''}>${esc(c.make||'')} ${esc(c.model||c.name||'')} ${c.plate?'('+esc(c.plate)+')':''}</option>`).join('');
  populateFuelTypes(f?f.carId:state.currentCarId, f?.fuelTypeId);
  const todayF=new Date().toISOString().slice(0,10);
  setDateTriple('f-date', f?.date||todayF);
  document.getElementById('f-odo').value=f?.odo||getMaxOdo(state.currentCarId)||'';
  document.getElementById('f-liters').value=f?.liters||'';
  document.getElementById('f-cost').value=f?.cost||'';
  document.getElementById('f-full').checked=f?.fullTank??true;
  document.getElementById('f-note').value=f?.note||'';
  document.getElementById('f-full-label').textContent=state.lang==='cs'?'Plná nádrž':'Full tank';
  document.getElementById('fuel-errors').innerHTML='';
  document.getElementById('fuel-calc').style.display='none';
  // Live calc — používáme oninput přímo na elementech (bez addEventListener aby se nepřidávaly duplicity)
  const fLiters=document.getElementById('f-liters');
  const fCost=document.getElementById('f-cost');
  fLiters.oninput=updateFuelCalc;
  fCost.oninput=updateFuelCalc;
  document.getElementById('f-car').onchange=function(){populateFuelTypes(this.value,null);};
  openModal('fuel-modal');
}

function populateFuelTypes(carId,selectedId){
  const opts=getFuelOptions(carId);
  const sel=document.getElementById('f-fueltype');
  sel.innerHTML=opts.map(o=>`<option value="${o.id}" ${o.id===selectedId?'selected':''}>${state.lang==='cs'?o.cs:o.en}</option>`).join('');
}

function updateFuelCalc(){
  const liters=parseFloat(document.getElementById('f-liters').value)||0;
  const cost=parseFloat(document.getElementById('f-cost').value)||0;
  const calc=document.getElementById('fuel-calc');
  if(liters>0&&cost>0){
    const ppl=cost/liters;
    calc.textContent=(state.lang==='cs'?'Cena za litr: ':'Price per litre: ')+fmtNum(ppl,2)+' Kč/l';
    calc.style.display='block';
  }else{calc.style.display='none';}
}

function saveFuel(){
  const errors=[];
  const date=getDateTriple('f-date');
  const odo=parseFloat(document.getElementById('f-odo').value)||0;
  const carId=document.getElementById('f-car').value;
  const fuelTypeId=document.getElementById('f-fueltype').value;
  const liters=parseFloat(document.getElementById('f-liters').value)||0;
  const cost=parseFloat(document.getElementById('f-cost').value)||0;
  const fullTank=document.getElementById('f-full').checked;
  const note=document.getElementById('f-note').value.trim();
  if(!date)errors.push(t('date')+': neplatné nebo neúplné datum');
  if(!liters)errors.push(t('liters')+': '+t('required_field'));
  if(!cost)errors.push(t('total_price')+': '+t('required_field'));
  if(errors.length){document.getElementById('fuel-errors').innerHTML=errors.map(e=>`<div class="form-error">${e}</div>`).join('');return;}
  if(state.editingFuelId){
    const idx=state.fuels.findIndex(f=>f.id===state.editingFuelId);
    state.fuels[idx]={...state.fuels[idx],date,odo,carId,fuelTypeId,liters,cost,fullTank,note,updatedAt:new Date().toISOString()};
  }else{
    state.fuels.push({id:uid(),carId,date,odo,fuelTypeId,liters,cost,fullTank,note,createdAt:new Date().toISOString()});
  }
  saveData();closeModal('fuel-modal');showToast(t('save'),'success');renderAll();
}

function deleteFuel(id){
  if(!confirm(t('confirm_delete')))return;
  state.fuels=state.fuels.filter(f=>f.id!==id);saveData();renderAll();
}

// ─── CAR MODAL ───────────────────────────────────────────────
// ─── TYRE HELPERS ────────────────────────────────────────────
// Povolené rychlostní indexy (dle ETRTO normy)
const TYRE_SPEED_INDEXES = new Set(['F','G','J','K','L','M','N','P','Q','R','S','T','H','U','V','W','Y','Z','ZR']);

// Generuje HTML pole pro jednu sadu pneumatik (summer/winter/allseason)

function validateSpeedIndex(el){
  const val = el.value.toUpperCase().replace(/[^A-Z]/g,'');
  el.value = val;
  const valid = !val || TYRE_SPEED_INDEXES.has(val);
  el.style.borderColor = valid ? '' : 'var(--red)';
  el.title = valid ? '' : (state.lang==='cs'?'Neplatný rychlostní index':'Invalid speed index');
}

function toggleTyreMode(){
  const allSeason = document.getElementById('c-tyre-allseason').checked;
  document.getElementById('tyre-seasonal').style.display = allSeason ? 'none' : '';
  document.getElementById('tyre-allseason').style.display = allSeason ? '' : 'none';
  const lbl = document.getElementById('c-tyre-mode-label');
  const cs = state.lang==='cs';
  lbl.textContent = allSeason
    ? (cs?'Celoroční pneumatiky':'All-season tyres')
    : (cs?'Sezónní pneumatiky (letní + zimní)':'Seasonal tyres (summer + winter)');
}

// Přečte data jedné osy z formuláře (axle: 'front' nebo 'rear')
function getTyreAxle(set, axle){
  const g = id => document.getElementById(`c-tyre-${set}-${axle}-${id}`)?.value||'';
  const width=parseInt(g('width'))||null;
  const aspect=parseInt(g('aspect'))||null;
  const rim=parseInt(g('rim'))||null;
  const load=parseInt(g('load'))||null;
  const speed=g('speed').toUpperCase().trim()||null;
  const plow=parseFloat(g('plow'))||null;
  const phigh=parseFloat(g('phigh'))||null;
  if(!width&&!aspect&&!rim&&!load&&!speed&&!plow&&!phigh) return null;
  return {width,aspect,rim,load,speed,plow,phigh};
}

// Přečte celou sadu (přední + zadní) z formuláře
function getTyreSet(set){
  const sameEl = document.getElementById(`c-tyre-${set}-same`);
  const same = sameEl ? sameEl.checked : true;
  const front = getTyreAxle(set, 'front');
  const rear  = same ? null : getTyreAxle(set, 'rear');
  const mfgDate = document.getElementById(`c-tyre-${set}-mfgdate`)?.value.trim()||null;
  if(!front && !rear && !mfgDate) return null;
  return {same, front, rear, ...(mfgDate?{mfgDate}:{})};
}

// Zapíše data jedné osy do formuláře
function setTyreAxle(set, axle, data){
  if(!data) return;
  const fields = ['width','aspect','rim','load','speed','plow','phigh'];
  fields.forEach(id => {
    const el = document.getElementById(`c-tyre-${set}-${axle}-${id}`);
    if(el) el.value = data[id]||'';
  });
}

// Zapíše celou sadu (přední + zadní) do formuláře
// Podporuje starý formát (data.width přímo na root) pro zpětnou kompatibilitu
function setTyreSet(set, data){
  if(!data) return;
  // Detekce starého formátu: data má přímo width/aspect/rim (bez front/rear)
  const isLegacy = data.width !== undefined || data.aspect !== undefined;
  if(isLegacy){
    // Starý formát → použij jako přední, zadní nechat prázdné, same=true
    setTyreAxle(set, 'front', data);
    const sameEl = document.getElementById(`c-tyre-${set}-same`);
    if(sameEl) sameEl.checked = true;
    toggleTyreSame(set);
    return;
  }
  // Nový formát
  const sameEl = document.getElementById(`c-tyre-${set}-same`);
  if(sameEl) sameEl.checked = data.same !== false;
  toggleTyreSame(set);
  setTyreAxle(set, 'front', data.front);
  if(!data.same) setTyreAxle(set, 'rear', data.rear);
  const mfgEl = document.getElementById(`c-tyre-${set}-mfgdate`);
  if(mfgEl) mfgEl.value = data.mfgDate||'';
}

// Formátuje jednu osu jako řetězec: "235/45 R17 97Y 2.2/2.5 bar"
function tyreAxleSummary(a){
  if(!a) return '';
  const parts=[];
  if(a.width&&a.aspect&&a.rim) parts.push(`${a.width}/${a.aspect} R${a.rim}`);
  else if(a.width) parts.push(`${a.width}`);
  if(a.load||a.speed) parts.push(`${a.load||''}${a.speed||''}`);
  if(a.plow||a.phigh) parts.push(`${a.plow||'?'}/${a.phigh||'?'} bar`);
  return parts.join(' ');
}

// Formátuje celou sadu — vrátí řetězec nebo objekt {front, rear} pro zobrazení
// Podporuje starý formát (přímé width na root)
function tyreSummary(t){
  if(!t) return '';
  // Starý formát — data přímo na root objektu
  if(t.width !== undefined || t.aspect !== undefined) return tyreAxleSummary(t);
  // Nový formát
  const f = tyreAxleSummary(t.front);
  const r = tyreAxleSummary(t.rear);
  if(t.same || !r) return f; // přední = zadní, vrátí jen jeden řetězec
  if(!f) return r;
  return {front: f, rear: r}; // objekt pro víceřádkové zobrazení
}

// Přepne viditelnost zadní nápravy podle toggleu "Přední = zadní"
function toggleTyreSame(set){
  const sameEl  = document.getElementById(`c-tyre-${set}-same`);
  const rearDiv = document.getElementById(`c-tyre-${set}-rear-section`);
  const lbl     = document.getElementById(`c-tyre-${set}-same-label`);
  if(!sameEl || !rearDiv) return;
  const same = sameEl.checked;
  rearDiv.style.display = same ? 'none' : '';
  if(lbl) lbl.textContent = same
    ? (state.lang==='cs' ? 'Přední = zadní (stejné)' : 'Front = rear (identical)')
    : (state.lang==='cs' ? 'Přední ≠ zadní (různé)'  : 'Front ≠ rear (different)');
}

function renderTyreTab(car){
  const cs = state.lang==='cs';
  const allSeason = car?.tyreAllSeason||false;

  // Pomocník: pole pro jednu osu (axle = 'front' | 'rear')
  const axleFields = (set, axle, plow_ph='2.2', phigh_ph='2.5') => `
    <div class="form-group">
      <label class="form-label">${cs?'Šířka (mm)':'Width (mm)'}</label>
      <input type="number" class="form-input" id="c-tyre-${set}-${axle}-width" placeholder="235" min="100" max="455" step="5">
    </div>
    <div class="form-group">
      <label class="form-label">${cs?'Výškový profil (%)':'Aspect ratio (%)'}</label>
      <input type="number" class="form-input" id="c-tyre-${set}-${axle}-aspect" placeholder="45" min="20" max="90">
    </div>
    <div class="form-group">
      <label class="form-label">${cs?'Průměr ráfku R':'Rim R'}</label>
      <input type="number" class="form-input" id="c-tyre-${set}-${axle}-rim" placeholder="17" min="10" max="26">
    </div>
    <div class="form-group">
      <label class="form-label">${cs?'Hmotnostní index':'Load index'}</label>
      <input type="number" class="form-input" id="c-tyre-${set}-${axle}-load" placeholder="97" min="50" max="130">
    </div>
    <div class="form-group">
      <label class="form-label">${cs?'Rychlostní index':'Speed index'}</label>
      <input type="text" class="form-input" id="c-tyre-${set}-${axle}-speed" placeholder="Y" maxlength="2"
        style="text-transform:uppercase" data-oninput="validateSpeedIndex">
    </div>
    <div class="form-group">
      <label class="form-label">${cs?'Tlak – nízká zátěž (bar)':'Pressure – low load (bar)'}</label>
      <input type="number" class="form-input" id="c-tyre-${set}-${axle}-plow" placeholder="${plow_ph}" min="1.5" max="4.5" step="0.1">
    </div>
    <div class="form-group">
      <label class="form-label">${cs?'Tlak – vysoká zátěž (bar)':'Pressure – high load (bar)'}</label>
      <input type="number" class="form-input" id="c-tyre-${set}-${axle}-phigh" placeholder="${phigh_ph}" min="1.5" max="4.5" step="0.1">
    </div>
    <div class="form-group"></div>`;

  // Celá sekce jedné sady: přední náprava + toggle + zadní náprava
  const setSection = (set, isSame) => `
    <div class="form-section-label full" style="margin-top:4px;border-left-color:var(--text2)">
      ${cs?'Přední náprava':'Front axle'}
    </div>
    ${axleFields(set,'front')}
    <div class="form-group full" style="margin:4px 0 2px;">
      <div class="toggle-wrap">
        <label class="toggle">
          <input type="checkbox" id="c-tyre-${set}-same" ${isSame?'checked':''}
            data-onchange="toggleTyreSame" data-set="${set}">
          <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label" id="c-tyre-${set}-same-label">
          ${isSame
            ? (cs?'Přední = zadní (stejné)':'Front = rear (identical)')
            : (cs?'Přední ≠ zadní (různé)':'Front ≠ rear (different)')}
        </span>
      </div>
    </div>
    <div id="c-tyre-${set}-rear-section" style="display:${isSame?'none':''}; grid-column:1/-1;">
      <div class="form-grid">
        <div class="form-section-label full" style="border-left-color:var(--text3)">
          ${cs?'Zadní náprava':'Rear axle'}
        </div>
        ${axleFields(set,'rear','2.4','2.7')}
      </div>
    </div>
    <div class="form-group full" style="margin-top:6px;">
      <label class="form-label">${cs?'Datum výroby pneumatik':'Tyre manufacture date'}</label>
      <input type="text" class="form-input" id="c-tyre-${set}-mfgdate"
        placeholder="${cs?'např. 2023 nebo týen/rok: 2350':'e.g. 2023 or week/year: 2350'}"
        style="font-family:var(--font-mono)" maxlength="20">
    </div>`;

  // Určíme výchozí same pro každou sadu
  const getSame = (set) => {
    const d = car?.tyres?.[set];
    if(!d) return true;               // prázdná sada → same=true
    if(d.width !== undefined) return true; // starý formát → same=true
    return d.same !== false;
  };

  const tab = document.getElementById('car-tab-tyres');
  tab.innerHTML = `
    <div class="form-grid">
      <div class="form-group full" style="margin-bottom:4px;">
        <div class="toggle-wrap">
          <label class="toggle">
            <input type="checkbox" id="c-tyre-allseason" ${allSeason?'checked':''} data-onchange="toggleTyreMode">
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label" id="c-tyre-mode-label">
            ${allSeason?(cs?'Celoroční pneumatiky':'All-season tyres'):(cs?'Sezónní pneumatiky (letní + zimní)':'Seasonal tyres (summer + winter)')}
          </span>
        </div>
      </div>
    </div>

    <div id="tyre-seasonal" style="display:${allSeason?'none':''}">
      <div class="form-grid" style="margin-top:6px;">
        <div class="form-section-label full">${cs?'Letní pneumatiky':'Summer tyres'}</div>
        ${setSection('summer', getSame('summer'))}
        <div class="form-section-label full" style="margin-top:8px;">${cs?'Zimní pneumatiky':'Winter tyres'}</div>
        ${setSection('winter', getSame('winter'))}
      </div>
    </div>

    <div id="tyre-allseason" style="display:${allSeason?'':'none'}">
      <div class="form-grid" style="margin-top:6px;">
        <div class="form-section-label full">${cs?'Celoroční pneumatiky':'All-season tyres'}</div>
        ${setSection('allseason', getSame('allseason'))}
      </div>
    </div>`;

  // Naplnit hodnotami ze stávajícího záznamu
  if(car?.tyres){
    ['summer','winter','allseason'].forEach(set=>{
      if(car.tyres[set]) setTyreSet(set, car.tyres[set]);
    });
  }
}

function switchCarTab(name,btn){
  document.querySelectorAll('.modal-tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.modal-tab-content').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('car-tab-'+name).classList.add('active');
  // Tyre tab se renderuje on-demand (lazy) — potřebuje znát aktuální auto
  if(name==='tyres') renderTyreTab(getCar(state.editingCarId));
}

// openCarModal je alias pro zpětnou kompatibilitu (sidebar edit buttony)
function openCarModal(carId){ openCarEdit(carId); }

function openCarEdit(carId){
  state.editingCarId = carId || null;
  state.editReturnPage = state.currentPage || 'fleet';
  state.openSection = 'basic';
  // Inicializuj drivetrain stav z existujícího vozidla
  const _editCar = carId ? getCar(carId) : null;
  _carEditDrivetrain = {hasAutomatic: _editCar?.hasAutomatic||false, has4x4: _editCar?.has4x4||false};
  if(carId){
    // Existující vozidlo → inline edit stránka
    state.currentCarId = carId;
    showPage('vehicle-edit');
  } else {
    // Nové vozidlo → wizard
    state.wizardStep = 1;
    showPage('vehicle-wizard');
  }
}

function updateStatusToggleLabel(isActive){
  const lbl=document.getElementById('c-status-text');
  lbl.textContent=isActive?(state.lang==='cs'?'Aktivní':'Active'):(state.lang==='cs'?'Neaktivní':'Inactive');
  lbl.style.color=isActive?'var(--green)':'var(--text3)';
}

// ── Drivetrain features (automatická převodovka / pohon 4×4) ──

// Uloží aktuální stav přepínačů pohonu (voláno z onchange na togglech)
function saveCarEditDrivetrain(){
  const cs=state.lang==='cs';
  const autoEl=document.getElementById('c-has-automatic');
  const x4El=document.getElementById('c-has-4x4');
  const hasAuto=autoEl?.checked||false;
  const has4x4=x4El?.checked||false;
  _carEditDrivetrain.hasAutomatic=hasAuto;
  _carEditDrivetrain.has4x4=has4x4;
  // Synchronizace i se wizard draftem
  _wizardDraftData['_hasAutomatic']=hasAuto;
  _wizardDraftData['_has4x4']=has4x4;
  // Aktualizace popisků toggles
  const autoText=document.getElementById('c-has-automatic-text');
  const x4Text=document.getElementById('c-has-4x4-text');
  if(autoText){autoText.textContent=hasAuto?(cs?'Ano':'Yes'):(cs?'Ne':'No');autoText.style.color=hasAuto?'var(--green)':'';}
  if(x4Text){x4Text.textContent=has4x4?(cs?'Ano':'Yes'):(cs?'Ne':'No');x4Text.style.color=has4x4?'var(--green)':'';}
}

// Vrátí HTML string pro sekci "Základní informace" (včetně drivetrain přepínačů)
function buildBasicSectionForm(cs){
  return `<div class='form-grid'>
  <div class='form-group'>
    <label class='form-label required'>${cs?'Značka':'Make'}</label>
    <div class='ac-wrap' id='ac-make-wrap'>
      <input type='text' class='form-input' id='c-make' placeholder='Škoda' autocomplete='off'
        data-oninput="acFilter" data-field="make" data-onfocus="acFilter" data-onblur="acHide"
        data-onkeydown="acKey">
      <div class='ac-dropdown' id='ac-make-list' style='display:none'></div>
    </div>
  </div>
  <div class='form-group'>
    <label class='form-label required'>Model</label>
    <div class='ac-wrap' id='ac-model-wrap'>
      <input type='text' class='form-input' id='c-model' placeholder='Octavia' autocomplete='off'
        data-oninput="acFilter" data-field="model" data-onfocus="acFilter" data-onblur="acHide"
        data-onkeydown="acKey">
      <div class='ac-dropdown' id='ac-model-list' style='display:none'></div>
    </div>
  </div>
  <div class='form-group'><label class='form-label'>${cs?'Rok výroby':'Year'}</label><input type='number' class='form-input' id='c-year' placeholder='2008' min='1900' max='2099'></div>
  <div class='form-group'><label class='form-label'>SPZ</label><input type='text' class='form-input' id='c-plate' maxlength='16' placeholder='1Z3 4567' style='text-transform:uppercase'></div>
  <div class='form-group full'><label class='form-label'>VIN</label><input type='text' class='form-input' id='c-vin' maxlength='32' placeholder='TMBBG61Z982...' style='text-transform:uppercase'></div>
  <div class='form-group'>
    <label class='form-label required'>${cs?'Typ paliva':'Fuel type'}</label>
    <select class='form-select' id='c-fueltype'>
      <option value='' disabled selected hidden>${cs?'Vyberte':'Select'}</option>
      <option value='petrol'>${cs?'Benzín':'Petrol'}</option>
      <option value='diesel'>Diesel</option>
      <option value='lpg'>LPG</option>
      <option value='electric'>${cs?'Elektro':'Electric'}</option>
      <option value='hybrid'>Hybrid</option>
      <option value='phev'>Plug-in Hybrid (PHEV)</option>
    </select>
  </div>
  <div class='form-group'>
    <label class='form-label' id='c-status-label'>${cs?'Stav':'Status'}</label>
    <div class='toggle-wrap' style='margin-top:4px'>
      <label class='toggle'><input type='checkbox' id='c-status-toggle'><span class='toggle-slider'></span></label>
      <span class='toggle-label' id='c-status-text'>${cs?'Aktivní':'Active'}</span>
    </div>
  </div>
  <div class='form-group'>
    <label class='form-label'>${cs?'Automatická převodovka':'Automatic gearbox'}</label>
    <div class='toggle-wrap' style='margin-top:4px'>
      <label class='toggle'><input type='checkbox' id='c-has-automatic' data-onchange="saveCarEditDrivetrain"><span class='toggle-slider'></span></label>
      <span class='toggle-label' id='c-has-automatic-text'>${cs?'Ne':'No'}</span>
    </div>
  </div>
  <div class='form-group'>
    <label class='form-label'>${cs?'Pohon 4×4':'4×4 drive'}</label>
    <div class='toggle-wrap' style='margin-top:4px'>
      <label class='toggle'><input type='checkbox' id='c-has-4x4' data-onchange="saveCarEditDrivetrain"><span class='toggle-slider'></span></label>
      <span class='toggle-label' id='c-has-4x4-text'>${cs?'Ne':'No'}</span>
    </div>
  </div>
  <div class='form-group'><label class='form-label'>${cs?'Počáteční km':'Start odometer'}</label><input type='number' class='form-input' id='c-startodo' placeholder='243927'></div>
  <div class='form-group'>
    <label class='form-label'>${cs?'Datum pořízení':'Date acquired'}</label>
    <div class='date-triple' id='c-acquired-wrap'>
      <input type='number' class='dt-d' id='c-acquired-d' placeholder='DD' min='1' max='31'>
      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-acquired-m' placeholder='MM' min='1' max='12'>
      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-acquired-y' placeholder='RRRR' min='1900' max='2099'>
    </div>
  </div>
  <div class='form-group'>
    <label class='form-label'>${cs?'Datum vyřazení':'Decommissioned'}</label>
    <div class='date-triple' id='c-decommissioned-wrap'>
      <input type='number' class='dt-d' id='c-decommissioned-d' placeholder='DD' min='1' max='31'>
      <span class='dt-sep'>.</span><input type='number' class='dt-m' id='c-decommissioned-m' placeholder='MM' min='1' max='12'>
      <span class='dt-sep'>.</span><input type='number' class='dt-y' id='c-decommissioned-y' placeholder='RRRR' min='1900' max='2099'>
    </div>
  </div>
  <div class='form-group full'>
    <label class='form-label'>${cs?'Barva':'Color'}</label>
    <div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:4px' id='color-picker'>
      <span class='color-swatch' style='background:#e8c547' data-color='#e8c547'></span>
      <span class='color-swatch' style='background:#ff6b35' data-color='#ff6b35'></span>
      <span class='color-swatch' style='background:#4caf82' data-color='#4caf82'></span>
      <span class='color-swatch' style='background:#5b8dee' data-color='#5b8dee'></span>
      <span class='color-swatch' style='background:#b05be8' data-color='#b05be8'></span>
      <span class='color-swatch' style='background:#e05c5c' data-color='#e05c5c'></span>
      <span class='color-swatch' style='background:#7a5230' data-color='#7a5230'></span>
      <span class='color-swatch' style='background:#c8956a' data-color='#c8956a'></span>
      <span class='color-swatch' style='background:#e8e4d8' data-color='#e8e4d8'></span>
      <span class='color-swatch' style='background:#2a2a2a;border:1px solid #555' data-color='#2a2a2a'></span>
      <span class='color-swatch' style='background:#aaa' data-color='#aaaaaa'></span>
    </div>
  </div>
</div>`;
}

// Vrátí HTML string pro sekci "Servis" (s podmíněnými sekcemi pro převodovku a 4×4)
function buildServiceSectionForm(cs, hasAutomatic, has4x4){
  const showAuto=hasAutomatic?'':'none';
  const show4x4=has4x4?'':'none';
  return `
<div class='form-grid'>
  <div class='form-section-label'>${cs?'Výměna motorového oleje':'Engine oil change'}</div>
  <div class='form-group'><label class='form-label'>${cs?'Interval (km)':'Interval (km)'}</label><input type='number' class='form-input' id='c-oil-interval' placeholder='10000'></div>
  <div class='form-group'><label class='form-label'>${cs?'Naposledy při (km)':'Last done (km)'}</label><input type='number' class='form-input' id='c-oil-last' placeholder='245448'></div>
  <div class='form-group'><label class='form-label'>${cs?'Varovat (km zbývá)':'Warn (km left)'}</label><input type='number' class='form-input' id='c-oil-warn' placeholder='1000' value='1000'></div>
  <div class='form-group'><label class='form-label'>${cs?'Typ motorového oleje':'Engine oil type'}</label><input type='text' class='form-input' id='c-oil-type' maxlength='100' placeholder='5W-30 Longlife'></div>
  <div class='form-section-label' id='gearbox-section-label' style='display:${showAuto}'>
    ${cs?'Výměna oleje v převodovce':'Gearbox oil change'}
    <span style='display:block;font-weight:400;color:var(--text3);font-size:.7rem;margin-top:1px'>${cs?'automatická převodovka':'automatic gearbox'}</span>
  </div>
  <div class='form-group' id='c-gearbox-int-grp' style='display:${showAuto}'><label class='form-label'>${cs?'Interval (km)':'Interval (km)'}</label><input type='number' class='form-input' id='c-gearbox-oil-interval' placeholder='60000'></div>
  <div class='form-group' id='c-gearbox-last-grp' style='display:${showAuto}'><label class='form-label'>${cs?'Naposledy při (km)':'Last done (km)'}</label><input type='number' class='form-input' id='c-gearbox-oil-last' placeholder='245448'></div>
  <div class='form-group' id='c-gearbox-warn-grp' style='display:${showAuto}'><label class='form-label'>${cs?'Varovat (km zbývá)':'Warn (km left)'}</label><input type='number' class='form-input' id='c-gearbox-oil-warn' value='1000'></div>
  <div class='form-group' style='display:${showAuto}'></div>
  <div class='form-section-label' id='x4-section-label' style='display:${show4x4}'>
    ${cs?'Výměna oleje ve čtyřkolce':'4×4 oil change'}
    <span style='display:block;font-weight:400;color:var(--text3);font-size:.7rem;margin-top:1px'>${cs?'pohon 4×4':'4×4 drive'}</span>
  </div>
  <div class='form-group' id='c-4x4-int-grp' style='display:${show4x4}'><label class='form-label'>${cs?'Interval (km)':'Interval (km)'}</label><input type='number' class='form-input' id='c-4x4-oil-interval' placeholder='60000'></div>
  <div class='form-group' id='c-4x4-last-grp' style='display:${show4x4}'><label class='form-label'>${cs?'Naposledy při (km)':'Last done (km)'}</label><input type='number' class='form-input' id='c-4x4-oil-last' placeholder='245448'></div>
  <div class='form-group' id='c-4x4-warn-grp' style='display:${show4x4}'><label class='form-label'>${cs?'Varovat (km zbývá)':'Warn (km left)'}</label><input type='number' class='form-input' id='c-4x4-oil-warn' value='1000'></div>
  <div class='form-group' style='display:${show4x4}'></div>
  <div class='form-section-label'>${cs?'Chladící kapalina':'Coolant'}</div>
  <div class='form-group'><label class='form-label'>${cs?'Typ chladící kapaliny':'Coolant type'}</label><input type='text' class='form-input' id='c-coolant-type' maxlength='100' placeholder='G13 / G12+'></div>
  <div class='form-group'></div>
  <div class='form-section-label'>${cs?'Poznámka k vozidlu':'Vehicle notes'}</div>
  <div class='form-group full'><textarea class='form-textarea' id='c-note' rows='3' maxlength='2000' placeholder='${cs?'Poznámky...':'Notes...'}'></textarea></div>
</div>`;
}

function saveCar(){
  const make=document.getElementById('c-make').value.trim();
  const model=document.getElementById('c-model').value.trim();
  const fuelType=document.getElementById('c-fueltype').value;

  if(!make){showToast(state.lang==='cs'?'Značka je povinná':'Make is required','error');return;}
  if(!model){showToast(state.lang==='cs'?'Model je povinný':'Model is required','error');return;}
  if(!fuelType){showToast(state.lang==='cs'?'Typ paliva je povinný':'Fuel type is required','error');return;}

  const plate = document.getElementById('c-plate').value.trim().toUpperCase() || null;
  const vin = document.getElementById('c-vin').value.trim().toUpperCase() || null;

  // Validace unikátnosti SPZ a VIN
  if(plate && state.cars.some(c => c.plate === plate && c.id !== state.editingCarId)){
    showToast(state.lang==='cs'?'Tato SPZ je již evidována u jiného vozidla':'This license plate is already registered','error');
    return;
  }
  if(vin && state.cars.some(c => c.vin === vin && c.id !== state.editingCarId)){
    showToast(state.lang==='cs'?'Toto VIN je již evidováno u jiného vozidla':'This VIN is already registered','error');
    return;
  }

  const data={
    make,model,
    year:parseInt(document.getElementById('c-year').value)||null,
    plate,
    vin,
    fuelType:document.getElementById('c-fueltype').value,
    status:document.getElementById('c-status-toggle').checked?'active':'inactive',
    startOdo:parseInt(document.getElementById('c-startodo').value)||0,
    color:state.selectedColor,
    stk:getDateTriple('c-stk')||null,
    stkWarn:parseInt(document.getElementById('c-stk-warn').value)||30,
    emission:getDateTriple('c-emission')||null,
    emissionWarn:parseInt(document.getElementById('c-emission-warn').value)||30,
    pov:getDateTriple('c-pov')||null,
    povWarn:parseInt(document.getElementById('c-pov-warn').value)||30,
    insurance:getDateTriple('c-ins')||null,
    insuranceWarn:parseInt(document.getElementById('c-ins-warn').value)||30,
    assist:getDateTriple('c-assist')||null,
    assistWarn:parseInt(document.getElementById('c-assist-warn').value)||30,
    oilInterval:parseInt(document.getElementById('c-oil-interval').value)||null,
    oilLastKm:parseInt(document.getElementById('c-oil-last').value)||null,
    oilWarn:parseInt(document.getElementById('c-oil-warn').value)||1000,
    oilType:document.getElementById('c-oil-type').value.trim()||null,
    coolantType:document.getElementById('c-coolant-type').value.trim()||null,
    // Automatická převodovka a pohon 4×4
    hasAutomatic:document.getElementById('c-has-automatic')?.checked||false,
    has4x4:document.getElementById('c-has-4x4')?.checked||false,
    gearboxOilInterval:parseInt(document.getElementById('c-gearbox-oil-interval')?.value)||null,
    gearboxOilLastKm:parseInt(document.getElementById('c-gearbox-oil-last')?.value)||null,
    gearboxOilWarn:parseInt(document.getElementById('c-gearbox-oil-warn')?.value)||1000,
    xferOilInterval:parseInt(document.getElementById('c-4x4-oil-interval')?.value)||null,
    xferOilLastKm:parseInt(document.getElementById('c-4x4-oil-last')?.value)||null,
    xferOilWarn:parseInt(document.getElementById('c-4x4-oil-warn')?.value)||1000,
    note:document.getElementById('c-note').value.trim(),
    acquired:getDateTriple('c-acquired')||null,
    decommissioned:getDateTriple('c-decommissioned')||null,
    // Pneumatiky — uložíme jen pokud byl tab otevřen (elementy existují)
    ...(document.getElementById('c-tyre-allseason')!==null ? {
      tyreAllSeason: document.getElementById('c-tyre-allseason').checked,
      tyres: {
        summer:   getTyreSet('summer'),
        winter:   getTyreSet('winter'),
        allseason: getTyreSet('allseason'),
      }
    } : {}),
  };
  if(state.editingCarId){
    const idx=state.cars.findIndex(c=>c.id===state.editingCarId);
    state.cars[idx]={...state.cars[idx],...data};
  }else{
    const nc={id:uid(),...data};
    state.cars.push(nc);state.currentCarId=nc.id;
  }
  saveData();
  // Clear wizard draft
  _wizardDraftData = {};
  // Navigate back
  const returnTo = state.editReturnPage || 'fleet';
  state.editingCarId = null;
  showPage(returnTo);
  showToast(state.lang==='cs'?'Vozidlo uloženo':'Vehicle saved','success');
}

function deleteCar(){
  if(!confirm(t('confirm_delete_car')))return;
  state.records=state.records.filter(r=>r.carId!==state.editingCarId);
  state.fuels=state.fuels.filter(f=>f.carId!==state.editingCarId);
  state.reminders=state.reminders.filter(r=>r.carId!==state.editingCarId);
  state.cars=state.cars.filter(c=>c.id!==state.editingCarId);
  state.currentCarId=state.cars[0]?.id||null;
  _wizardDraftData={};
  state.editingCarId=null;
  saveData();
  showPage('fleet');
  showToast(state.lang==='cs'?'Vozidlo smazáno':'Vehicle deleted','success');
}

// ─── REMINDERS ───────────────────────────────────────────────
function openReminderModal(){
  const carSel=document.getElementById('rem-car');
  carSel.innerHTML=state.cars.map(c=>`<option value="${esc(c.id)}" ${c.id===state.currentCarId?'selected':''}>${esc(c.make||'')} ${esc(c.model||c.name||'')}</option>`).join('');
  document.getElementById('rem-name').value='';
  document.getElementById('rem-type').value='km';
  toggleReminderType();
  prefillReminderFromCar(state.currentCarId);
  openModal('reminder-modal');
}
function prefillReminderFromCar(carId){
  const car=getCar(carId);
  const maxOdo=getMaxOdo(carId)||0;
  // Interval km — předvyplnit z profilu vozidla pokud existuje
  document.getElementById('rem-interval').value=car?.oilInterval||'';
  // Naposledy při — předvyplnit poslední výměnu oleje z profilu, fallback na max odo
  document.getElementById('rem-lastdone').value=car?.oilLastKm||maxOdo||'';
  document.getElementById('rem-warn').value=car?.oilWarn||'1000';
  setDateTriple('rem-date','');
  // Hint pod polem — zobrazit aktuální km vozidla
  const hint=document.getElementById('rem-odo-hint');
  if(hint) hint.textContent=maxOdo>0?(state.lang==='cs'?`Aktuální stav: ${fmtNum(maxOdo)} km`:`Current odometer: ${fmtNum(maxOdo)} km`):'';
}
function toggleReminderType(){
  const v=document.getElementById('rem-type').value;
  document.getElementById('rem-km-group').style.display=v==='km'?'':'none';
  document.getElementById('rem-lastdone-group').style.display=v==='km'?'':'none';
  document.getElementById('rem-warn-group').style.display=v==='km'?'':'none';
  document.getElementById('rem-date-group').style.display=v==='date'?'':'none';
}
function saveReminder(){
  const name=document.getElementById('rem-name').value.trim();
  if(!name){showToast(t('required_field'),'error');return;}
  state.reminders.push({id:uid(),carId:document.getElementById('rem-car').value,name,
    type:document.getElementById('rem-type').value,
    interval:parseInt(document.getElementById('rem-interval').value)||null,
    lastDone:parseInt(document.getElementById('rem-lastdone').value)||null,
    date:getDateTriple('rem-date')||null,
    warnAt:parseInt(document.getElementById('rem-warn').value)||1000});
  saveData();closeModal('reminder-modal');renderAll();
}
function deleteReminder(id){state.reminders=state.reminders.filter(r=>r.id!==id);saveData();renderRemindersPage();}

// ─── IMPORT / EXPORT ─────────────────────────────────────────
function exportData(){
  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  const ts=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const data=JSON.stringify({cars:state.cars,records:state.records,fuels:state.fuels,reminders:state.reminders,exportedAt:now.toISOString()},null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=`mycars_${ts}.json`;a.click();URL.revokeObjectURL(url);
  showToast(t('export_ok'),'success');
}
function importData(e){
  const file=e.target.files[0];if(!file)return;
  if(file.size>20*1024*1024){showToast('Import failed','error');e.target.value='';return;}
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const raw=safeJsonParse(ev.target.result);
      const d=sanitizeImported(raw);
      state.cars=d.cars;state.records=d.records;
      state.fuels=d.fuels;state.reminders=d.reminders;
      if(state.cars.length)state.currentCarId=state.cars[0].id;
      state.filterCat='';state.search='';state.fuelSearch='';
      saveData();renderAll();showToast(t('import_ok'),'success');
    }catch{showToast('Import failed','error');}
  };
  reader.readAsText(file);e.target.value='';
}

// ─── TOAST ───────────────────────────────────────────────────
let toastTimer;
function showToast(msg,type=''){
  const el=document.getElementById('toast');el.textContent=msg;el.className='show '+type;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.className='';},2500);
}

// ── Modal overlay — klik mimo okno NEZAVÍRÁ formulář ─────────
// Formuláře se zavírají pouze tlačítkem ✕ nebo Zrušit,
// aby nedocházelo ke ztrátě rozepsaných dat.

// ─── SETTINGS PAGE ───────────────────────────────────────────
function renderSettings(){
  const el=document.getElementById('content');
  const cs=state.lang==='cs';
  const totalRecords=state.records.length;
  const totalFuels=state.fuels.length;
  const activeCars=state.cars.filter(c=>c.status==='active').length;
  const inactiveCars=state.cars.length-activeCars;

  el.innerHTML=`

    <!-- ── Two-column layout: left = preferences, right = system/info ── -->
    <div class="settings-two-col">

      <!-- LEFT column: Vzhled · Jazyk · Připomínky -->
      <div>
        <div class="section-title">${cs?'Vzhled':'Appearance'}</div>
        <div class="settings-card settings-col-card">
          <div class="settings-card-title" style="margin-bottom:6px;">${cs?'Barevné téma':'Color theme'}</div>
          <div class="settings-card-desc" style="margin-bottom:14px;">${cs
            ?'Tmavé téma je výchozí. Světlé je optimalizované pro přímé slunce. Sklo používá průhledné prvky s gradientovým pozadím.'
            :'Dark theme is the default. Light is optimized for direct sunlight. Glass uses translucent surfaces over a gradient background.'}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button data-action="setTheme" data-theme="dark" class="btn ${(state.settings.theme||'dark')==='dark'?'btn-primary':'btn-ghost'}" style="flex:1;justify-content:center;min-width:100px;">
              ${cs?'Tmavé':'Dark'}
            </button>
            <button data-action="setTheme" data-theme="bright" class="btn ${state.settings.theme==='bright'?'btn-primary':'btn-ghost'}" style="flex:1;justify-content:center;min-width:100px;">
              ${cs?'Světlé':'Light'}
            </button>
            <button data-action="setTheme" data-theme="glass" class="btn ${state.settings.theme==='glass'?'btn-primary':'btn-ghost'}" style="flex:1;justify-content:center;min-width:100px;">
              ${cs?'Sklo':'Glass'}
            </button>
          </div>
        </div>

        <div class="section-title">${cs?'Jazyk rozhraní':'Interface language'}</div>
        <div class="settings-card settings-col-card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;">
            <div class="settings-card-title" style="margin-bottom:2px;">${cs?'Přepnout jazyk':'Switch language'}</div>
            <div style="font-size:.8rem;color:var(--text2);">${cs?'Čeština / English':'Czech / English'}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="lang-btn ${cs?'active':''}" data-action="setLang" data-lang="cs" title="Přepnout do češtiny">CS</button>
            <button class="lang-btn ${!cs?'active':''}" data-action="setLang" data-lang="en" title="Switch to English">EN</button>
          </div>
        </div>

        <div class="section-title">${cs?'Připomínky':'Reminders'}</div>
        <div class="settings-card settings-col-card">
          <div class="settings-card-title" style="margin-bottom:6px;">${cs?'Přezutí pneumatik':'Tyre change reminders'}</div>
          <div class="settings-card-desc" style="margin-bottom:12px;">${cs
            ?'Automaticky upozorní 30 dní před 1.\u00a011. (zimní) a před 31.\u00a03. (letní) pro každé aktivní vozidlo.'
            :'Automatically alerts 30 days before 1 Nov (winter) and 31 Mar (summer) for each active vehicle.'}</div>
          <div class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="setting-tire-reminders" ${state.settings.tireReminders?'checked':''}
                data-onchange="setTireReminders">
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label" style="color:${state.settings.tireReminders?'var(--green)':'var(--text2)'}">
              ${state.settings.tireReminders?(cs?'Zapnuto':'Enabled'):(cs?'Vypnuto':'Disabled')}
            </span>
          </div>
        </div>
      </div>

      <!-- RIGHT column: Instalace · Statistika · O aplikaci -->
      <div>
        <div class="section-title">${cs?'Instalace aplikace':'App installation'}</div>
        <div class="settings-card settings-col-card" id="pwa-install-card">
          <div class="settings-card-title">${cs?'Nainstalovat jako aplikaci':'Install as app'}</div>
          <div class="settings-card-desc">${cs
            ?'Nainstalujte MyCars jako PWA aplikaci. Po instalaci bude dostupná jako nativní aplikace na vašem zařízení — bez prohlížeče, s ikonou na ploše a plnou offline podporou.'
            :'Install MyCars as a PWA. After installation it will be available as a native-like app on your device — no browser chrome, home screen icon, full offline support.'}</div>
          ${location.protocol === 'file:'
            ? `<div style="padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:.82rem;color:var(--text2);line-height:1.6;">
                ${cs
                  ?'<strong style="color:var(--text)">Spuštěno přes file://</strong><br>Pro PWA instalaci otevřete aplikaci přes HTTP server nebo sdílenou složku přes LAN. Přes file:// funguje vše ostatní normálně.'
                  :'<strong style="color:var(--text)">Running via file://</strong><br>To install as a PWA, open the app via an HTTP server or LAN share. Everything else works normally over file://.'}
               </div>`
            : `<button id="pwa-install-btn" class="btn btn-primary" data-action="triggerPwaInstall" style="width:100%;justify-content:center;margin-top:4px;display:none">
                ↓ ${cs?'Nainstalovat MyCars':'Install MyCars'}
               </button>
               <div id="pwa-install-hint" style="margin-top:8px;font-size:.78rem;color:var(--text3)">
                 ${cs
                   ?'Tlačítko se zobrazí, jakmile prohlížeč potvrdí, že jsou splněna kritéria pro instalaci PWA.'
                   :'The button appears once the browser confirms PWA install criteria are met.'}
               </div>`
          }
        </div>

        <div class="section-title">${cs?'Statistika využití':'Usage statistics'}</div>
        <div class="settings-card settings-col-card">
          <div class="settings-info-row"><span>${cs?'Aktivních vozidel':'Active vehicles'}</span><span>${activeCars}</span></div>
          <div class="settings-info-row"><span>${cs?'Neaktivních vozidel':'Inactive vehicles'}</span><span>${inactiveCars}</span></div>
          <div class="settings-info-row"><span>${cs?'Servisních záznamů':'Service records'}</span><span>${totalRecords}</span></div>
          <div class="settings-info-row"><span>${cs?'Záznamů tankování':'Fuel entries'}</span><span>${totalFuels}</span></div>
        </div>

        <div class="section-title">${cs?'O aplikaci':'About'}</div>
        <div class="settings-card settings-col-card">
          <div class="settings-info-row"><span>${cs?'Aplikace':'Application'}</span><span>MyCars</span></div>
          <div class="settings-info-row"><span>${cs?'Verze':'Version'}</span><span>3.13.4</span></div>
          <div class="settings-info-row"><span>Build</span><span style="font-family:var(--font-mono)">20260526-018</span></div>
          <div class="settings-info-row"><span>${cs?'Autor':'Author'}</span><span>kraah</span></div>
          <div class="settings-info-row"><span>${cs?'Úložiště':'Storage'}</span><span>localStorage · mycars_v3</span></div>
          ${(()=>{
            const u=getStorageUsageSync();
            const kb=(u.used/1024).toFixed(1);
            const limitKb=(u.limit/1024/1024).toFixed(0);
            const color=u.pct>90?'var(--red)':u.pct>70?'var(--accent)':'var(--green)';
            return `<div class="settings-info-row"><span>${cs?'Využití úložiště':'Storage usage'}</span><span style="display:flex;align-items:center;gap:8px;min-width:200px;justify-content:flex-end">
              <div style="flex:1;max-width:120px;height:6px;background:var(--border);border-radius:3px;overflow:hidden"><div style="height:100%;width:${u.pct.toFixed(1)}%;background:${color};transition:width .3s"></div></div>
              <span style="font-family:var(--font-mono);font-size:.75rem;white-space:nowrap">${kb} KB / ~${limitKb} MB</span>
            </span></div>`;
          })()}
          <div class="settings-info-row"><span>${cs?'Dokumentace':'Documentation'}</span><span><a href="README.md" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;">README.md ↗</a></span></div>
          <div class="settings-info-row"><span>${cs?'Licence':'Licence'}</span><span><a href="https://www.gnu.org/licenses/gpl-3.0-standalone.html" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;">GNU GPL v3 ↗</a></span></div>
        </div>
      </div>

    </div><!-- /settings-two-col -->

    <!-- Full width: Data & import -->
    <div class="section-title">${cs?'Import a export dat':'Data import & export'}</div>
    <div class="settings-grid" style="margin-bottom:28px;">
      <div class="settings-card">
        <div class="settings-card-title">${cs?'Export dat (JSON)':'Export data (JSON)'}</div>
        <div class="settings-card-desc">${cs?'Stáhne kompletní zálohu všech vozidel, záznamů, tankování a připomínek jako JSON soubor.':'Downloads a complete backup of all vehicles, records, fuel entries and reminders as a JSON file.'}</div>
        <button class="btn btn-ghost" data-action="exportData" style="width:100%;justify-content:center;margin-top:4px;">↑ ${cs?'Exportovat zálohu':'Export backup'}</button>
      </div>
      <div class="settings-card">
        <div class="settings-card-title">${cs?'Import dat (JSON)':'Import data (JSON)'}</div>
        <div class="settings-card-desc">${cs?'Načte zálohu z JSON souboru. Stávající data budou nahrazena.':'Loads a backup from a JSON file. Existing data will be replaced.'}</div>
        <button class="btn btn-ghost" data-action="triggerImportFile" style="width:100%;justify-content:center;margin-top:4px;">↓ ${cs?'Importovat zálohu':'Import backup'}</button>
      </div>
      <div class="settings-card">
        <div class="settings-card-title">${cs?'Import z CSV':'Import from CSV'}</div>
        <div class="settings-card-desc">${cs?'Importuje servisní záznamy nebo tankování z CSV souboru. Podporuje formát exportu z Google Sheets.':'Imports service records or fuel entries from a CSV file. Supports Google Sheets export format.'}</div>
        <button class="btn btn-fuel" data-action="openCsvImportModal" style="width:100%;justify-content:center;margin-top:4px;">CSV ${cs?'import':'import'}</button>
      </div>
    </div>

    <!-- Full width: Delete data -->
    <div class="section-title">${cs?'Mazání dat':'Delete data'}</div>
    <div class="settings-grid" style="margin-bottom:28px;">
      <div class="settings-card">
        <div class="settings-card-title" style="color:var(--amber)">${cs?'Smazat provozní data':'Delete operational data'}</div>
        <div class="settings-card-desc">${cs?'Smaže záznamy servisu a tankování. Vozidla a jejich nastavení zůstanou zachována.':'Deletes service records and fuel entries. Vehicles and their settings will be kept.'}</div>
        <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:4px;border-color:var(--amber);color:var(--amber);" data-action="confirmDeleteOperational">${cs?'Smazat záznamy a tankování':'Delete records & fuel'}</button>
      </div>
      <div class="settings-card">
        <div class="settings-card-title" style="color:var(--red)">${cs?'Smazat veškerá data':'Delete all data'}</div>
        <div class="settings-card-desc">${cs?'Nevratně smaže všechna vozidla, záznamy, tankování a připomínky. Tuto akci nelze vzít zpět.':'Permanently deletes all vehicles, records, fuel entries and reminders. This cannot be undone.'}</div>
        <button class="btn btn-danger" data-action="confirmDeleteAll" style="width:100%;justify-content:center;margin-top:4px;">${cs?'Smazat vše':'Delete all'}</button>
      </div>
    </div>`;
}

// ─── AUTOCOMPLETE ────────────────────────────────────────────
let acIndex = { make: -1, model: -1 };

function acGetItems(field) {
  if (field === 'make') return CAR_BRANDS;
  const make = document.getElementById('c-make')?.value.trim();
  return CAR_MODELS[make] || [];
}

function acFilter(field) {
  const input = document.getElementById('c-' + field);
  const list  = document.getElementById('ac-' + field + '-list');
  if (!input || !list) return;
  const q = input.value.trim().toLowerCase();
  const items = acGetItems(field);
  const matches = q
    ? items.filter(i => i.toLowerCase().includes(q)).slice(0, 30)
    : items.slice(0, 30);
  acIndex[field] = -1;
  if (!matches.length) { list.style.display = 'none'; return; }
  list.innerHTML = matches.map((m, i) => {
    const hi = q ? m.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi'), '<strong>$1</strong>') : m;
    return `<div class="ac-item" data-val="${m}" onmousedown="acPick('${field}','${m.replace(/'/g,"\\'")}')">` + hi + '</div>';
  }).join('');
  list.style.display = 'block';
}

function acPick(field, value) {
  const input = document.getElementById('c-' + field);
  const list  = document.getElementById('ac-' + field + '-list');
  input.value = value;
  list.style.display = 'none';
  acIndex[field] = -1;
  // When brand changes, reset and re-filter model
  if (field === 'make') {
    const modelInput = document.getElementById('c-model');
    if (modelInput) modelInput.value = '';
    acFilter('model');
  }
  input.dispatchEvent(new Event('change'));
}

function acKey(event, field) {
  const list = document.getElementById('ac-' + field + '-list');
  if (!list || list.style.display === 'none') return;
  const items = list.querySelectorAll('.ac-item');
  if (!items.length) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    acIndex[field] = Math.min(acIndex[field] + 1, items.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    acIndex[field] = Math.max(acIndex[field] - 1, 0);
  } else if (event.key === 'Enter' && acIndex[field] >= 0) {
    event.preventDefault();
    acPick(field, items[acIndex[field]].dataset.val);
    return;
  } else if (event.key === 'Escape') {
    list.style.display = 'none'; return;
  }
  items.forEach((el, i) => el.classList.toggle('ac-selected', i === acIndex[field]));
  if (acIndex[field] >= 0) items[acIndex[field]].scrollIntoView({ block: 'nearest' });
}

// Close dropdowns on Escape key
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeCswMenu();
});

// Close dropdowns when clicking outside
document.addEventListener('click', e => {
  ['make','model'].forEach(f => {
    const wrap = document.getElementById('ac-' + f + '-wrap');
    if (wrap && !wrap.contains(e.target)) {
      const list = document.getElementById('ac-' + f + '-list');
      if (list) list.style.display = 'none';
    }
  });
  // Close car switcher dropdown
  const dd=document.getElementById('csw-dropdown');
  if(dd&&!dd.contains(e.target)){
    const menu=document.getElementById('csw-menu');
    const trigger=document.getElementById('csw-trigger');
    if(menu&&menu.style.display!=='none'){menu.style.display='none';trigger?.classList.remove('open');trigger?.setAttribute('aria-expanded','false');}
  }
});

loadData();setLang(state.lang);setupDatePickers();

// ─── TABLE SCROLL INDICATOR ───────────────────────────────────
// Přidá třídu .scrollable na .table-scroll pokud obsah přesahuje šířku (zobrazí gradient)
function updateTableScrollIndicators(){
  document.querySelectorAll('.table-scroll').forEach(el=>{
    el.classList.toggle('scrollable', el.scrollWidth > el.clientWidth + 4);
  });
}
// Observer na resize — reaguje na změnu velikosti okna
const _tableScrollObserver = new ResizeObserver(updateTableScrollIndicators);
// Pozorujeme #content-scroll aby observer zachytil i dynamicky renderované tabulky
const _contentScrollEl = document.getElementById('content-scroll');
if(_contentScrollEl) _tableScrollObserver.observe(_contentScrollEl);
// Volat také po každém renderu stránky (hook do renderPage)
const _origRenderPage = renderPage;
renderPage = function(){ _origRenderPage.apply(this, arguments); setTimeout(updateTableScrollIndicators, 50); };

// ─── DATE-TRIPLE: inputmode pro mobilní klávesnici ─────────────
// Všechny date-triple inputy v statickém HTML — dynamicky vygenerované dostávají
// inputmode přes initDateTripleNav (voláno z openModal)
document.querySelectorAll('.date-triple input').forEach(inp=>{
  inp.setAttribute('inputmode','numeric');
});

// ─── CSV IMPORT ───────────────────────────────────────────────

function cmpTableSort(key){
  if(_cmpTableSort.key===key){
    _cmpTableSort.dir=_cmpTableSort.dir===1?-1:1;
  } else {
    _cmpTableSort={key, dir:1};
  }
  renderAnalytics();
}

let csvParsedRows = []; // výsledek parsování, čeká na potvrzení
let _cmpTableSort  = {key: null, dir: 1}; // stav řazení tabulky porovnání

function openCsvImportModal(){
  if(!state.cars.length){showToast('Nejprve přidej vozidlo','error');return;}
  // Naplnit datalist vozidel
  const dl = document.getElementById('csv-car-list');
  dl.innerHTML = state.cars.map(c=>{
    const label=`${c.make||''} ${c.model||''}${c.plate?' ('+c.plate+')':''}`.trim();
    return `<option value="${esc(label)}"></option>`;
  }).join('');
  // Necháme prázdné – uživatel si vybere sám
  const searchEl = document.getElementById('csv-car-search');
  if(searchEl) searchEl.value='';
  // Reset do kroku 1
  document.getElementById('csv-step-1').style.display = '';
  document.getElementById('csv-step-2').style.display = 'none';
  document.getElementById('csv-import-btn').style.display = 'none';
  document.getElementById('csv-filename').textContent = 'Žádný soubor nevybrán';
  // Reset typu na placeholder
  const typeEl = document.getElementById('csv-type');
  typeEl.value = '';
  csvTypeChanged();
  csvParsedRows = [];
  openModal('csv-modal');
}

// Resolves typed car label → car ID; returns null when no exact match
function _getCsvCarId(){
  const q=(document.getElementById('csv-car-search').value||'').trim().toLowerCase();
  return state.cars.find(c=>{
    const label=`${c.make||''} ${c.model||''}${c.plate?' ('+c.plate+')':''}`.trim().toLowerCase();
    return label===q;
  })?.id||null;
}

function csvTypeChanged(){
  const type = document.getElementById('csv-type').value;
  const hint = document.getElementById('csv-format-hint');
  if(!type){
    hint.innerHTML = `<span style="color:var(--text3)">Vyberte typ importu pro zobrazení očekávaného formátu.</span>`;
    return;
  }
  if(type === 'records'){
    hint.innerHTML = `<strong style="color:var(--text);display:block;margin-bottom:4px;">Očekávaný formát sloupců — Servisní záznamy:</strong>
      <code style="color:var(--accent);">Datum, Stav tachometru, Popis, Součástky, Jednotková cena, Celková cena, Kategorie</code><br>
      Datum DD.MM.RRRR · Ceny v Kč · Kategorie nepovinná → automaticky zařazena do nové kategorie`;
  } else {
    hint.innerHTML = `<strong style="color:var(--text);display:block;margin-bottom:4px;">Očekávaný formát sloupců — Tankování:</strong>
      <code style="color:var(--accent);">Datum, Typ paliva, Tankováno litrů, Cena za litr, Celková cena, Stav tachometru, …, Plná nádrž, Poznámka</code><br>
      Datum DD.MM.RRRR · Čísla s čárkou jako desetinným oddělovačem · Plná nádrž: Ano/Ne`;
  }
}

function handleCsvFile(event){
  const type = document.getElementById('csv-type').value;
  if(!type){ showToast('Nejprve vyberte typ importu','error'); event.target.value=''; return; }
  const file = event.target.files[0];
  if(!file) return;
  document.getElementById('csv-filename').textContent = file.name;
  // Reset file input so same file can be re-selected
  event.target.value = '';
  const reader = new FileReader();
  reader.onload = e => parseCsvPreview(e.target.result);
  reader.readAsText(file, 'UTF-8');
}

// ── Parsovací utility ────────────────────────────────────────

// Odstraní mezery (včetně \xa0) a "Kč", převede českou čárku na tečku → číslo
function parseCzNum(s){
  if(!s) return 0;
  const clean = s.replace(/\xa0/g,'').replace(/\s/g,'').replace('Kč','').replace(',','.').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

// Odstraní \xa0 z tachometru a převede na int
function parseOdo(s){
  if(!s) return null;
  const clean = s.replace(/\xa0/g,'').replace(/\s/g,'').replace(',','.');
  const n = parseInt(clean);
  return isNaN(n) ? null : n;
}

// DD.MM.RRRR → YYYY-MM-DD
function csvDateToISO(s){
  if(!s || !s.trim()) return null;
  const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if(!m) return null;
  return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
}

// Mapování textového typu paliva na interní id
function csvFuelTypeToId(s){
  const v = (s||'').trim().toLowerCase();
  if(v.includes('diesel premium')) return 'dp';
  if(v.includes('diesel'))         return 'd';
  if(v.includes('lpg'))            return 'lpg';
  if(v.includes('elektr'))         return 'elec';
  if(v.includes('100'))            return 'p100';
  if(v.includes('98'))             return 'p98';
  if(v.includes('95+') || v.includes('95 +')) return 'p95p';
  if(v.includes('95') || v.includes('natural') || v.includes('e10')) return 'p95';
  return 'p95'; // fallback
}

// Jednoduché CSV parsování (zvládne quoted fields s čárkou uvnitř)
function parseCSV(text){
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim());
  const result = [];
  for(const line of lines){
    const row = [];
    let cur = '', inQ = false;
    for(let i=0; i<line.length; i++){
      const ch = line[i];
      if(ch==='"'){ inQ=!inQ; continue; }
      if(ch===',' && !inQ){ row.push(cur.trim()); cur=''; continue; }
      cur += ch;
    }
    row.push(cur.trim());
    result.push(row);
  }
  return result;
}

// ── Parsování a náhled ───────────────────────────────────────

function parseCsvPreview(text){
  const type = document.getElementById('csv-type').value;
  const rows = parseCSV(text);
  if(rows.length < 2){ showToast('CSV soubor je prázdný nebo nečitelný','error'); return; }

  const headers = rows[0].map(h=>h.replace(/\xa0/g,' ').trim());
  const dataRows = rows.slice(1).filter(r=>r.some(c=>c.trim()));

  csvParsedRows = [];
  const errors = [];

  if(type === 'records'){
    parseCsvRecords(headers, dataRows, csvParsedRows, errors);
  } else {
    parseCsvFuel(headers, dataRows, csvParsedRows, errors);
  }

  renderCsvPreview(type, csvParsedRows, errors);
}

function parseCsvRecords(headers, dataRows, out, errors){
  // Flexibilní mapování sloupců podle názvu hlavičky
  const hi = name => headers.findIndex(h=>h.toLowerCase().includes(name.toLowerCase()));
  const iDatum    = hi('datum');
  const iTacho    = hi('tachom');
  const iPopis    = hi('popis');
  const iSouc     = hi('součástky');
  const iJedCena  = hi('jednotková');
  const iCelCena  = hi('celková');
  const iKat      = hi('kategorie');

  dataRows.forEach((row, i) => {
    const dateISO = csvDateToISO(row[iDatum]);
    const popis   = (iSouc>=0 ? row[iPopis] : row[iPopis]||'').trim();
    if(!popis){ errors.push(`Řádek ${i+2}: chybí popis — přeskočen`); return; }

    // Qty a cena: zkusíme jednotkovou cenu, fallback na celkovou/qty
    const qty    = parseCzNum(row[iSouc]);
    const jedCena= parseCzNum(row[iJedCena]);
    const celCena= parseCzNum(row[iCelCena]);
    const finalQty   = qty || 1;
    const finalPrice = jedCena || (finalQty>0 ? celCena/finalQty : celCena);

    const kat = mapCatToNew((iKat>=0 && row[iKat]?.trim()) ? row[iKat].trim() : '');

    out.push({
      _ok: !!dateISO,
      _warn: !dateISO ? 'Datum chybí nebo je neplatné' : '',
      date:  dateISO || '',
      odo:   parseOdo(row[iTacho]),
      desc:  popis.slice(0,200),
      cat:   (kat||'').slice(0,80),
      qty:   finalQty,
      price: finalPrice,
      note:  '',
    });
  });
}

function parseCsvFuel(headers, dataRows, out, errors){
  const hi = name => headers.findIndex(h=>h.toLowerCase().includes(name.toLowerCase()));
  const iDatum  = hi('datum');
  const iTyp    = hi('typ');
  const iLitry  = hi('litrů');
  const iCena   = hi('celková');
  const iTacho  = hi('tachom');
  const iPlna   = hi('plná');
  const iPozmn  = hi('poznámka');

  dataRows.forEach((row, i) => {
    const dateISO = csvDateToISO(row[iDatum]);
    const liters  = parseCzNum(row[iLitry]);
    const cost    = parseCzNum(row[iCena]);
    if(!liters && !cost){ errors.push(`Řádek ${i+2}: chybí data — přeskočen`); return; }

    const plna = (row[iPlna]||'').trim().toLowerCase();

    out.push({
      _ok:    !!dateISO,
      _warn:  !dateISO ? 'Datum chybí nebo je neplatné' : '',
      date:   dateISO || '',
      fuelTypeId: csvFuelTypeToId(row[iTyp]),
      liters,
      cost,
      odo:    parseOdo(row[iTacho]),
      fullTank: plna==='ano' || plna==='yes' || plna==='1',
      note:   (iPozmn>=0 ? row[iPozmn] : '').trim().slice(0,500),
    });
  });
}

// ── Render náhledu ───────────────────────────────────────────

function renderCsvPreview(type, rows, errors){
  document.getElementById('csv-step-1').style.display = 'none';
  document.getElementById('csv-step-2').style.display = '';

  const okCount  = rows.filter(r=>r._ok).length;
  const warnCount= rows.filter(r=>!r._ok).length;
  const carId    = _getCsvCarId();
  const existingCount = carId && type==='records'
    ? state.records.filter(r=>r.carId===carId).length
    : state.fuels.filter(f=>f.carId===carId).length;

  const overwriteWarn = existingCount>0
    ? `<div style="margin-bottom:8px;padding:9px 13px;border-radius:var(--radius-sm);background:var(--red-dim);border:1px solid var(--red);color:var(--red);font-size:.8rem;">
        ⚠ Importem se smažou <strong>${existingCount}</strong> stávající ${type==='records'?'záznamy':'tankování'} tohoto vozidla a nahradí se novými.
       </div>`
    : '';

  document.getElementById('csv-preview-info').innerHTML =
    overwriteWarn +
    `Nalezeno <strong>${rows.length}</strong> řádků — ` +
    `<span style="color:var(--green)">${okCount} OK</span>` +
    (warnCount ? ` · <span style="color:var(--accent)">${warnCount} s varováním</span>` : '');

  const errEl = document.getElementById('csv-preview-errors');
  errEl.innerHTML = errors.map(e=>`<div class="form-error" style="margin-bottom:3px;">${e}</div>`).join('');

  const thead = document.getElementById('csv-preview-head');
  const tbody = document.getElementById('csv-preview-body');

  if(type === 'records'){
    thead.innerHTML = `<tr><th>Datum</th><th>Tachometr</th><th>Popis</th><th>Ks</th><th class="td-right">Jedn. cena</th><th class="td-right">Celkem</th><th>Kategorie</th><th></th></tr>`;
    tbody.innerHTML = rows.map(r=>`
      <tr style="${!r._ok?'opacity:.5':''}">
        <td class="td-mono">${r.date?fmtDate(r.date):'<span style="color:var(--accent)">—</span>'}</td>
        <td class="td-mono td-muted">${r.odo!=null?fmtNum(r.odo):'—'}</td>
        <td>${esc(r.desc)}</td>
        <td>${r.qty}</td>
        <td class="td-right td-mono">${fmtMoney(r.price)}</td>
        <td class="td-right td-mono">${fmtMoney(r.qty*r.price)}</td>
        <td><span class="cat-badge" style="background:${CAT_COLORS[r.cat]||'#555'}22;color:${CAT_COLORS[r.cat]||'#aaa'}">${esc(r.cat)}</span></td>
        <td>${r._warn?`<span style="color:var(--accent);font-size:.7rem;">${esc(r._warn)}</span>`:''}</td>
      </tr>`).join('');
  } else {
    thead.innerHTML = `<tr><th>Datum</th><th>Tachometr</th><th>Palivo</th><th class="td-right">Litry</th><th class="td-right">Celkem</th><th>Plná</th><th>Poznámka</th><th></th></tr>`;
    tbody.innerHTML = rows.map(r=>`
      <tr style="${!r._ok?'opacity:.5':''}">
        <td class="td-mono">${r.date?fmtDate(r.date):'<span style="color:var(--accent)">—</span>'}</td>
        <td class="td-mono td-muted">${r.odo!=null?fmtNum(r.odo):'—'}</td>
        <td><span class="fuel-badge">${esc(fuelTypeLabel(r.fuelTypeId))}</span></td>
        <td class="td-right td-mono">${fmtNum(r.liters,2)} l</td>
        <td class="td-right td-mono">${fmtMoney(r.cost)}</td>
        <td>${r.fullTank?'<span style="color:var(--green)">✔</span>':'—'}</td>
        <td class="td-muted">${esc(r.note||'')}</td>
        <td>${r._warn?`<span style="color:var(--accent);font-size:.7rem;">${esc(r._warn)}</span>`:''}</td>
      </tr>`).join('');
  }

  document.getElementById('csv-import-btn').style.display = okCount > 0 ? '' : 'none';
  if(okCount === 0) showToast('Žádné platné řádky k importu','error');
}

// ── Potvrzení importu ────────────────────────────────────────

function confirmCsvImport(){
  const type  = document.getElementById('csv-type').value;
  const carId = _getCsvCarId();
  const validRows = csvParsedRows.filter(r=>r._ok);
  if(!carId){ showToast('Vyberte vozidlo ze seznamu','error'); return; }
  if(!validRows.length){ showToast('Žádné platné řádky','error'); return; }

  if(type === 'records'){
    // Smazat stávající servisní záznamy pro toto vozidlo před importem
    const deletedCount = state.records.filter(r=>r.carId===carId).length;
    state.records = state.records.filter(r=>r.carId!==carId);
    validRows.forEach(r=>{
      state.records.push({
        id: uid(), carId,
        date: r.date, odo: r.odo||0,
        desc: r.desc, cat: r.cat,
        qty: r.qty, price: r.price,
        note: r.note,
        createdAt: new Date().toISOString(),
      });
    });
    showToast(`Importováno ${validRows.length} záznamů${deletedCount?` (smazáno ${deletedCount} stávajících)`:''}`, 'success');
  } else {
    // Smazat stávající tankování pro toto vozidlo před importem
    const deletedCount = state.fuels.filter(f=>f.carId===carId).length;
    state.fuels = state.fuels.filter(f=>f.carId!==carId);
    validRows.forEach(r=>{
      state.fuels.push({
        id: uid(), carId,
        date: r.date, odo: r.odo||0,
        fuelTypeId: r.fuelTypeId,
        liters: r.liters, cost: r.cost,
        fullTank: r.fullTank, note: r.note,
        createdAt: new Date().toISOString(),
      });
    });
    showToast(`Importováno ${validRows.length} tankování${deletedCount?` (smazáno ${deletedCount} stávajících)`:''}`, 'success');
  }

  saveData();
  closeModal('csv-modal');
  renderAll();
}

// ─── VEHICLE BRANDS & MODELS ─────────────────────────────────
const CAR_BRANDS = [
  // European mainstream
  'Abarth','Alfa Romeo','Audi','BMW','Citroën','CUPRA','Dacia','DS',
  'Ferrari','Fiat','Ford','Honda','Hyundai','Jaguar','Jeep','Kia',
  'Lamborghini','Lancia','Land Rover','Lexus','Maserati','Mazda',
  'Mercedes-Benz','MINI','Mitsubishi','Nissan','Opel','Peugeot',
  'Porsche','Renault','SEAT','Škoda','Smart','Subaru','Suzuki',
  'Tesla','Toyota','Volkswagen','Volvo',
  // Premium & sports
  'Aston Martin','Bentley','Bugatti','Ferrari','Koenigsegg','Lamborghini',
  'Lotus','Maserati','McLaren','Morgan','Pagani','Rimac','Rolls-Royce',
  'TVR','Wiesmann',
  // American
  'Buick','Cadillac','Chevrolet','Chrysler','Dodge','Ford','GMC',
  'Hummer','Jeep','Lincoln','Mercury','Oldsmobile','Pontiac','RAM','Rivian',
  // Asian — Japanese
  'Daihatsu','Honda','Infiniti','Isuzu','Lexus','Mazda','Mitsubishi',
  'Nissan','Subaru','Suzuki','Toyota',
  // Asian — Korean
  'Genesis','Hyundai','Kia','SsangYong',
  // Asian — Chinese
  'Aiways','BYD','Chery','GAC','Great Wall','Haval','Hongqi','JAC',
  'Lynk & Co','MG','NIO','Ora','Xpeng','Zeekr',
  // Asian — Other
  'Proton','Tata',
  // Eastern European & historical
  'Datsun','FSO','Lada','Liaz','Praga','Rover','Saab','Skoda',
  'Tatra','Trabant','Zastava','Škoda (historická)',
  // New brands & EV
  'Alpine','Fisker','Genesis','Polestar',
  // Vans & commercial (common in records)
  'Iveco','MAN','Vauxhall',
  // Rare / collector
  'AC','Ariel','Autobianchi','Avia','Bristol','Brilliance','De Tomaso',
  'Saturn','Wiesmann',
].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a.localeCompare(b,'cs'));

const CAR_MODELS = {
  'Alfa Romeo':['33','75','145','146','147','155','156','159','164','166','Brera','GTA','GTV','Giulia','Giulietta','MiTo','Spider','Stelvio','Tonale'],
  'Audi':['A1','A2','A3','A4','A4 Allroad','A5','A6','A6 Allroad','A7','A8','e-tron','e-tron GT','Q2','Q3','Q4 e-tron','Q5','Q5 Sportback','Q6','Q7','Q8','Q8 e-tron','R8','RS3','RS4','RS5','RS6','RS7','RS Q3','RS Q8','S1','S3','S4','S5','S6','S7','S8','SQ5','SQ7','SQ8','TT','TTS','TT RS'],
  'BMW':['1','2','2 Active Tourer','3','3 GT','4','5','6','6 GT','7','8','i3','i4','i5','i7','iX','iX1','iX2','iX3','M1','M2','M3','M4','M5','M6','M8','X1','X2','X3','X3 M','X4','X4 M','X5','X5 M','X6','X6 M','X7','Z3','Z4'],
  'Citroën':['AX','Berlingo','BX','C-Elysee','C1','C2','C3','C3 Aircross','C3 Picasso','C4','C4 Cactus','C4 Picasso','C4 Spacetourer','C5','C5 Aircross','C5 X','C6','C8','C-Crosser','C-Zero','Jumper','Jumpy','Nemo','Saxo','Synergie','Xantia','XM','Xsara','Xsara Picasso','ZX'],
  'CUPRA':['Ateca','Born','Formentor','Leon','Terramar'],
  'Dacia':['Bigster','Dokker','Duster','Jogger','Logan','Lodgy','Sandero','Sandero Stepway','Spring'],
  'DS':['DS3','DS3 Crossback','DS4','DS5','DS7','DS7 Crossback','DS9'],
  'Fiat':['124 Spider','127','128','500','500L','500X','Albea','Barchetta','Bravo','Brava','Coupe','Croma','Doblo','Ducato','Freemont','Grande Punto','Idea','Linea','Marea','Multipla','Palio','Panda','Punto','Scudo','Sedici','Stilo','Tipo','Ulysse'],
  'Ford':['B-Max','C-Max','EcoSport','Edge','Escape','Everest','Explorer','F-150','Fiesta','Focus','Fusion','Galaxy','Grand C-Max','Ka','Ka+','Kuga','Maverick','Mondeo','Mustang','Mustang Mach-E','Puma','Ranger','S-Max','Tourneo','Transit','Transit Connect','Transit Custom','Transit Courier'],
  'Honda':['Accord','City','Civic','CR-V','CR-Z','e','e:Ny1','FR-V','HR-V','Insight','Jazz','Legend','Logo','NSX','Pilot','Prelude','Stream'],
  'Hyundai':['Bayon','Elantra','Getz','i10','i20','i20 N','i30','i30 N','i40','i50','IONIQ','IONIQ 5','IONIQ 6','IONIQ 9','ix20','ix35','ix55','Kona','Kona Electric','Nexo','Santa Cruz','Santa Fe','Sonata','Stargazer','Staria','Terracan','Trajet','Tucson','Veloster'],
  'Jaguar':['E-Pace','E-Type','F-Pace','F-Type','I-Pace','S-Type','X-Type','XE','XF','XJ','XK'],
  'Jeep':['Avenger','Cherokee','Commander','Compass','Gladiator','Grand Cherokee','Grand Wagoneer','Patriot','Renegade','Wrangler'],
  'Kia':['Carens','Carnival','Ceed','EV3','EV6','EV9','Magentis','Niro','Optima','Picanto','ProCeed','Rio','Sorento','Soul','Sportage','Stinger','Stonic','Venga','XCeed'],
  'Land Rover':['Defender','Discovery','Discovery Sport','Freelander','Range Rover','Range Rover Evoque','Range Rover Sport','Range Rover Velar'],
  'Lexus':['CT','ES','GS','GX','IS','LC','LM','LS','LX','NX','RC','RX','RZ','UX'],
  'Mazda':['2','3','5','6','BT-50','CX-3','CX-30','CX-5','CX-60','CX-7','CX-9','MX-3','MX-5','MX-30','RX-7','RX-8'],
  'Mercedes-Benz':['A','B','C','CLA','CLE','CLS','E','EQA','EQB','EQC','EQE','EQS','G','GL','GLA','GLB','GLC','GLE','GLK','GLS','ML','R','S','SL','SLC','SLK','Sprinter','V','Vaneo','Viano','Vito'],
  'MG':['3','4','5','6','7','EHS','HS','Marvel R','ZS','ZS EV'],
  'MINI':['Cabrio','Clubman','Cooper','Countryman','Coupe','Hatch','John Cooper Works','Paceman','Roadster'],
  'Mitsubishi':['3000 GT','ASX','Carisma','Colt','Eclipse','Eclipse Cross','Galant','Grandis','L200','L300','Lancer','Outlander','Pajero','Pajero Sport','Space Gear','Space Runner','Space Star','Space Wagon'],
  'Nissan':['100 NX','200 SX','350Z','370Z','Almera','Ariya','Frontier','GT-R','Juke','Leaf','Maxima','Micra','Murano','Navara','Note','Pathfinder','Patrol','Pixo','Primera','Pulsar','Qashqai','Serena','Sunny','Terrano','Tiida','X-Trail'],
  'Opel':['Adam','Agila','Ampera','Antara','Astra','Calibra','Cascada','Combo','Corsa','Crossland','Frontera','Grandland','Insignia','Kadett','Meriva','Mokka','Mokka-e','Movano','Omega','Rekord','Senator','Signum','Sintra','Tigra','Vectra','Vivaro','Zafira','Zafira Tourer'],
  'Peugeot':['1007','104','107','108','2008','204','205','206','207','207 CC','208','3008','301','305','306','307','308','405','406','407','408','4007','4008','5008','504','505','508','607','806','807','Bipper','Expert','Partner','RCZ','Rifter','Traveller'],
  'Polestar':['1','2','3','4','5','6'],
  'Porsche':['356','718 Boxster','718 Cayman','911','918','928','944','959','964','993','996','997','Boxster','Cayenne','Cayman','Macan','Panamera','Taycan'],
  'Renault':['Arkana','Austral','Captur','Clio','Espace','Express','Fluence','Freetrekker','Grand Modus','Grand Scenic','Kadjar','Kangoo','Koleos','Laguna','Latitude','Logan','Master','Megane','Megane E-Tech','Modus','Safrane','Scenic','Symbol','Trafic','Twingo','Twizy','Vel Satis','Wind','Zoe'],
  'SEAT':['Alhambra','Altea','Altea XL','Arona','Ateca','Cordoba','Exeo','Ibiza','Inca','Leon','Leon Cupra','Mii','Tarraco','Terra','Toledo'],
  'Škoda':['Citigo','Enyaq','Enyaq Coupé','Fabia','Fabia Combi','Fabia RS','Felicia','Kamiq','Karoq','Kodiaq','Octavia','Octavia Combi','Octavia RS','Rapid','Roomster','Scala','Superb','Superb Combi','Yeti'],
  'Smart':['#1','#3','EQ','ForFour','ForTwo','Roadster'],
  'Subaru':['BRZ','Forester','Impreza','Legacy','Levorg','Outback','SVX','Tribeca','WRX','XV'],
  'Suzuki':['Alto','Baleno','Celerio','Grand Vitara','Ignis','Jimny','Kizashi','Liana','S-Cross','Splash','Swift','SX4','Vitara','Wagon R+'],
  'Tesla':['Cybertruck','Model 3','Model S','Model X','Model Y','Roadster'],
  'Toyota':['Auris','Auris Hybrid','Avensis','Aygo','bZ4X','bZ3','C-HR','Camry','Carina','Celica','Corolla','Corolla Cross','FJ Cruiser','GR86','GR Yaris','Hilux','Land Cruiser','Picnic','Prius','Prius+','ProAce','ProAce City','RAV4','RAV4 Hybrid','Sequoia','Supra','Urban Cruiser','Verso','Verso-S','Yaris','Yaris Cross','Yaris GR'],
  'Volkswagen':['Amarok','Arteon','Beetle','Bora','Caddy','California','Caravelle','CC','Crafter','e-Golf','e-up!','Eos','Fox','Golf','Golf Alltrack','Golf Estate','Golf GTD','Golf GTI','Golf GTE','Golf R','Golf Variant','ID.3','ID.4','ID.5','ID.6','ID.7','ID. Buzz','Jetta','Lupo','Multivan','Passat','Passat Alltrack','Passat CC','Phaeton','Polo','Polo GTI','Scirocco','Sharan','T-Cross','T-Roc','Tiguan','Tiguan Allspace','Touareg','Touran','Transporter','up!'],
  'Volvo':['C30','C40','C70','S40','S60','S60 Cross Country','S80','S90','V40','V40 Cross Country','V50','V60','V60 Cross Country','V70','V90','V90 Cross Country','XC40','XC60','XC70','XC90'],
  'BYD':['Atto 3','Han','Sea Lion 6','Sea Lion 7','Seal','Sealion 6','Tang'],
  'Genesis':['G70','G80','G90','GV60','GV70','GV80'],
  'Cupra':['Ateca','Born','Formentor','Leon','Terramar'],
};


// ─── PWA — Service Worker registration ───────────────────────
// Only runs over HTTP/HTTPS — silently skipped on file:// so the
// app continues to work without any changes when opened directly.
(function registerServiceWorker() {
  // Skip on file:// — app works fine without SW
  if (location.protocol === 'file:') return;
  // Skip if SW not supported
  if (!('serviceWorker' in navigator)) return;
  // Skip on any origin that doesn't own a mycars-sw.js
  // (e.g. preview sandboxes, Claude, CodePen — avoids noisy 404 errors)
  // To activate PWA: serve all three files from the same HTTP/HTTPS origin.
  if (!['localhost', '127.0.0.1'].includes(location.hostname) &&
      !location.hostname.endsWith('.local') &&
      !location.hostname.endsWith('.home') &&
      !location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    // Not a LAN/local address — check if sw file likely exists by attempting
    // a HEAD request before registering to avoid a console 404 warning.
    fetch('./mycars-sw.js', { method: 'HEAD' })
      .then(r => { if (r.ok) doRegister(); })
      .catch(() => {}); // silently skip if not reachable
    return;
  }

  doRegister();
})();

function doRegister() {
  // Auto-reload when the new SW takes control (skipWaiting already called in SW)
  let _swRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!_swRefreshing) { _swRefreshing = true; location.reload(); }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./mycars-sw.js')
      .then(reg => {
        console.log('[MyCars SW] registered, scope:', reg.scope);

        // Show a brief toast while the update downloads, then auto-reload kicks in
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast(
                state.lang === 'cs'
                  ? 'Nová verze — přenačítám…'
                  : 'New version — reloading…',
                'info'
              );
            }
          });
        });
      })
      .catch(err => console.warn('[MyCars SW] registration failed:', err));
  });
}

// ─── PWA — Install prompt ────────────────────────────────────
// The browser fires beforeinstallprompt when the PWA criteria are
// met. We capture it and surface an "Install" button in Settings.
let _pwaInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); // prevent the automatic mini-infobar
  _pwaInstallPrompt = e;
  // Reveal the install button in Settings if it is currently rendered
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.style.display = '';
});

window.addEventListener('appinstalled', () => {
  _pwaInstallPrompt = null;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.closest('.settings-card').style.display = 'none';
  showToast(
    state.lang === 'cs' ? 'Aplikace nainstalována! ✓' : 'App installed! ✓',
    'success'
  );
});

function triggerPwaInstall() {
  if (!_pwaInstallPrompt) return;
  _pwaInstallPrompt.prompt();
  _pwaInstallPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') _pwaInstallPrompt = null;
  });
}

// ─── EVENT DELEGATION ────────────────────────────────────────
// Nahrazuje všechny inline onclick/onchange/oninput/onkeydown atributy.
// Každý element používá data-action / data-onchange / data-oninput / data-onkeydown
// plus případné data-id, data-page, data-col, data-dir, data-lang, data-theme,
// data-field, data-set, data-stop-propagation atributy.

// ── Wrapper funkce pro dříve inline JS ───────────────────────
function confirmDeleteAll() {
  const cs = state.lang === 'cs';
  if (!confirm(cs ? 'Opravdu smazat veškerá data? Tuto akci nelze vzít zpět.' : 'Delete all data? This cannot be undone.')) return;
  state.cars = []; state.records = []; state.fuels = []; state.reminders = [];
  state.currentCarId = null;
  saveData(); renderAll(); showToast(cs ? 'Data smazána' : 'Data deleted', 'success');
}
function confirmDeleteOperational() {
  const cs = state.lang === 'cs';
  if (!confirm(cs ? 'Smazat všechny záznamy servisu a tankování? Vozidla zůstanou.' : 'Delete all service records and fuel entries? Vehicles will be kept.')) return;
  state.records = []; state.fuels = []; state.reminders = [];
  saveData(); renderAll(); showToast(cs ? 'Provozní data smazána' : 'Operational data deleted', 'success');
}
function clearSearchInput() {
  const el = document.getElementById('topbar-search');
  if (el) el.value = '';
  handleGlobalSearch('');
}
function triggerImportFile() { document.getElementById('import-file').click(); }
function triggerImportCsvFile() { document.getElementById('import-csv-file').click(); }
function setFilterCat(val) { state.filterCat = val; state.page = 1; renderRecords(); }
function setTireReminders(checked) { state.settings.tireReminders = checked; saveData(); renderPage(); }
function setFuelSearchVal(val) { state.fuelSearch = val; state.fuelPage = 1; renderFuelPage(); }
function setRecordsSearch(val) { state.search = val; state.page = 1; renderRecords(); }
function acHide(field) {
  const list = document.getElementById('ac-' + field + '-list');
  setTimeout(() => { if (list) list.style.display = 'none'; }, 150);
}

// ── Click dispatcher ─────────────────────────────────────────
document.addEventListener('click', function _clickDispatch(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.stopPropagation) e.stopPropagation();
  const d = el.dataset;
  switch (d.action) {
    // Navigation
    case 'showPage':            showPage(d.page); break;
    // Modals — open
    case 'openCarModal':        openCarModal(d.id); break;
    case 'openFuelModal':       openFuelModal(d.id); break;
    case 'openRecordModal':     openRecordModal(); break;
    case 'openReminderModal':   openReminderModal(); break;
    case 'openCsvImportModal':  openCsvImportModal(); break;
    // Modals — close
    case 'closeModal':          closeModal(d.id); break;
    case 'closeRecordDetail':   closeRecordDetail(); break;
    // Saves
    case 'saveCar':             saveCar(); break;
    case 'saveFuel':            saveFuel(); break;
    case 'saveRecord':          saveRecord(); break;
    case 'saveRecordInline':    saveRecordInline(); break;
    case 'saveReminder':        saveReminder(); break;
    case 'cancelCarEdit':       cancelCarEdit(); break;
    case 'wizardNext':          wizardNext(); break;
    case 'wizardBack':          wizardBack(); break;
    // Deletes
    case 'deleteCar':           deleteCar(); break;
    case 'deleteFuel':          deleteFuel(d.id); break;
    case 'deleteRecord':        deleteRecord(d.id); break;
    case 'deleteReminder':      deleteReminder(d.id); break;
    case 'confirmDeleteAll':         confirmDeleteAll(); break;
    case 'confirmDeleteOperational': confirmDeleteOperational(); break;
    // Data
    case 'exportData':          exportData(); break;
    case 'triggerImportFile':   triggerImportFile(); break;
    case 'triggerImportCsvFile':triggerImportCsvFile(); break;
    case 'confirmCsvImport':    confirmCsvImport(); break;
    // Sorting / paging
    case 'sortBy':              sortBy(d.col); break;
    case 'fuelSortBy':          fuelSortBy(d.col); break;
    case 'changePage':          changePage(Number(d.dir)); break;
    case 'changeFuelPage':      changeFuelPage(Number(d.dir)); break;
    // Car / record selection
    case 'selectCar':           selectCar(d.id); break;
    case 'selectRecord':        selectRecord(d.id); break;
    case 'selectAnalyticsCar':  selectAnalyticsCar(d.id); break;
    case 'selectRemindersCar':  selectRemindersCar(d.id); break;
    case 'setAnalyticsTab':     setAnalyticsTab(d.tab); break;
    case 'cmpTableSort':         cmpTableSort(d.key); break;
    case 'cmpTableSort':         cmpTableSort(d.key); break;
    case 'cmpTableSort':         cmpTableSort(d.key); break;
    case 'switchCar':           switchCar(d.id); break;
    // UI toggles
    case 'toggleSidebar':       toggleSidebar(); break;
    case 'toggleSearchOverlay': toggleSearchOverlay(); break;
    case 'clearSearchOverlay':  clearSearchOverlay(); break;
    case 'clearSearchInput':    clearSearchInput(); break;
    case 'closeCswMenu':        closeCswMenu(); break;
    case 'toggleCswMenu':       toggleCswMenu(); break;
    case 'toggleChartTooltip':  toggleChartTooltip(el); break;
    case 'toggleEditSection':   toggleEditSection(d.id); break;
    // Settings
    case 'setLang':             setLang(d.lang); break;
    case 'setTheme':            setTheme(d.theme); break;
    case 'triggerPwaInstall':   triggerPwaInstall(); break;
  }
});

// ── Change dispatcher ────────────────────────────────────────
document.addEventListener('change', function _changeDispatch(e) {
  const el = e.target.closest('[data-onchange]');
  if (!el) return;
  switch (el.dataset.onchange) {
    case 'importData':              importData(e); break;
    case 'handleCsvFile':           handleCsvFile(e); break;
    case 'csvTypeChanged':          csvTypeChanged(); break;
    case 'prefillReminderFromCar':  prefillReminderFromCar(el.value); break;
    case 'toggleReminderType':      toggleReminderType(); break;
    case 'toggleTyreMode':          toggleTyreMode(); break;
    case 'toggleTyreSame':          toggleTyreSame(el.dataset.set); break;
    case 'setFilterCat':            setFilterCat(el.value); break;
    case 'setTireReminders':        setTireReminders(el.checked); break;
    case 'saveCarEditDrivetrain':   saveCarEditDrivetrain(); break;
  }
});

// ── Input dispatcher ─────────────────────────────────────────
document.addEventListener('input', function _inputDispatch(e) {
  const el = e.target.closest('[data-oninput]');
  if (!el) return;
  switch (el.dataset.oninput) {
    case 'handleGlobalSearch':     handleGlobalSearch(el.value); break;
    case 'handleGlobalSearchSync': handleGlobalSearch(el.value); syncDesktopSearch(el.value); break;
    case 'setFuelSearch':          setFuelSearchVal(el.value); break;
    case 'setRecordsSearch':       setRecordsSearch(el.value); break;
    case 'acFilter':               acFilter(el.dataset.field); break;
    case 'validateSpeedIndex':     validateSpeedIndex(el); break;
  }
});

// ── Keydown dispatcher ───────────────────────────────────────
document.addEventListener('keydown', function _keydownDispatch(e) {
  const el = e.target.closest('[data-onkeydown]');
  if (!el) return;
  switch (el.dataset.onkeydown) {
    case 'acKey': acKey(e, el.dataset.field); break;
  }
});

// ── Focus dispatcher ────────────────────────────────────────────
document.addEventListener('focus', function _focusDispatch(e) {
  const el = e.target.closest('[data-onfocus]');
  if (!el) return;
  switch (el.dataset.onfocus) {
    case 'acFilter': acFilter(el.dataset.field); break;
  }
}, true);

// ── Blur dispatcher ────────────────────────────────────────────
document.addEventListener('blur', function _blurDispatch(e) {
  const el = e.target.closest('[data-onblur]');
  if (!el) return;
  switch (el.dataset.onblur) {
    case 'acHide': acHide(el.dataset.field); break;
  }
}, true);
