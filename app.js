const KEY="aghsatman_v3";
let data=JSON.parse(localStorage.getItem(KEY)||'{"items":[],"paid":[]}');
const $=id=>document.getElementById(id);

function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function faNum(n){return Number(n).toLocaleString("fa-IR")}
function money(n){return faNum(n)+" تومان"}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function pad(n){return String(n).padStart(2,"0")}

/* Persian/Jalali calendar conversion */
const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2347,2380,2450,3178];
function div(a,b){return Math.floor(a/b)}
function mod(a,b){return a-Math.floor(a/b)*b}
function jalCal(jy){
 let bl=breaks.length, gy=jy+621, leapJ=-14, jp=breaks[0], jm=0, jump=0;
 for(let i=1;i<bl;i++){jm=breaks[i];jump=jm-jp;if(jy<jm)break;leapJ+=div(jump,33)*8+div(mod(jump,33),4);jp=jm}
 let n=jy-jp;leapJ+=div(n,33)*8+div(mod(n,33)+3,4);
 if(mod(jump,33)===4&&jump-n===4)leapJ++;
 let leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150;
 return {leap:mod(mod(n+1,33)-1,4),march:20+leapJ-leapG}
}
function g2d(gy,gm,gd){let d=div((gy+div(gm-8,6)+100100)*1461,4)+div(153*mod(gm+9,12)+2,5)+gd-34840408;return d-div(div(gy+100100+div(gm-8,6),100)*3,4)+752}
function d2g(j){let j2=4*j+139361631;j2+=div(div(4*j+183187720,146097)*3,4)*4-3908;let i=div(mod(j2,1461),4)*5+308;let gd=div(mod(i,153),5)+1,gm=mod(div(i,153),12)+1,gy=div(j2,1461)-100100+div(8-gm,6);return[gy,gm,gd]}
function j2d(jy,jm,jd){let r=jalCal(jy);return g2d(jy+621,3,r.march)+(jm<=7?(jm-1)*31:(jm-1)*30+6)+jd-1}
function d2j(jdn){
 const [gy,gm,gd]=d2g(jdn);let jy=gy-621,r=jalCal(jy),k=jdn-g2d(gy,3,r.march);
 if(k>=0){let jm=k<186?1+div(k,31):7+div(k-186,30),jd=1+mod(k,k<186?31:30);return[jy,jm,jd]}
 jy--;r=jalCal(jy);k=jdn-g2d(gy,3,r.march);let jm=7+div(k-186,30),jd=1+mod(k-186,30);return[jy,jm,jd]
}
function jalaliToDate(s){
 const [jy,jm,jd]=s.replaceAll("-","/").split("/").map(Number);
 if(!jy||!jm||!jd||jm<1||jm>12||jd<1||jd>31)throw Error("تاریخ را مثل 1405/06/18 وارد کنید.");
 const [gy,gm,gd]=d2g(j2d(jy,jm,jd));return new Date(gy,gm-1,gd)
}
function dateToJalali(d){const [jy,jm,jd]=d2j(g2d(d.getFullYear(),d.getMonth()+1,d.getDate()));return`${jy}/${pad(jm)}/${pad(jd)}`}
function daysInMonth(y,m){if(m<=6)return 31;if(m<=11)return 30;return jalaliToDate(`${y+1}/01/01`)>jalaliToDate(`${y}/12/01`)?30:29}
function addMonths(y,m,n){let x=y*12+m-1+n;return[Math.floor(x/12),mod(x,12)+1]}
function nextDue(item){
 const [sy,sm]=dateToJalali(jalaliToDate(item.start)).split("/").map(Number),today=new Date(),today0=new Date(today.getFullYear(),today.getMonth(),today.getDate());
 for(let i=0;i<item.count;i++){const[y,m]=addMonths(sy,sm,i),day=Math.min(item.day,daysInMonth(y,m)),d=jalaliToDate(`${y}/${pad(m)}/${pad(day)}`);if(d>=today0)return{date:d,i}}
 return null
}
function daysUntil(d){return Math.round((d-new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()))/86400000)}
function render(){
 const upcoming=data.items.map(x=>({x,d:nextDue(x)})).filter(a=>a.d).sort((a,b)=>a.d.date-b.d.date),n=upcoming[0];
 $("nextTitle").textContent=n?n.x.name:"هنوز قسطی ثبت نشده";
 $("nextAmount").textContent=n?money(n.x.amount):"—";
 $("nextDate").textContent=n?dateToJalali(n.d.date):"—";
 $("nextDays").textContent=n?(daysUntil(n.d.date)===0?"امروز":daysUntil(n.d.date)===1?"فردا":`${faNum(daysUntil(n.d.date))} روز دیگر`):"—";
 $("activeCount").textContent=faNum(data.items.length);$("paidCount").textContent=faNum(data.paid.length);
 $("list").innerHTML=upcoming.map(a=>`<div class="card"><div class="cardMain"><div class="cardName">${escapeHtml(a.x.name)}</div><div class="muted">${dateToJalali(a.d.date)} · قسط ${faNum(a.d.i+1)} از ${faNum(a.x.count)}</div></div><div class="cardSide"><div class="amount">${money(a.x.amount)}</div><button class="payBtn" onclick="pay('${a.x.id}')">پرداخت شد ✓</button></div></div>`).join("")||'<div class="empty">هنوز قسطی ثبت نشده است.</div>';
 $("paidList").innerHTML=data.paid.slice(-10).reverse().map(p=>`<div class="card"><div class="cardMain"><div class="cardName">${escapeHtml(p.name)}</div><div class="muted">پرداخت در ${p.date}</div></div><div class="cardSide"><div class="amount">${money(p.amount)}</div></div></div>`).join("")||'<div class="empty">هنوز پرداختی ثبت نشده است.</div>'
}
function pay(id){const x=data.items.find(a=>a.id===id);if(!x)return;const d=nextDue(x);data.paid.push({name:x.name,amount:x.amount,date:dateToJalali(new Date()),dueDate:dateToJalali(d.date)});x.count--;if(x.count<=0)data.items=data.items.filter(a=>a.id!==id);save()}
function formatMoneyInput(v){let digits=v.replace(/[^\d]/g,"");return digits?Number(digits).toLocaleString("en-US"):""}
$("amount").addEventListener("input",e=>{const pos=e.target.selectionStart;e.target.value=formatMoneyInput(e.target.value);e.target.selectionStart=e.target.selectionEnd=e.target.value.length})
$("addBtn").onclick=()=>$("formDlg").showModal();$("closeDlg").onclick=()=>$("formDlg").close();$("cancelBtn").onclick=()=>$("formDlg").close();
$("form").onsubmit=e=>{e.preventDefault();try{const start=$("start").value.trim();jalaliToDate(start);const amount=Number($("amount").value.replace(/[^\d]/g,""));const item={id:crypto.randomUUID(),name:$("name").value.trim(),amount,day:Number($("day").value),start,count:Number($("count").value)};if(!item.name||!amount||item.day<1||item.day>31||item.count<1)throw Error("لطفاً همه اطلاعات را کامل وارد کنید.");data.items.push(item);$("form").reset();$("start").value="";$("startDisplay").textContent="انتخاب تاریخ";$("startPicker").classList.add("placeholder");$("formDlg").close();save()}catch(err){alert(err.message)}};
$("notifyBtn").onclick=async()=>{if(!("Notification"in window)){alert("این مرورگر اعلان را پشتیبانی نمی‌کند.");return}const p=await Notification.requestPermission();alert(p==="granted"?"اجازه اعلان فعال شد.":"اجازه اعلان داده نشد.")};

