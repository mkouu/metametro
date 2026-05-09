import { useState, useEffect, useRef } from "react";

// ── 2호선 노선 (내선순환=시계방향 기준 순서) ──────────────
// 내선(시계): 시청→을지로→...→성수→건대→...→잠실→...→강남→교대→서초→방배→사당→낙성대→...→신도림→...→합정→홍대→...→충정로→시청
const LINE2=["시청","을지로입구","을지로3가","을지로4가","동대문역사문화공원","신당","상왕십리","왕십리","한양대","뚝섬","성수","건대입구","구의","강변","잠실나루","잠실","잠실새내","종합운동장","삼성","선릉","역삼","강남","교대","서초","방배","사당","낙성대","서울대입구","봉천","신림","신대방","구로디지털단지","대림","신도림","문래","영등포구청","당산","합정","홍대입구","신촌","이대","아현","충정로"];
const N=LINE2.length;
const nxI=i=>(i+1)%N, pvI=i=>(i-1+N)%N;

// 강남 구간: 지도상 방향이 LINE2 배열 순서와 반대
const GANGNAM=new Set(["당산","영등포구청","문래","신도림","대림","구로디지털단지","신대방","신림","봉천","서울대입구","낙성대","사당","방배","서초","교대","강남","역삼","선릉","삼성","종합운동장","잠실새내","잠실","잠실나루"]);
const isGn=st=>GANGNAM.has(st);
const TRANSFER=new Set(["시청","을지로3가","을지로4가","동대문역사문화공원","왕십리","성수","건대입구","잠실","종합운동장","삼성","선릉","강남","교대","사당","서울대입구","신림","구로디지털단지","대림","신도림","합정","홍대입구","신촌","충정로"]);

// ── 방향 계산 ──────────────────────────────────────────
// 내선(I)=시계방향: 강북=nextIdx방향, 강남=prevIdx방향(지도상 반대)
// "사당→강남"은 내선(I) — 사당에서 방배→서초→교대→강남으로 내선 이동
function getNextSt(cur,d){
  const i=LINE2.indexOf(cur); if(i===-1) return null;
  const gn=isGn(cur);
  // 내선(I): 강북=nextIdx, 강남=prevIdx (강남구간은 배열 역방향이 시계방향)
  return LINE2[d==="I"?(gn?pvI(i):nxI(i)):(gn?nxI(i):pvI(i))];
}

// 출발→도착 기준 방향 계산 (강남 구간 보정)
function calcDir(from,to){
  const fi=LINE2.indexOf(from), ti=LINE2.indexOf(to);
  if(fi===-1||ti===-1) return "I";
  const gn=isGn(from);
  // 강남 구간: prevIdx 방향이 내선(시계)
  // 강북 구간: nextIdx 방향이 내선(시계)
  const fwd=(ti-fi+N)%N; // nextIdx 방향 거리
  if(gn){
    // 강남: prevIdx(배열 역방향)가 내선 → fwd가 클수록 내선 반대
    return fwd>(N/2)?"I":"O";
  } else {
    return fwd<=(N/2)?"I":"O";
  }
}

// ── 혼잡도 테이블 ─────────────────────────────────────
const CT={
  "신도림":{I:{"07:30":132,"08:00":159,"08:30":168,"09:00":145,"09:30":112,"10:00":78,"17:30":98,"18:00":138,"18:30":171,"19:00":152,"19:30":118,"20:00":88,"21:00":62},O:{"07:30":68,"08:00":82,"08:30":88,"09:00":75,"09:30":58,"10:00":48,"17:30":112,"18:00":128,"18:30":142,"19:00":135,"19:30":112,"20:00":85,"21:00":58}},
  "강남":{I:{"07:30":55,"08:00":72,"08:30":88,"09:00":82,"09:30":68,"10:00":52,"17:30":105,"18:00":132,"18:30":128,"19:00":118,"19:30":95,"20:00":72,"21:00":55},O:{"07:30":98,"08:00":118,"08:30":101,"09:00":89,"09:30":72,"10:00":58,"17:30":65,"18:00":78,"18:30":85,"19:00":78,"19:30":65,"20:00":52,"21:00":42}},
  "홍대입구":{I:{"07:30":62,"08:00":78,"08:30":92,"09:00":88,"09:30":72,"10:00":58,"17:30":98,"18:00":118,"18:30":125,"19:00":132,"19:30":118,"20:00":95,"21:00":72},O:{"07:30":102,"08:00":128,"08:30":135,"09:00":118,"09:30":92,"10:00":68,"17:30":72,"18:00":85,"18:30":92,"19:00":88,"19:30":72,"20:00":58,"21:00":45}},
  "잠실":{I:{"07:30":72,"08:00":95,"08:30":108,"09:00":98,"09:30":82,"10:00":65,"17:30":88,"18:00":112,"18:30":118,"19:00":108,"19:30":92,"20:00":72,"21:00":55},O:{"07:30":88,"08:00":105,"08:30":98,"09:00":88,"09:30":72,"10:00":58,"17:30":95,"18:00":115,"18:30":122,"19:00":112,"19:30":95,"20:00":72,"21:00":55}},
  "사당":{I:{"07:30":112,"08:00":138,"08:30":145,"09:00":147,"09:30":118,"10:00":82,"17:30":88,"18:00":115,"18:30":125,"19:00":118,"19:30":98,"20:00":72,"21:00":52},O:{"07:30":55,"08:00":68,"08:30":75,"09:00":68,"09:30":55,"10:00":45,"17:30":102,"18:00":118,"18:30":125,"19:00":112,"19:30":88,"20:00":65,"21:00":48}},
  "교대":{I:{"07:30":68,"08:00":92,"08:30":105,"09:00":98,"09:30":78,"10:00":62,"17:30":85,"18:00":108,"18:30":115,"19:00":105,"19:30":88,"20:00":68,"21:00":52},O:{"07:30":82,"08:00":98,"08:30":92,"09:00":82,"09:30":68,"10:00":55,"17:30":75,"18:00":92,"18:30":98,"19:00":88,"19:30":72,"20:00":55,"21:00":42}},
  "건대입구":{I:{"07:30":58,"08:00":78,"08:30":88,"09:00":82,"09:30":68,"10:00":52,"17:30":92,"18:00":112,"18:30":118,"19:00":108,"19:30":92,"20:00":72,"21:00":55},O:{"07:30":72,"08:00":88,"08:30":82,"09:00":72,"09:30":58,"10:00":48,"17:30":85,"18:00":102,"18:30":108,"19:00":98,"19:30":82,"20:00":62,"21:00":48}},
  "왕십리":{I:{"07:30":65,"08:00":85,"08:30":92,"09:00":85,"09:30":68,"10:00":52,"17:30":82,"18:00":102,"18:30":108,"19:00":98,"19:30":82,"20:00":62,"21:00":48},O:{"07:30":78,"08:00":95,"08:30":88,"09:00":78,"09:30":62,"10:00":50,"17:30":78,"18:00":95,"18:30":102,"19:00":92,"19:30":75,"20:00":58,"21:00":44}},
  "합정":{I:{"07:30":55,"08:00":72,"08:30":82,"09:00":78,"09:30":62,"10:00":50,"17:30":88,"18:00":108,"18:30":115,"19:00":108,"19:30":92,"20:00":72,"21:00":58},O:{"07:30":88,"08:00":108,"08:30":115,"09:00":102,"09:30":82,"10:00":62,"17:30":65,"18:00":78,"18:30":85,"19:00":78,"19:30":62,"20:00":50,"21:00":40}},
  "선릉":{I:{"07:30":52,"08:00":68,"08:30":78,"09:00":72,"09:30":58,"10:00":45,"17:30":88,"18:00":108,"18:30":112,"19:00":102,"19:30":85,"20:00":65,"21:00":50},O:{"07:30":85,"08:00":102,"08:30":95,"09:00":85,"09:30":68,"10:00":55,"17:30":62,"18:00":75,"18:30":80,"19:00":72,"19:30":58,"20:00":46,"21:00":38}},
  "역삼":{I:{"07:30":48,"08:00":65,"08:30":75,"09:00":68,"09:30":55,"10:00":42,"17:30":85,"18:00":105,"18:30":110,"19:00":100,"19:30":82,"20:00":62,"21:00":48},O:{"07:30":88,"08:00":105,"08:30":98,"09:00":88,"09:30":72,"10:00":58,"17:30":58,"18:00":72,"18:30":78,"19:00":70,"19:30":56,"20:00":44,"21:00":36}},
  "시청":{I:{"07:30":42,"08:00":55,"08:30":65,"09:00":60,"09:30":48,"10:00":38,"17:30":72,"18:00":88,"18:30":92,"19:00":85,"19:30":70,"20:00":54,"21:00":42},O:{"07:30":68,"08:00":82,"08:30":78,"09:00":70,"09:30":56,"10:00":44,"17:30":55,"18:00":68,"18:30":72,"19:00":65,"19:30":52,"20:00":40,"21:00":32}},
  "신림":{I:{"07:30":72,"08:00":92,"08:30":102,"09:00":94,"09:30":75,"10:00":58,"17:30":62,"18:00":78,"18:30":84,"19:00":76,"19:30":62,"20:00":48,"21:00":36},O:{"07:30":38,"08:00":50,"08:30":46,"09:00":40,"09:30":32,"10:00":26,"17:30":82,"18:00":100,"18:30":106,"19:00":98,"19:30":80,"20:00":62,"21:00":46}},
  "_d":{"07:30":40,"08:00":55,"08:30":65,"09:00":58,"09:30":46,"10:00":36,"12:00":40,"17:30":65,"18:00":80,"18:30":85,"19:00":78,"19:30":64,"20:00":50,"21:00":38}
};

// 출입문 데이터 (환승 보너스)
const DOOR_DATA={
  "건대입구":[{door:[8,3],bonus:.10}],"잠실":[{door:[1,1],bonus:.10}],
  "종합운동장":[{door:[4,1],bonus:.08}],"선릉":[{door:[5,2],bonus:.08}],
  "강남":[{door:[5,1],bonus:.12}],"교대":[{door:[10,4],bonus:.10}],
  "사당":[{door:[5,3],bonus:.10}],"신림":[{door:[5,3],bonus:.08}],
  "대림":[{door:[4,1],bonus:.08}],
  "신도림":[{door:[7,3],bonus:.15},{door:[5,4],bonus:.12}],
  "합정":[{door:[2,2],bonus:.10}],"홍대입구":[{door:[6,3],bonus:.12}],
  "충정로":[{door:[4,3],bonus:.07}],"시청":[{door:[10,4],bonus:.08}],
  "왕십리":[{door:[7,2],bonus:.10},{door:[3,4],bonus:.08}],
};

