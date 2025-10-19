// app.js
// Minimal Express server for A3 (no login), Handlebars with no layout.
// Pages: / (albums), /album/:id (album details), /photo-details/:pid (photo details),
// /edit-photo (GET form + POST with PRG redirect).
//
// Docs: Express starter/static, express-handlebars usage, MDN forms, PRG pattern.
const express = require('express');
const exphbs  = require('express-handlebars');
const path    = require('path');
const biz     = require('./business');

const app = express();

// Register Handlebars (no default layout)
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares: form parsing + static files
app.use(express.urlencoded({ extended: true })); // for POST forms
app.use(express.static(path.join(__dirname, 'public'))); // serves /public/*

/** Landing: list albums as bullet links */
app.get('/', async (req, res) => {
  const albums = await biz.listAlbums();
  res.render('albums', { layout: undefined, albums });
});

/** Album details: list photos + total */
app.get('/album/:id', async (req, res) => {
  const albumId = Number(req.params.id);
  const info = await biz.listPhotosByAlbumId(albumId); // { albumName, photos, count }
  res.render('album-details', { layout: undefined, ...info });
});

/** Photo details: title, description, image (max-width 300px in CSS/template) */
app.get('/photo-details/:pid', async (req, res) => {
  const pid = Number(req.params.pid);
  const result = await biz.getPhotoDetails(pid);
  if (!result.ok) return res.status(404).send('Photo not found');
  res.render('photo-details', { layout: undefined, photo: result.photo });
});

/** Edit GET: prefilled form */
app.get('/edit-photo', async (req, res) => {
  const pid = Number(req.query.pid);
  const result = await biz.getPhotoDetails(pid);
  if (!result.ok) return res.status(404).send('Photo not found');
  res.render('edit-photo', { layout: undefined, photo: result.photo, error: null });
});

/** Edit POST: PRG (on success redirect to details; on failure show message) */
app.post('/edit-photo', async (req, res) => {
  const pid = Number(req.body.pid);
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();

  const r = await biz.updatePhotoDetails(pid, title || null, description || null);
  if (!r.ok) {
    const cur = await biz.getPhotoDetails(pid);
    return res.status(400).render('edit-photo', {
      layout: undefined,
      photo: cur.ok ? cur.photo : { id: pid, title: '', description: '' },
      error: r.reason || 'Update failed'
    });
  }
  // PRG: redirect to the GET page to avoid resubmission on refresh
  res.redirect('/photo-details/' + pid);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log('Web server running at http://127.0.0.1:' + PORT);
});
