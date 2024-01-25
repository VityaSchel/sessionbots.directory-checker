import { BotSchema } from '@/db-schemas/bot.js'
import { getDb } from '@/db.js'
import { requestBot } from '@/send.js'
import Fastify from 'fastify'
import _ from 'lodash'

const fastify = Fastify({
  logger: true
})

fastify.post<{ Body: { sessionID: string, input: string, output: string } }>('/assert', {
  schema: {
    body: {
      sessionID: { type: 'string' },
      input: { type: 'string' },
      output: { type: 'string' },
    },
  },
  handler: async (request, reply) => {
    try {
      const outputs = await requestBot(request.body.sessionID, request.body.input)
      if(request.body.output === outputs[0]){
        reply.send({ ok: true, equals: true })
      } else {
        reply.send({ ok: true, equals: false, outputs })
      }
    } catch(e) {
      console.error(e)
      reply.send({ ok: false })
    }
  }
})

fastify.post('/check-uptime', async (request, reply) => {
  try {
    const botsDb = await getDb('bots')
    const botsValues = await botsDb.mget(await botsDb.keys())
    const bots = botsValues
      .filter(Boolean)
      .map(bot => JSON.parse(bot as string) as BotSchema)
    
    const targetBots = _.chunk(
      bots
        .filter(bot => bot.visible)
        .filter(bot => Date.now() - bot.lastChecked > 1000 * 60 * 60 * 2),
      4
    )
    for (const bots of targetBots) {
      await Promise.all(bots.map(async bot => {
        try {
          const outputs = await requestBot(bot.id, _.sample(['/start', 'hi', 'hi?', 'hello', 'hello?', 'hey', 'start', '.']))
          bot.lastChecked = Date.now()
          if (outputs.length > 0) {
            bot.status = 'online'
            bot.checksFails = 0
            await botsDb.put(bot.id, JSON.stringify(bot))
          } else {
            bot.status = 'offline'
            bot.checksFails++
            if (bot.checksFails > 60) {
              bot.visible = false
            }
            await botsDb.put(bot.id, JSON.stringify(bot))
          }
        } catch(e) {
          console.error(e)
        }
      }))
    }
    
    reply.send({ ok: true })
  } catch (e) {
    console.error(e)
    reply.send({ ok: false })
  }
})

fastify.listen({ port: 6713 }, (err, address) => {
  if (err) throw err
  console.log(`Server is now listening on ${address}`)
})