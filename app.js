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