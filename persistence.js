// persistence.js
// MongoDB persistence layer for Digital Media Catalog A3.
// Handles connection setup, health ping, and all DB operations (no JSON files).

const { MongoClient } = require('mongodb');

const DB_NAME = 'infs3201_fall2025';
let client, db, initPromise;

/**
 * Build the MongoDB connection URI.
 * Accepts either MONGODB_URI directly, or MDB_USER/MDB_PASS/MDB_HOST env vars.
 * @returns {string} MongoDB connection string
 * @throws {Error} if credentials are missing
 */
function buildUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const u = process.env.MDB_USER;
  const p = process.env.MDB_PASS ? encodeURIComponent(process.env.MDB_PASS) : '';
  const h = process.env.MDB_HOST;
  if (u && p && h) {
    return `mongodb+srv://${u}:${p}@${h}/?retryWrites=true&w=majority&authSource=admin`;
  }
  throw new Error('Missing Mongo credentials: set MONGODB_URI or MDB_USER/MDB_PASS/MDB_HOST');
}

/**
 * Initialize MongoDB client once per process and verify with a ping.
 * Reuses the same promise if already in progress.
 * @returns {Promise<import('mongodb').Db>} Connected database instance
 */
async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const uri = buildUri();
    client = new MongoClient(uri);
    await client.connect();                          // connect per driver docs
    await client.db(DB_NAME).command({ ping: 1 });   // sanity check ping 
    db = client.db(DB_NAME);
    console.log('✅ Mongo connected & ping OK');
    return db;
  })();
  return initPromise;
}

/**
 * Return current DB instance, waiting for initialization if necessary.
 * @returns {Promise<import('mongodb').Db>}
 */
async function getDb() {
  if (!db) await init();
  if (!db) throw new Error('Mongo DB not initialized');
  return db;
}

// ---------------------- Repository methods ----------------------

/**
 * List all albums (no _id field).
 * @returns {Promise<Array<{id:number,name:string,description?:string}>>}
 */
async function listAlbums() {
  const col = (await getDb()).collection('albums');
  const out = [];
  const cur = col.find({}, { projection: { _id: 0 } });
  for await (const d of cur) out.push(d);
  return out;
}

/**
 * Get an album by id.
 * @param {number|string} id - Album ID
 * @returns {Promise<{id:number,name:string,description?:string}|null>}
 */
async function getAlbumById(id) {
  return (await getDb()).collection('albums')
    .findOne({ id: Number(id) }, { projection: { _id: 0 } });
}

/**
 * List photos belonging to a specific album.
 * @param {number|string} albumId
 * @returns {Promise<Array<{id:number,filename:string,title:string,description:string,albums:number[]}>>}
 */
async function listPhotosByAlbum(albumId) {
  const col = (await getDb()).collection('photos');
  const out = [];
  const cur = col.find({ albums: Number(albumId) }, { projection: { _id: 0 } });
  for await (const d of cur) out.push(d);
  return out;
}

/**
 * Get a single photo by id.
 * @param {number|string} id
 * @returns {Promise<{id:number,filename:string,title:string,description:string,albums:number[]} | null>}
 */
async function getPhotoById(id) {
  return (await getDb()).collection('photos')
    .findOne({ id: Number(id) }, { projection: { _id: 0 } });
}

/**
 * Update the title/description metadata of a photo.
 * Returns true only if one document was matched and modified.
 *
 * @param {number|string} id - Photo ID
 * @param {?string} title - New title (or null to skip)
 * @param {?string} description - New description (or null to skip)
 * @returns {Promise<boolean>} True if exactly one document was modified
 */
async function updatePhotoMeta(id, title, description) {
  const r = await (await getDb()).collection('photos').updateOne(
    { id: Number(id) },
    { $set: { title, description } }
  );
  return r.matchedCount === 1 && r.modifiedCount === 1;
}

module.exports = {
  init,
  listAlbums,
  getAlbumById,
  listPhotosByAlbum,
  getPhotoById,
  updatePhotoMeta
};