function toSlot(h,m){return`${String(h).padStart(2,"0")}:${m<30?"00":"30"}`;}
function getCong(st,d,h,m){
  const slot=toSlot(h,m),t=CT[st];
  if(t){const dv=t[d];if(dv){if(dv[slot]!==undefined)return dv[slot];const keys=Object.keys(dv).sort(),sn=h*60+(m<30?0:30);let cl=keys[0],md=9999;for(const k of keys){const[kh,km]=k.split(":").map(Number),df=Math.abs(kh*60+km-sn);if(df<md){md=df;cl=k;}}return dv[cl];}}
  return CT["_d"][slot]??CT["_d"]["10:00"]??40;
}

// ── 칸/구역별 확률 계산 (zone 보정 포함) ─────────────────
function calcZoneBonus(st,car,zone){
  const doors=DOOR_DATA[st]||[];
  let bonus=0;
  for(const{door:[dc,dp],bonus:b} of doors){
    if(dc!==car) continue;
    const dist=Math.abs(dp-(zone+0.5));
    bonus+=b*Math.exp(-0.7*dist);
  }
  // 칸별 보정: 앞칸(1번)과 뒷칸(10번) 선호도 차이
  const carPenalty=car<=2||car>=9?0.05:car<=4||car>=7?0.02:0;
  return{bonus:Math.min(bonus,0.15),penalty:carPenalty};
}

function calcProb(st,nst,d,h,m,car=5,zone=2){
  const C=getCong(st,d,h,m),Cn=nst?getCong(nst,d,h,m):0;
  const fl=C*(C>=130?.20:C>=100?.17:C>=70?.15:.12);
  const al=Math.max(Math.max(0,C-Cn),fl);
  const r=C>=130?.08:C>=100?.15:C>=70?.30:.60;
  const S=Math.min(1,(al*r)/40),E=Math.max(0,C-34);
  // 경쟁압력 지수 0.4 (기존 0.7보다 낮춤 — 혼잡할수록 하차도 많아 실제 기회 더 있음)
  const W=S/(S+Math.pow(E/40,.4)+.001);
  // 하차량 보너스: C-Cn 차이 클수록(환승역 등) 추가 기회
  const alightBonus=Math.min(0.3,Math.max(0,C-Cn)/200);
  let P=S*(.5+.5*W)+alightBonus;
  if(C<40){const tv=C/40;P=Math.max(P,P+.6*(1-tv)*(1-P));}
  // 구역/칸 보정
  const{bonus,penalty}=calcZoneBonus(st,car,zone);
  P=P*(1+bonus)*(1-penalty);
  const zoneDiff=(zone===1?0.03:zone===2?0:-0.02);
  P=Math.max(0.02,Math.min(0.95,P+zoneDiff));
  return Math.round(P*100);
}

function bestZone(st,nst,d,h,m){
  let b={car:1,zone:1,prob:0},bn={car:1,zone:1,prob:0};
  for(let c=1;c<=10;c++)for(let z=1;z<=3;z++){
    const p=calcProb(st,nst,d,h,m,c,z);
    if(p>b.prob)b={car:c,zone:z,prob:p};
    if(nst){const np=calcProb(nst,null,d,h,m,c,z);if(np>bn.prob)bn={car:c,zone:z,prob:np};}
  }
  return{cur:b,next:nst?bn:null};
}

// ── 색상/레이블 ────────────────────────────────────────
const gc=p=>p>=60?"#00C853":p>=35?"#FF8F00":"#F44336";
const gb=p=>p>=60?"#E8F5E9":p>=35?"#FFF8E1":"#FFEBEE";
const gcl=c=>c<=40?"여유":c<=65?"보통":c<=100?"혼잡":"매우혼잡";
const gcc=c=>c<=40?"#00C853":c<=65?"#FF8F00":"#F44336";
const gcb=c=>c<=40?"#E8F5E9":c<=65?"#FFF8E1":"#FFEBEE";

// ── 포인트샵 아이템 ────────────────────────────────────
const SHOP_AVATARS=[
  {id:"a1",emoji:"👑",name:"황금왕관",price:500,desc:"레전드의 상징"},
  {id:"a2",emoji:"🦄",name:"유니콘",price:300,desc:"희귀 아바타"},
  {id:"a3",emoji:"🐉",name:"드래곤",price:800,desc:"전설의 존재"},
  {id:"a4",emoji:"🧙",name:"마법사",price:200,desc:"신비로운 분위기"},
  {id:"a5",emoji:"🦸",name:"슈퍼히어로",price:400,desc:"정의의 수호자"},
  {id:"a6",emoji:"🤖",name:"로봇",price:250,desc:"미래에서 온 존재"},
];
const SHOP_EMOJIS=[
  {id:"e1",emoji:"😂",name:"빵터짐",price:50},
  {id:"e2",emoji:"🔥",name:"불꽃",price:80},
  {id:"e3",emoji:"✨",name:"반짝반짝",price:60},
  {id:"e4",emoji:"👋",name:"하이파이브",price:40},
  {id:"e5",emoji:"🎉",name:"파티",price:100},
  {id:"e6",emoji:"💎",name:"다이아",price:200},
];
const FREE_AVTS=["😎","🧑","👩","👦","👧","🧔","👱","🧕","🦊","🐯","🐻","🐼","🦁","🐸","🐧"];
const FREE_EMOJIS=["👍","❤️"];

function mkUnknown(){return{id:-1,avatar:"👤",name:"알 수 없음",isUnknown:true,destStation:null};}
function mkUser(si,d){
  const steps=Math.floor(Math.random()*8)+1,gn=isGn(LINE2[si]);
  const di=d==="I"?(gn?(si-steps+N)%N:(si+steps)%N):(gn?(si+steps)%N:(si-steps+N)%N);
  const avts=[...FREE_AVTS,...SHOP_AVATARS.map(s=>s.emoji)];
  return{id:Math.floor(Math.random()*999999),avatar:avts[Math.floor(Math.random()*avts.length)],name:`유저${Math.floor(Math.random()*999)+1}`,destStation:LINE2[di]};
}
function genArea(si,d,h,m,c,z){
  const p=calcProb(LINE2[si],null,d,h,m,c,z)/100;
  const emptyRate=Math.min(0.7,p*0.9);
  const leavingRate=Math.min(0.3,p*0.4);
  const s=()=>{const r=Math.random();if(r<emptyRate)return{status:"empty",user:null};if(r<emptyRate+leavingRate)return{status:"leaving-soon",user:mkUser(si,d)};return{status:"occupied",user:mkUnknown()};};
  return{top:Array.from({length:6},s),bottom:Array.from({length:6},s),standing:Array.from({length:Math.floor(Math.random()*4)+1},()=>mkUser(si,d))};
}
function genAll(si,d,h,m){const o={};for(let c=1;c<=10;c++)for(let a=1;a<=3;a++)o[`${c}-${a}`]=genArea(si,d,h,m,c,a);return o;}

let _ax=null;
function sfx(t="click"){
  try{
    if(!_ax)_ax=new(window.AudioContext||window.webkitAudioContext)();
    const ctx=_ax,now=ctx.currentTime;
    const tone=(f,dv,v=.1,w="sine",dl=0)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type=w;o.frequency.value=f;g.gain.setValueAtTime(0,now+dl);g.gain.linearRampToValueAtTime(v,now+dl+.01);g.gain.linearRampToValueAtTime(0,now+dl+dv);o.start(now+dl);o.stop(now+dl+dv+.05);};
    if(t==="click")tone(880,.07,.08);
    else if(t==="success"){tone(523,.1,.1,"sine",0);tone(659,.1,.1,"sine",.08);tone(784,.15,.12,"sine",.16);}
    else if(t==="cancel")tone(330,.1,.07,"sawtooth");
    else tone(1046,.08,.07);
  }catch(e){}
}

