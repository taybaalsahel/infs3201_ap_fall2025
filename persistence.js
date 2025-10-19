// persistence.js
// Temporary JSON file storage using Node's fs/promises.
// Will be replaced by MongoDB store later (same exported functions).
const fs = require('fs/promises');
const path = require('path');

const DATA = {
  albums: path.join(__dirname, 'albums.json'),
  photos: path.join(__dirname, 'photos.json')
};

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON in ' + file);
  }
  return data;
}

async function writeJson(file, data) {
  const s = JSON.stringify(data, null, 2);
  await fs.writeFile(file, s, 'utf8');
}

async function getAllAlbums() {
  return await readJson(DATA.albums);
}

async function getAllPhotos() {
  return await readJson(DATA.photos);
}

async function getPhotoById(id) {
  const photos = await readJson(DATA.photos);
  let i = 0;
  while (i < photos.length) {
    const p = photos[i];
    if (p && p.id === id) return p;
    i = i + 1;
  }
  return null;
}

async function updatePhoto(photo) {
  const photos = await readJson(DATA.photos);
  let i = 0;
  let updated = false;
  while (i < photos.length) {
    if (photos[i] && photos[i].id === photo.id) {
      photos[i] = photo;
      updated = true;
      break;
    }
    i = i + 1;
  }
  if (!updated) photos.push(photo);
  await writeJson(DATA.photos, photos);
  return true;
}

module.exports = {
  getAllAlbums,
  getAllPhotos,
  getPhotoById,
  updatePhoto
};
