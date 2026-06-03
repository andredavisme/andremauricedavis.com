/**
 * amd-auth.js
 * Google OAuth gate shared across all AMD platform pages.
 * Redirects unauthenticated users to login.html.
 * Exposes: window.amdSession (Supabase session), window.amdUser (amd_users row)
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hhyhulqngdkwsxhymmcd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_haKvwV0M7KMj4Qz69M6WGg_KmIfU-aI';

// BASE_PATH handles the GitHub Pages subpath.
// GitHub Pages: andredavisme.github.io/andremauricedavis.com  → '/andremauricedavis.com'
// Production:   andremauricedavis.com                         → ''
const BASE_PATH = window.location.hostname === 'andredavisme.github.io'
  ? '/andremauricedavis.com'
  : '';

// REDIRECT_URL points to site root so index.html catches the OAuth callback hash
// and forwards to feed.html. This avoids Supabase allowlist exact-match issues
// with deep paths like /feed.html.
const REDIRECT_URL = window.location.hostname === 'andredavisme.github.io'
  ? 'https://andredavisme.github.io/andremauricedavis.com/'
  : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? window.location.origin + '/'
  : 'https://andremauricedavis.com/';

// storageKey namespaces auth tokens away from other projects on the same Supabase instance.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storageKey: 'amd-platform-auth' },
});

/**
 * Call on every protected page.
 * Returns the amd_users row for the logged-in user, or redirects to login.
 */
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = BASE_PATH + '/login.html';
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
        role: 'member',
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
 * Sign in with Google. Call from login.html.
 */
export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: REDIRECT_URL,
    },
  });
}

/**
 * Sign out and redirect to login.
 */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = BASE_PATH + '/login.html';
}
