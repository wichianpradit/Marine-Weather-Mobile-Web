let DATA=null,tab="wx";
const $=id=>document.getElementById(id);
const val=(x,u="",d=1)=>x==null?"--":Number(x).toFixed(d)+u;
const dirs=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
const dir=x=>x==null?"--":Math.round(x)+"° "+dirs[Math.round(x/22.5)%16];
const day=s=>{if(!s)return"--";return new Intl.DateTimeFormat("en",{weekday:"short"}).format(new Date(s+"T12:00:00"))};
const icons={RAIN:"☂",HUMIDITY:"◉",PRESSURE:"◌",WIND:"➤","WIND DIR":"⌁",CLOUD:"☁","WAVE PERIOD":"≋",CURRENT:"↝","SEA TEMP":"♨","WAVE HEIGHT":"≋","WAVE DIR • FROM":"⌁","CURRENT DIR • TO":"⌁"};
const normDeg=x=>((Number(x)%360)+360)%360;
const compass=(deg,mode="TO")=>{
 if(deg==null||!Number.isFinite(Number(deg)))return `<div class="compass mutedCompass">--</div>`;
 const d=normDeg(deg),txt=dir(d);
 // Arrow graphic points upward at 0°. CSS rotation follows navigation bearing clockwise.
 return `<div class="compass">
   <div class="dial">
    <span class="north">N</span><span class="east">E</span><span class="south">S</span><span class="west">W</span>
    <span class="needle" style="transform:translate(-50%,-88%) rotate(${d}deg)">➤</span>
    <i></i>
   </div>
   <div class="bearing"><b>${txt}</b><small>${mode}</small></div>
 </div>`;
};
const card=(l,v,c="")=>`<div class="card"><span class="cardIcon">${icons[l]||"•"}</span><div class="label">${l}</div><div class="value ${c}">${v}</div></div>`;
const dirCard=(l,value,deg,mode,c="")=>`<div class="card dirCard"><div class="label">${l}</div><div class="dirGrid"><div><div class="value ${c}">${value}</div></div>${compass(deg,mode)}</div></div>`;
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function ddmToDD(deg,min,hem,maxDeg){
 deg=Number(deg);min=Number(min);
 if(!Number.isFinite(deg)||!Number.isFinite(min)||deg<0||deg>maxDeg||min<0||min>=60)throw new Error("INVALID_DDM");
 let x=deg+min/60;if(hem==="S"||hem==="W")x=-x;return x;
}
function ddToDDM(x,isLat){
 const hem=isLat?(x<0?"S":"N"):(x<0?"W":"E"),a=Math.abs(Number(x)),deg=Math.floor(a),min=(a-deg)*60;
 return {deg,min,hem};
}
function fmtDDM(x,isLat){
 const p=ddToDDM(x,isLat),pad=isLat?2:3;
 return `${String(p.deg).padStart(pad,"0")}° ${p.min.toFixed(4).padStart(7,"0")}′ ${p.hem}`;
}
function currentCoords(){
 return {lat:ddmToDD($("latDeg").value,$("latMin").value,$("latHem").value,90),
         lon:ddmToDD($("lonDeg").value,$("lonMin").value,$("lonHem").value,180)};
}
function params(){const p=currentCoords();return `lat=${encodeURIComponent(p.lat)}&lon=${encodeURIComponent(p.lon)}&name=${encodeURIComponent($("name").value)}`}
function preview(){
 try{const p=currentCoords();$("ddmPreview").textContent=`${fmtDDM(p.lat,true)}   •   ${fmtDDM(p.lon,false)}`}catch{$("ddmPreview").textContent="ตรวจสอบค่า Degrees / Minutes"}
}
function setDDM(lat,lon){
 const a=ddToDDM(lat,true),b=ddToDDM(lon,false);
 $("latDeg").value=a.deg;$("latMin").value=a.min.toFixed(4);$("latHem").value=a.hem;
 $("lonDeg").value=b.deg;$("lonMin").value=b.min.toFixed(4);$("lonHem").value=b.hem;preview();
}
async function load(){
 $("live").textContent="UPDATING...";
 try{
  const base=(window.MARINE_API_BASE||"").replace(/\/$/,"");if(!base)throw new Error("API_BASE_NOT_SET");
  const r=await fetch(base+"/api/dashboard?"+params(),{cache:"no-store"});DATA=await r.json();
  if(!r.ok)throw new Error(DATA.error||"API error");render();$("live").textContent="LIVE";
 }catch(e){$("live").textContent="OFFLINE";console.error(e);toast(e.message==="INVALID_DDM"?"พิกัด DDM ไม่ถูกต้อง":"เชื่อมต่อข้อมูลไม่ได้")}
}
function render(){
 const w=DATA.weather||{},s=DATA.sea||{};$("place").textContent=DATA.location.name;
 $("coords").textContent=`${fmtDDM(DATA.location.lat,true)}  •  ${fmtDDM(DATA.location.lon,false)}`;
 $("temp").textContent=val(w.temp,"°C");$("cond").textContent=w.time?`TMD • ${w.time}`:"TMD • no data";
 $("wave").textContent=val(s.wave," m");$("wdir").textContent=dir(s.waveDir);
 $("cards").innerHTML=card("RAIN",val(w.rain," mm"),"cyan")+card("HUMIDITY",val(w.humidity,"%",0))+card("PRESSURE",val(w.pressure," hPa"))+dirCard("WIND",val(w.windKn," kt"),w.windDir,"FROM")+card("CLOUD",val(Math.max(w.cloudLow||0,w.cloudMed||0,w.cloudHigh||0),"%",0));
 $("seaCards").innerHTML=dirCard("WAVE",val(s.wave," m"),s.waveDir,"FROM","cyan")+card("WAVE PERIOD",val(s.period," s"))+dirCard("CURRENT",val(s.current," kt"),s.currentDir,"TO","cyan")+card("SEA TEMP",val(s.temp,"°C"));
 $("weatherCards").innerHTML=$("cards").innerHTML;
 $("seaFull").innerHTML=dirCard("WAVE HEIGHT / DIRECTION",val(s.wave," m"),s.waveDir,"FROM","cyan")+card("WAVE PERIOD",val(s.period," s"))+dirCard("CURRENT / DIRECTION",val(s.current," kt"),s.currentDir,"TO","cyan")+card("SEA TEMP",val(s.temp,"°C"));
 if($("seaWaveNow")){ $("seaWaveNow").textContent=val(s.wave," m"); $("seaWaveDir").textContent=dir(s.waveDir)+" • FROM"; $("seaWindNow").textContent=val(w.windKn," kt"); $("seaWindDir").textContent=dir(w.windDir)+" • FROM"; }
 renderDays();
}
function renderDays(){
 const rows=DATA?.days||[];$("dayList").innerHTML=rows.length?rows.map(x=>tab==="wx"
 ?`<div class="day"><b>${day(x.date)}</b><span>☂ ${val(x.rain," mm")}</span><span>${val(x.tMax,"°",0)}/${val(x.tMin,"°",0)}</span><span><i class="miniArrow" style="transform:rotate(${normDeg(x.windDir||0)}deg)">➤</i> ${x.windMax==null?"--":val(x.windMax*1.94384," kt",0)} ${dir(x.windDir)}</span></div>`
 :`<div class="day"><b>${day(x.date)}</b><span class="cyan">≋ ${val(x.wave," m")}</span><span>${val(x.period," s")}</span><span><i class="miniArrow" style="transform:rotate(${normDeg(x.waveDir||0)}deg)">➤</i> ${dir(x.waveDir)}</span></div>`).join(""):`<div class="notice">ยังไม่มีข้อมูล 7 วันจาก TMD/Marine</div>`;
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));b.classList.add("on");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(b.dataset.page).classList.add("active")});
document.querySelectorAll(".switch button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".switch button").forEach(x=>x.classList.remove("on"));b.classList.add("on");tab=b.dataset.tab;renderDays()});
["latDeg","latMin","latHem","lonDeg","lonMin","lonHem"].forEach(id=>$(id).addEventListener("input",preview));
$("reload").onclick=load;
$("save").onclick=()=>{try{const p=currentCoords();localStorage.setItem("mwloc2",JSON.stringify({name:$("name").value,lat:p.lat,lon:p.lon}));toast("บันทึกพิกัด DDM แล้ว");load()}catch{toast("พิกัด DDM ไม่ถูกต้อง")}};
$("gps").onclick=()=>{if(!navigator.geolocation){toast("อุปกรณ์นี้ไม่รองรับ GPS");return} $("gps").textContent="กำลังหาพิกัด…";navigator.geolocation.getCurrentPosition(p=>{setDDM(p.coords.latitude,p.coords.longitude);$("gps").textContent="⌖ USE GPS";toast("รับพิกัด GPS แล้ว")},()=>{$("gps").textContent="⌖ USE GPS";toast("ไม่สามารถรับพิกัด GPS ได้")},{enableHighAccuracy:true,timeout:12000,maximumAge:30000})};
try{const x=JSON.parse(localStorage.getItem("mwloc2"));if(x){$("name").value=x.name||"Pattani Sea";setDDM(x.lat,x.lon)}else setDDM(6.8695,101.2505)}catch{setDDM(6.8695,101.2505)}
preview();load();setInterval(load,10*60*1000);
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");
// V4 Tide & Current — Open-Meteo Marine model
function currentClass(k){k=Number(k)||0;return k<.5?'low':k<1?'mid':k<1.5?'strong':'vstrong'}
function localExtrema(levels,times){const a=[];for(let i=1;i<levels.length-1;i++){if(levels[i]==null)continue;const p=levels[i-1],x=levels[i],n=levels[i+1];if(p==null||n==null)continue;if(x>p&&x>=n)a.push({type:'▲ HIGH',time:times[i],v:x});if(x<p&&x<=n)a.push({type:'▼ LOW',time:times[i],v:x})}return a}
async function loadTide(){
 try{
  const p=currentCoords();
  const u=new URL('https://marine-api.open-meteo.com/v1/marine');
  u.searchParams.set('latitude',p.lat);u.searchParams.set('longitude',p.lon);u.searchParams.set('timezone','Asia/Bangkok');u.searchParams.set('forecast_days','2');u.searchParams.set('cell_selection','sea');u.searchParams.set('length_unit','metric');u.searchParams.set('velocity_unit','kn');u.searchParams.set('hourly','sea_level_height_msl,ocean_current_velocity,ocean_current_direction,wave_height,wave_period,wave_direction');
  const r=await fetch(u,{cache:'no-store'}),j=await r.json();if(!r.ok||!j.hourly)throw new Error(j.reason||'TIDE_API');
  renderTide(j.hourly);
 }catch(e){console.error(e);$('tideNow').textContent='--';$('currentNow').textContent='--';$('tideExtremes').innerHTML='<div class="notice">ยังรับข้อมูล Tide/Current ไม่ได้</div>'}
}
function renderTide(h){
 const now=new Date(),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),idx=[];
 h.time.forEach((t,i)=>{if(t.slice(0,10)===today)idx.push(i)});if(!idx.length)return;
 const times=idx.map(i=>h.time[i]),levels=idx.map(i=>h.sea_level_height_msl[i]),curr=idx.map(i=>h.ocean_current_velocity[i]),cdir=idx.map(i=>h.ocean_current_direction[i]),waves=idx.map(i=>h.wave_height?.[i]),periods=idx.map(i=>h.wave_period?.[i]),wdirs=idx.map(i=>h.wave_direction?.[i]);
 const hh=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Bangkok',hour:'2-digit',hour12:false}).format(now))%24,ni=Math.min(hh,idx.length-1);
 $('tideDate').textContent=today;$('tideNow').textContent=val(levels[ni],' m',2);$('currentNow').textContent=val(curr[ni],' kt',2);$('currentDirNow').textContent=dir(cdir[ni])+' • TO';
 const delta=ni>0&&levels[ni]!=null&&levels[ni-1]!=null?levels[ni]-levels[ni-1]:0;$('tideTrend').textContent=Math.abs(delta)<.01?'≈ NEAR SLACK LEVEL':delta>0?'↗ RISING':'↘ FALLING';
 const ex=localExtrema(levels,times);$('tideExtremes').innerHTML=ex.length?ex.map(x=>`<div class="extreme"><b>${x.type}</b><span>${x.time.slice(11,16)} • ${Number(x.v).toFixed(2)} m</span></div>`).join(''):'<div class="notice">ไม่พบจุดกลับตัวในช่วงวันนี้</div>';
 $('currentHours').innerHTML=times.map((t,i)=>`<div class="hourChip ${currentClass(curr[i])}"><b>${t.slice(11,16)}</b><strong>${val(curr[i],' kt',2)}</strong><small>${dir(cdir[i])} • TO</small></div>`).join('');
 if($('strengthDots')) $('strengthDots').innerHTML=curr.map(v=>`<i class="${currentClass(v)}"></i>`).join('');
 if($('seaHourly')) { const picks=[9,10,11,12,13,14,15].filter(i=>i<times.length); $('seaHourly').innerHTML=picks.map(i=>`<div class="seaHour ${i===ni?'now':''}"><b>${times[i].slice(11,16)}</b><span>น้ำ ${val(levels[i],' m',2)}</span><strong>กระแส ${val(curr[i],' kt',1)}</strong><small>↗ ${dir(cdir[i])}</small><span>คลื่น ${val(waves[i],' m',1)}</span><small>${val(periods[i],' s',1)} • ${dir(wdirs[i])}</small></div>`).join(''); }
 drawTide(levels,curr,waves,ni);
}
function drawTide(levels,curr,waves,nowIndex){
 const c=$('tideCanvas'),dpr=window.devicePixelRatio||1,w=c.clientWidth||330,h=c.clientHeight||230;c.width=w*dpr;c.height=h*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);x.clearRect(0,0,w,h);const pad={l:34,r:10,t:16,b:32},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b,valid=levels.filter(Number.isFinite);if(!valid.length)return;let mn=Math.min(...valid),mx=Math.max(...valid);if(mx===mn){mx+=.1;mn-=.1}const X=i=>pad.l+(i/(levels.length-1))*pw,Y=v=>pad.t+(mx-v)/(mx-mn)*ph;
 x.font='9px system-ui';x.fillStyle='#7fa8bd';x.strokeStyle='#15516f';x.lineWidth=1;for(let k=0;k<4;k++){let yy=pad.t+k*ph/3;x.beginPath();x.moveTo(pad.l,yy);x.lineTo(w-pad.r,yy);x.stroke();let vv=mx-k*(mx-mn)/3;x.fillText(vv.toFixed(2)+'m',1,yy+3)}
 curr.forEach((v,i)=>{if(v==null)return;const bh=Math.min(ph*.38,(Number(v)/2)*ph*.38);x.fillStyle=Number(v)<.5?'#31e98166':Number(v)<1?'#ffd34f66':Number(v)<1.5?'#ff963866':'#ff4d5f66';x.fillRect(X(i)-pw/levels.length*.28,pad.t+ph-bh,Math.max(2,pw/levels.length*.56),bh)});
 x.beginPath();levels.forEach((v,i)=>{if(v==null)return;i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v))});x.strokeStyle='#22cfff';x.lineWidth=2.5;x.stroke();
 if(waves&&waves.some(Number.isFinite)){const wv=waves.filter(Number.isFinite),wmn=Math.min(...wv),wmx=Math.max(...wv);const WY=v=>pad.t+(wmx===wmn?.5:(wmx-v)/(wmx-wmn))*ph; x.beginPath();waves.forEach((v,i)=>{if(v==null)return;i?x.lineTo(X(i),WY(v)):x.moveTo(X(i),WY(v))});x.strokeStyle='#a957ff';x.lineWidth=2.2;x.stroke();}
 if(nowIndex>=0){x.beginPath();x.moveTo(X(nowIndex),pad.t);x.lineTo(X(nowIndex),pad.t+ph);x.strokeStyle='#ffffff88';x.setLineDash([4,4]);x.stroke();x.setLineDash([]);x.fillStyle='#fff';x.fillText('NOW',Math.min(w-30,X(nowIndex)+3),pad.t+10)}
 [0,6,12,18,23].forEach(i=>{if(i<levels.length){x.fillStyle='#8aafc2';x.fillText(String(i).padStart(2,'0'),X(i)-5,h-10)}})
}
const _loadV3=load;load=async function(){await _loadV3();loadTide()};
window.addEventListener('resize',()=>{if(document.getElementById('sea')?.classList.contains('active'))loadTide()});
loadTide();

