// business.js

const store = require('./persistence');

/**
 * @typedef {Object} Album
 * @property {number} id
 * @property {string} name
 * @property {string} [description]
 */

/**
 * @typedef {Object} Photo
 * @property {number} id
 * @property {string} filename
 * @property {string} title
 * @property {string} description
 * @property {number[]} [albums]  // album ids the photo belongs to
 */

/**
 * Return all albums for the landing page.
 * @returns {Promise<Album[]>}
 */
async function listAlbums() {
  return await store.listAlbums();
}

/**
 * Return album details for the given album id:
 * the album name, the list of photos, and the total count.
 *
 * @param {number|string} albumId - Album identifier (will be coerced to number).
 * @returns {Promise<{albumName:string, photos:Photo[], count:number}>}
 */
async function listPhotosByAlbumId(albumId) {
  const id = Number(albumId);
  const album = await store.getAlbumById(id);
  const photos = await store.listPhotosByAlbum(id);
  const name = album ? album.name : 'Unknown album';
  return { albumName: name, photos, count: photos.length };
}

/**
 * Get a single photo details by id.
 *
 * @param {number|string} id - Photo identifier (will be coerced to number).
 * @returns {Promise<{ok:true, photo:Photo} | {ok:false}>}
 */
async function getPhotoDetails(id) {
  const photo = await store.getPhotoById(Number(id));
  return photo ? { ok: true, photo } : { ok: false };
}

/**
 * Update a photo's title and/or description.
 * Conforms to PRG flow in the route layer: caller redirects on success.
 *
 * @param {number|string} id - Photo identifier (will be coerced to number).
 * @param {?string} title - New title (or null to keep unchanged).
 * @param {?string} description - New description (or null to keep unchanged).
 * @returns {Promise<{ok:true} | {ok:false, reason:string}>}
 */
async function updatePhotoDetails(id, title, description) {
  const ok = await store.updatePhotoMeta(Number(id), title, description);
  return ok ? { ok: true } : { ok: false, reason: 'Not updated' };
}

module.exports = {
  listAlbums,
  listPhotosByAlbumId,
  getPhotoDetails,
  updatePhotoDetails
};
