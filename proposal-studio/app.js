/* MrPackerMover — Proposal Studio
 * Vanilla JS, no dependencies.
 * Fill the form -> Create Proposal -> Download a real 2-page A4 vector PDF.
 * The PDF is built directly with PDF operators (no canvas / no print dialog). */
(function(){
  "use strict";
  var $=function(id){return document.getElementById(id);};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var num=function(v){var n=parseFloat(v);return isFinite(n)?n:0;};
  var fmt=function(n){return '₹'+Math.round(num(n)).toLocaleString('en-IN');};      // on-screen
  var rs =function(n){return 'Rs. '+Math.round(num(n)).toLocaleString('en-IN');};    // in PDF (WinAnsi-safe)

  var PACKING=['Standard Wrap','Bubble Wrap','Wooden Crate','Original Box','Blanket Wrap'];
  var PACK_SHORT={'Standard Wrap':'Std','Bubble Wrap':'Bubble','Wooden Crate':'Crate','Original Box':'Box','Blanket Wrap':'Blanket'};
  function shortPack(p){return PACK_SHORT[p]||p;}

  var defaultItems=[
    {name:'Sofa Set (3-Seater)',qty:2,pack:'Bubble Wrap',rem:''},
    {name:'Single Seater / Chairs',qty:4,pack:'Bubble Wrap',rem:''},
    {name:'Centre Table (Glass)',qty:1,pack:'Wooden Crate',rem:'Glass 43"'},
    {name:'LED Television — 43"',qty:1,pack:'Wooden Crate',rem:''},
    {name:'Air Conditioner (Split/Window)',qty:2,pack:'Standard Wrap',rem:'De-install'},
    {name:'Air Cooler',qty:1,pack:'Standard Wrap',rem:'Plastic'},
    {name:'Ceiling Fans',qty:3,pack:'Standard Wrap',rem:''},
    {name:'Refrigerator',qty:1,pack:'Bubble Wrap',rem:''},
    {name:'Washing Machine',qty:1,pack:'Bubble Wrap',rem:''},
    {name:'Microwave / OTG',qty:1,pack:'Standard Wrap',rem:''},
    {name:'Water Purifier',qty:1,pack:'Standard Wrap',rem:''},
    {name:'Gas Stove',qty:1,pack:'Standard Wrap',rem:''},
    {name:'Dining Table + Chairs',qty:1,pack:'Bubble Wrap',rem:''},
    {name:'Double Bed',qty:1,pack:'Standard Wrap',rem:'Folding'},
    {name:'Single Bed',qty:1,pack:'Standard Wrap',rem:''},
    {name:'Mattress',qty:3,pack:'Standard Wrap',rem:''},
    {name:'Almirah (Big)',qty:1,pack:'Standard Wrap',rem:''},
    {name:'Dressing Table',qty:1,pack:'Bubble Wrap',rem:''},
    {name:'Temple / Mandir',qty:1,pack:'Bubble Wrap',rem:'Fragile'},
    {name:'Geyser',qty:1,pack:'Standard Wrap',rem:''},
    {name:'Motorcycle / Scooter',qty:1,pack:'Blanket Wrap',rem:'Fuel drained'},
    {name:'Bicycle (Kids)',qty:1,pack:'Standard Wrap',rem:''},
    {name:'Cartons (Assorted)',qty:15,pack:'Standard Wrap',rem:'Crockery, books'},
    {name:'Wooden Boxes',qty:2,pack:'Standard Wrap',rem:''}
  ];
  var defaultCharges=[
    {name:'Professional packing — material & labour',amt:18000},
    {name:'Transportation (Meerut → Jamnagar)',amt:24000},
    {name:'Loading & unloading',amt:6000},
    {name:'Unpacking & basic rearrangement',amt:4000},
    {name:'Toll, permits & state entry',amt:3000}
  ];
  var defaultServices=[
    'Professional packing — Premium 5-layer materials, room-wise labelling',
    'Trained & verified crew — Uniformed, background-checked movers',
    'GPS-tracked transport — Dedicated container, live location on request',
    'Loading & unloading — Careful handling with floor & wall protection',
    'Unpacking & rearrangement — Boxes opened and furniture placed',
    'All-risk transit insurance — Optional cover on declared goods value'
  ];
  var defaultTerms=[
    'This proposal is valid for the number of days stated on page one from the date of issue.',
    'Prices are inclusive of packing material, labour and standard transportation as itemised.',
    'Transit insurance is optional and charged on the declared value of goods; claims are settled as per the insurer’s policy.',
    'Handling beyond ground floor, long carry over 50 m, or lift-unavailability may attract additional charges, informed in advance.',
    'A booking advance confirms the move; the balance is payable before unloading at destination.',
    'Dismantling / re-fixing of modular furniture, ACs and geysers by technicians is chargeable at actuals unless stated.',
    'The company is not liable for internal or mechanical damage to electronic items that are self-packed or undeclared.',
    'Delivery timelines are good-faith estimates and may vary due to road, weather or regulatory conditions beyond our control.',
    'Perishables, cash, jewellery, documents and hazardous materials are not accepted for transit.',
    'Any dispute is subject to the jurisdiction of the courts at the company’s registered city.'
  ];

  /* ---------- editor rows ---------- */
  function itemRowHTML(it){it=it||{};var opts=PACKING.map(function(p){return '<option'+(p===it.pack?' selected':'')+'>'+p+'</option>';}).join('');
    return '<div class="irow"><input class="fi i-name" value="'+esc(it.name)+'" placeholder="Article name"><input class="fi i-qty" type="number" min="0" value="'+(it.qty==null?1:it.qty)+'"><select class="fi i-pack">'+opts+'</select><input class="fi i-rem" value="'+esc(it.rem)+'" placeholder="Remarks (optional)"><button class="row-del" type="button" title="Remove" aria-label="Remove">✕</button></div>';}
  function chargeRowHTML(c){c=c||{};return '<div class="crow"><input class="fi c-name" value="'+esc(c.name)+'" placeholder="Charge description"><input class="fi c-amt" type="number" min="0" value="'+(c.amt==null?'':c.amt)+'"><button class="row-del" type="button" title="Remove" aria-label="Remove">✕</button></div>';}
  function initRows(){
    $('itemRows').innerHTML=defaultItems.map(itemRowHTML).join('');
    $('chargeRows').innerHTML=defaultCharges.map(chargeRowHTML).join('');
    $('f_services').value=defaultServices.join('\n');
    $('f_terms').value=defaultTerms.join('\n');
  }

  /* ---------- dates ---------- */
  function two(n){return (n<10?'0':'')+n;}
  function isoToday(){var d=new Date();return d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate());}
  function addDays(iso,days){var d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+days);return d;}
  function prettyDate(d){if(typeof d==='string'){d=new Date(d+'T00:00:00');}if(isNaN(d))return '-';var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return two(d.getDate())+' '+m[d.getMonth()]+' '+d.getFullYear();}
  var QUOTE_NO;
  function initDates(){var t=isoToday();var md=addDays(t,8);$('m_date').value=md.getFullYear()+'-'+two(md.getMonth()+1)+'-'+two(md.getDate());var d=new Date();QUOTE_NO='MPM-'+d.getFullYear()+two(d.getMonth()+1)+two(d.getDate())+'-'+two(((d.getHours()*60+d.getMinutes())%99)+1);}

  function inWords(n){n=Math.round(num(n));if(n===0)return 'Zero';var a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];var b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];function t2(x){return x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:'');}function t3(x){return (x>=100?a[Math.floor(x/100)]+' Hundred'+(x%100?' ':''):'')+(x%100?t2(x%100):'');}var out='';var cr=Math.floor(n/10000000);n%=10000000;var lk=Math.floor(n/100000);n%=100000;var th=Math.floor(n/1000);n%=1000;if(cr)out+=t2(cr)+' Crore ';if(lk)out+=t2(lk)+' Lakh ';if(th)out+=t2(th)+' Thousand ';if(n)out+=t3(n);return out.trim();}

  /* ---------- totals + collect ---------- */
  function recalc(){
    var sub=0,rows=$('chargeRows').querySelectorAll('.crow');
    for(var i=0;i<rows.length;i++){sub+=num(rows[i].querySelector('.c-amt').value);}
    var gstRate=num($('f_gst').value),gv=num($('f_goods').value),insRate=num($('f_insrate').value);
    var premium=Math.round(gv*insRate/100),gst=Math.round(sub*gstRate/100),grand=sub+gst+premium;
    $('f_premium').value=premium;
    $('sumSub').textContent=fmt(sub);$('sumGstLbl').textContent='GST @ '+gstRate+'% · extra';$('sumGst').textContent=fmt(gst);$('sumIns').textContent=fmt(premium);$('sumGrand').textContent=fmt(sub);
    var allin=$('sumAllin');if(allin)allin.textContent=fmt(grand);
    var items=$('itemRows').querySelectorAll('.irow'),cnt=0;
    for(var j=0;j<items.length;j++){if(items[j].querySelector('.i-name').value.trim())cnt+=Math.max(0,num(items[j].querySelector('.i-qty').value))||0;}
    $('ab_items').textContent=cnt;$('ab_total').textContent=fmt(sub);
    return {sub:sub,gstRate:gstRate,gst:gst,gv:gv,insRate:insRate,premium:premium,grand:grand};
  }
  function val(id){return $(id).value.trim();}
  function collect(){
    var items=[],irows=$('itemRows').querySelectorAll('.irow');
    for(var i=0;i<irows.length;i++){var nm=irows[i].querySelector('.i-name').value.trim();if(!nm)continue;items.push({name:nm,qty:num(irows[i].querySelector('.i-qty').value),pack:irows[i].querySelector('.i-pack').value,rem:irows[i].querySelector('.i-rem').value.trim()});}
    var charges=[],crows=$('chargeRows').querySelectorAll('.crow');
    for(var k=0;k<crows.length;k++){var cn=crows[k].querySelector('.c-name').value.trim();if(!cn)continue;charges.push({name:cn,amt:num(crows[k].querySelector('.c-amt').value)});}
    var t=recalc();
    return {
      company:{name:val('c_name'),tag:val('c_tag'),phone:val('c_phone'),mobile:val('c_mobile'),email:val('c_email'),web:val('c_web'),addr:val('c_addr'),gst:val('c_gst'),rep:val('c_rep')},
      customer:{name:val('m_name'),phone:val('m_phone'),email:val('m_email')},
      move:{from:val('m_from'),froms:val('m_froms'),to:val('m_to'),tos:val('m_tos'),date:$('m_date').value,house:$('m_house').value,dist:val('m_dist'),svc:$('m_svc').value},
      items:items,charges:charges,totals:t,
      services:$('f_services').value.split('\n').map(function(s){return s.trim();}).filter(Boolean),
      terms:$('f_terms').value.split('\n').map(function(s){return s.trim();}).filter(Boolean),
      pay:val('f_pay'),validDays:num($('f_valid').value)||15
    };
  }

  /* ================= ON-SCREEN PREVIEW (HTML) ================= */
  var IC={
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/></svg>',
    globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7.5" cy="18" r="1.7" fill="#fff" stroke="none"/><circle cx="17.5" cy="18" r="1.7" fill="#fff" stroke="none"/></svg>',
    truckdark:'<svg viewBox="0 0 24 24" fill="none" stroke="#231a07" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7.5" cy="18" r="1.6" fill="#231a07" stroke="none"/><circle cx="17.5" cy="18" r="1.6" fill="#231a07" stroke="none"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };
  function invTableHTML(list,offset){
    var rows=list.map(function(it,i){
      return '<tr><td class="c-n">'+(offset+i+1)+'</td><td>'+esc(it.name)+(it.rem?'<span class="rmk">'+esc(it.rem)+'</span>':'')+'</td><td class="c-q">'+(it.qty||0)+'</td><td class="c-p">'+esc(shortPack(it.pack))+'</td></tr>';
    }).join('');
    return '<table class="inv"><thead><tr><th class="c-n">#</th><th>Article</th><th class="c-q">Qty</th><th class="c-p">Pack</th></tr></thead><tbody>'+rows+'</tbody></table>';
  }
  function render(d){
    var c=d.company,cu=d.customer,mv=d.move,t=d.totals;
    var validTill=prettyDate(addDays(isoToday(),d.validDays));
    var totalArticles=d.items.reduce(function(s,it){return s+(num(it.qty)||0);},0);
    var mid=Math.ceil(d.items.length/2);
    var invLeft=invTableHTML(d.items.slice(0,mid),0), invRight=invTableHTML(d.items.slice(mid),mid);
    var chargeRows=d.charges.map(function(c){return '<tr><td>'+esc(c.name)+'</td><td class="num">'+fmt(c.amt)+'</td></tr>';}).join('');
    var svc=d.services.map(function(s){var p=s.split(/—|–|\|/);var h=p[0].trim();var sub=(p.slice(1).join('—')).trim();return '<div class="svc"><span class="ck">'+IC.check+'</span><div><b>'+esc(h)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</div></div>';}).join('');
    var terms=d.terms.map(function(x){return '<li>'+esc(x)+'</li>';}).join('');
    var contact=[];
    if(c.phone)contact.push('<span>'+IC.phone+esc(c.phone)+'</span>');
    if(c.mobile)contact.push('<span>'+IC.phone+esc(c.mobile)+'</span>');
    if(c.email)contact.push('<span>'+IC.mail+esc(c.email)+'</span>');
    if(c.web)contact.push('<span>'+IC.globe+esc(c.web)+'</span>');

    var s1='<section class="sheet s1"><header class="masthead"><div class="mast-top">'+
      '<div class="mast-brand"><span class="mm">'+IC.truck+'</span><div><div class="mast-name">'+esc(c.name)+'</div><div class="mast-tag">'+esc(c.tag)+'</div></div></div>'+
      '<div class="mast-right"><div class="p-eyebrow">Moving Proposal</div><div class="mast-quote">'+esc(QUOTE_NO)+'</div>'+
      '<div class="mast-meta"><span class="k">Date</span><span class="v">'+prettyDate(isoToday())+'</span><span class="k">Valid till</span><span class="v">'+validTill+'</span></div></div></div>'+
      '<div class="mast-contact">'+contact.join('')+(c.addr?'<span>'+IC.pin+esc(c.addr)+'</span>':'')+'</div></header>'+
      '<div class="body"><div class="parties">'+
      '<div class="party"><div class="p-eyebrow">Prepared for</div><div class="name">'+esc(cu.name||'-')+'</div><div class="lines">'+(cu.phone?esc(cu.phone)+'<br>':'')+(cu.email?esc(cu.email):'')+'</div></div>'+
      '<div class="party"><div class="p-eyebrow">Prepared by</div><div class="name">'+esc(c.name)+'</div><div class="lines">'+esc(c.rep||'')+(c.gst?'<br>GSTIN: '+esc(c.gst):'')+'</div></div></div>'+
      '<div class="route"><div class="route-map">'+
      '<div class="route-end from"><div class="lbl">From</div><div class="city">'+esc(mv.from||'-')+'</div><div class="sub">'+esc(mv.froms||'')+'</div></div>'+
      '<div class="route-line"><div class="track"></div><span class="dotA"></span><span class="dotB"></span><div class="truck">'+IC.truck+'</div></div>'+
      '<div class="route-end to"><div class="lbl">To</div><div class="city">'+esc(mv.to||'-')+'</div><div class="sub">'+esc(mv.tos||'')+'</div></div></div>'+
      '<div class="route-chips">'+
      '<div class="chip"><div class="k">Move date</div><div class="v">'+prettyDate(mv.date)+'</div></div>'+
      '<div class="chip"><div class="k">Home size</div><div class="v">'+esc(mv.house)+'</div></div>'+
      '<div class="chip"><div class="k">Distance</div><div class="v">'+esc(mv.dist||'-')+'</div></div>'+
      '<div class="chip"><div class="k">Service</div><div class="v">'+esc(mv.svc)+'</div></div></div></div>'+
      '<p class="intro">Dear '+esc(cu.name||'Customer')+', thank you for choosing <b>'+esc(c.name)+'</b> for your '+esc(mv.house)+' relocation from <b>'+esc(mv.from)+'</b> to <b>'+esc(mv.to)+'</b>. Please find your itemised inventory and a fully transparent estimate below — with no hidden charges.</p>'+
      '<div class="p-block"><div class="p-sec"><h3>Inventory of Articles</h3><div class="rule"></div><div class="meta">'+d.items.length+' items · '+totalArticles+' articles</div></div>'+
      '<div class="inv-cols"><div>'+invLeft+'</div><div>'+invRight+'</div></div></div>'+
      '<div class="p-block"><div class="p-sec"><h3>Cost Estimate</h3><div class="rule"></div><div class="meta">All figures in ₹ INR</div></div>'+
      '<div class="grandbar"><div><div class="gl">Grand Total</div><div class="gi">+ GST @ '+t.gstRate+'% extra'+(t.premium>0?' &nbsp;·&nbsp; + Insurance extra':'')+'</div></div><div class="gv">'+fmt(t.sub)+'</div></div>'+
      '<div class="costfoot"><div><span class="p-eyebrow">In words</span>Rupees '+inWords(t.sub)+' Only</div><div class="ct-r"><span class="p-eyebrow">Payment terms</span>'+esc(d.pay)+'</div></div>'+
      '<div class="validstrip">'+IC.clock+'<div>This estimate is valid till <b>'+validTill+'</b>. Book early to lock your move date &amp; pricing.</div></div></div>'+
      '<div class="pagefoot"><span><span class="gold">'+esc(c.name)+'</span> · '+esc(QUOTE_NO)+'</span><span>Page 1 of 2 — Quotation</span></div></div></section>';

    var s2='<section class="sheet s2"><header class="slimhead"><div class="slim-l"><span class="mm">'+IC.truck+'</span><b>'+esc(c.name)+'</b></div>'+
      '<div class="slim-r"><div class="p-eyebrow">Terms &amp; Agreement</div><div class="q">'+esc(QUOTE_NO)+'</div></div></header><div class="body">'+
      '<div class="p-block"><div class="p-sec"><h3>What’s Included</h3><div class="rule"></div></div><div class="svc-grid">'+svc+'</div></div>'+
      '<div class="p-block"><div class="p-sec"><h3>Terms &amp; Conditions</h3><div class="rule"></div></div><ol class="terms">'+terms+'</ol></div>'+
      '<div class="p-block"><div class="p-sec"><h3>Acceptance</h3><div class="rule"></div></div>'+
      '<div class="signs"><div class="sign"><div class="line"></div><div class="who">For '+esc(c.name)+'</div><div class="role">Authorised Signatory · Date</div></div>'+
      '<div class="sign"><div class="line"></div><div class="who">'+esc(cu.name||'Customer')+'</div><div class="role">Accepted — Signature &amp; Date</div></div></div></div>'+
      '<div class="pagefoot"><span><span class="gold">'+esc(c.name)+'</span> · '+esc(QUOTE_NO)+'</span><span>Page 2 of 2 — Terms</span></div></div>'+
      '<div class="p-foot"><div><div class="thanks">Thank you for trusting '+esc(c.name)+' with your move.</div>'+
      '<div class="ct">'+[c.phone,c.mobile,c.email,c.web].filter(Boolean).map(esc).join(' · ')+(c.addr?' · '+esc(c.addr):'')+'</div></div>'+
      '<div class="p-badges"><span class="b">Insured Transit</span><span class="b">On-time Delivery</span><span class="b">Trained Crew</span><span class="b">GPS Tracked</span><span class="b">24×7 Support</span></div></div></section>';

    $('doc').innerHTML=s1+s2;
  }

  /* ================= VECTOR PDF GENERATOR ================= */
  var PW=595.28, PH=841.89, CM=40, CW=PW-2*CM, RX=PW-CM;
  // Helvetica & Helvetica-Bold advance widths (per 1000 em) for ASCII 32..126
  var HW=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  var HB=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

  function ff(n){return (isFinite(n)?n:0).toFixed(2);}
  function col(hex){return ff(parseInt(hex.substr(0,2),16)/255)+' '+ff(parseInt(hex.substr(2,2),16)/255)+' '+ff(parseInt(hex.substr(4,2),16)/255);}
  function san(s){return String(s==null?'':s).replace(/₹/g,'Rs.').replace(/[—–]/g,'-').replace(/→/g,'->').replace(/≈/g,'~').replace(/×/g,'x').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/·/g,'|').replace(/[^\x20-\x7E]/g,'');}
  function tw(s,sz,b){var a=(b===1)?HB:HW,w=0;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i)-32;w+=(c>=0&&c<95)?a[c]:556;}return w*sz/1000;}
  function trunc(s,sz,b,mw){s=san(s);if(tw(s,sz,b)<=mw)return s;var t=s;while(t.length>1&&tw(t+'..',sz,b)>mw)t=t.slice(0,-1);return t+'..';}
  function wrap(s,sz,b,mw){s=san(s);var wds=s.split(/\s+/),L=[],c='';for(var i=0;i<wds.length;i++){var t=c?c+' '+wds[i]:wds[i];if(tw(t,sz,b)>mw&&c){L.push(c);c=wds[i];}else c=t;}if(c)L.push(c);return L;}

  function fillRect(O,x,y,w,h,hex){O.push(col(hex)+' rg '+ff(x)+' '+ff(PH-(y+h))+' '+ff(w)+' '+ff(h)+' re f');}
  function strokeRect(O,x,y,w,h,hex,t){O.push(col(hex)+' RG '+ff(t||0.7)+' w '+ff(x)+' '+ff(PH-(y+h))+' '+ff(w)+' '+ff(h)+' re S');}
  function seg(O,x1,y1,x2,y2,hex,t,dash){O.push((dash?'[3 3] 0 d ':'[] 0 d ')+col(hex)+' RG '+ff(t||0.7)+' w '+ff(x1)+' '+ff(PH-y1)+' m '+ff(x2)+' '+ff(PH-y2)+' l S');}
  function txt(O,x,y,s,sz,b,hex,al){s=san(s);var w=tw(s,sz,b),tx=x;if(al==='r')tx=x-w;else if(al==='c')tx=x-w/2;var fn=(b===1)?'F2':((b===2)?'F3':'F1');O.push('BT '+col(hex||'000000')+' rg /'+fn+' '+ff(sz)+' Tf '+ff(tx)+' '+ff(PH-y)+' Td ('+s.replace(/[\\()]/g,function(c){return '\\'+c;})+') Tj ET');return w;}

  /* ---- vector icons (drawn in a 0..24 space, like an SVG viewBox) ---- */
  function P(x,y){return ff(x)+' '+ff(PH-y);}
  function ipoly(O,pts,hex,w,close,fill){var c=[];for(var i=0;i<pts.length;i++)c.push(P(pts[i][0],pts[i][1])+' '+(i?'l':'m'));if(close)c.push('h');O.push((fill?col(hex)+' rg ':col(hex)+' RG '+ff(w||1.2)+' w 1 J 1 j [] 0 d ')+c.join(' ')+' '+(fill?'f':'S'));}
  function icirc(O,cx,cy,r,hex,w,fill){var k=0.5523*r,X=cx,Y=PH-cy;O.push((fill?col(hex)+' rg ':col(hex)+' RG '+ff(w||1)+' w ')+ff(X+r)+' '+ff(Y)+' m '+ff(X+r)+' '+ff(Y+k)+' '+ff(X+k)+' '+ff(Y+r)+' '+ff(X)+' '+ff(Y+r)+' c '+ff(X-k)+' '+ff(Y+r)+' '+ff(X-r)+' '+ff(Y+k)+' '+ff(X-r)+' '+ff(Y)+' c '+ff(X-r)+' '+ff(Y-k)+' '+ff(X-k)+' '+ff(Y-r)+' '+ff(X)+' '+ff(Y-r)+' c '+ff(X+k)+' '+ff(Y-r)+' '+ff(X+r)+' '+ff(Y-k)+' '+ff(X+r)+' '+ff(Y)+' c '+(fill?'f':'S'));}
  function icon(O,name,x,y,sz,hex,w){w=w||1.3;var u=sz/24;function pt(a,b){return [x+a*u,y+b*u];}function L(a,cl){var m=[];for(var i=0;i<a.length;i++)m.push(pt(a[i][0],a[i][1]));ipoly(O,m,hex,w,cl,false);}function CC(a,b,r,fl){icirc(O,x+a*u,y+b*u,r*u,hex,w,fl);}
    switch(name){
      case 'truck': L([[2.5,7],[14,7],[14,16],[2.5,16]],true); L([[14,10],[18,10],[21,13.5],[21,16],[14,16]],true); CC(6.5,18,1.9,true); CC(17,18,1.9,true); break;
      case 'phone': L([[7.5,3],[16.5,3],[16.5,21],[7.5,21]],true); L([[10.5,5.5],[13.5,5.5]],false); CC(12,18,0.9,true); break;
      case 'mail': L([[2.5,5],[21.5,5],[21.5,19],[2.5,19]],true); L([[2.5,6.5],[12,13],[21.5,6.5]],false); break;
      case 'globe': CC(12,12,9.3,false); L([[12,2.7],[12,21.3]],false); L([[2.7,12],[21.3,12]],false); break;
      case 'pin': CC(12,9.5,5.2,false); L([[7.7,13],[12,21.5]],false); L([[16.3,13],[12,21.5]],false); CC(12,9.5,1.9,true); break;
      case 'cal': L([[3.5,5.5],[20.5,5.5],[20.5,20],[3.5,20]],true); L([[3.5,10],[20.5,10]],false); L([[8,3.5],[8,7]],false); L([[16,3.5],[16,7]],false); break;
      case 'home': L([[3,11.5],[12,3.5],[21,11.5]],false); L([[6,10.5],[6,20],[18,20],[18,10.5]],false); break;
      case 'ruler': L([[3,12],[21,12]],false); L([[6.5,9],[3,12],[6.5,15]],false); L([[17.5,9],[21,12],[17.5,15]],false); break;
      case 'check': L([[5,12.5],[10,17.5],[19,7]],false); break;
      case 'clock': CC(12,12,9,false); L([[12,7],[12,12],[15.5,13.8]],false); break;
    }
  }
  /* brand palette — matches the MrPackerMover website tokens */
  var CO={navy:'092341',navy2:'051121',crim:'990010',crimMid:'bd1325',crimLt:'ea757f',crimDk:'7e0311',blush:'fdecee',ink:'1c2637',body:'434e60',soft:'6b7488',line:'e3e7ef',tint:'f2f5fa',tint2:'e9eef6',white:'ffffff'};
  function rrect(O,x,y,w,h,r,hex,stroke,sw){
    r=Math.min(r,w/2,h/2);var xL=x,xR=x+w,yT=PH-y,yB=PH-(y+h),k=0.5523*r;
    var c=[ff(xL+r)+' '+ff(yT)+' m',ff(xR-r)+' '+ff(yT)+' l',
      ff(xR-r+k)+' '+ff(yT)+' '+ff(xR)+' '+ff(yT-r+k)+' '+ff(xR)+' '+ff(yT-r)+' c',ff(xR)+' '+ff(yB+r)+' l',
      ff(xR)+' '+ff(yB+r-k)+' '+ff(xR-r+k)+' '+ff(yB)+' '+ff(xR-r)+' '+ff(yB)+' c',ff(xL+r)+' '+ff(yB)+' l',
      ff(xL+r-k)+' '+ff(yB)+' '+ff(xL)+' '+ff(yB+r-k)+' '+ff(xL)+' '+ff(yB+r)+' c',ff(xL)+' '+ff(yT-r)+' l',
      ff(xL)+' '+ff(yT-r+k)+' '+ff(xL+r-k)+' '+ff(yT)+' '+ff(xL+r)+' '+ff(yT)+' c','h'];
    O.push((stroke?col(hex)+' RG '+ff(sw||0.8)+' w ':col(hex)+' rg ')+c.join(' ')+' '+(stroke?'S':'f'));
  }
  function badge(O,cx,cy,r,bg,ic,icHex,icSz){icirc(O,cx,cy,r,bg,0,true);if(ic)icon(O,ic,cx-icSz/2,cy-icSz/2,icSz,icHex,Math.max(1,icSz*0.11));}
  // Build a full clickable URL from the website text (e.g. "mrpackermover.com" -> "https://mrpackermover.com/").
  function webURL(s){s=String(s==null?'':s).trim().replace(/^https?:\/\//i,'').replace(/\/+$/,'');return 'https://'+s+(s.indexOf('/')<0?'/':'');}
  function contactRow(O,list,x,ybase,badgeBg,icHex,textHex,links,maxW){
    var sz=8.5,io=19,gap=15,br=7,isz=9;                       // base metrics
    if(maxW){var need=-gap;for(var n=0;n<list.length;n++)need+=io+tw(list[n][1],sz,0)+gap;
      if(need>maxW){var f=Math.max(0.66,maxW/need);sz*=f;io*=f;gap*=f;br*=f;isz*=f;}}  // scale down to fit on one line
    var by=ybase-sz*0.353,cx=x;
    for(var i=0;i<list.length;i++){badge(O,cx+br,by,br,badgeBg,list[i][0],icHex,isz);var w=txt(O,cx+io,ybase,list[i][1],sz,0,textHex);if(links&&list[i][0]==='globe')links.push({x:cx,y:ybase-9,w:io+w,h:13,url:webURL(list[i][1])});cx+=io+w+gap;}
    return cx;
  }

  function secHead(O,title,meta,y){var w=txt(O,CM,y+2,title,12.5,1,CO.navy);var mw=meta?tw(san(meta),9,0):0;seg(O,CM+w+12,y-1,RX-(mw?mw+8:0),y-1,CO.crimLt,1.3);if(meta)txt(O,RX,y+2,meta,9,0,CO.soft,'r');}
  function party(O,x,y,w,h,eyebrow,name,lines){rrect(O,x,y,w,h,10,CO.line,true,1);txt(O,x+15,y+17,eyebrow,8,1,CO.crim);txt(O,x+15,y+35,trunc(name,14,1,w-26),14,1,CO.navy);for(var i=0;i<lines.length&&i<2;i++)txt(O,x+15,y+49+i*12,trunc(lines[i],9,0,w-26),9,0,CO.soft);}
  function invCol(O,list,x,cw,yTop,off){
    var y=yTop, qX=x+cw-50, pX=x+cw;
    fillRect(O,x,y,cw,15,CO.tint);
    txt(O,x+8,y+10,'#',7.5,1,CO.soft);txt(O,x+20,y+10,'ARTICLE',7.5,1,CO.soft);txt(O,qX,y+10,'QTY',7.5,1,CO.soft,'r');txt(O,pX,y+10,'PACK',7.5,1,CO.soft,'r');
    y+=15;seg(O,x,y,x+cw,y,CO.crimLt,1.3);
    for(var i=0;i<list.length;i++){
      var it=list[i],hasR=it.rem&&it.rem.length,rh=hasR?18.5:15,nameMax=qX-(x+20)-14;
      if(i%2===1)fillRect(O,x,y,cw,rh,CO.tint);
      txt(O,x+8,y+10.5,String(off+i+1),8,1,CO.crim);
      txt(O,x+20,y+10.5,trunc(it.name,9,0,nameMax),9,0,CO.ink);
      txt(O,qX,y+10.5,String(it.qty||0),9,1,CO.navy,'r');
      txt(O,pX,y+10.5,shortPack(it.pack),8,0,CO.crimDk,'r');
      if(hasR)txt(O,x+20,y+17.5,trunc(it.rem,7.5,2,nameMax+30),7.5,2,CO.soft);
      y+=rh;seg(O,x,y,x+cw,y,CO.line,0.4);
    }
    return y;
  }
  function logo(O,x,y,s){ // crimson rounded badge with a white truck
    rrect(O,x,y,s,s,s*0.24,CO.crim);
    icon(O,'truck',x+s*0.15,y+s*0.2,s*0.7,CO.white,s*0.052);
  }

  function sheet1(d){
    var O=[],links=[],c=d.company,cu=d.customer,mv=d.move,t=d.totals;
    var validTill=prettyDate(addDays(isoToday(),d.validDays));
    fillRect(O,0,0,PW,112,CO.navy);
    fillRect(O,0,112,PW,4,CO.crim);
    logo(O,CM,20,42);
    txt(O,CM+58,42,c.name||'MrPackerMover',20,1,CO.white);
    if(c.tag)txt(O,CM+58,58,c.tag,10.5,2,'aebccf');
    txt(O,RX,30,'MOVING PROPOSAL',9,1,CO.crimLt,'r');
    txt(O,RX,50,QUOTE_NO,15,1,CO.white,'r');
    txt(O,RX,68,'Date: '+prettyDate(isoToday()),8.5,0,'8ea1ba','r');
    txt(O,RX,80,'Valid till: '+validTill,8.5,0,'8ea1ba','r');
    seg(O,CM,94,RX,94,'26405f',0.9);
    var mc=[];if(c.phone)mc.push(['phone',c.phone]);if(c.mobile)mc.push(['phone',c.mobile]);if(c.email)mc.push(['mail',c.email]);if(c.web)mc.push(['globe',c.web]);if(c.addr)mc.push(['pin',c.addr]);
    contactRow(O,mc,CM,106,CO.crim,CO.white,'c9d3e2',links,CW);

    var y=140, bw=(CW-16)/2, bh=66;
    party(O,CM,y,bw,bh,'PREPARED FOR',cu.name||'-',[cu.phone,cu.email].filter(Boolean));
    party(O,CM+bw+16,y,bw,bh,'PREPARED BY',c.name,[c.rep,c.gst?('GSTIN: '+c.gst):''].filter(Boolean));
    y+=bh+16;

    var rmH=54;
    rrect(O,CM,y,CW,rmH,10,CO.line,true,1);
    txt(O,CM+18,y+17,'FROM',8,1,CO.crim);txt(O,CM+18,y+35,trunc(mv.from||'-',15,1,175),15,1,CO.navy);if(mv.froms)txt(O,CM+18,y+47,mv.froms,9,0,CO.soft);
    txt(O,RX-18,y+17,'TO',8,1,CO.crim,'r');txt(O,RX-18,y+35,trunc(mv.to||'-',15,1,175),15,1,CO.navy,'r');if(mv.tos)txt(O,RX-18,y+47,mv.tos,9,0,CO.soft,'r');
    var cy=y+28,mx1=CM+CW/2-46,mx2=CM+CW/2+46;
    seg(O,mx1,cy,mx2,cy,CO.crimLt,1.3,true);
    fillRect(O,mx1-2,cy-2,4,4,CO.crim);fillRect(O,mx2-2,cy-2,4,4,CO.crim);
    icirc(O,CM+CW/2,cy,12,CO.crim,0,true);icon(O,'truck',CM+CW/2-8.5,cy-8.5,17,CO.white,1.3);
    var cyps=y+rmH+10,chH=30;
    rrect(O,CM,cyps,CW,chH,8,CO.tint);
    var chips=[['MOVE DATE',prettyDate(mv.date)],['HOME SIZE',mv.house],['DISTANCE',mv.dist||'-'],['SERVICE',mv.svc]],chIco=['cal','home','ruler','truck'],cwid=CW/4;
    for(var ci=0;ci<4;ci++){var cx=CM+ci*cwid;if(ci>0)seg(O,cx,cyps+6,cx,cyps+chH-6,CO.line,0.8);badge(O,cx+17,cyps+15,8.5,CO.blush,chIco[ci],CO.crim,11);txt(O,cx+33,cyps+13,chips[ci][0],7.5,1,CO.soft);txt(O,cx+33,cyps+24,trunc(String(chips[ci][1]||''),9.5,1,cwid-44),9.5,1,CO.ink);}
    y=cyps+chH+18;

    var intro='Dear '+(cu.name||'Customer')+', thank you for choosing '+c.name+' for your '+mv.house+' relocation from '+mv.from+' to '+mv.to+'. Please find your itemised inventory and a fully transparent estimate below - with no hidden charges.';
    var il=wrap(intro,9.5,0,CW);
    for(var ii=0;ii<il.length;ii++)txt(O,CM,y+ii*12.5,il[ii],9.5,0,CO.body);
    y+=il.length*12.5+13;

    var totalArticles=d.items.reduce(function(s,it){return s+(num(it.qty)||0);},0);
    secHead(O,'Inventory of Articles',d.items.length+' items - '+totalArticles+' articles',y);y+=16;
    var mid=Math.ceil(d.items.length/2),colW=(CW-24)/2;
    var yL=invCol(O,d.items.slice(0,mid),CM,colW,y,0);
    var yR=invCol(O,d.items.slice(mid),CM+colW+24,colW,y,mid);
    y=Math.max(yL,yR)+18;

    secHead(O,'Cost Estimate','All figures in INR',y);y+=16;
    var gh=58,gv=rs(t.sub),gsz=27;if(tw(gv,gsz,1)>CW*0.5)gsz=22;if(tw(gv,gsz,1)>CW*0.5)gsz=18;
    rrect(O,CM,y,CW,gh,10,CO.navy);
    fillRect(O,CM,y+12,4,gh-24,CO.crim);
    txt(O,CM+22,y+25,'GRAND TOTAL',11,1,CO.crimLt);
    txt(O,CM+22,y+43,'+ GST @ '+t.gstRate+'% extra'+(t.premium>0?'      + Insurance extra':''),8.5,2,'8ea1ba');
    txt(O,RX-22,y+39,gv,gsz,1,CO.white,'r');
    y+=gh+16;
    txt(O,CM,y,'IN WORDS',7.5,1,CO.crim);
    var iw2=wrap('Rupees '+inWords(t.sub)+' Only',10,2,CW*0.58);
    for(var w3=0;w3<iw2.length;w3++)txt(O,CM,y+13+w3*12,iw2[w3],10,2,CO.body);
    txt(O,RX,y,'PAYMENT TERMS',7.5,1,CO.crim,'r');
    var pw=wrap(d.pay,9.5,0,CW*0.36);
    for(var p3=0;p3<pw.length;p3++)txt(O,RX,y+13+p3*12,pw[p3],9.5,0,CO.body,'r');
    y+=13+Math.max(iw2.length,pw.length)*12+16;
    rrect(O,CM,y,CW,26,8,CO.blush);
    badge(O,CM+16,y+13,7,CO.crim,'clock',CO.white,9);
    txt(O,CM+30,y+16,'This estimate is valid till '+validTill+'.   Book early to lock your move date & pricing.',9.5,0,CO.navy);
    y+=26+14;
    seg(O,CM,y,RX,y,CO.line,0.8);
    txt(O,CM,y+12,c.name+'   -   '+QUOTE_NO,8,1,CO.crim);
    txt(O,RX,y+12,'Page 1 of 2 - Quotation',8,0,CO.soft,'r');
    return {content:O.join('\n'),links:links};
  }

  function sheet2(d){
    var O=[],links=[],c=d.company,cu=d.customer;
    fillRect(O,0,0,PW,52,CO.navy);fillRect(O,0,52,PW,4,CO.crim);
    logo(O,CM,11,30);
    txt(O,CM+44,31,c.name,15,1,CO.white);
    txt(O,RX,24,'TERMS & AGREEMENT',9,1,CO.crimLt,'r');
    txt(O,RX,38,QUOTE_NO,9,0,'c9d3e2','r');

    var y=86,half=(CW-24)/2;
    secHead(O,"What's Included",'',y);y+=18;
    var svcs=d.services,colH=Math.ceil(svcs.length/2),yA=y,yB=y;
    for(var i=0;i<svcs.length;i++){
      var isL=i<colH,cx=isL?CM:CM+half+24,cyy=isL?yA:yB;
      var parts=svcs[i].split(/—|–|\|/),head=parts[0].trim(),sub=parts.slice(1).join('-').trim();
      badge(O,cx+8,cyy-1,8,CO.crim,'check',CO.white,10);
      txt(O,cx+24,cyy+1,trunc(head,11,1,half-28),11,1,CO.navy);
      if(sub)txt(O,cx+24,cyy+12,trunc(sub,9,0,half-28),9,0,CO.soft);
      var used=sub?28:20;if(isL)yA+=used;else yB+=used;
    }
    y=Math.max(yA,yB)+16;

    secHead(O,'Terms & Conditions','',y);y+=18;
    var tms=d.terms,tcolH=Math.ceil(tms.length/2),tHalf=(CW-24)/2,tyA=y,tyB=y;
    for(var k=0;k<tms.length;k++){
      var tL=k<tcolH,tx2=tL?CM:CM+tHalf+24,tyy=tL?tyA:tyB;
      rrect(O,tx2,tyy-8,15,15,3.5,CO.crim);
      txt(O,tx2+7.5,tyy+1.5,String(k+1),8,1,CO.white,'c');
      var lines=wrap(tms[k],9.5,0,tHalf-24);
      for(var l=0;l<lines.length;l++)txt(O,tx2+23,tyy+1.5+l*11.5,lines[l],9.5,0,CO.body);
      var uh=lines.length*11.5+8;if(tL)tyA+=uh;else tyB+=uh;
    }
    y=Math.max(tyA,tyB)+18;

    secHead(O,'Acceptance','',y);y+=30;
    var sw=(CW-40)/2;
    seg(O,CM,y,CM+sw,y,CO.ink,1.2);seg(O,CM+sw+40,y,RX,y,CO.ink,1.2);
    txt(O,CM,y+14,'For '+c.name,11,1,CO.navy);txt(O,CM,y+26,'Authorised Signatory - Date',9,0,CO.soft);
    txt(O,CM+sw+40,y+14,cu.name||'Customer',11,1,CO.navy);txt(O,CM+sw+40,y+26,'Accepted - Signature & Date',9,0,CO.soft);
    y+=44;rrect(O,CM,y,CW,28,8,CO.blush);
    badge(O,CM+16,y+14,7,CO.crim,'check',CO.white,9);
    txt(O,CM+30,y+17,'Kindly sign and return a copy of this proposal to confirm your booking. This estimate supersedes any prior verbal quote.',9,2,CO.navy);

    var fy=PH-58;
    fillRect(O,0,fy,PW,58,CO.navy2);fillRect(O,0,fy,PW,3,CO.crim);
    txt(O,CM,fy+24,'Thank you for trusting '+c.name+' with your move.',11,2,CO.white);
    var fc=[];if(c.phone)fc.push(['phone',c.phone]);if(c.mobile)fc.push(['phone',c.mobile]);if(c.email)fc.push(['mail',c.email]);if(c.web)fc.push(['globe',c.web]);if(c.addr)fc.push(['pin',c.addr]);
    contactRow(O,fc,CM,fy+42,CO.crim,CO.white,'9db0c8',links,CW);
    txt(O,RX,fy+24,'Page 2 of 2 - Terms',8,0,'8ea1ba','r');
    return {content:O.join('\n'),links:links};
  }

  function assemble(pages){
    var N=pages.length,firstFont=3+N*2,nF1=firstFont,nF2=firstFont+1,nF3=firstFont+2,body=[],obj=nF3;
    body[1]='<< /Type /Catalog /Pages 2 0 R >>';
    var kids=[];for(var i=0;i<N;i++)kids.push((3+i*2)+' 0 R');
    body[2]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+N+' /MediaBox [0 0 '+ff(PW)+' '+ff(PH)+'] >>';
    for(i=0;i<N;i++){var pnum=3+i*2,cnum=4+i*2,st=pages[i].content,links=pages[i].links||[],annots=[];
      for(var j=0;j<links.length;j++){var lk=links[j];obj++;
        var uri=String(lk.url).replace(/[\\()]/g,function(ch){return '\\'+ch;});
        body[obj]='<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect ['+ff(lk.x)+' '+ff(PH-(lk.y+lk.h))+' '+ff(lk.x+lk.w)+' '+ff(PH-lk.y)+'] /A << /S /URI /URI ('+uri+') >> >>';
        annots.push(obj+' 0 R');}
      body[pnum]='<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 '+nF1+' 0 R /F2 '+nF2+' 0 R /F3 '+nF3+' 0 R >> >>'+(annots.length?' /Annots ['+annots.join(' ')+']':'')+' /Contents '+cnum+' 0 R >>';
      body[cnum]='<< /Length '+st.length+' >>\nstream\n'+st+'\nendstream';}
    body[nF1]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    body[nF2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    body[nF3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';
    var out='%PDF-1.4\n%âãÏÓ\n',off=[],total=obj;
    for(var n=1;n<=total;n++){off[n]=out.length;out+=n+' 0 obj\n'+body[n]+'\nendobj\n';}
    var xs=out.length;
    out+='xref\n0 '+(total+1)+'\n0000000000 65535 f \n';
    for(n=1;n<=total;n++)out+=('0000000000'+off[n]).slice(-10)+' 00000 n \n';
    out+='trailer\n<< /Size '+(total+1)+' /Root 1 0 R >>\nstartxref\n'+xs+'\n%%EOF';
    var arr=new Uint8Array(out.length);for(var k=0;k<out.length;k++)arr[k]=out.charCodeAt(k)&0xff;
    return new Blob([arr],{type:'application/pdf'});
  }
  function genPDF(d){return assemble([sheet1(d),sheet2(d)]);}

  /* ================= VIEW + ACTIONS ================= */
  function setStep(n){var els=$('steps').querySelectorAll('.st');for(var i=0;i<els.length;i++)els[i].classList.toggle('on',(+els[i].getAttribute('data-s'))<=n);}
  function showPreview(){render(collect());$('editorView').setAttribute('hidden','');$('actionbar').setAttribute('hidden','');$('previewView').removeAttribute('hidden');setStep(2);window.scrollTo(0,0);}
  function showEditor(){$('previewView').setAttribute('hidden','');$('editorView').removeAttribute('hidden');$('actionbar').removeAttribute('hidden');setStep(1);window.scrollTo(0,0);}
  function fileName(){return (val('c_name')||'MrPackerMover').replace(/[^\w-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')+'-Proposal-'+QUOTE_NO;}
  function printDoc(){setStep(3);var prev=document.title;document.title=fileName();window.print();setTimeout(function(){document.title=prev;},700);}
  function toast(msg){var t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},4600);}

  function download(){
    try{
      var blob=genPDF(collect());
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');a.href=url;a.download=fileName()+'.pdf';document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(function(){URL.revokeObjectURL(url);},3000);
      setStep(3);toast('PDF downloaded — check your Downloads folder.');
    }catch(e){
      toast('Could not build the PDF: '+((e&&e.message)||e)+'. Opening print instead.');
      printDoc();
    }
  }

  function bind(){
    $('editorView').addEventListener('input',recalc);
    $('editorView').addEventListener('click',function(e){var del=e.target.closest&&e.target.closest('.row-del');if(del){var row=del.closest('.irow,.crow');if(row){row.parentNode.removeChild(row);recalc();}}});
    $('addItem').addEventListener('click',function(){$('itemRows').insertAdjacentHTML('beforeend',itemRowHTML({qty:1,pack:'Standard Wrap'}));var r=$('itemRows').querySelectorAll('.irow');r[r.length-1].querySelector('.i-name').focus();});
    $('addCharge').addEventListener('click',function(){$('chargeRows').insertAdjacentHTML('beforeend',chargeRowHTML({}));var r=$('chargeRows').querySelectorAll('.crow');r[r.length-1].querySelector('.c-name').focus();});
    $('createBtn').addEventListener('click',showPreview);
    $('backBtn').addEventListener('click',showEditor);
    $('printBtn').addEventListener('click',printDoc);
    $('dlBtn').addEventListener('click',download);
  }

  initRows();initDates();bind();recalc();
})();
