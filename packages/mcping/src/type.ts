// Type define

export interface ServerStatus {
  host: string
  port: number
  ipv4: string
  latency: number
  description: any
  version: {
    name: string
    protocol: number
  }
  players: {
    online: number
    max: number
  }
}
