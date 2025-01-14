import { Poller, Session, ready } from '@session.js/client'
import { generateSeedHex } from '@session.js/keypair'
import { encode } from '@session.js/mnemonic'
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator'
await ready

export function requestBot(
  sessionID: string,
  input: string,
): Promise<string[]> {
  return new Promise((resolve) => {
    const sessionInstance = new Session()
    const shortName: string = uniqueNamesGenerator({
      dictionaries: [colors, animals],
      separator: ' ',
      style: 'capital',
      length: 2,
    })
    sessionInstance.setMnemonic(encode(generateSeedHex()), shortName)
    const poller = new Poller()

    const kill = () => {
      poller.stopPolling()
    }

    const timeout = 60 * 1000
    setTimeout(() => {
      kill()
      resolve([])
    }, timeout)

    sessionInstance.sendMessage({ to: sessionID, text: input })

    sessionInstance.on('message', (msg) => {
      kill()
      if (msg.text) {
        resolve([msg.text])
      } else {
        resolve([])
      }
    })

    sessionInstance.addPoller(poller)
  })
}
