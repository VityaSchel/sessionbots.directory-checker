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

fastify.post<{ Body: { sessionID: string } }>('/check-uptime', {
  schema: {
    body: {
      sessionID: { type: 'string' }
    },
  },
  handler: async (request, reply) => {
    try {
      const outputs = await requestBot(request.body.sessionID, _.sample(['/start', 'hi', 'hi?', 'hello', 'hello?', 'hey', 'start', '.']))
      reply.send({ ok: true, online: outputs.length > 0 })
    } catch (e) {
      console.error(e)
      reply.send({ ok: false })
    }
  }
})

fastify.listen({ port: 6713 }, (err, address) => {
  if (err) throw err
  console.log(`Server is now listening on ${address}`)
})