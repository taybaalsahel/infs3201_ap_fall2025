// app.js
// A3 Express server (no login). Handlebars without layout.
// Pages:
//   GET  /                    → albums list
//   GET  /album/:id           → album details (photos + count)
//   GET  /photo-details/:pid  → photo details
//   GET  /edit-photo?pid=ID   → edit form (prefilled)
//   POST /edit-photo          → PRG: update then redirect to details
//
// Loads .env first, serves static assets, waits for Mongo init, and has basic error handling.

require('dotenv').config();

const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');

const biz = require('./business');
const store = require('./persistence');

const app = express();

// ---------- View engine (Handlebars) ----------
const hbs = exphbs.create({
  extname: '.handlebars',
  defaultLayout: false, // no layout required for this assignment
  helpers: {
    /** Strict equality helper for templates. */
    eq: (a, b) => a === b
  }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// ---------- Middleware ----------
app.use(express.urlencoded({ extended: true }));           // parse POST forms
app.use(express.static(path.join(__dirname, 'public')));   // serve /public/**   (docs: express.static)  // :contentReference[oaicite:1]{index=1}

/**
 * GET /health
 * Lightweight health probe used during development.
 * @route GET /health
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.get('/health', (req, res) => {
  res.type('text').send('OK');
});

/**
 * GET /
 * Landing page: list all albums as bullet links.
 * Renders views/albums.handlebars with { albums }.
 * @route GET /
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
app.get('/', async (req, res, next) => {
  try {
    const albums = await biz.listAlbums();
    res.render('albums', { albums, layout: false });
  } catch (err) { next(err); }
});

/**
 * GET /album/:id
 * Album details: list photos in the album and the total count.
 * The singular/plural is handled in the template via the `eq` helper.
 * @route GET /album/:id
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
app.get('/album/:id', async (req, res, next) => {
  try {
    const albumId = Number(req.params.id);
    const info = await biz.listPhotosByAlbumId(albumId); // { albumName, photos, count }
    res.render('album-details', { ...info, layout: false });
  } catch (err) { next(err); }
});

/**
 * GET /photo-details/:pid
 * Photo details page: title, description and image.
 * @route GET /photo-details/:pid
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
app.get('/photo-details/:pid', async (req, res, next) => {
  try {
    const pid = Number(req.params.pid);
    const result = await biz.getPhotoDetails(pid);
    if (!result.ok) return res.status(404).send('Photo not found');
    res.render('photo-details', { photo: result.photo, layout: false });
  } catch (err) { next(err); }
});

/**
 * GET /edit-photo
 * Prefilled edit form for a photo (title + description).
 * @route GET /edit-photo
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
app.get('/edit-photo', async (req, res, next) => {
  try {
    const pid = Number(req.query.pid);
    const result = await biz.getPhotoDetails(pid);
    if (!result.ok) return res.status(404).send('Photo not found');
    res.render('edit-photo', { photo: result.photo, error: null, layout: false });
  } catch (err) { next(err); }
});

/**
 * POST /edit-photo
 * Updates title/description, then uses PRG (Post/Redirect/Get) to avoid resubmission.
 * On failure, re-renders the form with an error message (no auto-redirect).
 * @route POST /edit-photo
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
app.post('/edit-photo', async (req, res, next) => {
  try {
    const pid = Number(req.body.pid);
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();

    const r = await biz.updatePhotoDetails(pid, title || null, description || null);
    if (!r.ok) {
      const cur = await biz.getPhotoDetails(pid);
      return res.status(400).render('edit-photo', {
        photo: cur.ok ? cur.photo : { id: pid, title: '', description: '' },
        error: r.reason || 'Update failed',
        layout: false
      });
    }
    // PRG: redirect to GET page to avoid form resubmission. (PRG pattern)  // :contentReference[oaicite:2]{index=2}
    res.redirect('/photo-details/' + pid);
  } catch (err) { next(err); }
});

// ---------- 404 (optional) ----------
/**
 * Catch-all 404 handler.
 * @param {express.Request} req
 * @param {express.Response} res
 */
app.use((req, res) => {
  res.status(404).send('Not found');
});

// ---------- Error handler (keep last) ----------
/**
 * Express error-handling middleware (must have 4 args).
 * Keep it after all routes so it can catch thrown/passed errors.
 * @param {Error} err
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal error');
}); // docs: error-handling middleware signature & placement.  // :contentReference[oaicite:3]{index=3}

// ---------- Boot server only after Mongo init ----------
const PORT = process.env.PORT || 8000;
(async () => {
  try {
    await store.init(); // ensure Mongo connected & ping OK before serving
    app.listen(PORT, () => {
      console.log(`Web server running at http://127.0.0.1:${PORT}`);
    });
  } catch (e) {
    console.error('❌ Failed to initialize Mongo:', e.message);
    process.exit(1);
  }
})();
