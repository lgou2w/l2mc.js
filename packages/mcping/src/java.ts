/* eslint-disable no-unused-vars */

import { Transform, TransformCallback } from 'stream'
import { ServerStatus } from './type'
import { Socket, isIPv4 } from 'net'
import { resolveSrv } from 'dns'

export interface MinecraftStatus extends ServerStatus {
  description: string | { [key: string]: any }
  players: {
    online: number
    max: number
    sample?: { id: string, name: string }[]
  }
  favicon?: string
  [key: string]: any
}

type Options = {
  timeout?: number
  connectTimeout?: number
}

export async function ping (
  host: string,
  port?: number | undefined,
  options?: Options
): Promise<MinecraftStatus> {
  const _options = { ...DEFAULT_OPTIONS, ...options }
  if (!isIPv4(host)) {
    await new Promise((resolve) => {
      resolveSrv(`_minecraft._tcp.${host}`, (err, addresses) => {
        if (err || addresses.length <= 0) {
          resolve()
        } else {
          host = addresses[0].name
          port = addresses[0].port
          resolve()
        }
      })
    })
  }
  return new Promise<MinecraftStatus>((resolve, reject) => {
    try {
      const start = Date.now()
      const socket = new Socket()
      const reader = new ChunkReader()
      socket.setNoDelay(true)
      socket.once('error', reject)
      socket.setTimeout(_options.connectTimeout!, () => {
        socket.destroy()
        reject(new Error('Socket timeout'))
      })
      socket.pipe(reader)
      reader.on('data', (data: Buffer) => {
        // do not send ping packet, because some plugins will directly
        // disconnect after replying to the response
        socket.end()
        const response = readPacketResponse(data)
        const status = <MinecraftStatus> { ...response }
        status.host = host
        status.port = socket.remotePort || port || DEFAULT_PORT
        status.ipv4 = socket.remoteAddress || host
        status.latency = Date.now() - start
        resolve(status)
      })
      socket.connect(port || DEFAULT_PORT, host, () => {
        socket.setTimeout(_options.timeout!)
        socket.write(writePacketHandshake(host, port || DEFAULT_PORT))
        socket.write(writePacketRequest())
      })
    } catch (e) {
      reject(e)
    }
  })
}

const DEFAULT_PORT = 25565
const DEFAULT_OPTIONS: Partial<Options> = {
  timeout: 12000,
  connectTimeout: 12000
}

const PROTOCOL = 578 // 1.15.2
const NEXT_STATUS = 0x1
const PACKET_HANDSHAKE = 0x0
const PACKET_REQUEST = 0x0
const PACKET_RESPONSE = 0x0

function writePacket (data: Buffer): Buffer {
  return Buffer.concat([
    writeVarInt(data.length),
    data
  ])
}

function writePacketHandshake (host: string, port: number): Buffer {
  const hostBuf = Buffer.from(host)
  const portBuf = Buffer.alloc(2)
  portBuf.writeUInt16BE(port)
  return writePacket(Buffer.concat([
    writeVarInt(PACKET_HANDSHAKE),
    writeVarInt(PROTOCOL),
    writeVarInt(hostBuf.length),
    hostBuf,
    portBuf,
    writeVarInt(NEXT_STATUS)
  ]))
}

function writePacketRequest (): Buffer {
  return writePacket(Buffer.from([PACKET_REQUEST]))
}

function readPacketResponse (buf: Buffer) {
  const [packetId, offset] = readVarInt(buf, 0)
  const [, newOffset] = readVarInt(buf, offset)
  if (packetId !== PACKET_RESPONSE) {
    throw new Error(`Bad packet id: ${packetId}`)
  }
  const response = buf.slice(newOffset, buf.length).toString()
  return JSON.parse(response)
}

// VarInt

function writeVarInt (value: number): Buffer {
  const bytes: number[] = []
  do {
    let b = value & 127
    value >>>= 7
    if (value !== 0) {
      b |= 128
    }
    bytes.push(b)
  } while (value !== 0)
  return Buffer.from(bytes)
}

function readVarInt (buf: Buffer, offset: number): [number, number] {
  let numRead = 0
  let result = 0
  let b = 0
  let v: number
  do {
    b = buf.readUInt8(offset++)
    result |= (v = b & 127) << (7 * numRead++)
    if (numRead > 5) {
      throw new Error('VarInt too big')
    }
  } while ((b & 128) !== 0)
  return [result, offset]
}

// Packet chunk reader

class ChunkReader extends Transform {
  private buffer = Buffer.alloc(0)
  private transforming = false
  private flushCallback?: () => void

  async _transform (chunk: any, encoding: string, callback: TransformCallback) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    this.transforming = true

    let offset = 0
    let length: number
    while (true) {
      const packetStart = offset
      try {
        [length, offset] = readVarInt(this.buffer, offset)
      } catch (e) {
        break
      }

      if (offset + length > this.buffer.length) {
        offset = packetStart
        break
      }

      try {
        this.push(this.buffer.slice(offset, offset + length))
      } catch (e) {
        return this.destroy(e)
      }
      offset += length
      await Promise.resolve()
    }
    this.buffer = this.buffer.slice(offset)
    this.flushCallback && this.flushCallback()
    this.transforming = false
    callback()
  }

  flush (callback: TransformCallback): void {
    if (this.transforming) {
      this.flushCallback = callback
    } else {
      callback()
    }
  }
}
