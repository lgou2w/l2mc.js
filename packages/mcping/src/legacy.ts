/* eslint-disable no-unused-vars */

import { ServerStatus } from './type'
import { Socket } from 'net'

export interface LegacyStatus extends ServerStatus {
  description: string
}

type Options = {
  timeout?: number
  connectTimeout?: number
}

export function ping16x (host: string, port?: number | undefined, options?: Options) {
  const hostBuf = writeUTF16BE(host)
  const portBuf = Buffer.alloc(4)
  const payloadLenBuf = Buffer.alloc(2)
  payloadLenBuf.writeUInt16BE(hostBuf.length + 7, 0)
  portBuf.writeInt32BE(port || DEFAULT_PORT, 0)
  return ping(Buffer.concat([
    Buffer.from([
      0xFE, // Packet Identifier
      0x01, // Server List Ping
      0xFA, // Plugin Message
      0x00, 0x0B, // MC|PingHost (UTF-16BE) Length
      0x00, 0x4D, 0x00, 0x43, 0x00, 0x7C, 0x00, 0x50, 0x00, 0x69, 0x00,
      0x6E, 0x00, 0x67, 0x00, 0x48, 0x00, 0x6F, 0x00, 0x73, 0x00, 0x74
    ]),
    payloadLenBuf, // len(UTF-16BE(host)) + 7
    Buffer.from([0x4E]), // Protocol Version (0x4E = 78 = 1.6.4)
    hostBuf,
    portBuf
  ]), host, port, options)
}

export function ping14xTo15x (host: string, port?: number | undefined, options?: Options) {
  return ping(Buffer.from([0xFE, 0x01]), host, port, options)
}

export function pingBeta18xTo13x (host: string, port?: number | undefined, options?: Options) {
  return ping(Buffer.from([0xFE]), host, port, options)
}

const DEFAULT_PORT = 25565
const DEFAULT_OPTIONS: Partial<Options> = {
  timeout: 10000,
  connectTimeout: 10000
}

const PACKET_PONG_ID = 0xFF

function ping (
  packet: Buffer,
  host: string,
  port?: number | undefined,
  options?: Options
): Promise<LegacyStatus> {
  const _options = { ...DEFAULT_OPTIONS, ...options }
  return new Promise<LegacyStatus>((resolve, reject) => {
    try {
      const status = <LegacyStatus> {}
      const start = Date.now()
      const socket = new Socket()
      socket.setNoDelay(true)
      socket.once('error', reject)
      socket.setTimeout(_options.connectTimeout!, () => {
        socket.destroy()
        reject(new Error('Socket timeout'))
      })
      socket.on('data', (data) => {
        socket.destroy()
        try {
          const pong = readPacketPong(data)
          status.host = host
          status.port = socket.remotePort || port || DEFAULT_PORT
          status.ipv4 = socket.remoteAddress || host
          status.latency = Date.now() - start
          status.version = pong.version
          status.players = pong.players
          status.description = pong.description
          resolve(status)
        } catch (e) {
          reject(e)
        }
      })
      socket.connect(port || DEFAULT_PORT, host, () => {
        socket.setTimeout(_options.timeout!)
        socket.write(packet)
      })
    } catch (e) {
      reject(e)
    }
  })
}

function readPacketPong (buf: Buffer) {
  const packetId = buf.readUInt8(0)
  if (packetId !== PACKET_PONG_ID) {
    throw new Error(`Bad packet id: ${packetId}`)
  }

  const payloadLen = buf.readUInt16BE(1)
  const payload = readUTF16BE(buf.slice(3))
  if (payload.length !== payloadLen) {
    throw new Error(`Bad packet payload length. (expected: ${payloadLen}, current: ${payload.length})`)
  }

  if (payload[0] === '\xa7' && payload[1] === '1') {
    const pairs = payload.slice(3).split('\0')
    if (pairs.length !== 5) {
      throw new Error(`Bad packet payload entries: ${pairs} (expected: 5, current: ${pairs.length}`)
    }
    return {
      version: { protocol: parseInt(pairs[0]), name: pairs[1] },
      players: { max: parseInt(pairs[4]), online: parseInt(pairs[3]) },
      description: pairs[2]
    }
  } else {
    const pairs = payload.split('\xa7')
    if (pairs.length !== 3) {
      throw new Error(`Bad packet payload entries: ${pairs} (expected: 3, current: ${pairs.length}`)
    }
    return {
      version: { protocol: 0, name: '' },
      players: { max: parseInt(pairs[2]), online: parseInt(pairs[1]) },
      description: pairs[0]
    }
  }
}

// UTF-16BE See: https://github.com/ashtuchkin/iconv-lite/blob/5931403/encodings/utf16.js#L17-L64

function writeUTF16BE (str: string): Buffer {
  const buf = Buffer.from(str, 'ucs2')
  for (let i = 0; i < buf.length; i += 2) {
    const tmp = buf[i]
    buf[i] = buf[i + 1]
    buf[i + 1] = tmp
  } return buf
}

function readUTF16BE (buf: Buffer): string {
  if (buf.length <= 0) {
    return ''
  }
  const data = Buffer.alloc(buf.length + 1)
  let j = 0
  for (let i = 0; i < buf.length; i += 2, j += 2) {
    data[j] = buf[i + 1]
    data[j + 1] = buf[i]
  }
  return data.slice(0, j).toString('ucs2')
}
