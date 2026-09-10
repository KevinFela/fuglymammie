const SUPABASE_URL="https://kdrenkxjhhupuvjhpdrk.supabase.co";
const SUPABASE_KEY="sb_publishable_u-kQrZgBjM35l7xVeBaaCw_sm2vVHXq";
const BUCKET="event-media";
const MAX_IMAGE_SIZE=10*1024*1024;
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let adminEvents=[],subscribers=[],removeExistingImage=false;

const $=id=>document.getElementById(id);
const logoutButton=$("logout-button"),adminEventsList=$("admin-events-list"),subscriberList=$("subscriber-list");
const totalEventsElement=$("total-events"),upcomingEventsCountElement=$("upcoming-events-count"),subscriberCountElement=$("subscriber-count");
const addEventButton=$("add-event-button"),overviewAddEventButton=$("overview-add-event"),eventEditorModal=$("event-editor-modal");
const closeEventEditorButton=$("close-event-editor"),eventForm=$("event-form"),eventFormHeading=$("event-form-heading");
const eventFormMessage=$("event-form-message"),saveEventButton=$("save-event-button"),entryTypeInput=$("event-entry-type");
const ticketUrlInput=$("event-ticket-url"),ticketUrlLabel=$("ticket-url-label"),ticketUrlHelp=$("ticket-url-help");
const imageInput=$("event-image"),imagePreview=$("event-image-preview"),existingImageUrlInput=$("existing-image-url"),removeImageButton=$("remove-event-image");

function escapeHTML(v){if(v===null||v===undefined)return "";return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function formatDate(s){return s?new Date(`${s}T00:00:00`).toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}):""}
function formatDateTime(s){return s?new Date(s).toLocaleString("en-ZA",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):""}
function entryLabel(t){return {free:"Free",ticketed:"Ticketed",rsvp:"RSVP",invite_only:"Invite Only"}[t]||"Free"}

function updateEntryTypeFields(){
  const t=entryTypeInput.value;
  if(t==="ticketed"){ticketUrlLabel.textContent="Ticket URL";ticketUrlHelp.textContent="Optional, but recommended for ticketed events."}
  else if(t==="rsvp"){ticketUrlLabel.textContent="RSVP URL";ticketUrlHelp.textContent="Optional. Add a registration link if you have one."}
  else if(t==="invite_only"){ticketUrlLabel.textContent="Event Info URL";ticketUrlHelp.textContent="Optional. Invite-only events do not need a public booking link."}
  else{ticketUrlLabel.textContent="Event Info URL";ticketUrlHelp.textContent="Optional. Free events can leave this empty."}
}

function showImagePreview(url){
  imagePreview.innerHTML="";
  if(!url){removeImageButton.hidden=true;return}
  const img=document.createElement("img");img.src=url;img.alt="Event poster preview";imagePreview.appendChild(img);removeImageButton.hidden=false;
}

function safeName(n){return n.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/-+/g,"-")}
function filePath(file){const id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;return `events/${id}-${safeName(file.name)}`}
function storagePath(url){if(!url)return null;const m=`/storage/v1/object/public/${BUCKET}/`;const i=url.indexOf(m);if(i<0)return null;try{return decodeURIComponent(url.slice(i+m.length))}catch{return url.slice(i+m.length)}}

async function requireAdmin(){
  const {data,error}=await supabaseClient.auth.getSession();
  if(error||!data.session){location.href="../";return null}
  const {data:admin,error:aerr}=await supabaseClient.from("admins").select("user_id").eq("user_id",data.session.user.id).maybeSingle();
  if(aerr||!admin){await supabaseClient.auth.signOut();location.href="../";return null}
  return data.session.user;
}

async function loadAdminEvents(){
  const {data,error}=await supabaseClient.from("events")
    .select("id,title,event_date,location,description,ticket_url,status,published,created_at,updated_at,entry_type,image_url,video_url")
    .order("event_date",{ascending:false});
  if(error){console.error(error);adminEventsList.innerHTML='<p class="dashboard-loading">Unable to load events.</p>';return}
  adminEvents=data||[];renderAdminEvents();updateStats();
}

async function loadSubscribers(){
  const {data,error}=await supabaseClient.from("subscribers").select("*").order("created_at",{ascending:false});
  if(error){console.error(error);subscriberList.innerHTML='<p class="dashboard-loading">Unable to load subscribers.</p>';return}
  subscribers=data||[];renderSubscribers();updateStats();
}

