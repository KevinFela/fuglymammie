const SUPABASE_URL="https://kdrenkxjhhupuvjhpdrk.supabase.co";
const SUPABASE_KEY="sb_publishable_u-kQrZgBjM35l7xVeBaaCw_sm2vVHXq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let eventsData=[];

const feedSection=document.getElementById("feed-section");
const eventsSection=document.getElementById("events-section");
const feedButton=document.getElementById("feed-btn");
const eventsButton=document.getElementById("events-btn");
const joinButton=document.getElementById("join-btn");
const brandLink=document.getElementById("brand-link");
const feedContainer=document.getElementById("feed-container");
const upcomingContainer=document.getElementById("upcoming-events-container");
const eventModal=document.getElementById("event-modal");
const joinModal=document.getElementById("join-modal");
const joinForm=document.getElementById("join-form");
const joinMessage=document.getElementById("join-message");

function escapeHTML(v){
  if(v===null||v===undefined)return "";
  return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function formatEventDate(s){
  if(!s)return "";
  return new Date(`${s}T00:00:00`).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"});
}

function isFutureOrToday(s){
  if(!s)return false;
  const e=new Date(`${s}T00:00:00`);
  const t=new Date();t.setHours(0,0,0,0);
  return e>=t;
}

function safeURL(u){
  if(!u||u==="#")return null;
  try{const x=new URL(u);return ["http:","https:"].includes(x.protocol)?x.href:null}catch{return null}
}

function entryLabel(t){
  return {free:"FREE EVENT",ticketed:"TICKETED",rsvp:"RSVP",invite_only:"INVITE ONLY"}[t]||"FREE EVENT";
}

function actionLabel(t){
  return {free:"Event Info",ticketed:"Get Tickets",rsvp:"RSVP",invite_only:"Event Info"}[t]||"Event Info";
}

async function loadEvents(){
  try{
    const {data,error}=await supabaseClient.from("events")
      .select("id,title,event_date,location,description,ticket_url,status,published,entry_type,image_url,video_url,created_at")
      .eq("published",true)
      .order("event_date",{ascending:false});
    if(error)throw error;
    eventsData=data||[];
    renderFeed();renderUpcomingEvents();
  }catch(error){
    console.error(error);
    feedContainer.innerHTML='<li class="empty-state">Unable to load updates right now.</li>';
    upcomingContainer.innerHTML='<li class="empty-state">Unable to load upcoming events.</li>';
  }
}

function card(e,upcoming=false){
  const crossed=!upcoming&&(e.status==="cancelled"||e.status==="postponed");
  return `<li class="feed-item" data-event-id="${escapeHTML(e.id)}">
    <span class="feed-date">${escapeHTML(formatEventDate(e.event_date))}</span>
    <div class="feed-title ${crossed?"strikethrough":""}">${escapeHTML(e.title)}</div>
    ${e.location?`<div class="feed-location">${escapeHTML(e.location)}</div>`:""}
    <span class="feed-entry-type">${escapeHTML(entryLabel(e.entry_type))}</span>
    ${!upcoming&&e.status!=="upcoming"?`<span class="event-status"> · ${escapeHTML(e.status)}</span>`:""}
  </li>`;
}

function renderFeed(){
  feedContainer.innerHTML=eventsData.length?eventsData.map(e=>card(e)).join(""):'<li class="empty-state">No updates available.</li>';
  addEventListeners();
}

function renderUpcomingEvents(){
  const list=eventsData.filter(e=>e.status==="upcoming"&&isFutureOrToday(e.event_date))
    .sort((a,b)=>new Date(`${a.event_date}T00:00:00`)-new Date(`${b.event_date}T00:00:00`));
  upcomingContainer.innerHTML=list.length?list.map(e=>card(e,true)).join(""):'<li class="empty-state">No upcoming events announced.</li>';
  addEventListeners();
}

function addEventListeners(){
  document.querySelectorAll("[data-event-id]").forEach(el=>el.onclick=()=>openEventModal(el.dataset.eventId));
}

function openEventModal(id){
  const e=eventsData.find(x=>x.id===id);if(!e)return;
  document.getElementById("modal-date").textContent=formatEventDate(e.event_date);
  document.getElementById("modal-entry-type").textContent=entryLabel(e.entry_type);
  document.getElementById("modal-title").textContent=e.title||"";
  document.getElementById("modal-location").textContent=e.location||"";
  document.getElementById("modal-body").textContent=e.description||"";

  const wrap=document.getElementById("modal-image-wrap");
  const img=document.getElementById("modal-image");
  if(e.image_url){img.src=e.image_url;img.alt=`${e.title||"Event"} poster`;wrap.hidden=false}
  else{img.removeAttribute("src");wrap.hidden=true}

  const ticket=document.getElementById("modal-ticket-btn");
  const t=safeURL(e.ticket_url);
  if(t){ticket.href=t;ticket.textContent=actionLabel(e.entry_type);ticket.hidden=false}
  else{ticket.hidden=true;ticket.removeAttribute("href")}

  const video=document.getElementById("modal-video-btn");
  const v=safeURL(e.video_url);
  if(v){video.href=v;video.hidden=false}
  else{video.hidden=true;video.removeAttribute("href")}

  eventModal.classList.add("active");
}

feedButton.onclick=()=>{feedSection.classList.add("active");eventsSection.classList.remove("active")};
eventsButton.onclick=()=>{eventsSection.classList.add("active");feedSection.classList.remove("active")};
brandLink.onclick=e=>{e.preventDefault();feedButton.click()};
joinButton.onclick=()=>{joinMessage.textContent="";joinModal.classList.add("active")};

document.getElementById("event-modal-close").onclick=()=>eventModal.classList.remove("active");
document.getElementById("join-modal-close").onclick=()=>joinModal.classList.remove("active");
document.querySelectorAll(".modal-overlay").forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove("active")});
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal-overlay").forEach(m=>m.classList.remove("active"))});

joinForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const first_name=document.getElementById("first-name").value.trim();
  const last_name=document.getElementById("last-name").value.trim();
  const email=document.getElementById("email").value.trim().toLowerCase();
  const city=document.getElementById("city").value.trim();
  const btn=joinForm.querySelector(".form-submit");
  btn.disabled=true;btn.textContent="Joining...";joinMessage.textContent="";
  try{
    const {error}=await supabaseClient.from("subscribers").insert([{first_name,last_name,email,city:city||null}]);
    if(error){
      if(error.code==="23505"){joinMessage.textContent="You're already in the network.";return}
      throw error;
    }
    joinMessage.textContent="You're in. Speak soon.";joinForm.reset();
  }catch(error){console.error(error);joinMessage.textContent="Unable to join right now. Please try again."}
  finally{btn.disabled=false;btn.textContent="Join Network"}
});

document.getElementById("instagram-link").href="https://instagram.com";
document.getElementById("x-link").href="https://x.com";
document.getElementById("year").textContent=new Date().getFullYear();
loadEvents();
