/**
 * amd-feed.js
 * Fetches published posts from amd_posts (joined with amd_content_sources
 * and approved discussion reply count via amd_discussion_threads).
 * Renders feed cards into #feed-grid.
 */

import { supabase } from './amd-auth.js';

const PAGE_SIZE = 24;
let currentPage = 0;
let activePlatform = 'all';
let isLoading = false;
let hasMore = true;

// Canonical platform theme_key values + display config
const PLATFORM_CONFIG = {
  facebook:  { label: 'Facebook',  color: '#1877F2', emoji: '📘' },
  reddit:    { label: 'Reddit',    color: '#FF4500', emoji: '🟠' },
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', emoji: '💼' },
  youtube:   { label: 'YouTube',   color: '#FF0000', emoji: '▶️' },
};

const DEFAULT_CONFIG = { label: 'Post', color: '#c97b12', emoji: '📄' };

function getPlatformConfig(themeKey) {
  return PLATFORM_CONFIG[themeKey?.toLowerCase()] ?? DEFAULT_CONFIG;
}

function relativeTime(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statBadge(icon, value) {
  if (value == null) return '';
  return `<span class="feed-card-stat"><span class="feed-card-stat-icon">${icon}</span>${Number(value).toLocaleString()}</span>`;
}

/**
 * Count approved AMD discussion replies.
 * amd_discussion_posts rows are pre-filtered to status=approved via
 * PostgREST embedded filter in the query select string.
 */
function getReplyCount(post) {
  const threads = post.amd_discussion_threads;
  if (!Array.isArray(threads) || threads.length === 0) return 0;
  const posts = threads[0].amd_discussion_posts;
  return Array.isArray(posts) ? posts.length : 0;
}

function buildCard(post, source) {
  const cfg  = getPlatformConfig(source?.theme_key ?? post.platform);
  // image_url (admin-uploaded) takes priority, then fallback to scraped thumbnails
  const thumb = post.image_url ?? post.thumbnail_url ?? post.media_url;
  const body  = post.body?.length > 220 ? post.body.slice(0, 217) + '…' : post.body;
  const title = post.title ?? '';
  const replyCount = getReplyCount(post);

  const mediaHtml = thumb
    ? post.media_type === 'video'
      ? `<div class="feed-card-media feed-card-media--video">
           <img src="${thumb}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
           <div class="feed-card-play">▶</div>
         </div>`
      : `<div class="feed-card-media">
           <img src="${thumb}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
         </div>`
    : '';

  return `
    <article class="feed-card" data-post-id="${post.id}">
      <header class="feed-card-header">
        <span class="feed-card-badge" style="--badge-color:${cfg.color}">
          <span class="feed-card-badge-dot"></span>${cfg.emoji} ${cfg.label}
        </span>
        <time class="feed-card-time" datetime="${post.published_at}">${relativeTime(post.published_at ?? post.imported_at)}</time>
      </header>
      ${mediaHtml}
      <div class="feed-card-body">
        ${title ? `<h3 class="feed-card-title">${title}</h3>` : ''}
        ${body  ? `<p class="feed-card-text">${body}</p>`    : ''}
      </div>
      <footer class="feed-card-footer">
        <div class="feed-card-stats">
          ${statBadge('❤️', post.like_count)}
          ${statBadge('💬', post.comment_count)}
          ${statBadge('↗️', post.share_count)}
          ${statBadge('👁️', post.view_count)}
          ${replyCount > 0 ? statBadge('🗨️', replyCount) : ''}
        </div>
        <div class="feed-card-actions">
          ${post.url ? `<a class="feed-card-link" href="${post.url}" target="_blank" rel="noopener">Original ↗</a>` : ''}
          <button class="feed-card-discuss btn btn-sm btn-ghost" data-post-id="${post.id}">Discuss</button>
        </div>
      </footer>
    </article>
  `;
}

export async function loadPosts(reset = false) {
  if (isLoading || (!hasMore && !reset)) return;

  if (reset) {
    currentPage = 0;
    hasMore     = true;
    document.getElementById('feed-grid').innerHTML = '';
  }

  isLoading = true;
  setLoadingState(true);

  const from = currentPage * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  // image_url added to SELECT.
  // amd_discussion_posts embedded filter uses PostgREST column filter syntax:
  // "amd_discussion_posts!thread_id(id, status).eq(status, approved)"
  // is not valid — instead we use the correct resource embedding with
  // a query param approach: select the column and filter server-side via
  // a separate count query to avoid PostgREST embedded filter limitations.
  let query = supabase
    .from('amd_posts')
    .select(`
      id, platform, title, body, url,
      image_url, media_url, media_type, thumbnail_url,
      published_at, imported_at,
      like_count, comment_count, share_count, view_count, tags,
      amd_content_sources!source_id ( label, theme_key, badge_color ),
      amd_discussion_threads!post_id (
        id,
        amd_discussion_posts!thread_id ( id, status )
      )
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(from, to);

  if (activePlatform !== 'all') {
    query = query.eq('platform', activePlatform);
  }

  const { data: posts, error } = await query;

  if (error) {
    console.error('Feed load error:', error);
    setLoadingState(false);
    isLoading = false;
    return;
  }

  hasMore = posts.length === PAGE_SIZE;
  currentPage++;

  const grid = document.getElementById('feed-grid');

  if (posts.length === 0 && reset) {
    grid.innerHTML = '<p class="feed-empty">No posts published yet. Check back soon.</p>';
  } else {
    posts.forEach(post => {
      // Filter approved replies client-side (avoids PostgREST embedded filter syntax issues)
      if (post.amd_discussion_threads) {
        post.amd_discussion_threads = post.amd_discussion_threads.map(thread => ({
          ...thread,
          amd_discussion_posts: (thread.amd_discussion_posts ?? []).filter(p => p.status === 'approved'),
        }));
      }
      const source = Array.isArray(post.amd_content_sources)
        ? post.amd_content_sources[0]
        : post.amd_content_sources;
      grid.insertAdjacentHTML('beforeend', buildCard(post, source));
    });
  }

  // Wire Discuss buttons (only unwired ones)
  grid.querySelectorAll('.feed-card-discuss[data-post-id]:not([data-wired])').forEach(btn => {
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => {
      const BASE_PATH = window.location.hostname === 'andredavisme.github.io'
        ? '/andremauricedavis.com'
        : '';
      window.location.href = `${BASE_PATH}/thread.html?post=${btn.dataset.postId}`;
    });
  });

  setLoadingState(false);
  updateLoadMoreButton();
  isLoading = false;
}

function setLoadingState(loading) {
  const spinner = document.getElementById('feed-spinner');
  if (spinner) spinner.style.display = loading ? 'flex' : 'none';
}

function updateLoadMoreButton() {
  const btn = document.getElementById('feed-load-more');
  if (!btn) return;
  btn.style.display = hasMore ? 'block' : 'none';
}

export function setActivePlatform(platform) {
  activePlatform = platform;
  document.querySelectorAll('.feed-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.platform === platform);
  });
  loadPosts(true);
}
