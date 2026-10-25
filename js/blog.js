// js/blog.js
const SPACE_ID = "6m78ew60enow";
const ACCESS_TOKEN = "Nwy7_jdkVg1PLiDxMP-srrdSqFKGz8zCYWW1aRbnLbM";
const API = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master`;

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

const assetUrl = (asset, w = 1200) =>
  asset ? `https:${asset.fields.file.url}?w=${w}&fm=webp&q=80` : "";

function collectAssets(data) {
  const map = {};
  (data.includes?.Asset || []).forEach((a) => (map[a.sys.id] = a));
  return map;
}

function fail(el, msg) {
  el.innerHTML = `<p class="error">Couldn't load posts. ${esc(msg)}</p>`;
  console.error(msg);
}

// ---------- Listing page ----------
async function initListing() {
  const el = document.getElementById("post-list");
  if (!el) return;
  el.innerHTML = "<p>Loading…</p>";

  try {
    const res = await fetch(
      `${API}/entries?content_type=post&order=-fields.date&limit=100&access_token=${ACCESS_TOKEN}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.items.length) {
      el.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    const assets = collectAssets(data);
    el.innerHTML = data.items
      .map((item) => {
        const f = item.fields;
        const href = `/blog/post.html?slug=${encodeURIComponent(f.slug)}`;
        const cover = f.cover ? assets[f.cover.sys.id] : null;
        return `<li class="post-card">
          ${cover ? `<a href="${href}"><img src="${assetUrl(cover, 600)}" alt="" loading="lazy"></a>` : ""}
          <h2><a href="${href}">${esc(f.title)}</a></h2>
          <time datetime="${esc(f.date)}">${fmtDate(f.date)}</time>
          ${f.summary ? `<p>${esc(f.summary)}</p>` : ""}
        </li>`;
      })
      .join("");
  } catch (err) {
    fail(el, err.message);
  }
}

// ---------- Single post page ----------
async function initPost() {
  const el = document.getElementById("post");
  if (!el) return;

  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    el.innerHTML = "<p>Post not found.</p>";
    return;
  }
  el.innerHTML = "<p>Loading…</p>";

  try {
    const res = await fetch(
      `${API}/entries?content_type=post&limit=1&fields.slug=${encodeURIComponent(slug)}&access_token=${ACCESS_TOKEN}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.items.length) {
      el.innerHTML = "<p>Post not found.</p>";
      return;
    }

    const f = data.items[0].fields;
    const cover = f.cover ? collectAssets(data)[f.cover.sys.id] : null;

    document.title = `${f.title} — Your Name`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", f.summary || "");

    el.innerHTML = `
      <article class="post">
        <header>
          <h1>${esc(f.title)}</h1>
          <time datetime="${esc(f.date)}">${fmtDate(f.date)}</time>
          ${f.tags?.length ? `<ul class="post-tags">${f.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        </header>
        ${cover ? `<img class="post-cover" src="${assetUrl(cover)}" alt="">` : ""}
        <div class="post-body">${marked.parse(f.body || "")}</div>
      </article>`;
  } catch (err) {
    fail(el, err.message);
  }
}

initListing();
initPost();