// V4.2 — interactive SEA chart: tap/drag to inspect every hour
let SEA24=null,SEA_SELECTED=null;
function seaArrow(deg){deg=Number(deg);if(!Number.isFinite(deg))return '•';const a=['↑','↗','→','↘','↓','↙','←','↖'];return a[Math.round((((deg%360)+360)%360)/45)%8]}
function renderSeaSelection(i,scroll=false){
 if(!SEA24)return;i=Math.max(0,Math.min(SEA24.times.length-1,i));SEA_SELECTED=i;
 const d=SEA24,level=d.levels[i],cv=d.curr[i],cd=d.cdir[i],wv=d.waves[i],wp=d.periods[i],wd=d.wdirs[i];
 $('tideNow').textContent=val(level,' m',2);$('currentNow').textContent=val(cv,' kt',2);$('currentDirNow').textContent=`${seaArrow(cd)} ${dir(cd)} • TO`;
 if($('seaWaveNow')){$('seaWaveNow').textContent=val(wv,' m',1);$('seaWaveDir').textContent=`${seaArrow(wd)} ${dir(wd)} • FROM`}
 const prev=i>0?d.levels[i-1]:d.levels[i],delta=Number(level)-Number(prev);$('tideTrend').textContent=Math.abs(delta)<.01?'≈ NEAR SLACK LEVEL':delta>0?'↗ RISING':'↘ FALLING';
 document.querySelectorAll('.seaHour').forEach((el,n)=>el.classList.toggle('selected',n===i));
 if(scroll){const el=document.querySelector(`.seaHour[data-hour="${i}"]`);el?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})}
 document.querySelectorAll('.seaMetric').forEach(el=>{el.classList.remove('selectedPulse');void el.offsetWidth;el.classList.add('selectedPulse')});
 drawTide(d.levels,d.curr,d.waves,d.nowIndex,i);
}
function buildSeaHours(d){
 $('seaHourly').innerHTML=d.times.map((t,i)=>`<div class="seaHour ${i===d.nowIndex?'now':''}" data-hour="${i}"><b>${t.slice(11,16)}</b><span>น้ำ ${val(d.levels[i],' m',2)}</span><strong>กระแส ${val(d.curr[i],' kt',1)}</strong><small>${seaArrow(d.cdir[i])} ${dir(d.cdir[i])} • TO</small><span>คลื่น ${val(d.waves[i],' m',1)}</span><small>${val(d.periods[i],' s',1)} • ${seaArrow(d.wdirs[i])} ${dir(d.wdirs[i])}</small></div>`).join('');
 document.querySelectorAll('.seaHour').forEach(el=>el.addEventListener('click',()=>renderSeaSelection(Number(el.dataset.hour))));
}
function bindSeaCanvas(){const c=$('tideCanvas');if(!c||c.dataset.interactive)return;c.dataset.interactive='1';let down=false;const pick=e=>{if(!SEA24)return;const r=c.getBoundingClientRect(),clientX=e.touches?e.touches[0].clientX:e.clientX,padL=34,padR=10,x=Math.max(padL,Math.min(r.width-padR,clientX-r.left)),ratio=(x-padL)/(r.width-padL-padR),i=Math.round(ratio*(SEA24.times.length-1));renderSeaSelection(i,true)};c.addEventListener('pointerdown',e=>{down=true;c.setPointerCapture?.(e.pointerId);pick(e)});c.addEventListener('pointermove',e=>{if(down)pick(e)});c.addEventListener('pointerup',()=>down=false);c.addEventListener('pointercancel',()=>down=false)}
const _renderTideV41=renderTide;
renderTide=function(h){
 _renderTideV41(h);
 const now=new Date(),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),idx=[];h.time.forEach((t,i)=>{if(t.slice(0,10)===today)idx.push(i)});if(!idx.length)return;
 const hh=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Bangkok',hour:'2-digit',hour12:false}).format(now))%24;
 SEA24={times:idx.map(i=>h.time[i]),levels:idx.map(i=>h.sea_level_height_msl[i]),curr:idx.map(i=>h.ocean_current_velocity[i]),cdir:idx.map(i=>h.ocean_current_direction[i]),waves:idx.map(i=>h.wave_height?.[i]),periods:idx.map(i=>h.wave_period?.[i]),wdirs:idx.map(i=>h.wave_direction?.[i]),nowIndex:Math.min(hh,idx.length-1)};
 buildSeaHours(SEA24);bindSeaCanvas();renderSeaSelection(SEA_SELECTED??SEA24.nowIndex,true);
};
// Extend draw function with a selected-hour marker while preserving NOW marker
const _drawTideV41=drawTide;
drawTide=function(levels,curr,waves,nowIndex,selectedIndex){_drawTideV41(levels,curr,waves,nowIndex);if(selectedIndex==null)return;const c=$('tideCanvas'),dpr=window.devicePixelRatio||1,w=c.clientWidth||330,h=c.clientHeight||230,x=c.getContext('2d');x.save();x.scale(dpr,dpr);const padL=34,padR=10,padT=16,padB=32,pw=w-padL-padR,ph=h-padT-padB,X=padL+(selectedIndex/(levels.length-1))*pw;x.beginPath();x.moveTo(X,padT);x.lineTo(X,padT+ph);x.strokeStyle='#24d4ff';x.lineWidth=2;x.stroke();x.beginPath();x.arc(X,padT+ph,5,0,Math.PI*2);x.fillStyle='#24d4ff';x.fill();x.font='bold 10px system-ui';x.fillStyle='#24d4ff';x.fillText(String(selectedIndex).padStart(2,'0')+':00',Math.max(2,Math.min(w-40,X-16)),padT+12);x.restore()};
