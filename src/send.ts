import { spawn } from 'child_process'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url)) + '/'

export function requestBot(sessionID: string, input: string): Promise<string[]> {
  return new Promise(resolve => {
    const outputs: string[] = []

    const sessionInstance = spawn('node', [__dirname + '../out/cli/send.js', sessionID, input])

    const onMessage = text => {
      const anchor = '[received_message]:'
      if (text.startsWith(anchor)) {
        const responseSerialized = text.slice(anchor.length)
        const output = JSON.parse(responseSerialized)
        outputs.push(output)
      }
    }

    sessionInstance.on('message', msg => {
      const text = msg.toString()
      onMessage(text)
    })
    sessionInstance.stdout.on('data', msg => {
      const text = msg.toString()
      onMessage(text)
    })

    sessionInstance.on('error', e => {
      console.error(e.message)
      resolve([])
    })

    sessionInstance.on('exit', () => {
      resolve(outputs)
    })
  })
}