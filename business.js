// business.js
// Business layer for A3: NO login, NO ownership checks.
// Uses loop-only style (no map/filter/reduce). Storage is via persistence.js (JSON for now).
const store = require('./persistence');

/** List albums for landing page */
async function listAlbums() {
  const albums = await store.getAllAlbums();
  const out = [];
  let i = 0;
  while (i < albums.length) {
    const a = albums[i];
    if (a && typeof a.id === 'number' && typeof a.name === 'string') {
      out.push({ id: a.id, name: a.name });
    }
    i = i + 1;
  }
  return out;
}

/** List photos in a given album id */
async function listPhotosByAlbumId(albumId) {
  const albums = await store.getAllAlbums();
  let albumName = '';
  let i = 0;
  while (i < albums.length) {
    if (albums[i] && albums[i].id === albumId) {
      albumName = String(albums[i].name || '');
      break;
    }
    i = i + 1;
  }

  const photos = await store.getAllPhotos();
  const list = [];
  let j = 0;
  while (j < photos.length) {
    const p = photos[j];
    let inAlbum = false;
    if (p && Array.isArray(p.albums)) {
      let k = 0;
      while (k < p.albums.length) {
        if (p.albums[k] === albumId) { inAlbum = true; break; }
        k = k + 1;
      }
    }
    if (inAlbum) {
      list.push({ id: p.id, title: String(p.title || p.filename || '') });
    }
    j = j + 1;
  }

  return { albumName, photos: list, count: list.length };
}

/** Get photo details for display (album names resolved, tags joined) */
async function getPhotoDetails(photoId) {
  const p = await store.getPhotoById(photoId);
  if (!p) return { ok: false, reason: 'Photo not found' };

  // Resolve album ids -> names
  const albums = await store.getAllAlbums();
  const names = [];
  if (Array.isArray(p.albums)) {
    let i = 0;
    while (i < p.albums.length) {
      let j = 0;
      let name = '';
      while (j < albums.length) {
        if (albums[j] && albums[j].id === p.albums[i]) { name = String(albums[j].name || ''); break; }
        j = j + 1;
      }
      if (name) names.push(name);
      i = i + 1;
    }
  }

  // Build tags string
  let tagsOut = 'None';
  if (Array.isArray(p.tags) && p.tags.length > 0) {
    let t = 0;
    let buf = '';
    while (t < p.tags.length) {
      if (t > 0) buf = buf + ', ';
      buf = buf + String(p.tags[t]);
      t = t + 1;
    }
    tagsOut = buf;
  }

  // Image path from /public/photos/
  const imageUrl = '/photos/' + String(p.filename || '');

  return {
    ok: true,
    photo: {
      id: p.id,
      title: p.title,
      description: p.description,
      filename: p.filename,
      imageUrl,
      date: p.date,
      albums: names,
      tags: tagsOut,
      resolution: p.resolution
    }
  };
}

/** Update photo title/description */
async function updatePhotoDetails(photoId, newTitle, newDescription) {
  const p = await store.getPhotoById(photoId);
  if (!p) return { ok: false, reason: 'Photo not found' };

  if (typeof newTitle === 'string' && newTitle.trim().length > 0) p.title = newTitle;
  if (typeof newDescription === 'string' && newDescription.trim().length > 0) p.description = newDescription;

  await store.updatePhoto(p);
  return { ok: true };
}

module.exports = {
  listAlbums,
  listPhotosByAlbumId,
  getPhotoDetails,
  updatePhotoDetails
};