const months=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
let calYear,calMonth;

function openCalendar(){
  const current=$("start").value;
  if(current){
    [calYear,calMonth]=current.split("/").map(Number);
  }else{
    const nowJ=dateToJalali(new Date()).split("/").map(Number);
    calYear=nowJ[0]; calMonth=nowJ[1];
  }
  drawCalendar();
  $("calendarOverlay").classList.add("open");
  $("calendarOverlay").setAttribute("aria-hidden","false");
}
function drawCalendar(){
  $("calTitle").textContent=`${months[calMonth-1]} ${faNum(calYear)}`;
  const first=jalaliToDate(`${calYear}/${pad(calMonth)}/01`);
  // JS Sunday=0. Persian week starts Saturday, so convert to Saturday index.
  const offset=(first.getDay()+1)%7;
  const total=daysInMonth(calYear,calMonth);
  const selected=$("start").value;
  let html="";
  for(let i=0;i<offset;i++) html+='<button class="empty" type="button"></button>';
  for(let d=1;d<=total;d++){
    const val=`${calYear}/${pad(calMonth)}/${pad(d)}`;
    const classes=[];
    if(val===dateToJalali(new Date())) classes.push("today");
    if(val===selected) classes.push("selected");
    html+=`<button type="button" class="${classes.join(" ")}" data-date="${val}">${faNum(d)}</button>`;
  }
  $("calendarDays").innerHTML=html;
  document.querySelectorAll("#calendarDays button[data-date]").forEach(btn=>{
    btn.onclick=()=>{
      $("start").value=btn.dataset.date;
      $("startDisplay").textContent=btn.dataset.date;
      $("startPicker").classList.remove("placeholder");
      closeCalendar();
    };
  });
}
function closeCalendar(){
  $("calendarOverlay").classList.remove("open");
  $("calendarOverlay").setAttribute("aria-hidden","true");
}
function changeMonth(delta){
  calMonth+=delta;
  if(calMonth>12){calMonth=1;calYear++}
  if(calMonth<1){calMonth=12;calYear--}
  drawCalendar();
}
$("startPicker").onclick=openCalendar;
$("prevMonth").onclick=()=>changeMonth(-1);
$("nextMonth").onclick=()=>changeMonth(1);
$("todayBtn").onclick=()=>{
  const nowJ=dateToJalali(new Date());
  $("start").value=nowJ;
  $("startDisplay").textContent=nowJ;
  $("startPicker").classList.remove("placeholder");
  closeCalendar();
};

render();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");

$("calendarOverlay").addEventListener("click",e=>{if(e.target.id==="calendarOverlay")closeCalendar()});
