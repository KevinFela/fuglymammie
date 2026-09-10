const SUPABASE_URL="https://kdrenkxjhhupuvjhpdrk.supabase.co";
const SUPABASE_KEY="sb_publishable_u-kQrZgBjM35l7xVeBaaCw_sm2vVHXq";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const form=document.getElementById("admin-login-form");
const email=document.getElementById("admin-email");
const password=document.getElementById("admin-password");
const button=document.getElementById("login-button");
const message=document.getElementById("login-message");
document.getElementById("admin-year").textContent=new Date().getFullYear();

async function isAdmin(id){
  const {data,error}=await supabaseClient.from("admins").select("user_id").eq("user_id",id).maybeSingle();
  if(error){console.error(error);return false}
  return !!data;
}

form.addEventListener("submit",async e=>{
  e.preventDefault();
  message.textContent="";button.disabled=true;button.textContent="Logging in...";
  try{
    const {data,error}=await supabaseClient.auth.signInWithPassword({email:email.value.trim().toLowerCase(),password:password.value});
    if(error){message.textContent=error.message;return}
    if(!data.user||!(await isAdmin(data.user.id))){await supabaseClient.auth.signOut();message.textContent="Access denied.";return}
    window.location.href="dashboard/";
  }catch(err){console.error(err);message.textContent=err.message||"Something went wrong."}
  finally{button.disabled=false;button.textContent="Log in"}
});

(async()=>{
  const {data}=await supabaseClient.auth.getSession();
  if(data.session&&await isAdmin(data.session.user.id))window.location.href="dashboard/";
})();
