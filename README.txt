FUGLYMAMMIE — EDITORIAL CMS (NEW POSTS FEATURE)
================================================

This is an UPDATE to your existing website. It retains Events, upcoming events,
Subscribers, existing login, mobile layout and purple-awareness introduction.
It adds a Posts tab to Admin, date-ordered editorial items to the home feed,
cover-image uploads, YouTube embeds, drafts and publishing controls.

INSTALLATION — TWO PARTS
------------------------
A) In the Supabase dashboard for the FUGLYMAMMIE project, open SQL Editor and
   run EDITORIAL-SETUP.sql once. It creates the editorial_posts table and a
   separate editorial-media bucket with admin-only write policies.
   IMPORTANT: do not run this in the IMBUZII project. This conversation's
   connected Supabase access currently shows IMBUZII only, so the SQL has NOT
   been applied to Fuglymammie's actual database for you.

B) Extract this ZIP. Upload its website files/folders to the root of the
   existing KevinFela/fuglymammie GitHub repository, preserving paths.
   Do NOT upload the SQL file or README as part of your public site unless
   you want to; they are included here as installation instructions.
   Keep your current favicon.png; it is intentionally not replaced.
   Wait for GitHub Pages to publish your changes.

ADMIN USE
---------
Visit https://fuglymammie.co.za/admin/ and sign in with your existing admin
account. In the dashboard choose Posts > + Add Post. Enter date, headline,
optional story, photo, video link, and tick Published on the website to show
it publicly. Leave unticked for a draft. The latest post opens in the feed;
older posts expand on tap. YouTube links play inline; other HTTP(S) links
open in a new tab. Images are limited to 8 MB.

SAFETY / LIMITATIONS
--------------------
- Never put a Supabase secret/service-role key into these browser files.
- All uploaded cover images are publicly accessible once uploaded, even
  when a post itself is still a draft. Don't upload private/embargoed photos.
- This version embeds YouTube videos, but does not upload/host video files.
- Existing event-media bucket and event/subscriber data are unchanged.
- SQL is provided for manual application; this ZIP alone does not create
  your database table or storage bucket.