function updateStats(){
  const today=new Date();today.setHours(0,0,0,0);
  const upcoming=adminEvents.filter(e=>e.status==="upcoming"&&new Date(`${e.event_date}T00:00:00`)>=today);
  totalEventsElement.textContent=adminEvents.length;upcomingEventsCountElement.textContent=upcoming.length;subscriberCountElement.textContent=subscribers.length;
}

function renderAdminEvents(){
  adminEventsList.innerHTML=adminEvents.length?adminEvents.map(e=>`
    <article class="admin-list-item">
      <div class="admin-event-main">
        ${e.image_url?`<img class="admin-event-thumb" src="${escapeHTML(e.image_url)}" alt="">`:""}
        <div>
          <span class="admin-list-date">${escapeHTML(formatDate(e.event_date))}</span>
          <div class="admin-list-title">${escapeHTML(e.title)}</div>
          <div class="admin-list-meta">${escapeHTML(e.location||"No location")} · ${escapeHTML(entryLabel(e.entry_type))} · ${escapeHTML(e.status)} · ${e.published?"Published":"Hidden"}${e.video_url?" · Video":""}</div>
        </div>
      </div>
      <div class="admin-list-actions">
        <button class="admin-action-button" data-action="edit" data-id="${e.id}">Edit</button>
        <button class="admin-action-button" data-action="postpone" data-id="${e.id}">${e.status==="postponed"?"Set Upcoming":"Postpone"}</button>
        <button class="admin-action-button" data-action="cancel" data-id="${e.id}">Cancel</button>
        <button class="admin-action-button" data-action="publish" data-id="${e.id}">${e.published?"Hide":"Publish"}</button>
        <button class="admin-action-button danger" data-action="delete" data-id="${e.id}">Delete</button>
      </div>
    </article>`).join(""):'<p class="dashboard-loading">No events yet.</p>';
}

function renderSubscribers(){
  subscriberList.innerHTML=subscribers.length?subscribers.map(s=>`
    <article class="admin-list-item"><div>
      <div class="subscriber-email">${escapeHTML(s.email)}</div>
      <div class="subscriber-name">${escapeHTML(`${s.first_name||""} ${s.last_name||""}`.trim())}</div>
      <div class="subscriber-city">${escapeHTML(s.city||"No city")} · joined ${escapeHTML(formatDateTime(s.created_at))}</div>
    </div></article>`).join(""):'<p class="dashboard-loading">No subscribers yet.</p>';
}

document.querySelectorAll(".dashboard-nav-button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".dashboard-nav-button").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  document.querySelectorAll(".dashboard-section").forEach(x=>x.classList.remove("active"));$(`${b.dataset.section}-section`).classList.add("active");
});

function openAdd(){
  eventForm.reset();removeExistingImage=false;imageInput.value="";existingImageUrlInput.value="";showImagePreview("");
  $("event-id").value="";$("event-status").value="upcoming";entryTypeInput.value="free";$("event-published").checked=true;
  eventFormHeading.textContent="Add Event";saveEventButton.textContent="Publish Event";eventFormMessage.textContent="";updateEntryTypeFields();
  eventEditorModal.classList.add("active");
}

function openEdit(id){
  const e=adminEvents.find(x=>x.id===id);if(!e)return;
  eventForm.reset();removeExistingImage=false;$("event-id").value=e.id;$("event-title").value=e.title||"";$("event-date").value=e.event_date||"";
  $("event-location").value=e.location||"";$("event-description").value=e.description||"";ticketUrlInput.value=e.ticket_url||"";
  $("event-video-url").value=e.video_url||"";entryTypeInput.value=e.entry_type||"free";$("event-status").value=e.status||"upcoming";
  $("event-published").checked=!!e.published;imageInput.value="";existingImageUrlInput.value=e.image_url||"";showImagePreview(e.image_url||"");
  eventFormHeading.textContent="Edit Event";saveEventButton.textContent="Save Changes";eventFormMessage.textContent="";updateEntryTypeFields();
  eventEditorModal.classList.add("active");
}

function closeModal(){eventEditorModal.classList.remove("active");eventFormMessage.textContent=""}
addEventButton.onclick=openAdd;overviewAddEventButton.onclick=openAdd;closeEventEditorButton.onclick=closeModal;entryTypeInput.onchange=updateEntryTypeFields;
eventEditorModal.onclick=e=>{if(e.target===eventEditorModal)closeModal()};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

