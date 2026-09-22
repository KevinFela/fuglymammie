

// ======================================================
// FUGLY MAMMIE TURNS PURPLE — SESSION INTRO
// ======================================================
const purpleAwareness = document.getElementById("purple-awareness");
const purpleAwarenessEnter = document.getElementById("purple-awareness-enter");

if (purpleAwareness) {
  let purpleIntroSeen = false;

  try {
    purpleIntroSeen = sessionStorage.getItem("fm-purple-intro-seen-v2") === "1";
  } catch (error) {}

  if (purpleIntroSeen) {
    purpleAwareness.remove();
  } else {
    document.body.classList.add("fm-intro-lock");

    let purpleIntroClosed = false;
    let purpleIntroTimer;

    const closePurpleAwareness = () => {
      if (purpleIntroClosed) return;
      purpleIntroClosed = true;

      try {
        sessionStorage.setItem("fm-purple-intro-seen-v2", "1");
      } catch (error) {}

      clearTimeout(purpleIntroTimer);
      purpleAwareness.classList.add("is-leaving");
      document.body.classList.remove("fm-intro-lock");

      // Mobile Safari can restore a previous scroll position while a full-screen
      // intro is closing. Always reveal the homepage from its true top edge.
      window.scrollTo(0, 0);

      window.setTimeout(() => {
        purpleAwareness.remove();
        window.scrollTo(0, 0);
      }, 720);
    };

    if (purpleAwarenessEnter) {
      purpleAwarenessEnter.addEventListener("click", closePurpleAwareness);
    }

    purpleIntroTimer = window.setTimeout(closePurpleAwareness, 4500);
  }
}

const SUPABASE_URL="https://kdrenkxjhhupuvjhpdrk.supabase.co";
const SUPABASE_KEY="sb_publishable_u-kQrZgBjM35l7xVeBaaCw_sm2vVHXq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let eventsData=[];
let postsData=[];

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
    // Preserve editorial posts even if the existing events query is offline.
    renderFeed();
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

// Editorial posts and existing events share one date-ordered feed.
// User-supplied text is always escaped; only recognised YouTube IDs enter iframes.
function youtubeEmbed(link){
  const u=safeURL(link);
  if(!u)return null;
  try{
    const x=new URL(u),host=x.hostname.toLowerCase().replace(/^www\./,"").replace(/^m\./,"");
    let id=null;
    if(host==="youtu.be")id=x.pathname.split("/")[1];
    else if(["youtube.com","youtube-nocookie.com"].includes(host)){
      const segments=x.pathname.split("/").filter(Boolean);
      id=segments[0]==="watch"?x.searchParams.get("v"):
        (["embed","shorts","live"].includes(segments[0])?segments[1]:null);
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id||"")?`https://www.youtube-nocookie.com/embed/${id}`:null;
  }catch{return null}
}

function postCard(p){
  const img=safeURL(p.image_url),video=safeURL(p.video_url),embed=youtubeEmbed(p.video_url);
  const media=img?`<img class="post-cover" src="${escapeHTML(img)}" alt="${escapeHTML(p.title)}" loading="lazy">`:"";
  // Do not create any iframe while the post is collapsed. Create it only
  // after a real click on the post so playback cannot start off-screen.
  const player=embed?`<div class="post-video" data-youtube-embed="${escapeHTML(embed)}"></div>`:
    video?`<a class="post-video-link" href="${escapeHTML(video)}" target="_blank" rel="noopener noreferrer">Watch video</a>`:"";
  const date=p.post_date?`${p.post_date.slice(2,4)}-${p.post_date.slice(5,7)}-${p.post_date.slice(8,10)}`:"";
  return `<li class="feed-item feed-post"><article>
    <details class="post-expander"><summary class="post-heading"><span class="feed-date">${escapeHTML(date)}</span><span class="post-title">${escapeHTML(p.title)}</span></summary>
      <div class="post-content">
        ${player}${media}
        ${p.body?`<div class="post-body">${escapeHTML(p.body)}</div>`:""}
      </div>
    </details>
  </article></li>`;
}

function connectPostExpanders(){
  const posts=[...feedContainer.querySelectorAll(".post-expander")];
  posts.forEach(details=>details.addEventListener("toggle",()=>{
    const player=details.querySelector(".post-video[data-youtube-embed]");
    if(!details.open){
      // Removing the iframe stops playback, not just hides it.
      if(player)player.replaceChildren();
      return;
    }
    // Show one expanded editorial post and play only one video at a time.
    posts.forEach(other=>{
      if(other!==details){
        other.open=false;
        other.querySelector(".post-video[data-youtube-embed]")?.replaceChildren();
      }
    });
    if(!player||player.querySelector("iframe"))return;
    const base=player.dataset.youtubeEmbed;
    // It comes only from the validated, 11-character YouTube ID above.
    if(!base?.startsWith("https://www.youtube-nocookie.com/embed/"))return;
    const frame=document.createElement("iframe");
    frame.src=base+"?autoplay=1&mute=1&playsinline=1&rel=0";
    frame.title=(details.querySelector(".post-title")?.textContent||"Editorial post")+" video";
    frame.setAttribute("allow","autoplay; encrypted-media; gyroscope; picture-in-picture; web-share");
    frame.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
    frame.setAttribute("allowfullscreen","");
    player.appendChild(frame);
  }));
}

function renderFeed(){
  const entries=[
    ...eventsData.map(e=>({date:e.event_date||"",type:0,html:card(e)})),
    ...postsData.map(p=>({date:p.post_date||"",type:1,post:p})),
  ].sort((a,b)=>b.date.localeCompare(a.date)||b.type-a.type);
  feedContainer.innerHTML=entries.length?entries.map(e=>e.post?postCard(e.post):e.html).join(""):
    '<li class="empty-state">No updates available.</li>';
  addEventListeners();
  connectPostExpanders();
}

async function loadPosts(){
  const {data,error}=await supabaseClient.from("editorial_posts")
    .select("id,title,post_date,body,image_url,video_url,published,created_at")
    .eq("published",true).order("post_date",{ascending:false})
    .order("created_at",{ascending:false});
  if(error){console.warn("Editorial posts unavailable; showing events only:",error.message);return}
  postsData=data||[];renderFeed();
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
loadPosts();
