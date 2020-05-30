/* eslint-disable no-unused-vars */

import { ServerStatus } from './type'
import { createSocket } from 'dgram'
import { lookup } from 'dns'
import { isIPv4 } from 'net'

export interface BedrockStatus extends ServerStatus {
  description: string
  serverId: string
  gameId: string
  payload: string[]
}

type Options = {
  timeout?: number
}

export function pingBedrock (
  host: string,
  port?: number | undefined,
  options?: Options
): Promise<BedrockStatus> {
  return new Promise<string>((resolve, reject) => {
    if (!isIPv4(host)) {
      lookup(host, (err, address) => {
        if (err) {
          reject(err)
        } else {
          resolve(address)
        }
      })
    } else {
      resolve(host)
    }
  }).then((ipv4: string) => {
    return new Promise<BedrockStatus>((resolve, reject) => {
      try {
        const start = Date.now()
        const status = <BedrockStatus> {}
        const client = createSocket('udp4')
        client.once('error', reject)
        client.on('listening', () => {
          const ping = writePacketPing(start)
          client.send(ping, 0, ping.length, port || DEFAULT_PORT, ipv4)
        })
        client.on('message', (msg, rinfo) => {
          client.close()
          clearTimeout(timeoutHandle)
          const pong = readPacketPong(msg)
          status.host = host
          status.port = rinfo.port
          status.ipv4 = ipv4
          status.latency = Date.now() - start
          status.description = pong.serverName
          status.version = {
            name: pong.serverVersion,
            protocol: parseInt(pong.protocolVersion)
          }
          status.players = {
            online: parseInt(pong.online),
            max: parseInt(pong.max)
          }
          status.serverId = pong.serverId
          status.gameId = pong.gameId
          status.payload = pong.payload
          resolve(status)
        })
        client.bind()
        const timeoutHandle = setTimeout(() => {
          client.close()
          reject(new Error('Timeout'))
        }, options
          ? options.timeout || DEFAULT_TIMEOUT
          : DEFAULT_TIMEOUT)
      } catch (e) {
        reject(e)
      }
    })
  })
}

// Constants & Packet

const DEFAULT_PORT = 19132
const DEFAULT_TIMEOUT = 10000
const PACKET_PING_ID = 0x01
const PACKET_PONG_ID = 0x1C
const PACKET_MAGIC = [
  0x00, 0xFF, 0xFF, 0x00, 0xFE, 0xFE, 0xFE, 0xFE,
  0xFD, 0xFD, 0xFD, 0xFD, 0x12, 0x34, 0x56, 0x78
]

// Ping:
//
// 0x01     : Packet Id (byte)
// 8  bytes : Timestamp (long)
// 16 bytes : Magic data (bytes)
//
function writePacketPing (timestamp: number): Buffer {
  const timestampBuf = Buffer.alloc(8)
  timestampBuf.writeBigInt64BE(BigInt(timestamp))
  return Buffer.concat([
    Buffer.from([PACKET_PING_ID]),
    timestampBuf,
    Buffer.from(PACKET_MAGIC)
  ])
}

// Pong:
//
// 0x1C     : Packet Id (byte)
// 8  bytes : Timestamp (long)
// 8  bytes : Server Id (long)
// 16 bytes : Magic data (bytes)
// 2  bytes : Payload length (short)
// .. bytes : Payload (string)
//
function readPacketPong (buf: Buffer) {
  const packetId = buf.readInt8(0)
  if (packetId !== PACKET_PONG_ID) {
    throw new Error(`Bad packet id: ${packetId}`)
  }

  const timestamp = buf.readBigInt64BE(1).toString()
  const serverId = buf.readBigInt64BE(9).toString() + 'n' // bigint

  if (buf.compare(Buffer.from(PACKET_MAGIC), 0, PACKET_MAGIC.length, 17, 33) !== 0) {
    throw new Error(`Bad packet magic data: ${buf.slice(17, 33).toString('hex')}`)
  }

  const payloadLen = buf.readInt16BE(33)
  const payload = buf.slice(35, payloadLen).toString().split(/;/g)
  if (payload.length < 6) {
    throw new Error(`Bad packet payload entries: ${payload}. (expected: 6, current: ${payload.length})`)
  }

  const [gameId, serverName, protocolVersion, serverVersion, online, max] = payload
  return {
    timestamp,
    serverId,
    gameId,
    serverName,
    protocolVersion,
    serverVersion,
    online,
    max,
    payload
  }
}
