// app.js (Presentation Layer)
const prompt = require('prompt-sync')({ sigint: true })
const biz = require('./business')

/**
 * Prompt login and return {id, username} or null if failed
 * @returns {Promise<object|null>}
 */
async function login() {
    console.log('Please log in')
    var username = prompt('Username: ').trim()
    var password = prompt('Password: ').trim()
    var user = await biz.authenticate(username, password)
    if (!user) {
        console.log('Invalid credentials')
        return null
    }
    return user
}

/**
 * Menu action: Find Photo (enforces ownership)
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function uiFindPhoto(userId) {
    var idText = prompt('Photo ID? ').trim()
    var id = parseInt(idText, 10)
    if (isNaN(id)) { console.log('Invalid ID'); return }
    var res = await biz.findPhotoForDisplay(userId, id)
    if (!res.ok) { console.log(res.reason); return }
    var d = res.details
    console.log('Filename: ' + d.filename)
    console.log(' Title: ' + d.title)
    console.log('  Date: ' + d.date)
    console.log('Albums: ' + (d.albums.length ? d.albums.join(', ') : 'None'))
    console.log('  Tags: ' + d.tags)
}

/**
 * Menu action: Update Photo Details (title/description)
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function uiUpdatePhoto(userId) {
    var idText = prompt('Photo ID? ').trim()
    var id = parseInt(idText, 10)
    if (isNaN(id)) { console.log('Invalid ID'); return }

    console.log('Press enter to reuse existing value.')
    var newTitle = prompt('Enter new title (or Enter to keep): ')
    var newDesc  = prompt('Enter new description (or Enter to keep): ')
    var res = await biz.updatePhotoDetails(userId, id, newTitle, newDesc)
    if (!res.ok) { console.log(res.reason); return }
    console.log('Photo updated')
}

/**
 * Menu action: Album Photo List
 * @returns {Promise<void>}
 */
async function uiAlbumList() {
    var name = prompt('Album name? ').trim()
    var res = await biz.buildAlbumList(name)
    if (!res.ok) { console.log(res.reason); return }
    console.log(res.header)
    var i = 0
    while (i < res.lines.length) {
        console.log(res.lines[i])
        i = i + 1
    }
}

/**
 * Menu action: Tag Photo
 * @param {number} userId
 * @returns {Promise<void>}
 */
async function uiTagPhoto(userId) {
    var idText = prompt('Photo ID? ').trim()
    var id = parseInt(idText, 10)
    if (isNaN(id)) { console.log('Invalid ID'); return }
    var tag = prompt('Tag to add? ').trim()
    if (!tag) { console.log('Enter a tag'); return }
    var res = await biz.addTag(userId, id, tag)
    if (!res.ok) { console.log(res.reason); return }
    console.log('Updated!')
}

/**
 * Show menu once
 * @param {number} userId
 * @returns {Promise<boolean>} true to continue, false to exit
 */
async function showMenuOnce(userId) {
    console.log('')
    console.log('1. Find Photo')
    console.log('2. Update Photo Details')
    console.log('3. Album Photo List')
    console.log('4. Tag Photo')
    console.log('5. Exit')
    var s = prompt('Your selection> ').trim()

    if (s === '1') { await uiFindPhoto(userId); return true }
    if (s === '2') { await uiUpdatePhoto(userId); return true }
    if (s === '3') { await uiAlbumList(); return true }
    if (s === '4') { await uiTagPhoto(userId); return true }
    if (s === '5') return false

    console.log('Invalid selection')
    return true
}

/**
 * Program entry point
 * @returns {Promise<void>}
 */
async function main() {
    console.log('Digital Media Catalog (3-Tier, A2)')
    console.log('-----------------------------------')
    var user = await login()
    if (!user) return
    console.log('Welcome, ' + user.username)

    var cont = true
    while (cont) cont = await showMenuOnce(user.id)
}

main()
