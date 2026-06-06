/**
 * amd-auth.js
 * Auth guard for all AMD platform pages.
 * Unauthenticated users are redirected to auth.andremauricedavis.com with ?return=<current-url>.
 * Exposes: window.amdSession (Supabase session), window.amdUser (amd_users row)
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hhyhulqngdkwsxhymmcd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_haKvwV0M7KMj4Qz69M6WGg_KmIfU-aI';

// No storageKey override — use Supabase default so all AMD properties share the session.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AUTH_PORTAL = 'https://auth.andremauricedavis.com/';

/**
 * Redirect unauthenticated users to the AMD auth portal.
 * Passes the current page URL as ?return= so the portal sends them back.
 */
function redirectToPortal() {
  const returnUrl = window.location.href;
  window.location.replace(AUTH_PORTAL + '?return=' + encodeURIComponent(returnUrl));
}

/**
 * Call on every protected page (admin.html).
 * Returns the amd_users row for the logged-in user, or redirects to portal.
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirectToPortal();
    return null;
  }

  window.amdSession = session;

  // Upsert amd_users row (creates on first login, updates on return)
  // role: 'user' matches the amd_users table default — do not change to 'member'
  const { data: user, error } = await supabase
    .from('amd_users')
    .upsert(
      {
        auth_user_id: session.user.id,
        display_name: session.user.user_metadata?.full_name ?? null,
        avatar_url: session.user.user_metadata?.avatar_url ?? null,
        role: 'user',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth_user_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error('amd_users upsert error:', error);
  }

  window.amdUser = user;
  return user;
}

/**
 * Call on public pages (index.html, feed.html, thread.html).
 * Loads session + upserts amd_users row if logged in.
 * Does NOT redirect if no session — returns null silently.
 * Use window.amdUser / window.amdSession to drive session-aware UI.
 */
export async function optionalAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.amdSession = null;
    window.amdUser = null;
    return null;
  }

  window.amdSession = session;

  // Upsert amd_users row (creates on first login, updates on return)
  const { data: user, error } = await supabase
    .from('amd_users')
    .upsert(
      {
        auth_user_id: session.user.id,
        display_name: session.user.user_metadata?.full_name ?? null,
        avatar_url: session.user.user_metadata?.avatar_url ?? null,
        role: 'user',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth_user_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error('amd_users upsert error:', error);
  }

  window.amdUser = user;
  return user;
}

/**
 * Redirect to the auth portal, returning to the current page after login.
 * Use this for inline "Sign in" prompts on public pages.
 */
export function promptSignIn() {
  redirectToPortal();
}

/**
 * Sign out and return to the auth portal.
 */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.replace(AUTH_PORTAL);
}
