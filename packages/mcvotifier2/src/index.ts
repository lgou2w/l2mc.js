import { createConnection } from 'net'
import { createHmac } from 'crypto'

// See : https://github.com/NuVotifier/NuVotifier/blob/master/common/src/main/java/com/vexsoftware/votifier/net/protocol/VoteInboundHandler.java

type Options = {
  timeout?: number
  host: string
  port: number
  token: string
  vote: {
    username: string
    address: string
    timestamp: number
    serviceName: string
    challenge?: string
  }
}

export function vote (options: Options): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      validateOptions(options)
      const socket = createConnection(options.port, options.host)
      socket.setNoDelay(true)
      socket.on('error', reject)
      socket.setTimeout(options.timeout || 2000, () => {
        socket.removeListener('end', reject)
        socket.end()
        reject(new Error('Socket timeout'))
      })
      socket.once('data', (data: Buffer) => {
        socket.once('end', reject)
        const message = createMessage(data.toString(), options)
        socket.write(message)
        socket.once('data', (res: Buffer) => {
          socket.removeListener('end', reject)
          socket.end()
          const response: Response = JSON.parse(res.toString())
          if (response.status === 'ok') {
            resolve()
          } else {
            reject(new Error(`${response.cause}: ${response.errorMessage}`))
          }
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}

type Response = {
  status: 'ok' | 'error'
  cause?: string
  errorMessage?: string
}

function validateOptions (options?: Options) {
  if (!options || !options.host || !options.port || !options.token || !options.vote) {
    throw new Error('Invalid options: host, port, token, or vote in server')
  }
  const vote = options.vote
  if (!vote.username || !vote.address || !vote.timestamp || !vote.serviceName) {
    throw new Error('Invalid options: username, address, timestamp, or serviceName in vote')
  }
}

function createMessage (header: string, options: Options): Buffer {
  const data = header.split(' ')
  if (data.length !== 3) {
    throw new Error('Not a Votifier v2 protocol server')
  }

  options.vote.challenge = data[2].substring(0, data[2].length - 1)
  const voteJson = JSON.stringify(options.vote)
  const signature = createHmac('sha256', options.token)
    .update(voteJson)
    .digest('base64')
  const message = JSON.stringify({
    payload: JSON.stringify(options.vote),
    signature
  })
  // This added the support for chinese/unicode.
  const uint8array = new TextEncoder().encode(message)
  const messageBuf = Buffer.alloc(uint8array.length + 4)
  messageBuf.writeUInt16BE(0x733A, 0)
  messageBuf.writeUInt16BE(uint8array.length, 2)
  messageBuf.write(message, 4)
  return messageBuf
}
