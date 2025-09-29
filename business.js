// business.js
const store = require('./persistence')

/**
 * Authenticate a user by username and password (plain text per A2)
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object|null>} user object without password if match, else null
 */
async function authenticate(username, password) {
    const user = await store.getUserByUsername(username)
    if (!user) return null
    if (user.password !== password) return null
    return { id: user.id, username: user.username }
}

/**
 * Ensure current user owns a given photo id
 * @param {number} userId
 * @param {number} photoId
 * @returns {Promise<{ok:boolean, reason?:string, photo?:object}>}
 */
async function assertOwnership(userId, photoId) {
    const photo = await store.getPhotoById(photoId)
    if (!photo) return { ok: false, reason: 'Photo not found' }
    if (photo.owner !== userId) return { ok: false, reason: 'Access denied: not your photo' }
    return { ok: true, photo: photo }
}

/**
 * Find photo details formatted for display (translates album ids -> names)
 * @param {number} userId
 * @param {number} photoId
 * @returns {Promise<{ok:boolean, reason?:string, details?:object}>}
 */
async function findPhotoForDisplay(userId, photoId) {
    const chk = await assertOwnership(userId, photoId)
    if (!chk.ok) return { ok: false, reason: chk.reason }

    const photo = chk.photo
    const albums = await store.getAllAlbums()

    var names = []
    if (Array.isArray(photo.albums)) {
        var i = 0
        while (i < photo.albums.length) {
            var j = 0
            var name = ''
            while (j < albums.length) {
                if (albums[j] && albums[j].id === photo.albums[i]) {
                    name = String(albums[j].name || '')
                    break
                }
                j = j + 1
            }
            if (name) names.push(name)
            i = i + 1
        }
    }

    var tagsOut = 'None'
    if (Array.isArray(photo.tags) && photo.tags.length > 0) {
        var t = 0
        var buf = ''
        while (t < photo.tags.length) {
            if (t > 0) buf = buf + ', '
            buf = buf + String(photo.tags[t])
            t = t + 1
        }
        tagsOut = buf
    }

    return {
        ok: true,
        details: {
            filename: photo.filename,
            title: photo.title,
            date: photo.date,
            albums: names,
            tags: tagsOut
        }
    }
}

/**
 * Update title/description of a photo you own
 * @param {number} userId
 * @param {number} photoId
 * @param {string|null} newTitle
 * @param {string|null} newDescription
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
async function updatePhotoDetails(userId, photoId, newTitle, newDescription) {
    const chk = await assertOwnership(userId, photoId)
    if (!chk.ok) return { ok: false, reason: chk.reason }

    const photo = chk.photo
    if (typeof newTitle === 'string' && newTitle.trim().length > 0) photo.title = newTitle
    if (typeof newDescription === 'string' && newDescription.trim().length > 0) photo.description = newDescription
    await store.updatePhoto(photo)
    return { ok: true }
}

/**
 * Build CSV-like lines for a given album name (case-insensitive match)
 * @param {string} albumNameInput
 * @returns {Promise<{ok:boolean, header:string, lines:Array<string>, reason?:string}>}
 */
async function buildAlbumList(albumNameInput) {
    if (!albumNameInput) return { ok: false, header: '', lines: [], reason: 'Album name required' }

    const albums = await store.getAllAlbums()
    var wantedId = null
    var needle = albumNameInput.toLowerCase()
    var i = 0
    while (i < albums.length) {
        if (albums[i] && typeof albums[i].name === 'string' && albums[i].name.toLowerCase() === needle) {
            wantedId = albums[i].id
            break
        }
        i = i + 1
    }
    if (wantedId === null) return { ok: false, header: '', lines: [], reason: 'Album not found' }

    const photos = await store.getAllPhotos()
    var lines = []
    var j = 0
    while (j < photos.length) {
        var p = photos[j]
        var inAlbum = false
        if (p && Array.isArray(p.albums)) {
            var k = 0
            while (k < p.albums.length) {
                if (p.albums[k] === wantedId) { inAlbum = true; break }
                k = k + 1
            }
        }
        if (inAlbum) {
            var tagsOut = ''
            if (Array.isArray(p.tags) && p.tags.length > 0) {
                var t = 0
                while (t < p.tags.length) {
                    if (t > 0) tagsOut = tagsOut + ':'
                    tagsOut = tagsOut + String(p.tags[t])
                    t = t + 1
                }
            }
            lines.push(p.filename + ',' + p.resolution + ',' + tagsOut)
        }
        j = j + 1
    }

    return { ok: true, header: 'filename,resolution,tags', lines: lines }
}

/**
 * Add a tag to a photo you own (no duplicate, case-insensitive)
 * @param {number} userId
 * @param {number} photoId
 * @param {string} tag
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
async function addTag(userId, photoId, tag) {
    const chk = await assertOwnership(userId, photoId)
    if (!chk.ok) return { ok: false, reason: chk.reason }
    const photo = chk.photo

    if (!Array.isArray(photo.tags)) photo.tags = []
    var exists = false
    var i = 0
    var needle = String(tag || '').toLowerCase()
    while (i < photo.tags.length) {
        if (String(photo.tags[i]).toLowerCase() === needle) { exists = true; break }
        i = i + 1
    }
    if (exists) return { ok: false, reason: 'Tag already exists' }

    photo.tags.push(tag)
    await store.updatePhoto(photo)
    return { ok: true }
}

module.exports = {
    authenticate,
    findPhotoForDisplay,
    updatePhotoDetails,
    buildAlbumList,
    addTag
}
