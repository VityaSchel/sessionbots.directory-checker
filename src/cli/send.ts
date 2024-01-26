import { mkdir, rm } from 'fs/promises'
import { initializeSession, createIdentity, sendMessage, EventEmitter } from 'session-messenger-nodejs'
import tempdir from 'temp-dir'
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator'

const profileId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
const profilePath = tempdir + `/session-data-${profileId}/`
await mkdir(profilePath)

const targetSessionID = process.argv[2]
if (!targetSessionID) {
  throw new Error('No target session ID provided')
}

const inputMessage = process.argv[3]
if (!inputMessage) {
  throw new Error('No input message provided')
}

const timeout = 60 * 1000

await initializeSession({ profileDataPath: profilePath })
const shortName: string = uniqueNamesGenerator({
  dictionaries: [colors, animals],
  separator: ' ',
  style: 'capital',
  length: 2
})
const { sessionID } = await createIdentity(shortName)
console.log('Created new session with ID', sessionID)

const stop = async () => {
  await rm(profilePath, { recursive: true, force: true })
}

const events = new EventEmitter()
events.on('message', async (msg, conversation) => {
  if (conversation.id === targetSessionID && msg.dataMessage?.body) {
    console.log('[received_message]:'+JSON.stringify(msg.dataMessage.body))
    await stop()
    process.exit(0)
  }
})

// await new Promise(resolve => setTimeout(resolve, 1000))
await sendMessage(targetSessionID, { body: inputMessage })
console.log('Sent message to', targetSessionID)

setTimeout(() => {
  process.exit(0)
}, timeout)

process.on('SIGINT', stop)
