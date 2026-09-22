// Fuglymammie editorial publishing. Runs after dashboard.js and reuses its
// authenticated Supabase client, existing admin login and shared styling.
(() => {
  'use strict';
  const BUCKET_NAME = 'editorial-media';
  const MAX_POST_IMAGE = 8 * 1024 * 1024;
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const byId = id => document.getElementById(id);
  const modal = byId('post-editor-modal');
  const form = byId('post-form');
  const list = byId('admin-posts-list');
  const message = byId('post-form-message');
  const submit = byId('save-post-button');
  const input = byId('post-image');
  const preview = byId('post-image-preview');
  const removeButton = byId('post-remove-image');
  let posts = [];
  let removeImage = false;
  let previewURL = null;
  let busy = false;

  function dateToday() {
    const today = new Date();
    const shifted = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 10);
  }
  function normalURL(raw) {
    if (!raw) return null;
    try {
      const u = new URL(raw);
      return ['https:', 'http:'].includes(u.protocol) ? u.href : null;
    } catch { return null; }
  }
  function imagePath(url) {
    if (!url) return null;
    const base = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`;
    if (!url.startsWith(base)) return null;
    try { return decodeURIComponent(url.slice(base.length)); } catch { return null; }
  }
  function cleanupPreview() {
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
  }
  function showPreview(url) {
    cleanupPreview();
    preview.replaceChildren();
    removeButton.hidden = !url;
    if (!url) return;
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Post cover preview';
    preview.appendChild(img);
  }
  function isOpen() { return modal.classList.contains('active'); }
  function openEditor(post = null) {
    form.reset();
    removeImage = false;
    message.textContent = '';
    byId('post-id').value = post?.id || '';
    byId('post-form-heading').textContent = post ? 'Edit Post' : 'Add Post';
    submit.textContent = post ? 'Save Changes' : 'Save Post';
    byId('post-title').value = post?.title || '';
    byId('post-date').value = post?.post_date || dateToday();
    byId('post-body').value = post?.body || '';
    byId('post-video').value = post?.video_url || '';
    byId('post-published').checked = !!post?.published;
    byId('post-existing-image').value = post?.image_url || '';
    showPreview(post?.image_url || null);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    byId('post-title').focus();
  }
  function closeEditor() {
    if (busy) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    cleanupPreview();
    message.textContent = '';
  }
  byId('overview-add-post').onclick = () => openEditor();
  byId('add-post-button').onclick = () => openEditor();
  byId('close-post-editor').onclick = closeEditor;
  modal.addEventListener('click', e => { if (e.target === modal) closeEditor(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) closeEditor(); });
  input.addEventListener('change', () => {
    const f = input.files[0];
    if (!f) { showPreview(byId('post-existing-image').value); return; }
    if (!ALLOWED.includes(f.type) || f.size > MAX_POST_IMAGE) {
      input.value = '';
      message.textContent = 'Choose a JPG, PNG, WEBP or GIF no larger than 8 MB.';
      showPreview(byId('post-existing-image').value);
      return;
    }
    removeImage = false;
    message.textContent = '';
    showPreview(URL.createObjectURL(f));
    // showPreview does not own blob urls; remember it to revoke next time.
    previewURL = preview.firstElementChild?.src || null;
  });
  removeButton.onclick = () => {
    removeImage = true;
    input.value = '';
    showPreview(null);
  };

  function render() {
    list.innerHTML = posts.length ? posts.map(p => `
      <article class="admin-list-item">
        <div class="admin-event-main">
          ${normalURL(p.image_url) ? `<img class="admin-post-thumb" src="${escapeHTML(normalURL(p.image_url))}" alt="">` : ''}
          <div>
            <span class="admin-list-date">${escapeHTML(p.post_date || '')}</span>
            <div class="admin-list-title">${escapeHTML(p.title)}</div>
            <div class="admin-list-meta">${p.published ? 'Published' : 'Draft'}${p.video_url ? ' · Video' : ''}</div>
          </div>
        </div>
        <div class="admin-list-actions">
          <button class="admin-action-button" data-post-action="edit" data-post-id="${p.id}">Edit</button>
          <button class="admin-action-button" data-post-action="publish" data-post-id="${p.id}">${p.published ? 'Unpublish' : 'Publish'}</button>
          <button class="admin-action-button danger" data-post-action="delete" data-post-id="${p.id}">Delete</button>
        </div>
      </article>`).join('') : '<p class="dashboard-loading">No posts yet. Select + Add Post to begin.</p>';
  }
  async function reloadPosts() {
    const { data, error } = await supabaseClient.from('editorial_posts')
      .select('id,title,post_date,body,image_url,video_url,published,created_at')
      .order('post_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      list.innerHTML = `<p class="dashboard-loading">Could not load posts. Apply the editorial SQL setup first, then refresh. ${escapeHTML(error.message)}</p>`;
      return;
    }
    posts = data || [];
    render();
  }
  async function removeStoredImage(url) {
    const path = imagePath(url);
    if (path) {
      const { error } = await supabaseClient.storage.from(BUCKET_NAME).remove([path]);
      if (error) console.warn('Unused image cleanup needs attention:', error.message);
    }
  }
  async function uploadCover(file) {
    const name = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 80);
    const path = `posts/${crypto.randomUUID()}-${name}`;
    const storage = supabaseClient.storage.from(BUCKET_NAME);
    const { error } = await storage.upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw error;
    return { path, url: storage.getPublicUrl(path).data.publicUrl };
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    const id = byId('post-id').value;
    const title = byId('post-title').value.trim();
    const post_date = byId('post-date').value;
    const rawVideo = byId('post-video').value.trim();
    const video_url = normalURL(rawVideo);
    if (!title || !post_date) { message.textContent = 'Title and post date are required.'; return; }
    if (rawVideo && !video_url) { message.textContent = 'Use a full public http:// or https:// video URL.'; return; }
    const file = input.files[0];
    if (file && (!ALLOWED.includes(file.type) || file.size > MAX_POST_IMAGE)) {
      message.textContent = 'Choose a JPG, PNG, WEBP or GIF no larger than 8 MB.';
      return;
    }
    const oldUrl = byId('post-existing-image').value || null;
    busy = true;
    submit.disabled = true;
    submit.textContent = file ? 'Uploading image…' : 'Saving…';
    message.textContent = '';
    let uploaded = null;
    try {
      if (file) uploaded = await uploadCover(file);
      const payload = {
        title, post_date,
        body: byId('post-body').value.trim(),
        video_url,
        image_url: uploaded?.url || (removeImage ? null : oldUrl),
        published: byId('post-published').checked,
        updated_at: new Date().toISOString()
      };
      const query = id
        ? supabaseClient.from('editorial_posts').update(payload).eq('id', id)
        : supabaseClient.from('editorial_posts').insert(payload);
      const { data, error } = await query.select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('No post was saved. Check your admin permissions.');
      if (oldUrl && (uploaded || removeImage)) await removeStoredImage(oldUrl);
      closeEditor();
      await reloadPosts();
    } catch (err) {
      if (uploaded) await removeStoredImage(uploaded.url);
      message.textContent = err?.message || 'Unable to save this post.';
      console.error(err);
    } finally {
      busy = false;
      submit.disabled = false;
      submit.textContent = id ? 'Save Changes' : 'Save Post';
      if (modal.classList.contains('active') && !message.textContent) closeEditor();
    }
  });
  list.addEventListener('click', async e => {
    const button = e.target.closest('[data-post-action]');
    if (!button || busy) return;
    const post = posts.find(p => p.id === button.dataset.postId);
    if (!post) return;
    const action = button.dataset.postAction;
    if (action === 'edit') { openEditor(post); return; }
    if (action === 'delete' && !confirm(`Permanently delete "${post.title}"?`)) return;
    busy = true;
    button.disabled = true;
    try {
      const query = action === 'publish'
        ? supabaseClient.from('editorial_posts').update({ published: !post.published, updated_at: new Date().toISOString() }).eq('id', post.id)
        : supabaseClient.from('editorial_posts').delete().eq('id', post.id);
      const { data, error } = await query.select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('The post could not be changed. Check your admin access.');
      if (action === 'delete') await removeStoredImage(post.image_url);
      await reloadPosts();
    } catch (err) {
      alert(err?.message || 'Unable to update the post.');
      console.error(err);
    } finally { busy = false; button.disabled = false; }
  });
  (async () => {
    try {
      const { data: auth, error } = await supabaseClient.auth.getUser();
      if (error || !auth.user) return;
      const { data: admin, error: adminError } = await supabaseClient.from('admins')
        .select('user_id').eq('user_id', auth.user.id).maybeSingle();
      if (!adminError && admin) await reloadPosts();
    } catch (err) { console.error('Could not initialise posts editor:', err); }
  })();
})();