imageInput.onchange=()=>{
  const f=imageInput.files[0];
  if(!f){showImagePreview(existingImageUrlInput.value);return}
  if(!f.type.startsWith("image/")){eventFormMessage.textContent="Please choose an image file.";imageInput.value="";return}
  if(f.size>MAX_IMAGE_SIZE){eventFormMessage.textContent="Image must be 10 MB or smaller.";imageInput.value="";return}
  removeExistingImage=false;eventFormMessage.textContent="";showImagePreview(URL.createObjectURL(f));
};
removeImageButton.onclick=()=>{removeExistingImage=true;imageInput.value="";showImagePreview("")};

async function uploadImage(file){
  const path=filePath(file);
  const {error}=await supabaseClient.storage.from(BUCKET).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
  if(error)throw error;
  const {data}=supabaseClient.storage.from(BUCKET).getPublicUrl(path);
  return {url:data.publicUrl,path};
}
async function deleteImage(url){const p=storagePath(url);if(p)await supabaseClient.storage.from(BUCKET).remove([p])}

eventForm.onsubmit=async e=>{
  e.preventDefault();
  const id=$("event-id").value,title=$("event-title").value.trim(),eventDate=$("event-date").value;
  if(!title||!eventDate){eventFormMessage.textContent="Title and date are required.";return}
  let published=$("event-published").checked;const status=$("event-status").value;if(status==="draft")published=false;
  const newFile=imageInput.files[0]||null,oldUrl=existingImageUrlInput.value||null;
  saveEventButton.disabled=true;saveEventButton.textContent=newFile?"Uploading...":"Saving...";eventFormMessage.textContent="";
  let uploaded=null;
  try{
    let imageUrl=oldUrl;
    if(newFile){uploaded=await uploadImage(newFile);imageUrl=uploaded.url}
    else if(removeExistingImage)imageUrl=null;

    const payload={
      title,event_date:eventDate,location:$("event-location").value.trim()||null,description:$("event-description").value.trim()||null,
      entry_type:entryTypeInput.value,ticket_url:ticketUrlInput.value.trim()||null,video_url:$("event-video-url").value.trim()||null,
      image_url:imageUrl,status,published,updated_at:new Date().toISOString()
    };
    const result=id?await supabaseClient.from("events").update(payload).eq("id",id):await supabaseClient.from("events").insert([payload]);
    if(result.error)throw result.error;

    if(newFile&&oldUrl)await deleteImage(oldUrl);
    if(removeExistingImage&&oldUrl)await deleteImage(oldUrl);

    eventFormMessage.textContent=id?"Event updated.":"Event created.";await loadAdminEvents();setTimeout(closeModal,500);
  }catch(err){
    console.error(err);if(uploaded)await supabaseClient.storage.from(BUCKET).remove([uploaded.path]);
    eventFormMessage.textContent=err.message||"Unable to save event.";
  }finally{saveEventButton.disabled=false;saveEventButton.textContent=id?"Save Changes":"Publish Event"}
};

async function quickUpdate(id,changes){
  const {error}=await supabaseClient.from("events").update({...changes,updated_at:new Date().toISOString()}).eq("id",id);
  if(error){alert(error.message||"Unable to update event.");return}
  await loadAdminEvents();
}

adminEventsList.onclick=async e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const item=adminEvents.find(x=>x.id===b.dataset.id);if(!item)return;
  if(b.dataset.action==="edit")return openEdit(item.id);
  if(b.dataset.action==="postpone")return quickUpdate(item.id,{status:item.status==="postponed"?"upcoming":"postponed"});
  if(b.dataset.action==="cancel"){if(confirm(`Cancel "${item.title}"?`))return quickUpdate(item.id,{status:"cancelled"});return}
  if(b.dataset.action==="publish")return quickUpdate(item.id,{published:!item.published,status:(!item.published&&item.status==="draft")?"upcoming":item.status});
  if(b.dataset.action==="delete"){
    if(!confirm(`Permanently delete "${item.title}"?`))return;
    const {error}=await supabaseClient.from("events").delete().eq("id",item.id);
    if(error){alert(error.message);return}
    if(item.image_url)await deleteImage(item.image_url);await loadAdminEvents();
  }
};

logoutButton.onclick=async()=>{await supabaseClient.auth.signOut();location.href="../"};
$("admin-year").textContent=new Date().getFullYear();

(async()=>{if(await requireAdmin())await Promise.all([loadAdminEvents(),loadSubscribers()])})();
