Replace the matching files in your current project with these files.
Keep your existing favicon.png in the project root.

This version supports:
- Free events without any URL
- Ticketed / RSVP / Invite Only event types
- Event poster/image upload to Supabase bucket: event-media
- Optional YouTube / TikTok / Instagram video links
- Public event modal showing poster, entry type, optional action button and optional Watch Video button


PURPLE AWARENESS INTRO
----------------------
The homepage now opens with a full-screen purple GBVF awareness message:
"STOP KILLING OUR SISTERS."

Behaviour:
- Automatically fades into the site after 4.5 seconds.
- Visitor can choose ENTER SITE immediately.
- Appears once per browser session using sessionStorage.
- No database changes required.
- The existing Fuglymammie feed, events, network form and admin CMS are unchanged.

MOBILE FIX (iPhone/Safari)
--------------------------
- Prevents Safari text auto-enlargement.
- Fixes the fixed header overlapping/cutting off the first event.
- Keeps the existing Fuglymammie typography and feed proportions.
- Makes the purple awareness intro fit a 414px-wide iPhone viewport cleanly.
- Resets the page to the top when the intro fades out.
- Uses a new one-per-session intro key so the revised intro appears once after deployment.
