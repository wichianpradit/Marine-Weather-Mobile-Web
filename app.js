let DATA=null,tab="wx";
const $=id=>document.getElementById(id);
const val=(x,u="",d=1)=>x==null?"--":Number(x).toFixed(d)+u;
const dirs=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
const dir=x=>x==null?"--":Math.round(x)+"° "+dirs[Math.round(x/22.5)%16];
const day=s=>{if(!s)return"--";return new Intl.DateTimeFormat("en",{weekday:"short"}).format(new Date(s+"T12:00:00"))};
const card=(l,v,c="")=>`<div class="card"><div class="label">${l}</div><div class="value ${c}">${v}</div></div>`;
function params(){return `lat=${encodeURIComponent($("lat").value)}&lon=${encodeURIComponent($("lon").value)}&name=${encodeURIComponent($("name").value)}`}
async function load(){
 $("live").textContent="UPDATING...";
 try{
  const base=(window.MARINE_API_BASE||"").replace(/\/$/,"");
  if(!base) throw new Error("API_BASE_NOT_SET");
  const r=await fetch(base+"/api/dashboard?"+params(),{cache:"no-store"}); DATA=await r.json();
  if(!r.ok)throw new Error(DATA.error||"API error"); render(); $("live").textContent="LIVE";
 }catch(e){$("live").textContent="OFFLINE";console.error(e)}
}
function render(){
 const w=DATA.weather,s=DATA.sea;$("place").textContent=DATA.location.name;$("coords").textContent=`${DATA.location.lat.toFixed(4)}, ${DATA.location.lon.toFixed(4)}`;
 $("temp").textContent=val(w.temp,"°C");$("cond").textContent=w.time?`TMD • ${w.time}`:"TMD • no data";$("wave").textContent=val(s.wave," m");$("wdir").textContent=dir(s.waveDir);
 $("cards").innerHTML=card("RAIN",val(w.rain," mm"),"cyan")+card("HUMIDITY",val(w.humidity,"%",0))+card("PRESSURE",val(w.pressure," hPa"))+card("WIND",val(w.windKn," kt"))+card("WIND DIR",dir(w.windDir))+card("CLOUD",val(Math.max(w.cloudLow||0,w.cloudMed||0,w.cloudHigh||0),"%",0));
 $("seaCards").innerHTML=card("WAVE PERIOD",val(s.period," s"))+card("CURRENT",val(s.current," kt"))+card("SEA TEMP",val(s.temp,"°C"));
 $("weatherCards").innerHTML=$("cards").innerHTML;
 $("seaFull").innerHTML=card("WAVE HEIGHT",val(s.wave," m"),"cyan")+card("WAVE PERIOD",val(s.period," s"))+card("WAVE DIR • FROM",dir(s.waveDir))+card("CURRENT",val(s.current," kt"))+card("CURRENT DIR • TO",dir(s.currentDir))+card("SEA TEMP",val(s.temp,"°C"));
 renderDays();
}
function renderDays(){
 const rows=DATA?.days||[];$("dayList").innerHTML=rows.length?rows.map(x=>tab==="wx"
 ?`<div class="day"><b>${day(x.date)}</b><span>🌧 ${val(x.rain," mm")}</span><span>${val(x.tMax,"°",0)}/${val(x.tMin,"°",0)}</span><span>💨 ${x.windMax==null?"--":val(x.windMax*1.94384," kt",0)} ${dir(x.windDir)}</span></div>`
 :`<div class="day"><b>${day(x.date)}</b><span class="cyan">🌊 ${val(x.wave," m")}</span><span>${val(x.period," s")}</span><span>${dir(x.waveDir)}</span></div>`).join(""):`<div class="notice">ยังไม่มีข้อมูล 7 วันจาก TMD/Marine</div>`;
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));b.classList.add("on");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(b.dataset.page).classList.add("active")});
document.querySelectorAll(".switch button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".switch button").forEach(x=>x.classList.remove("on"));b.classList.add("on");tab=b.dataset.tab;renderDays()});
$("reload").onclick=load;$("save").onclick=()=>{localStorage.setItem("mwloc",JSON.stringify({name:$("name").value,lat:$("lat").value,lon:$("lon").value}));load()};
try{const x=JSON.parse(localStorage.getItem("mwloc"));if(x){$("name").value=x.name;$("lat").value=x.lat;$("lon").value=x.lon}}catch{}
load();setInterval(load,10*60*1000);
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");
