const sqlite3 = require('sqlite3')
const open = require('sqlite').open
const fs = require('fs')

const filename = 'contacts.sqlite3'
const numContacts = 1000 // TODO: read from process.argv

const shouldMigrate = !fs.existsSync(filename)


/**
 * Generate `numContacts` contacts,
 * one at a time
 *
 */
function * generateContacts () {
  let i = 1
  while (i <= numContacts) {
    yield [`name-${i}`, `email-${i}@domain.tld`]
    i++
  }
}

const migrate = async (db) => {
  console.log('Migrating db ...')
  await db.exec(`
        CREATE TABLE contacts(
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL
         )
     `)
  console.log('Done migrating db')
}

const insertContacts = async (db) => {
  console.log('Inserting contacts ...')
  const iterator = generateContacts()
  for (var i = 0; i < numContacts; i++) {
    let contact = iterator.next().value;
    db.run("insert into contacts (name,email) values (?, ?)", [contact[0], contact[1]]);
  }
}

const queryContact = async (db) => {
  const start = Date.now()
  const res = await db.get('SELECT name FROM contacts WHERE email = ?', [`email-${numContacts}@domain.tld`])
  if (!res || !res.name) {
    console.error('Contact not found')
    process.exit(1)
  }
  const end = Date.now()
  const elapsed = (end - start) / 1000
  console.log(`Query took ${elapsed} seconds`)
}

(async () => {
  const db = await open({
    filename,
    driver: sqlite3.Database
  })
  if (shouldMigrate) {
    await migrate(db)
  }
  await insertContacts(db)
  await queryContact(db)
  await db.close()
})()
