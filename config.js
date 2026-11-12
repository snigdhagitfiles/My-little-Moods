/* little moods · config.js
   paste your own Supabase project's details here (README.md shows where to find them).

   these two values are meant to be public: they're safe to put on github.
   your moods are protected by the database rules in supabase-setup.sql
   and by your mood key. never put a "secret" or "service_role" key here. */

window.LITTLE_MOODS_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT-ID.supabase.co",
  supabaseKey: "YOUR-PUBLISHABLE-KEY",   // starts with sb_publishable_ (older projects: the "anon public" key)
};
