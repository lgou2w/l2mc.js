/* eslint-disable no-unused-vars */

import { decode } from './base64'
import {
  NBT,
  NBTType,
  NBTTypes,
  NBTMetadata,
  NBTList,
  NBTCompound,
  tagByte,
  tagShort,
  tagInt,
  tagLong,
  tagFloat,
  tagDouble,
  tagByteArray,
  tagString,
  tagList,
  tagCompound,
  tagIntArray,
  tagLongArray
} from './nbt'

export class NBTReader {
  private readonly data: DataView
  private readonly length: number
  private readonly littleEndian: boolean
  private pos = 0
  constructor (data: DataView, littleEndian?: boolean) {
    this.data = data
    this.length = data.byteLength
    this.littleEndian = littleEndian || false
  }

  readByte (): number {
    const v = this.data.getInt8(this.pos)
    this.pos += 1
    return v
  }

  readUnsignedByte (): number | never {
    const v = this.readByte()
    if (v < 0) {
      throw new Error('EOF')
    }
    return v
  }

  readShort (): number {
    const v = this.data.getInt16(this.pos, this.littleEndian)
    this.pos += 2
    return v
  }

  readInt (): number {
    const v = this.data.getInt32(this.pos, this.littleEndian)
    this.pos += 4
    return v
  }

  readLong (): bigint {
    const v = this.data.getBigInt64(this.pos, this.littleEndian)
    this.pos += 8
    return v
  }

  readFloat (): number {
    const v = this.data.getFloat32(this.pos, this.littleEndian)
    this.pos += 4
    return v
  }

  readDouble (): number {
    const v = this.data.getFloat64(this.pos, this.littleEndian)
    this.pos += 8
    return v
  }

  readString (): string {
    const len = this.readShort()
    if (len <= 0) {
      return ''
    }
    const values = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      values[i] = this.readByte()
    }
    let out = ''
    let c: number, c2: number, c3: number
    let i = 0
    while (i < len) {
      c = values[i++]
      switch (c >> 4) {
        case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
          out += String.fromCharCode(c)
          break
        case 12: case 13:
          c2 = values[i++]
          out += String.fromCharCode(((c & 0x1F) << 6) | (c2 & 0x3F))
          break
        case 14:
          c2 = values[i++]
          c3 = values[i++]
          out += String.fromCharCode(
            ((c & 0x0F) << 12) |
            ((c2 & 0x3F) << 6) |
            ((c3 & 0x3F) << 0))
          break
      }
    }
    return out
  }

  toString () {
    return `NBTReader { pos: ${this.pos}, length: ${this.length}, littleEndian: ${this.littleEndian} }`
  }
}

function readMetadata (reader: NBTReader): NBTMetadata | null {
  const type = reader.readUnsignedByte()
  return type === NBTTypes.TAG_END
    ? null
    : <NBTMetadata> { type, name: reader.readString() }
}

function readValue (reader: NBTReader, type: NBTType): NBT {
  switch (type) {
    case NBTTypes.TAG_BYTE:
      return tagByte(reader.readByte())
    case NBTTypes.TAG_SHORT:
      return tagShort(reader.readShort())
    case NBTTypes.TAG_INT:
      return tagInt(reader.readInt())
    case NBTTypes.TAG_LONG:
      return tagLong(reader.readLong())
    case NBTTypes.TAG_FLOAT:
      return tagFloat(reader.readFloat())
    case NBTTypes.TAG_DOUBLE:
      return tagDouble(reader.readDouble())
    case NBTTypes.TAG_BYTE_ARRAY:
    case NBTTypes.TAG_INT_ARRAY:
    case NBTTypes.TAG_LONG_ARRAY:
      return readArray(reader, type)
    case NBTTypes.TAG_STRING:
      return tagString(reader.readString())
    case NBTTypes.TAG_LIST:
      return readList(reader)
    case NBTTypes.TAG_COMPOUND:
      return readCompound(reader)
    default:
      throw new Error(`Unsupported nbt type id: ${type}`)
  }
}

function readArray (reader: NBTReader, type: NBTType): NBT {
  const len = reader.readInt()
  const value: any[] = []
  for (let i = 0; i < len; i++) {
    const el = type === NBTTypes.TAG_BYTE_ARRAY
      ? reader.readByte()
      : type === NBTTypes.TAG_INT_ARRAY
        ? reader.readInt()
        : reader.readLong()
    value.push(el)
  }
  return type === NBTTypes.TAG_BYTE_ARRAY
    ? tagByteArray(value)
    : type === NBTTypes.TAG_INT_ARRAY
      ? tagIntArray(value)
      : tagLongArray(value)
}

function readList (reader: NBTReader): NBTList {
  const elementType = reader.readUnsignedByte() as NBTType
  const len = reader.readInt()
  const value: NBT[] = []
  if (elementType !== NBTTypes.TAG_END) {
    for (let i = 0; i < len; i++) {
      value.push(readValue(reader, elementType))
    }
  }
  return tagList(value)
}

function readCompound (reader: NBTReader): NBTCompound {
  const value: { [key: string]: NBT } = {}
  let entry: NBT
  let metadata = readMetadata(reader)
  while (metadata && metadata.type !== NBTTypes.TAG_END) {
    entry = readValue(reader, metadata.type)
    value[metadata.name] = entry
    metadata = readMetadata(reader)
  }
  return tagCompound(value)
}

export function read (
  data: ArrayBuffer | Int8Array | Uint8Array,
  littleEndian?: boolean
): NBT | never {
  if (data instanceof Int8Array || data instanceof Uint8Array) {
    data = data.buffer
  }
  const reader = new NBTReader(new DataView(data), littleEndian)
  const rootMetadata = readMetadata(reader)
  if (rootMetadata === null) {
    throw new Error('Invalid root nbt metadata.')
  }
  return readValue(reader, rootMetadata.type)
}

export function readBase64 (
  encoded: string,
  littleEndian?: boolean
): NBT | never {
  const decoded = decode(encoded)
  const data = new Int8Array(new ArrayBuffer(decoded.length))
  for (let i = 0; i < data.length; i++) {
    data[i] = decoded.charCodeAt(i)
  }
  return read(data, littleEndian)
}
