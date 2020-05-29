/* eslint-disable no-unused-vars */

import { encode } from './base64'
import {
  NBT,
  NBTType,
  NBTTypes,
  NBTMetadata,
  NBTList,
  NBTCompound,
  tag
} from './nbt'

const CAPACITY_DEFAULT = 32

export class NBTWriter {
  private readonly littleEndian: boolean
  private view: Int8Array
  private data: DataView
  private buff: ArrayBuffer
  private pos = 0
  constructor (littleEndian?: boolean) {
    this.buff = new ArrayBuffer(CAPACITY_DEFAULT)
    this.view = new Int8Array(this.buff)
    this.data = new DataView(this.buff)
    this.littleEndian = littleEndian || false
  }

  private ensureCapacity (minCapacity: number) {
    const oldCapacity = this.buff.byteLength
    if (minCapacity - oldCapacity > 0) {
      let newCapacity = oldCapacity << 1
      if (newCapacity - minCapacity < 0) {
        newCapacity = minCapacity
      }
      const oldView = this.view
      const oldData: number[] = []
      const newBuff = new ArrayBuffer(newCapacity)
      const newView = new Int8Array(newBuff)
      for (let i = 0; i < oldCapacity; i++) {
        oldData.push(oldView[i])
      }
      newView.set(oldData)
      this.buff = newBuff
      this.view = newView
      this.data = new DataView(newBuff)
    }
  }

  writtenView () { return this.view }
  writtenLength () { return this.pos }

  writeByte (value: number): NBTWriter {
    this.ensureCapacity(this.pos + 1)
    this.data.setInt8(this.pos, value)
    this.pos += 1
    return this
  }

  writeShort (value: number): NBTWriter {
    this.ensureCapacity(this.pos + 2)
    this.data.setInt16(this.pos, value, this.littleEndian)
    this.pos += 2
    return this
  }

  writeInt (value: number): NBTWriter {
    this.ensureCapacity(this.pos + 4)
    this.data.setInt32(this.pos, value, this.littleEndian)
    this.pos += 4
    return this
  }

  writeLong (value: number | string | bigint): NBTWriter {
    this.ensureCapacity(this.pos + 8)
    if (typeof value !== 'bigint') {
      value = BigInt(value)
    }
    this.data.setBigInt64(this.pos, value, this.littleEndian)
    this.pos += 8
    return this
  }

  writeFloat (value: number): NBTWriter {
    this.ensureCapacity(this.pos + 4)
    this.data.setFloat32(this.pos, value, this.littleEndian)
    this.pos += 4
    return this
  }

  writeDouble (value: number): NBTWriter {
    this.ensureCapacity(this.pos + 8)
    this.data.setFloat64(this.pos, value, this.littleEndian)
    this.pos += 8
    return this
  }

  writeString (value: string): NBTWriter | never {
    const len = value.length
    let utflen = 0
    for (let i = 0; i < len; i++) {
      const c = value.charCodeAt(i)
      if ((c >= 0x0001) && (c <= 0x007F)) {
        utflen++
      } else if (c > 0x07FF) {
        utflen += 3
      } else {
        utflen += 2
      }
    }
    if (utflen > 0xFFFF) {
      throw new Error(`Encoded string too long: ${utflen} bytes. (max: 65535)`)
    }

    this
      .writeByte((utflen >>> 8) & 0xFF)
      .writeByte((utflen >>> 0) & 0xFF)

    for (let i = 0; i < len; i++) {
      const c = value.charCodeAt(i)
      if ((c >= 0x0001) && (c <= 0x007F)) {
        this.writeByte(c)
      } else if (c > 0x07FF) {
        this
          .writeByte((0xE0 | ((c >> 12) & 0x0F)))
          .writeByte((0x80 | ((c >> 6) & 0x3F)))
          .writeByte((0x80 | ((c >> 0) & 0x3F)))
      } else {
        this
          .writeByte((0xC0 | ((c >> 6) & 0x1F)))
          .writeByte((0x80 | ((c >> 0) & 0x3F)))
      }
    }
    return this
  }