function Door({hi}){
  const c=hi?"#1A6DFF":"#C5CAD5";
  return <svg width="22" height="42" viewBox="0 0 26 48" fill="none">
    <rect x="1" y="1" width="24" height="46" rx="2" fill="#F8F9FB" stroke={c} strokeWidth="1.5"/>
    <rect x="3" y="3" width="9" height="42" rx="1" fill="white" stroke={c} strokeWidth=".8"/>
    <rect x="14" y="3" width="9" height="42" rx="1" fill="white" stroke={c} strokeWidth=".8"/>
    <rect x="4" y="4" width="7" height="12" rx="1" fill={hi?"#1A6DFF22":"#F0F2F5"}/>
    <rect x="15" y="4" width="7" height="12" rx="1" fill={hi?"#1A6DFF22":"#F0F2F5"}/>
    <rect x="10" y="20" width="2" height="7" rx="1" fill={c}/>
    <rect x="14" y="20" width="2" height="7" rx="1" fill={c}/>
  </svg>;
}
function Seat({seat,reserved,reaction,reported,onClick}){
  if(!seat)return <div style={{width:42,height:48}}/>;
  // 3. 제보된 자리: 테두리 색 + 체크 표시로 구분
  const isReported=!!reported;
  const bg=seat.isMe?"#FFFBF0":seat.status==="empty"?"#F0FFF4":seat.status==="leaving-soon"?"#FFF8E1":"#F8F9FB";
  let bd=seat.isMe?"#FF8F00":seat.status==="empty"?"#00C853":seat.status==="leaving-soon"?"#FF8F00":"#E5E8EE";
  // 제보된 occupied 자리는 주황 테두리로 강조
  if(isReported&&seat.status==="occupied"&&!seat.isMe) bd="#FF8F00";
  return <div onClick={onClick} style={{width:42,height:48,borderRadius:8,background:bg,border:`2px solid ${bd}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,opacity:seat.status==="occupied"&&!seat.isMe&&!isReported?.5:1,position:"relative",flexShrink:0,
    boxShadow:isReported&&seat.status==="occupied"?"0 0 6px #FF8F0044":"none"}}>
    {reserved&&<div style={{position:"absolute",top:1,right:2,fontSize:7,color:"#FF8F00"}}>📌</div>}
    {/* 제보 완료 표시 */}
    {isReported&&<div style={{position:"absolute",top:1,left:2,fontSize:7,color:seat.status==="empty"?"#00C853":"#FF8F00"}}>✓</div>}
    {reaction&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",fontSize:11}}>{reaction}</div>}
    {seat.isMe?<span style={{fontSize:17}}>😎</span>:seat.user?<>
      <span style={{fontSize:seat.status==="leaving-soon"?13:17}}>{seat.user.avatar}</span>
      {seat.status==="leaving-soon"&&seat.user.destStation&&<span style={{fontSize:6,color:"#FF8F00",fontWeight:700,textAlign:"center"}}>{seat.user.destStation}</span>}
    </>:<span style={{fontSize:15,color:"#00C853"}}>+</span>}
  </div>;
}
function Toast({msg}){return <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#191F28dd",backdropFilter:"blur(8px)",color:"white",padding:"11px 22px",borderRadius:50,fontSize:13,fontWeight:600,zIndex:999,whiteSpace:"nowrap"}}>{msg}</div>;}
function Sheet({children,onClose}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:300,display:"flex",alignItems:"flex-end",backdropFilter:"blur(3px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:"white",borderRadius:"20px 20px 0 0",padding:"20px 18px 44px",width:"100%",maxWidth:430,margin:"0 auto",maxHeight:"88vh",overflowY:"auto",boxSizing:"border-box"}}>
      <div style={{width:36,height:4,background:"#E5E8EE",borderRadius:2,margin:"0 auto 18px"}}/>
      {children}
    </div>
  </div>;
}

export default function App(){
  const [step,setStep]=useState(1);
  const [sub,setSub]=useState(null); // "seats"|"shop"
  const [curSt,setCurSt]=useState(null);
  const [destSt,setDestSt]=useState(null);
  const [picking,setPicking]=useState("cur");
  const [dir,setDir]=useState("I");
  const [car,setCar]=useState(null);
  const [zone,setZone]=useState(null);
  const [fbDone,setFbDone]=useState(false);
  const [pts,setPts]=useState(120);
  const [areas,setAreas]=useState({});
  const [stIdx,setStIdx]=useState(0);
  const [tStat,setTStat]=useState("stopped");
  const [modal,setModal]=useState(null);
  const [rdest,setRdest]=useState(null);
  const [mySeat,setMySeat]=useState(null);
  const [myDest,setMyDest]=useState(null);
  const [alrt,setAlrt]=useState(false);
  const [reserved,setReserved]=useState({});
  const [myRes,setMyRes]=useState(null);
  const [wq,setWq]=useState({});
  const [react,setReact]=useState({});
  const [profMod,setProfMod]=useState(null);
  const [chatMod,setChatMod]=useState(null);
  const [chatMsg,setChatMsg]=useState("");
  const [chatHist,setChatHist]=useState({});
  const [myProf,setMyProf]=useState({avatar:"😎",name:"나"});
  const [editProf,setEditProf]=useState(false);
  const [tmpName,setTmpName]=useState("나");
  const [tmpAv,setTmpAv]=useState("😎");
  const [sentEmoji,setSentEmoji]=useState(null);
  const [toast,setToast]=useState("");
  // 포인트샵
  const [shopTab,setShopTab]=useState("avatar");
  const [ownedAvt,setOwnedAvt]=useState([]);
  const [ownedEmj,setOwnedEmj]=useState([]);
  const [shopConfirm,setShopConfirm]=useState(null);
  const [reported,setReported]=useState({}); // key → "empty"|"leaving-soon"|"occupied"
  const tmr=useRef(null);

  const now=new Date(),H=now.getHours(),M=now.getMinutes();
  const nxt=curSt?getNextSt(curSt,dir):null; // 현재 선택 기반 다음역
  const tSt=LINE2[stIdx];
  const tNxt=getNextSt(tSt,dir); // 소셜 화면 열차 기반 다음역
  const ak=`${car}-${zone}`;
  const ad=areas[ak]||{top:[],bottom:[],standing:[]};
  const ptLv=pts<100?"🌱":pts<300?"⭐":pts<600?"🔥":"👑";
  const {cur:best,next:bestN}=curSt&&destSt?bestZone(curSt,nxt,dir,H,M):{cur:null,next:null};
  const availEmojis=[...FREE_EMOJIS,...ownedEmj.map(id=>SHOP_EMOJIS.find(e=>e.id===id)?.emoji).filter(Boolean)];
  const allAvts=[...FREE_AVTS,...ownedAvt.map(id=>SHOP_AVATARS.find(a=>a.id===id)?.emoji).filter(Boolean)];

  const toast_=m=>{setToast(m);setTimeout(()=>setToast(""),2400);};
  const addPts=(n,m)=>{setPts(p=>p+n);toast_(m);};
  const openModal=m=>{setRdest(destSt||null);setModal(m);};

  const buyItem=(item,type)=>{
    if(pts<item.price){toast_("포인트가 부족해요!");return;}
    if(type==="avatar"&&ownedAvt.includes(item.id))return;
    if(type==="emoji"&&ownedEmj.includes(item.id))return;
    setPts(p=>p-item.price);
    if(type==="avatar")setOwnedAvt(p=>[...p,item.id]);
    if(type==="emoji")setOwnedEmj(p=>[...p,item.id]);
    toast_(`${item.name} 구매 완료! 🎉`);
    setShopConfirm(null);
  };

  // 열차 이동 타이머 (소셜 화면에서만)
  useEffect(()=>{
    if(sub!=="seats")return;
    tmr.current=setInterval(()=>{
      setTStat("moving");
      setTimeout(()=>{
        setStIdx(p=>{
          const gn=isGn(LINE2[p]);
          const next=dir==="I"?(gn?pvI(p):nxI(p)):(gn?nxI(p):pvI(p));
          const ns=LINE2[next];
          if(myDest){
            const gn2=isGn(ns),ta=dir==="I"?(gn2?pvI(next):nxI(next)):(gn2?nxI(next):pvI(next));
            if(LINE2[ta]===myDest)setAlrt(true);
            if(ns===myDest){setAreas(prev=>{const u=JSON.parse(JSON.stringify(prev));Object.keys(u).forEach(k=>{["top","bottom"].forEach(r=>{u[k][r].forEach((s,i)=>{if(s.isMe)u[k][r][i]={status:"empty",user:null};});});});return u;});setMySeat(null);setMyDest(null);setAlrt(false);}
          }
          setAreas(prev=>{
            const u=JSON.parse(JSON.stringify(prev));
            Object.keys(u).forEach(k2=>{["top","bottom"].forEach(r=>{u[k2][r].forEach((s,i)=>{if(!s.isMe&&s.user&&s.user.destStation===ns)u[k2][r][i]={status:"empty",user:null};});u[k2][r].forEach((s,i)=>{if(s.status==="empty"&&Math.random()<.3)u[k2][r][i]={status:"occupied",user:mkUnknown()};});});});
            return u;
          });
          return next;
        });
        setTStat("stopped");
        setTimeout(()=>setTStat("moving"),3000);
      },2000);
    },9000);
    return()=>clearInterval(tmr.current);
  },[sub,dir,myDest]);

  const enterSocial=()=>{
    sfx("success");
    const i=LINE2.indexOf(curSt);
    setStIdx(i>=0?i:0);
    setAreas(genAll(i>=0?i:0,dir,H,M));
    setSub("seats");
  };

  const handleSeatClick=(row,i)=>{
    const key=`${ak}-${row}-${i}`,seat=ad[row]?.[i];
    if(!seat)return;
    if(seat.isMe){openModal({type:"release",key,row,i});return;}
    if(seat.status==="empty"){
      sfx("click");
      if(mySeat&&mySeat!==key){openModal({type:"replace",row,i,key});return;}
      // 2. 빈자리도 제보 or 등록 선택 가능
      openModal({type:"emptyChoice",row,i,key});return;
    }
    if(seat.status==="leaving-soon"){sfx("click");openModal({type:"detail",seat,key,row,i});return;}
    // occupied: 이미 제보했어도 다시 클릭 가능 (제보 상태 확인용)
    sfx("click");openModal({type:"report",row,i,key,user:seat.user?.isUnknown?null:seat.user,alreadyReported:!!reported[key]});
  };

  const confirmSeat=(row,i,key,dest)=>{
    setAreas(p=>{const u=JSON.parse(JSON.stringify(p));Object.keys(u).forEach(k=>{["top","bottom"].forEach(r=>{u[k][r].forEach((s,j)=>{if(s.isMe)u[k][r][j]={status:"empty",user:null};});});});u[ak][row][i]={status:"leaving-soon",destStation:dest,user:{...myProf,id:0},isMe:true};return u;});
    setMySeat(key);setMyDest(dest);
    if(myRes){setReserved(p=>{const n=JSON.parse(JSON.stringify(p));if(n[myRes])n[myRes]=n[myRes].filter(q=>!q.isMe);return n;});setMyRes(null);}
    addPts(10,"자리 등록 +10P 🎉");setModal(null);setRdest(null);
  };
  const doReserve=(key,dest)=>{
    if(myRes&&myRes!==key){setReserved(p=>{const n=JSON.parse(JSON.stringify(p));if(n[myRes])n[myRes]=n[myRes].filter(q=>!q.isMe);return n;});setWq(p=>({...p,[myRes]:Math.max(0,(p[myRes]||1)-1)}));}
    setReserved(p=>{const n=JSON.parse(JSON.stringify(p));n[key]=[...(n[key]||[]),{id:0,...myProf,destSt:dest,isMe:true}];return n;});
    setWq(p=>({...p,[key]:(p[key]||0)+1}));setMyRes(key);
    toast_("예약 완료! 📌");setModal(null);setRdest(null);
  };
  const sendEmoji=(uid,emoji)=>{sfx("select");setReact(p=>({...p,[uid]:emoji}));setSentEmoji({to:profMod?.name||"유저",emoji});setTimeout(()=>{setReact(p=>{const n={...p};delete n[uid];return n;});setSentEmoji(null);},2500);};
  const sendChat=(uid)=>{if(!chatMsg.trim())return;const t=new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});setChatHist(p=>({...p,[uid]:[...(p[uid]||[]),{from:"me",text:chatMsg,time:t}]}));const rs=["ㅎㅎ!","감사해요 😊","좋은 하루 되세요!","멋진 코디네요!"];setTimeout(()=>{const t2=new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});setChatHist(p=>({...p,[uid]:[...(p[uid]||[]),{from:"them",text:rs[Math.floor(Math.random()*rs.length)],time:t2}]}));},900);setChatMsg("");};

  const curCong=curSt?getCong(curSt,dir,H,M):null;
  const pct=(step/5)*100;
  const PBar=()=><div style={{height:3,background:"#F0F2F5"}}><div style={{width:`${pct}%`,height:"100%",background:"#1A6DFF",transition:"width .4s"}}/></div>;
  const PtBadge=({onClick})=><div onClick={onClick} style={{display:"flex",alignItems:"center",gap:3,background:"#FFFBF0",border:"1px solid #FFE082",borderRadius:20,padding:"4px 10px",flexShrink:0,cursor:onClick?"pointer":"default"}}><span style={{fontSize:11}}>{ptLv}</span><span style={{fontSize:12,fontWeight:700,color:"#FF8F00"}}>{pts}P</span></div>;
  const BackBtn=({onClick})=><button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="#191F28" strokeWidth="1.8" strokeLinecap="round"/></svg></button>;
  // afterStep: 이 정거장 수 이후부터만 선택 가능 (예약 시 현재 탑승자보다 늦게 내려야 함)
  const DestList=({onSelect,sel,color="#1A6DFF",bg="#EEF4FF",brd="#1A6DFF",afterStep=0})=>(
    <div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
      {Array.from({length:20},(_,k)=>{
        const gn=isGn(LINE2[stIdx]),s=k+1;
        const si=dir==="I"?(gn?(stIdx-s+N)%N:(stIdx+s)%N):(gn?(stIdx+s)%N:(stIdx-s+N)%N);
        const st=LINE2[si];
        const disabled=s<=afterStep; // afterStep 이하 정거장은 선택 불가
        return <button key={st} disabled={disabled} onClick={()=>!disabled&&onSelect(st)}
          style={{padding:"9px 12px",borderRadius:8,textAlign:"left",
            background:sel===st?bg:disabled?"#F8F9FB":"white",
            border:`1px solid ${sel===st?brd:disabled?"#F0F2F5":"#F0F2F5"}`,
            color:sel===st?color:disabled?"#C5CAD5":"#8B95A1",
            fontSize:13,display:"flex",justifyContent:"space-between",
            cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1}}>
          <span>{st}역</span>
          <span style={{fontSize:11,color:disabled?"#E5E8EE":"#B0B8C1"}}>
            {disabled?"예약 불가":s+"정거장 후"}
          </span>
        </button>;
      })}
    </div>
  );

  // ════ 포인트샵 ════
  if(sub==="shop") return(
    <div style={{minHeight:"100vh",background:"#F5F6F8",fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif",maxWidth:430,margin:"0 auto"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} button{font-family:inherit;border:none;cursor:pointer;} ::-webkit-scrollbar{display:none;}`}</style>
      <div style={{display:"flex",alignItems:"center",padding:"14px 16px",background:"white",borderBottom:"1px solid #F0F2F5",position:"sticky",top:0,zIndex:10}}>
        <BackBtn onClick={()=>setSub(null)}/>
        <div style={{flex:1,fontSize:15,fontWeight:700,color:"#191F28",textAlign:"center"}}>🛍️ 포인트 샵</div>
        <PtBadge/>
      </div>
      <div style={{padding:"16px 14px 48px"}}>
        {/* 탭 */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {[{k:"avatar",l:"🎭 아바타"},{k:"emoji",l:"💬 이모티콘"}].map(({k,l})=>(
            <button key={k} onClick={()=>setShopTab(k)} style={{flex:1,padding:"10px",borderRadius:10,background:shopTab===k?"#1A6DFF":"white",color:shopTab===k?"white":"#8B95A1",fontSize:13,fontWeight:700,border:shopTab===k?"none":"1px solid #E5E8EE"}}>{l}</button>
          ))}
        </div>
        {shopTab==="avatar"&&<>
          <div style={{fontSize:12,color:"#8B95A1",marginBottom:14}}>특별 아바타를 구매해서 개성을 표현해보세요!</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {SHOP_AVATARS.map(item=>{
              const owned=ownedAvt.includes(item.id);
              return <div key={item.id} style={{background:owned?"#EEF4FF":"white",border:`1px solid ${owned?"#1A6DFF":"#E5E8EE"}`,borderRadius:14,padding:"16px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{fontSize:40}}>{item.emoji}</div>
                <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#191F28"}}>{item.name}</div>
                <div style={{fontSize:11,color:"#8B95A1",textAlign:"center"}}>{item.desc}</div>
                <button onClick={()=>{if(!owned)setShopConfirm({item,type:"avatar"});}} style={{width:"100%",padding:"8px",borderRadius:8,background:owned?"#EEF4FF":pts>=item.price?"#1A6DFF":"#F0F2F5",color:owned?"#1A6DFF":pts>=item.price?"white":"#B0B8C1",fontSize:12,fontWeight:700}}>
                  {owned?"✓ 보유 중":`${item.price}P 구매`}
                </button>
              </div>;
            })}
          </div>
        </>}
        {shopTab==="emoji"&&<>
          <div style={{fontSize:12,color:"#8B95A1",marginBottom:6}}>기본 이모티콘: 👍 ❤️ (무료)</div>
          <div style={{fontSize:12,color:"#8B95A1",marginBottom:14}}>추가 이모티콘을 구매해서 소통해보세요!</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {SHOP_EMOJIS.map(item=>{
              const owned=ownedEmj.includes(item.id);
              return <div key={item.id} style={{background:owned?"#EEF4FF":"white",border:`1px solid ${owned?"#1A6DFF":"#E5E8EE"}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:28,flexShrink:0}}>{item.emoji}</span>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#191F28"}}>{item.name}</div></div>
                <button onClick={()=>{if(!owned)setShopConfirm({item,type:"emoji"});}} style={{padding:"7px 14px",borderRadius:8,background:owned?"#EEF4FF":pts>=item.price?"#1A6DFF":"#F0F2F5",color:owned?"#1A6DFF":pts>=item.price?"white":"#B0B8C1",fontSize:12,fontWeight:700,flexShrink:0}}>
                  {owned?"✓ 보유":`${item.price}P`}
                </button>
              </div>;
            })}
          </div>
        </>}
      </div>
      {/* 구매 확인 */}
      {shopConfirm&&<Sheet onClose={()=>setShopConfirm(null)}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:48,marginBottom:10}}>{shopConfirm.item.emoji}</div>
          <div style={{fontSize:16,fontWeight:700,color:"#191F28",marginBottom:4}}>{shopConfirm.item.name}</div>
          <div style={{fontSize:13,color:"#8B95A1",marginBottom:16}}>{shopConfirm.item.desc||""}</div>
          <div style={{background:"#FFFBF0",border:"1px solid #FFE082",borderRadius:12,padding:"12px",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,color:"#FF8F00"}}>{shopConfirm.item.price}P 차감</div>
            <div style={{fontSize:12,color:"#8B95A1",marginTop:4}}>보유: {pts}P → {pts-shopConfirm.item.price}P</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShopConfirm(null)} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:13}}>취소</button>
          <button onClick={()=>buyItem(shopConfirm.item,shopConfirm.type)} style={{flex:2,padding:"12px",borderRadius:10,background:"#1A6DFF",color:"white",fontSize:13,fontWeight:700}}>구매하기</button>
        </div>
      </Sheet>}
      {toast&&<Toast msg={toast}/>}
    </div>
  );

  // ════ 소셜 화면 ════
  if(sub==="seats"){
    const isFirst=car===1&&zone===1,isLast=car===10&&zone===3;
    const goL=()=>{if(zone>1)setZone(z=>z-1);else if(car>1){setCar(c=>c-1);setZone(3);}};
    const goR=()=>{if(zone<3)setZone(z=>z+1);else if(car<10){setCar(c=>c+1);setZone(1);}};
    const lbl=zone>1?`${car}-${zone-1}구역`:car>1?`${car-1}번 칸`:"";
    const rbl=zone<3?`${car}-${zone+1}구역`:car<10?`${car+1}번 칸`:"";
    const cnt=f=>["top","bottom"].reduce((a,r)=>a+(ad[r]?.filter(f).length||0),0);
    const curP=calcProb(tSt,tNxt,dir,H,M,car,zone);
    const nxtP=tNxt?calcProb(tNxt,null,dir,H,M,car,zone):null;

    return <div style={{minHeight:"100vh",background:"#F5F6F8",fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif",maxWidth:430,margin:"0 auto"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} button{font-family:inherit;border:none;cursor:pointer;} ::-webkit-scrollbar{display:none;}`}</style>
      <div style={{display:"flex",alignItems:"center",padding:"12px 14px",background:"white",borderBottom:"1px solid #F0F2F5",position:"sticky",top:0,zIndex:10,gap:8}}>
        <BackBtn onClick={()=>{setSub(null);clearInterval(tmr.current);}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:"#191F28"}}>{car}번 칸 · {zone}구역 <span style={{fontSize:12,color:gc(curP),fontWeight:700}}>({curP}%)</span></div>
          <div style={{fontSize:11,color:"#8B95A1",display:"flex",alignItems:"center",gap:4,marginTop:1}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:tStat==="stopped"?"#FF8F00":"#00C853",display:"inline-block"}}/>
            {tStat==="stopped"?`${tSt}역 정차 중`:`${tSt} → ${tNxt} 운행 중`}
          </div>
        </div>
        <button onClick={()=>{setTmpAv(myProf.avatar);setTmpName(myProf.name);setEditProf(true);}} style={{background:"#F8F9FB",border:"1px solid #E5E8EE",borderRadius:20,padding:"4px 10px",fontSize:13,color:"#191F28"}}>{myProf.avatar} {myProf.name}</button>
        <PtBadge onClick={()=>setSub("shop")}/>
      </div>
      <div style={{padding:"12px 14px 48px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
          <button onClick={goL} disabled={isFirst} style={{padding:"5px 10px",borderRadius:8,border:"1px solid #E5E8EE",background:"white",color:isFirst?"#E5E8EE":"#8B95A1",fontSize:11,flexShrink:0,whiteSpace:"nowrap"}}>◀ {lbl}</button>
          <div style={{flex:1,display:"flex",justifyContent:"center",gap:4}}>
            {[1,2,3].map(a=><div key={a} onClick={()=>setZone(a)} style={{width:a===zone?20:6,height:6,borderRadius:3,background:a===zone?"#1A6DFF":"#E5E8EE",cursor:"pointer",transition:"width .2s"}}/>)}
          </div>
          <button onClick={goR} disabled={isLast} style={{padding:"5px 10px",borderRadius:8,border:"1px solid #E5E8EE",background:"white",color:isLast?"#E5E8EE":"#8B95A1",fontSize:11,flexShrink:0,whiteSpace:"nowrap"}}>{rbl} ▶</button>
        </div>
        <div style={{textAlign:"right",fontSize:10,color:"#1A6DFF",fontWeight:600,marginBottom:6}}>진행방향 {tNxt}역 ▶</div>
        {/* 확률 미니카드 */}
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <div style={{flex:1,background:gb(curP),borderRadius:10,padding:"8px 10px",textAlign:"center",border:`1px solid ${gc(curP)}33`}}>
            <div style={{fontSize:10,color:"#8B95A1"}}>현재역 앉을 확률</div>
            <div style={{fontSize:20,fontWeight:800,color:gc(curP)}}>{curP}%</div>
          </div>
          {nxtP!==null&&<div style={{flex:1,background:gb(nxtP),borderRadius:10,padding:"8px 10px",textAlign:"center",border:`1px solid ${gc(nxtP)}33`}}>
            <div style={{fontSize:10,color:"#8B95A1"}}>{tNxt}역</div>
            <div style={{fontSize:20,fontWeight:800,color:gc(nxtP)}}>{nxtP}%</div>
          </div>}
        </div>
        {/* 좌석 카드 */}
        <div style={{display:"flex",alignItems:"stretch",background:"white",border:"1px solid #F0F2F5",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
          <div style={{width:30,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#F8F9FB",borderRight:"1px solid #F0F2F5",padding:"6px 0",gap:2}}>
            <div style={{fontSize:7,color:"#C5CAD5",writingMode:"vertical-rl"}}>출입문</div>
            <Door hi={false}/><div style={{fontSize:7,color:"#C5CAD5"}}>{car}-{zone+1}</div>
          </div>
          <div style={{flex:1,padding:"10px 4px"}}>
            <div style={{fontSize:7,color:"#B0B8C1",marginBottom:3,textAlign:"center"}}>↑ 위 (창문)</div>
            <div style={{display:"flex",gap:2,justifyContent:"center"}}>
              {ad.top?.map((seat,i)=>{const key=`${ak}-top-${i}`,wc=wq[key]||0;return(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  {wc>0?<div style={{display:"flex",gap:1,marginBottom:2}}>{Array.from({length:Math.min(wc,3)},(_,j)=><div key={j} style={{width:10,height:10,borderRadius:"50%",background:"#FFF8E1",border:"1px solid #FF8F00",fontSize:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#FF8F00"}}>🧍</div>)}</div>:<div style={{height:13}}/>}
                  <Seat seat={seat} reserved={!!(reserved[key]?.length)} reaction={react[seat?.user?.id]} reported={reported[key]} onClick={()=>handleSeatClick("top",i)}/>
                </div>);})}
            </div>
            <div style={{height:26,display:"flex",alignItems:"center",justifyContent:"center",color:"#E5E8EE",fontSize:8,letterSpacing:2}}>── 통로 ──</div>
            <div style={{display:"flex",gap:2,justifyContent:"center"}}>
              {ad.bottom?.map((seat,i)=>{const key=`${ak}-bottom-${i}`,wc=wq[key]||0;return(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <Seat seat={seat} reserved={!!(reserved[key]?.length)} reaction={react[seat?.user?.id]} reported={reported[key]} onClick={()=>handleSeatClick("bottom",i)}/>
                  {wc>0?<div style={{display:"flex",gap:1,marginTop:2}}>{Array.from({length:Math.min(wc,3)},(_,j)=><div key={j} style={{width:10,height:10,borderRadius:"50%",background:"#FFF8E1",border:"1px solid #FF8F00",fontSize:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#FF8F00"}}>🧍</div>)}</div>:<div style={{height:13}}/>}
                </div>);})}
            </div>
            <div style={{fontSize:7,color:"#B0B8C1",marginTop:3,textAlign:"center"}}>↓ 아래 (창문)</div>
          </div>
          <div style={{width:30,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#EEF4FF",borderLeft:"1px solid #DDEEFF",padding:"6px 0",gap:2}}>
            <div style={{fontSize:7,color:"#1A6DFF",writingMode:"vertical-rl"}}>출입문</div>
            <Door hi={true}/><div style={{fontSize:7,color:"#1A6DFF",fontWeight:700}}>{car}-{zone}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {[{l:"빈자리",c:"#00C853",f:s=>s.status==="empty"},{l:"곧 비는",c:"#FF8F00",f:s=>s.status==="leaving-soon"},{l:"사용중",c:"#B0B8C1",f:s=>s.status==="occupied"}].map(({l,c,f})=>(
            <div key={l} style={{flex:1,background:"white",borderRadius:10,padding:"8px 4px",textAlign:"center",border:"1px solid #F0F2F5"}}>
              <div style={{fontSize:16,fontWeight:800,color:c}}>{cnt(f)}</div>
              <div style={{fontSize:9,color:"#8B95A1",marginTop:1}}>{l}</div>
            </div>
          ))}
        </div>
        {ad.standing?.length>0&&<div style={{marginTop:10,background:"white",borderRadius:12,padding:"10px 12px",border:"1px solid #F0F2F5"}}>
          <div style={{fontSize:11,color:"#8B95A1",marginBottom:8}}>🚶 서있는 승객 {ad.standing.length}명</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {ad.standing.map((u,i)=>(
              <div key={i} onClick={()=>!u.isUnknown&&setProfMod(u)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:u.isUnknown?"default":"pointer",position:"relative"}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:"#F8F9FB",border:"1px solid #E5E8EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{u.avatar}</div>
                {react[u.id]&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",fontSize:12}}>{react[u.id]}</div>}
                <div style={{fontSize:8,color:"#B0B8C1"}}>{u.name}</div>
              </div>
            ))}
          </div>
        </div>}
        <div style={{fontSize:9,color:"#B0B8C1",marginTop:8,textAlign:"center"}}>🟢 빈자리→등록(+10P) · 🟡 하차예정→예약 · ⚫ 점유→제보(+3P)</div>
      </div>

      {alrt&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px"}}>
        <div style={{background:"white",borderRadius:18,padding:"24px 20px",width:"100%",border:"2px solid #FF8F00",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:8}}>🔔</div>
          <div style={{fontSize:16,fontWeight:800,color:"#FF8F00",marginBottom:5}}>곧 내리실 역이에요!</div>
          <div style={{fontSize:13,color:"#191F28",marginBottom:3}}>다음 역: <strong>{myDest}역</strong></div>
          <div style={{fontSize:12,color:"#8B95A1",marginBottom:16}}>역 도착 시 자리 자동 해제</div>
          <button onClick={()=>setAlrt(false)} style={{width:"100%",padding:"11px",borderRadius:10,background:"#FF8F00",color:"white",fontSize:13,fontWeight:700}}>확인</button>
        </div>
      </div>}
      {sentEmoji&&<div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",background:"#191F28dd",color:"white",borderRadius:20,padding:"9px 18px",fontSize:13,fontWeight:600,zIndex:998,display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap"}}><span style={{fontSize:18}}>{sentEmoji.emoji}</span>{sentEmoji.to}님에게 보냈어요</div>}

      {modal?.type==="mySeat"&&<Sheet onClose={()=>{setModal(null);setRdest(null);}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:3,color:"#191F28"}}>🪑 내 자리 등록</div>
        <div style={{fontSize:12,color:"#8B95A1",marginBottom:12}}>하차역 선택 <span style={{color:"#FF8F00"}}>+10P</span></div>
        <DestList onSelect={setRdest} sel={rdest}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setModal(null)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:13}}>취소</button>
          <button onClick={()=>rdest&&confirmSeat(modal.row,modal.i,modal.key,rdest)} disabled={!rdest} style={{flex:2,padding:"11px",borderRadius:10,background:rdest?"#1A6DFF":"#F0F2F5",color:rdest?"white":"#B0B8C1",fontSize:13,fontWeight:700}}>등록 (+10P)</button>
        </div>
      </Sheet>}

      {/* 2. 빈자리 클릭 — 등록 or 제보 선택 */}
      {modal?.type==="emptyChoice"&&<Sheet onClose={()=>setModal(null)}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:3,color:"#191F28"}}>빈 자리예요</div>
        <div style={{fontSize:12,color:"#8B95A1",marginBottom:16}}>어떻게 하시겠어요?</div>
        <button onClick={()=>setModal({type:"mySeat",row:modal.row,i:modal.i,key:modal.key})}
          style={{width:"100%",padding:"14px",borderRadius:11,background:"#1A6DFF",color:"white",fontSize:14,fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          🪑 내 자리로 등록하기 (+10P)
        </button>
        <button onClick={()=>setModal({type:"reportEmpty",row:modal.row,i:modal.i,key:modal.key})}
          style={{width:"100%",padding:"14px",borderRadius:11,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          📍 자리 상태 제보하기 (+3P)
        </button>
      </Sheet>}

      {/* 2. 빈자리 제보 모달 */}
      {modal?.type==="reportEmpty"&&<Sheet onClose={()=>setModal(null)}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:3,color:"#191F28"}}>📍 빈자리 상태 제보</div>
        <div style={{fontSize:12,color:"#8B95A1",marginBottom:14}}>실제 상태를 알려주세요 <span style={{color:"#FF8F00"}}>+3P</span></div>
        {[{s:"empty",l:"맞아요, 비어있어요",i:"✅",c:"#00C853"},
          {s:"occupied",l:"아니요, 사람 있어요",i:"🚫",c:"#8B95A1"}].map(({s,l,i,c})=>(
          <button key={s} onClick={()=>{
            setReported(p=>({...p,[modal.key]:s}));
            setAreas(p=>{const u=JSON.parse(JSON.stringify(p));u[ak][modal.row][modal.i]=s==="empty"?{status:"empty",user:null}:{...u[ak][modal.row][modal.i],status:s,user:s==="occupied"?mkUnknown():null};return u;});
            addPts(3,"제보 +3P 🙏");setModal(null);
          }} style={{width:"100%",padding:"12px 14px",borderRadius:9,textAlign:"left",background:"#F8F9FB",border:"1px solid #F0F2F5",color:c,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <span style={{fontSize:16}}>{i}</span>{l}
          </button>
        ))}
      </Sheet>}

      {/* 1. detail 모달 — afterStep으로 나보다 늦게 내리는 자리만 예약 가능 */}
      {modal?.type==="detail"&&<Sheet onClose={()=>setModal(null)}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12,color:"#191F28"}}>⏱ 하차 예정 자리</div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,padding:"12px",background:"#FFF8E1",borderRadius:12,border:"1px solid #FFE082"}}>
          <span style={{fontSize:30}}>{modal.seat.user?.avatar||"👤"}</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#191F28"}}>{modal.seat.user?.name||"승객"}</div>
            <div style={{fontSize:12,color:"#FF8F00",marginTop:2}}>📍 {modal.seat.user?.destStation||"?"}역 하차 예정</div>
            {(wq[modal.key]||0)>0&&<div style={{fontSize:11,color:"#8B95A1",marginTop:2}}>대기 {wq[modal.key]}명</div>}
          </div>
        </div>
        {modal.seat.user&&!modal.seat.user.isUnknown&&<button onClick={()=>{setProfMod(modal.seat.user);setModal(null);}} style={{width:"100%",padding:"10px",borderRadius:9,border:"1px solid #E5E8EE",background:"white",color:"#191F28",fontSize:13,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span>{modal.seat.user.avatar}</span>유저 정보 보기</button>}
        {myRes===modal.key
          ?<button onClick={()=>{setReserved(p=>{const n=JSON.parse(JSON.stringify(p));if(n[modal.key])n[modal.key]=n[modal.key].filter(q=>!q.isMe);return n;});setMyRes(null);toast_("예약 취소됨");setModal(null);}} style={{width:"100%",padding:"11px",borderRadius:9,background:"#F44336",color:"white",fontSize:13,fontWeight:700,marginBottom:8}}>예약 취소하기</button>
          :<button onClick={()=>setModal({...modal,type:"reserveSeat"})} style={{width:"100%",padding:"11px",borderRadius:9,background:"#FF8F00",color:"white",fontSize:13,fontWeight:700,marginBottom:8}}>선착순 예약하기 🎯</button>}
        <button onClick={()=>setModal(null)} style={{width:"100%",padding:"10px",borderRadius:9,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:13}}>닫기</button>
      </Sheet>}

      {modal?.type==="reserveSeat"&&(()=>{
        // 1. 현재 탑승자 하차역이 몇 정거장 후인지 계산
        const seatDestSt=modal.seat?.user?.destStation;
        let afterStep=0;
        if(seatDestSt){
          for(let k=1;k<=20;k++){
            const gn=isGn(LINE2[stIdx]),si=dir==="I"?(gn?(stIdx-k+N)%N:(stIdx+k)%N):(gn?(stIdx+k)%N:(stIdx-k+N)%N);
            if(LINE2[si]===seatDestSt){afterStep=k;break;}
          }
        }
        return <Sheet onClose={()=>{setModal(null);setRdest(null);}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:3,color:"#191F28"}}>📌 예약 하차역 선택</div>
          <div style={{fontSize:12,color:"#8B95A1",marginBottom:4}}>내리실 역을 선택해주세요</div>
          {afterStep>0&&<div style={{fontSize:11,color:"#FF8F00",background:"#FFF8E1",borderRadius:8,padding:"7px 10px",marginBottom:10}}>
            ⚠️ 현재 탑승자보다 늦게 내리는 역만 예약 가능해요 ({seatDestSt}역 이후)
          </div>}
          <DestList onSelect={setRdest} sel={rdest} color="#FF8F00" bg="#FFF8E1" brd="#FF8F00" afterStep={afterStep}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:13}}>취소</button>
            <button onClick={()=>rdest&&doReserve(modal.key,rdest)} disabled={!rdest} style={{flex:2,padding:"11px",borderRadius:10,background:rdest?"#FF8F00":"#F0F2F5",color:rdest?"white":"#B0B8C1",fontSize:13,fontWeight:700}}>예약 완료 🎯</button>
          </div>
        </Sheet>;
      })()}

      {/* 3. 점유 자리 제보 — reported 상태 반영 */}
      {modal?.type==="report"&&<Sheet onClose={()=>setModal(null)}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:3,color:"#191F28"}}>📍 자리 상태 제보</div>
        {modal.alreadyReported
          ?<div style={{fontSize:12,color:"#FF8F00",background:"#FFF8E1",borderRadius:8,padding:"7px 10px",marginBottom:10}}>✓ 이미 제보하셨어요. 다시 제보할 수 있어요.</div>
          :<div style={{fontSize:12,color:"#8B95A1",marginBottom:12}}>현재 상태 <span style={{color:"#FF8F00"}}>+3P</span></div>}
        {modal.user&&<button onClick={()=>{setProfMod(modal.user);setModal(null);}} style={{width:"100%",padding:"10px",borderRadius:9,border:"1px solid #E5E8EE",background:"white",color:"#191F28",fontSize:13,marginBottom:8,display:"flex",alignItems:"center",gap:8}}><span>{modal.user.avatar}</span>유저 정보 보기 →</button>}
        {[{s:"empty",l:"비어있어요",i:"✅",c:"#00C853"},{s:"occupied",l:"사람 있어요",i:"🚫",c:"#8B95A1"}].map(({s,l,i,c})=>(
          <button key={s} onClick={()=>{
            setReported(p=>({...p,[modal.key]:s}));
            setAreas(p=>{const u=JSON.parse(JSON.stringify(p));u[ak][modal.row][modal.i]=s==="empty"?{status:"empty",user:null}:{...u[ak][modal.row][modal.i],status:s};return u;});
            addPts(3,"제보 +3P 🙏");setModal(null);
          }} style={{width:"100%",padding:"11px 13px",borderRadius:9,textAlign:"left",background:reported[modal.key]===s?"#FFF8E1":"#F8F9FB",border:`1px solid ${reported[modal.key]===s?"#FF8F00":"#F0F2F5"}`,color:c,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:16}}>{i}</span>{l}
            {reported[modal.key]===s&&<span style={{marginLeft:"auto",fontSize:11,color:"#FF8F00"}}>이전 제보</span>}
          </button>
        ))}
      </Sheet>}
      {modal?.type==="replace"&&<Sheet onClose={()=>setModal(null)}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:7,color:"#191F28"}}>⚠️ 이미 자리 등록됨</div>
        <div style={{fontSize:13,color:"#8B95A1",marginBottom:16}}>기존 자리를 취소하고 새로 등록할까요?</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setModal(null)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:13}}>취소</button>
          <button onClick={()=>openModal({type:"mySeat",row:modal.row,i:modal.i,key:modal.key})} style={{flex:2,padding:"11px",borderRadius:10,background:"#FF8F00",color:"white",fontSize:13,fontWeight:700}}>새로 등록하기</button>
        </div>
      </Sheet>}
      {profMod&&!chatMod&&<Sheet onClose={()=>setProfMod(null)}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:"#F8F9FB",border:"2px solid #E5E8EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{profMod.avatar}</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#191F28"}}>{profMod.name}</div>
            {profMod.destStation&&<div style={{fontSize:12,color:"#8B95A1",marginTop:2}}>📍 {profMod.destStation}역 하차 예정</div>}
          </div>
        </div>
        <div style={{fontSize:12,color:"#8B95A1",marginBottom:8}}>이모티콘 보내기</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {availEmojis.map(e=><button key={e} onClick={()=>sendEmoji(profMod.id,e)} style={{fontSize:20,background:"#F8F9FB",border:"1px solid #E5E8EE",borderRadius:9,padding:"5px 8px"}}>{e}</button>)}
          <button onClick={()=>setSub("shop")} style={{fontSize:11,background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:9,padding:"5px 10px",color:"#FF8F00",fontWeight:700}}>+ 구매</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setChatMod(profMod)} style={{flex:1,padding:"11px",borderRadius:10,background:"#1A6DFF",color:"white",fontSize:13,fontWeight:700}}>💬 채팅하기</button>
          <button onClick={()=>setProfMod(null)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:13}}>닫기</button>
        </div>
      </Sheet>}
      {chatMod&&<div style={{position:"fixed",inset:0,background:"white",zIndex:400,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto"}}>
        <div style={{padding:"12px 14px",borderBottom:"1px solid #F0F2F5",display:"flex",alignItems:"center",gap:9}}>
          <button onClick={()=>setChatMod(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#8B95A1"}}>←</button>
          <div style={{width:30,height:30,borderRadius:"50%",background:"#F8F9FB",border:"1px solid #E5E8EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{chatMod.avatar}</div>
          <div><div style={{fontSize:13,fontWeight:700,color:"#191F28"}}>{chatMod.name}</div><div style={{fontSize:10,color:"#8B95A1"}}>{chatMod.destStation}역 하차</div></div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:8,background:"#F8F9FB"}}>
          {(chatHist[chatMod.id]||[]).length===0&&<div style={{textAlign:"center",color:"#B0B8C1",fontSize:13,marginTop:40}}>대화를 시작해보세요 👋</div>}
          {(chatHist[chatMod.id]||[]).map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.from==="me"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"70%",padding:"9px 12px",borderRadius:m.from==="me"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.from==="me"?"#1A6DFF":"white",color:m.from==="me"?"white":"#191F28",fontSize:13,boxShadow:"0 1px 4px rgba(0,0,0,.07)"}}>
                <div>{m.text}</div>
                <div style={{fontSize:9,color:m.from==="me"?"rgba(255,255,255,.6)":"#B0B8C1",marginTop:3,textAlign:"right"}}>{m.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 12px",borderTop:"1px solid #F0F2F5",display:"flex",gap:7}}>
          <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat(chatMod.id)} placeholder="메시지 입력..." style={{flex:1,background:"#F8F9FB",border:"1px solid #E5E8EE",borderRadius:20,padding:"9px 14px",fontSize:13,outline:"none",color:"#191F28"}}/>
          <button onClick={()=>sendChat(chatMod.id)} style={{width:36,height:36,borderRadius:"50%",background:"#1A6DFF",color:"white",fontSize:15}}>↑</button>
        </div>
      </div>}
      {editProf&&<Sheet onClose={()=>setEditProf(false)}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12,color:"#191F28"}}>✏️ 프로필 편집</div>
        <div style={{fontSize:12,color:"#8B95A1",marginBottom:4}}>아바타</div>
        <div style={{fontSize:11,color:"#B0B8C1",marginBottom:8}}>특별 아바타는 <span style={{color:"#FF8F00",cursor:"pointer"}} onClick={()=>setSub("shop")}>포인트샵</span>에서 구매</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {allAvts.map(av=><button key={av} onClick={()=>setTmpAv(av)} style={{fontSize:19,background:tmpAv===av?"#EEF4FF":"#F8F9FB",border:tmpAv===av?"2px solid #1A6DFF":"2px solid transparent",borderRadius:8,padding:"5px 6px"}}>{av}</button>)}
        </div>
        <div style={{fontSize:12,color:"#8B95A1",marginBottom:6}}>닉네임</div>
        <input autoFocus value={tmpName} onChange={e=>setTmpName(e.target.value)} maxLength={10} placeholder="닉네임" style={{width:"100%",background:"#F8F9FB",border:"1px solid #E5E8EE",borderRadius:9,padding:"10px 12px",fontSize:14,outline:"none",marginBottom:14,color:"#191F28",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setEditProf(false)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:13}}>취소</button>
          <button onClick={()=>{setMyProf({avatar:tmpAv,name:tmpName||"나"});setEditProf(false);}} style={{flex:2,padding:"11px",borderRadius:10,background:"#1A6DFF",color:"white",fontSize:13,fontWeight:700}}>저장</button>
        </div>
      </Sheet>}
      {toast&&<Toast msg={toast}/>}
    </div>;
  }

  // ════ 메인 흐름 (앉을 확률) ════
  const SocialBtn=()=><button onClick={enterSocial} style={{width:"100%",padding:"14px",borderRadius:10,border:"2px solid #1A6DFF",background:"white",color:"#1A6DFF",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>👥 자리 상세 보기</button>;

  return <div style={{minHeight:"100vh",background:"#F5F6F8",fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif",maxWidth:430,margin:"0 auto",color:"#191F28"}}>
    <style>{`*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;} @keyframes su{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}} .su{animation:su .22s ease forwards;} button{font-family:inherit;border:none;cursor:pointer;} ::-webkit-scrollbar{display:none;}`}</style>

    {step===1&&<div className="su">
      <div style={{display:"flex",alignItems:"center",padding:"14px 18px 10px",background:"white",borderBottom:"1px solid #F0F2F5",position:"sticky",top:0,zIndex:10}}>
        <div style={{flex:1,fontSize:17,fontWeight:700,color:"#191F28",textAlign:"center"}}>🚇 MetaMetro</div>
        <PtBadge onClick={()=>setSub("shop")}/>
      </div>
      <PBar/>
      <div style={{padding:"22px 18px"}}>
        <div style={{fontSize:20,fontWeight:800,marginBottom:3}}>어느 호선을 타세요?</div>
        <div style={{fontSize:13,color:"#8B95A1",marginBottom:20}}>현재는 2호선만 지원해요</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
          {[{n:1,c:"#375AA7"},{n:2,c:"#3DBE2D",on:true},{n:3,c:"#F06B00"},{n:4,c:"#2CAAD6"},{n:5,c:"#8B50A4"},{n:6,c:"#C55C1D"},{n:7,c:"#747F00"},{n:8,c:"#E5609F"},{n:9,c:"#BFA100"}].map(l=>(
            <button key={l.n} onClick={()=>{sfx(l.on?"select":"click");l.on?setStep(2):toast_("준비 중이에요!");}} style={{background:l.on?"white":"#F8F9FB",border:`1.5px solid ${l.on?l.c:"#E5E8EE"}`,borderRadius:12,padding:"13px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,opacity:l.on?1:.45,boxShadow:l.on?`0 2px 10px ${l.c}33`:"none",position:"relative"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:l.c,color:"white",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{l.n}</div>
              <div style={{fontSize:11,fontWeight:600,color:l.on?"#191F28":"#B0B8C1"}}>{l.n}호선</div>
              {!l.on&&<div style={{position:"absolute",top:4,right:4,fontSize:8,color:"#B0B8C1",background:"#F0F2F5",padding:"1px 4px",borderRadius:3}}>준비중</div>}
            </button>
          ))}
        </div>
      </div>
    </div>}

    {step===2&&<div style={{display:"flex",flexDirection:"column",height:"100vh"}} className="su">
      <div style={{display:"flex",alignItems:"center",padding:"12px 16px",background:"white",borderBottom:"1px solid #F0F2F5",position:"sticky",top:0,zIndex:10}}>
        <BackBtn onClick={()=>setStep(1)}/>
        <div style={{flex:1,fontSize:15,fontWeight:700,color:"#191F28",textAlign:"center"}}>{picking==="cur"?"탑승역 선택":"하차역 선택"}</div>
        <PtBadge onClick={()=>setSub("shop")}/>
      </div>
      <PBar/>
      <div style={{padding:"10px 14px",background:"white",borderBottom:"1px solid #F0F2F5",display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>{setCurSt(null);setPicking("cur");}} style={{flex:1,background:picking==="cur"?"#EEF4FF":"white",border:`1.5px solid ${picking==="cur"?"#1A6DFF":"#E5E8EE"}`,borderRadius:9,padding:"9px 10px",textAlign:"left"}}>
          <div style={{fontSize:10,color:"#8B95A1"}}>출발</div>
          <div style={{fontSize:13,fontWeight:700,color:curSt?"#1A6DFF":"#B0B8C1"}}>{curSt?`${curSt}역`:"선택 중…"}</div>
        </button>
        <div style={{color:"#C5CAD5",fontSize:15,flexShrink:0}}>→</div>
        <button onClick={()=>{if(curSt){setDestSt(null);setPicking("dest");}}} style={{flex:1,background:picking==="dest"?"#EEF4FF":"white",border:`1.5px solid ${picking==="dest"?"#1A6DFF":"#E5E8EE"}`,borderRadius:9,padding:"9px 10px",textAlign:"left"}}>
          <div style={{fontSize:10,color:"#8B95A1"}}>하차</div>
          <div style={{fontSize:13,fontWeight:700,color:destSt?"#1A6DFF":"#B0B8C1"}}>{destSt?`${destSt}역`:"선택 중…"}</div>
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",background:"white"}}>
        {LINE2.map((s,i)=>{
          const isCur=s===curSt,isDest=s===destSt,dis=picking==="dest"&&s===curSt;
          return <button key={s+i} disabled={dis} onClick={()=>{
            sfx("select");
            if(picking==="cur"){setCurSt(s);setPicking("dest");}
            else{if(s===curSt){toast_("출발역과 다른 역 선택해주세요");return;}const d=calcDir(curSt,s);setDestSt(s);setDir(d);setStIdx(LINE2.indexOf(curSt));setPicking("done");setStep(3);}
          }} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",width:"100%",background:isCur||isDest?"#EEF4FF":"white",borderBottom:"1px solid #F5F6F8",opacity:dis?.35:1,cursor:dis?"not-allowed":"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:isCur||isDest?"#1A6DFF":"#E5E8EE"}}/>
              <span style={{fontSize:14,color:isCur||isDest?"#1A6DFF":"#191F28",fontWeight:isCur||isDest?700:400}}>{s}</span>
              {TRANSFER.has(s)&&<span style={{fontSize:9,color:"#FF8F00",background:"#FFF8E1",borderRadius:3,padding:"2px 5px",fontWeight:600}}>환승</span>}
            </div>
            {isCur&&<span style={{fontSize:10,color:"#1A6DFF",fontWeight:600}}>출발</span>}
            {isDest&&<span style={{fontSize:10,color:"#1A6DFF",fontWeight:600}}>하차</span>}
          </button>;
        })}
      </div>
    </div>}

    {step===3&&<div className="su">
      <div style={{display:"flex",alignItems:"center",padding:"12px 16px",background:"white",borderBottom:"1px solid #F0F2F5",position:"sticky",top:0,zIndex:10}}>
        <BackBtn onClick={()=>{setStep(2);setPicking("dest");}}/>
        <div style={{flex:1,fontSize:15,fontWeight:700,color:"#191F28",textAlign:"center"}}>칸과 구역 선택</div>
        <PtBadge onClick={()=>setSub("shop")}/>
      </div>
      <PBar/>
      <div style={{padding:"16px 14px 48px"}}>
        <div style={{background:"white",borderRadius:12,padding:"12px",boxShadow:"0 1px 8px rgba(0,0,0,.05)",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#191F28"}}>{curSt}역 <span style={{fontSize:11,color:"#8B95A1",fontWeight:400}}>{dir==="I"?"내선(시계)":"외선(반시계)"}</span></div>
              <div style={{fontSize:11,color:"#8B95A1",marginTop:1}}>{nxt?`다음역: ${nxt}`:""}</div>
            </div>
            {curCong&&<div style={{background:gcb(curCong),color:gcc(curCong),borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:700}}>{gcl(curCong)} {Math.round(curCong)}%</div>}
          </div>
        </div>
        {best&&<div style={{background:"white",borderRadius:12,padding:"11px",boxShadow:"0 1px 8px rgba(0,0,0,.05)",marginBottom:12,display:"flex",gap:10}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:34,height:34,borderRadius:8,background:"#E8F5E9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🟢</div>
            <div>
              <div style={{fontSize:10,color:"#8B95A1"}}>현재역 추천</div>
              <div style={{fontSize:13,fontWeight:800,color:"#00C853"}}>{best.car}칸 {best.car}-{best.zone}구역 · {best.prob}%</div>
            </div>
          </div>
          {bestN&&<div style={{flex:1,display:"flex",alignItems:"center",gap:8,borderLeft:"1px solid #F0F2F5",paddingLeft:10}}>
            <div style={{width:34,height:34,borderRadius:8,background:"#E3F0FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔵</div>
            <div>
              <div style={{fontSize:10,color:"#8B95A1"}}>{nxt}역 추천</div>
              <div style={{fontSize:13,fontWeight:800,color:"#1A6DFF"}}>{bestN.car}칸 {bestN.car}-{bestN.zone}구역 · {bestN.prob}%</div>
            </div>
          </div>}
        </div>}
        {/* 칸 */}
        <div style={{fontSize:11,fontWeight:700,color:"#8B95A1",marginBottom:7}}>
          칸 선택 {!car&&<span style={{color:"#1A6DFF"}}>← 먼저 칸을 선택하세요</span>}
        </div>
        {[[1,2,3,4,5],[6,7,8,9,10]].map((row,ri)=>(
          <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:5}}>
            {row.map(c=>{
              const p=calcProb(curSt,nxt,dir,H,M,c,2);
              const ibCur=best?.car===c,ibNxt=bestN?.car===c,is=car===c;
              return <button key={c} onClick={()=>{sfx("select");setCar(c);setZone(null);}} style={{background:is?"#EEF4FF":"white",border:`1.5px solid ${is?"#1A6DFF":"#E5E8EE"}`,borderRadius:10,padding:"8px 2px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,minHeight:58,position:"relative",boxShadow:is?"0 2px 8px #1A6DFF22":"none",transition:"all .15s"}}>
                <div style={{position:"absolute",top:2,right:2,display:"flex",gap:1}}>
                  {ibCur&&<span style={{fontSize:8}}>🟢</span>}
                  {ibNxt&&<span style={{fontSize:8}}>🔵</span>}
                </div>
                <div style={{fontSize:12,fontWeight:700,color:is?"#1A6DFF":"#191F28"}}>{c}칸</div>
                <div style={{background:gb(p),color:gc(p),borderRadius:20,padding:"2px 5px",fontSize:10,fontWeight:600}}>{p}%</div>
              </button>;
            })}
          </div>
        ))}
        {/* 구역 - 칸 미선택 시 흐림 */}
        <div style={{position:"relative",marginTop:14}}>
          {!car&&<div style={{position:"absolute",inset:0,background:"rgba(245,246,248,.88)",zIndex:5,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,backdropFilter:"blur(1px)"}}>
            <div style={{fontSize:22}}>☝️</div>
            <div style={{fontSize:13,fontWeight:700,color:"#8B95A1"}}>먼저 칸을 선택해주세요</div>
          </div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
            <div style={{fontSize:11,fontWeight:700,color:"#8B95A1"}}>{car?`${car}칸 구역 선택`:"구역 선택"}</div>
            <div style={{fontSize:10,color:"#8B95A1"}}>🟢현재역 🔵{nxt}역</div>
          </div>
          <div style={{display:"flex",alignItems:"stretch",background:"#F8F9FB",borderRadius:10,overflow:"hidden",border:"1px solid #F0F2F5",minHeight:105}}>
            <div style={{width:5,background:"#E5E8EE",flexShrink:0}}/>
            {[1,2,3].map(z=>{
              const cp=car?calcProb(curSt,nxt,dir,H,M,car,z):0;
              const np=car&&nxt?calcProb(nxt,null,dir,H,M,car,z):null;
              const ibCurZ=best?.car===car&&best?.zone===z;
              const ibNxtZ=bestN?.car===car&&bestN?.zone===z;
              const is=zone===z&&!!car;
              return <div key={z} style={{display:"flex",alignItems:"stretch",flex:1}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"5px 2px",background:"#F0F2F5",width:30,gap:2,borderRight:"1px solid #E5E8EE"}}>
                  <Door hi={is}/><div style={{fontSize:7,color:"#C5CAD5",textAlign:"center"}}>{car||"?"}-{z}<br/>출입문</div>
                </div>
                <button onClick={()=>{if(!car)return;sfx("select");setZone(z);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"6px 2px",background:is?"#EEF4FF":"white",border:`2px solid ${is?"#1A6DFF":"transparent"}`,cursor:car?"pointer":"default"}}>
                  <div style={{fontSize:9,fontWeight:600,color:is?"#1A6DFF":"#8B95A1"}}>{car||"?"}-{z}구역</div>
                  {/* 현재역 확률 — 🟢만 표시 */}
                  <div style={{display:"flex",alignItems:"center",gap:2,marginTop:2}}>
                    {ibCurZ&&<span style={{fontSize:8}}>🟢</span>}
                    <span style={{fontSize:14,fontWeight:800,color:car?gc(cp):"#C5CAD5"}}>{car?`${cp}%`:"-%"}</span>
                  </div>
                  <div style={{fontSize:8,color:"#B0B8C1"}}>현재역</div>
                  {/* 다음역 확률 — 🔵는 여기에 */}
                  {np!==null&&<>
                    <div style={{display:"flex",alignItems:"center",gap:2,marginTop:1}}>
                      {ibNxtZ&&<span style={{fontSize:8}}>🔵</span>}
                      <div style={{fontSize:11,fontWeight:700,color:gc(np)}}>{np}%</div>
                    </div>
                    <div style={{fontSize:8,color:"#C5CAD5"}}>{nxt}</div>
                  </>}
                </button>
              </div>;
            })}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"5px 2px",background:"#F0F2F5",width:30,gap:2,borderLeft:"1px solid #E5E8EE"}}>
              <Door hi={false}/><div style={{fontSize:7,color:"#C5CAD5",textAlign:"center"}}>{car||"?"}-4<br/>출입문</div>
            </div>
            <div style={{width:5,background:"#E5E8EE",flexShrink:0}}/>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
          <button disabled={!(car&&zone)} onClick={()=>{sfx("success");setStep(4);}} style={{width:"100%",padding:"14px",borderRadius:10,background:car&&zone?"#1A6DFF":"#F0F2F5",color:car&&zone?"white":"#B0B8C1",fontSize:15,fontWeight:700,boxShadow:car&&zone?"0 4px 14px #1A6DFF33":"none"}}>
            {car&&zone?"결과 보기 →":"칸과 구역을 선택해주세요"}
          </button>
          {car&&zone&&<SocialBtn/>}
        </div>
      </div>
    </div>}

    {step===4&&car&&zone&&(()=>{
      const p=calcProb(curSt,nxt,dir,H,M,car,zone);
      const np=nxt?calcProb(nxt,null,dir,H,M,car,zone):null;
      return <div className="su">
        <div style={{display:"flex",alignItems:"center",padding:"12px 16px",background:"white",borderBottom:"1px solid #F0F2F5",position:"sticky",top:0,zIndex:10}}>
          <BackBtn onClick={()=>setStep(3)}/>
          <div style={{flex:1,fontSize:15,fontWeight:700,color:"#191F28",textAlign:"center"}}>앉을 확률</div>
          <PtBadge onClick={()=>setSub("shop")}/>
        </div>
        <PBar/>
        <div style={{padding:"16px 14px 48px"}}>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            {["2호선",`${curSt}→${destSt}`,dir==="I"?"내선":"외선",`${car}칸 ${car}-${zone}구역`,nxt?`다음역: ${nxt}`:""].filter(Boolean).map(c=>(
              <div key={c} style={{background:"white",border:"1px solid #E5E8EE",borderRadius:20,padding:"4px 11px",fontSize:11,color:"#8B95A1"}}>{c}</div>
            ))}
          </div>
          <div style={{background:`linear-gradient(135deg,${gb(p)},white)`,borderRadius:14,padding:"24px 16px",textAlign:"center",marginBottom:10,boxShadow:"0 1px 8px rgba(0,0,0,.05)"}}>
            <div style={{fontSize:11,color:"#8B95A1"}}>현재 역 기준</div>
            <div style={{fontSize:64,fontWeight:900,color:gc(p),lineHeight:1,margin:"8px 0 5px",letterSpacing:-2}}>{p}%</div>
            <div style={{display:"inline-block",background:gb(p),color:gc(p),borderRadius:20,padding:"5px 14px",fontSize:13,fontWeight:700,marginBottom:4}}>
              {p>=60?"👍 앉을 수 있어요!":p>=35?"🤔 어쩌면 가능해요":"😅 서있을 가능성 높아요"}
            </div>
            <div style={{fontSize:10,color:"#B0B8C1",marginTop:2}}>공공데이터 기반 · 칸/구역별 보정 적용</div>
          </div>
          {nxt&&np!==null&&<div style={{background:"white",borderRadius:12,padding:"13px",boxShadow:"0 1px 8px rgba(0,0,0,.05)",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:600,color:"#191F28",marginBottom:10}}>다음 역 비교 → {nxt}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-around",marginBottom:10}}>
              {[{st:curSt,prob:p,lbl:"지금"},{st:nxt,prob:np,lbl:"다음역"}].map((x,i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#8B95A1",marginBottom:3}}>{x.st}</div>
                  <div style={{fontSize:28,fontWeight:800,color:gc(x.prob)}}>{x.prob}%</div>
                  <div style={{background:gb(x.prob),color:gc(x.prob),borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:600,marginTop:3}}>{x.lbl}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"9px 12px",borderRadius:8,background:np>p?"#F0FFF4":"#FFF5F5",color:np>p?"#00A843":"#E53935",fontSize:12,fontWeight:600,textAlign:"center"}}>
              {np>p?`⏳ ${nxt}역에서 자리가 더 날 거예요`:`⚠️ ${nxt}역은 더 혼잡해져요`}
            </div>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={()=>{sfx("success");setStep(5);}} style={{width:"100%",padding:"14px",borderRadius:10,background:"#1A6DFF",color:"white",fontSize:15,fontWeight:700,boxShadow:"0 4px 14px #1A6DFF33"}}>자리 결과 남기기 →</button>
            <SocialBtn/>
          </div>
        </div>
      </div>;
    })()}

    {step===5&&<div className="su">
      <div style={{display:"flex",alignItems:"center",padding:"12px 16px",background:"white",borderBottom:"1px solid #F0F2F5",position:"sticky",top:0,zIndex:10}}>
        <BackBtn onClick={()=>setStep(4)}/>
        <div style={{flex:1,fontSize:15,fontWeight:700,color:"#191F28",textAlign:"center"}}>자리 어떠셨나요?</div>
        <PtBadge onClick={()=>setSub("shop")}/>
      </div>
      <PBar/>
      <div style={{padding:"20px 16px 48px",textAlign:"center"}}>
        <div style={{fontSize:13,color:"#8B95A1",marginBottom:3}}>앉든 서있든 알려주세요</div>
        <div style={{fontSize:12,color:"#B0B8C1",marginBottom:16}}>피드백마다 포인트 적립 🪙</div>
        <div style={{background:"#FFFBF0",border:"1px solid #FFE082",borderRadius:12,padding:"11px 14px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setSub("shop")}>
          <div style={{fontSize:12,color:"#8B95A1"}}>내 포인트 <span style={{color:"#FF8F00"}}>탭해서 샵 열기 →</span></div>
          <div style={{fontSize:17,fontWeight:800,color:"#FF8F00"}}>🪙 {pts}P</div>
        </div>
        {!fbDone?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{e:"👍",l:"앉았어요",c:"#00C853",bg:"#F0FFF4"},{e:"👎",l:"서있었어요",c:"#F44336",bg:"#FFF5F5"}].map(f=>(
            <button key={f.l} onClick={()=>{sfx("success");addPts(10,"+10P 적립!");setFbDone(true);}} style={{background:f.bg,border:`1.5px solid ${f.c}33`,borderRadius:16,padding:"22px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <div style={{fontSize:40}}>{f.e}</div>
              <div style={{fontSize:13,fontWeight:700,color:f.c}}>{f.l}</div>
              <div style={{fontSize:11,color:"#8B95A1"}}>+10P 적립</div>
            </button>
          ))}
        </div>:<div className="su" style={{marginBottom:16}}>
          <div style={{fontSize:46,marginBottom:8}}>🎉</div>
          <div style={{fontSize:16,fontWeight:700,color:"#191F28",marginBottom:4}}>감사해요!</div>
          <div style={{fontSize:19,fontWeight:800,color:"#FF8F00",marginBottom:4}}>🪙 {pts}P</div>
          <div style={{fontSize:12,color:"#8B95A1",marginBottom:16}}>피드백이 쌓일수록 더 정확해져요</div>
        </div>}
        {car&&zone&&<div style={{marginBottom:12}}><SocialBtn/></div>}
        <button onClick={()=>{sfx("click");setStep(1);setCurSt(null);setDestSt(null);setCar(null);setZone(null);setFbDone(false);setPicking("cur");}} style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid #E5E8EE",background:"white",color:"#8B95A1",fontSize:14,fontWeight:600}}>
          처음으로 돌아가기
        </button>
      </div>
    </div>}

    {toast&&<Toast msg={toast}/>}
  </div>;
}