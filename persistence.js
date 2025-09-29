// persistence.js
const fs = require('fs/promises')
const path = require('path')

const PHOTOS_FILE = path.join(__dirname, 'photos.json')
const ALBUMS_FILE = path.join(__dirname, 'albums.json')
const USERS_FILE = path.join(__dirname, 'users.json')

/**
 * Read a JSON file and return parsed value (tolerant to BOM/zero-width chars)
 * @param {string} filePath
 * @returns {Promise<any>}
 */
async function readJson(filePath) {
    const textRaw = await fs.readFile(filePath, 'utf8')
    // Strip BOM and common zero-width/invisible chars that break JSON.parse
    const text = textRaw.replace(/^[\uFEFF\u200B\u200E\u200F]+/, '')
    return JSON.parse(text)
}


/**
 * Write a value to a JSON file (pretty)
 * @param {string} filePath
 * @param {any} value
 * @returns {Promise<void>}
 */
async function writeJson(filePath, value) {
    const text = JSON.stringify(value, null, 2)
    await fs.writeFile(filePath, text, 'utf8')
}

/**
 * Get user by username (or null)
 * @param {string} username
 * @returns {Promise<object|null>}
 */
async function getUserByUsername(username) {
    const users = await readJson(USERS_FILE)
    var i = 0
    while (i < users.length) {
        if (users[i] && users[i].username === username) return users[i]
        i = i + 1
    }
    return null
}

/**
 * Get photo by id (or null)
 * @param {number} photoId
 * @returns {Promise<object|null>}
 */
async function getPhotoById(photoId) {
    const photos = await readJson(PHOTOS_FILE)
    var i = 0
    while (i < photos.length) {
        if (photos[i] && photos[i].id === photoId) return photos[i]
        i = i + 1
    }
    return null
}

/**
 * Save updated photo back to photos.json
 * @param {object} updated
 * @returns {Promise<void>}
 */
async function updatePhoto(updated) {
    const photos = await readJson(PHOTOS_FILE)
    var i = 0
    while (i < photos.length) {
        if (photos[i] && photos[i].id === updated.id) {
            photos[i] = updated
            await writeJson(PHOTOS_FILE, photos)
            return
        }
        i = i + 1
    }
}

/**
 * Get album by exact name (case-insensitive match is handled in business)
 * @param {string} name
 * @returns {Promise<object|null>}
 */
async function getAlbumByName(name) {
    const albums = await readJson(ALBUMS_FILE)
    var i = 0
    while (i < albums.length) {
        if (albums[i] && typeof albums[i].name === 'string' && albums[i].name === name) return albums[i]
        i = i + 1
    }
    return null
}

/**
 * Get all photos (array)
 * @returns {Promise<Array>}
 */
async function getAllPhotos() {
    return await readJson(PHOTOS_FILE)
}

/**
 * Get all albums (array)
 * @returns {Promise<Array>}
 */
async function getAllAlbums() {
    return await readJson(ALBUMS_FILE)
}

module.exports = {
    getUserByUsername,
    getPhotoById,
    updatePhoto,
    getAlbumByName,
    getAllPhotos,
    getAllAlbums
}