  toString () {
    return `NBTWriter { pos: ${this.pos}, littleEndian: ${this.littleEndian} }`
  }
}

function writeMetadata (writer: NBTWriter, metadata: NBTMetadata): NBTWriter {
  return writer
    .writeByte(metadata.type)
    .writeString(metadata.name)
}

function writeValue (writer: NBTWriter, nbt: NBT): NBTWriter {
  const type = nbt.__type__
  switch (type) {
    case NBTTypes.TAG_BYTE:
      return writer.writeByte(nbt.__value__)
    case NBTTypes.TAG_SHORT:
      return writer.writeShort(nbt.__value__)
    case NBTTypes.TAG_INT:
      return writer.writeInt(nbt.__value__)
    case NBTTypes.TAG_LONG:
      return writer.writeLong(nbt.__value__)
    case NBTTypes.TAG_FLOAT:
      return writer.writeFloat(nbt.__value__)
    case NBTTypes.TAG_DOUBLE:
      return writer.writeDouble(nbt.__value__)
    case NBTTypes.TAG_BYTE_ARRAY:
    case NBTTypes.TAG_INT_ARRAY:
    case NBTTypes.TAG_LONG_ARRAY:
      return writeArray(writer, nbt.__value__, type)
    case NBTTypes.TAG_STRING:
      return writer.writeString(nbt.__value__)
    case NBTTypes.TAG_LIST:
      return writeList(writer, nbt)
    case NBTTypes.TAG_COMPOUND:
      return writeCompound(writer, nbt)
    default:
      throw new Error(`Unsupported nbt type id: ${type}`)
  }
}

function writeArray (writer: NBTWriter, value: (number | bigint)[], type: NBTType): NBTWriter {
  writer.writeInt(value.length)
  for (let i = 0; i < value.length; i++) {
    const val = value[i]
    type === NBTTypes.TAG_BYTE_ARRAY
      ? writer.writeByte(val as number)
      : type === NBTTypes.TAG_INT_ARRAY
        ? writer.writeInt(val as number)
        : writer.writeLong(val)
  }
  return writer
}

function writeList (writer: NBTWriter, nbt: NBTList): NBTWriter {
  const elementType = nbt.__elementType__
  if (elementType === undefined) {
    // only TAG_COMPOUND is undefined
    const values: NBT[] = nbt.__value__
    writer
      .writeByte(values.length > 0 ? values[0].__type__ : 0)
      .writeInt(values.length)
    for (const v of values) {
      writeValue(writer, v)
    }
  } else {
    // pure list elements
    const values: any[] = nbt.__value__
    writer
      .writeByte(elementType)
      .writeInt(values.length)
    for (const v of values) {
      writeValue(writer, tag(elementType, v))
    }
  }
  return writer
}

function writeCompound (writer: NBTWriter, nbt: NBTCompound): NBTWriter {
  const values: {[key: string]: NBT} = nbt.__value__
  for (const key in values) {
    const val = values[key]
    writeMetadata(writer, <NBTMetadata> { type: val.__type__, name: key })
    writeValue(writer, val)
  }
  return writer.writeByte(NBTTypes.TAG_END) // TAG_END
}

export function write (nbt: NBT, littleEndian?: boolean): Int8Array {
  const writer = new NBTWriter(littleEndian)
  writeMetadata(writer, <NBTMetadata> { type: nbt.__type__, name: '' }) // root is empty name
  writeValue(writer, nbt)
  const view = writer.writtenView()
  const copy = new Int8Array(writer.writtenLength())
  const data = new Array<number>(copy.byteLength)
  for (let i = 0; i < copy.byteLength; i++) {
    data[i] = view[i]
  }
  copy.set(data)
  return copy
}

export function writeBase64 (nbt: NBT, littleEndian?: boolean): string {
  const data = write(nbt, littleEndian)
  const result: string[] = []
  for (let i = 0; i < data.byteLength; i++) {
    const c = String.fromCharCode(data[i])
    result.push(c)
  }
  const value = result.join('')
  return encode(value)
}
