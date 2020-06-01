/* eslint-disable no-unused-expressions */
/* eslint-disable no-unused-vars */

import { expect } from 'chai'
import { P_TYPE, P_VALUE, P_ELEMENT } from './constants'
import { NBTTypes, NBTReader, read, readBase64, NBTCompound } from '../src'
import * as Long from 'long'

/**
 * Structure:
 *
 * <TAG_COMPOUND> {
 *   foo: <TAG_BYTE> {
 *     [PROPERTY_VALUE]: 1
 *     ...
 *   }
 *   ...
 * }
 *
 * Length = 11
 * Content:
 *    10 : TAG_COMPOUND (byte)
 *   0,0 : UTF Length (short) = two zeros represent an empty string
 *     1 : TAG_BYTE (byte)
 *   0,3 : UTF Length (short) = 'foo'.length, three bytes
 *   102 : ASCII (byte) = f
 *   111 : ASCII (byte) = o
 *   111 : ASCII (byte) = o
 *     1 : Value (byte) = 1
 *     0 : TAG_END (byte) = Only TAG_COMPOUND EOF
 */
const BINARY = new Int8Array([10, 0, 0, 1, 0, 3, 102, 111, 111, 1, 0])
const BASE64 = 'CgAAAQADZm9vAQA='

// See: nbt-writer.spec.ts Line 68
const BINARY_ALL = new Int8Array([
  10, 0, 0, 1, 0, 1, 98, 0, 2, 0, 1, 115, 0, 0, 3, 0, 1, 105, 0, 0, 0,
  0, 4, 0, 1, 108, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1, 102, 0, 0, 0, 0, 6,
  0, 1, 100, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 2, 91, 98, 0, 0, 0, 0, 8, 0,
  1, 34, 0, 0, 9, 0, 1, 91, 0, 0, 0, 0, 0, 10, 0, 1, 123, 0, 11, 0, 2,
  91, 105, 0, 0, 0, 0, 12, 0, 2, 91, 108, 0, 0, 0, 0, 0
])

describe('@lgou2w/mcnbt - reader', () => {
  it('read basic', () => {
    const tag = read(BINARY)
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_COMPOUND)
    expect(tag[P_VALUE])
      .to.have.property('foo')
      .that.have.property(P_VALUE)
      .with.eq(1)
  })
  it('read base64', () => {
    const tag = readBase64(BASE64)
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_COMPOUND)
    expect(tag[P_VALUE])
      .to.have.property('foo')
      .that.have.property(P_VALUE)
      .with.eq(1)
  })
  it('read all tag types', () => {
    const tag = read(BINARY_ALL) as NBTCompound
    expect(tag.b).to.be.eq(0)
  })
  it('read root TAG_END should throw error', () => {
    const data = new Uint8Array([0])
    expect(() => read(data)).to.throw(Error)
  })
  it('read unsupported nbt type should throw error', () => {
    const data = new Uint8Array([127, 0, 0]) // 127 is unknown nbt type id
    expect(() => read(data)).to.throw(Error)
  })
  it('read unsigned byte EOF', () => {
    const view = new DataView(new Int8Array([127, -100]).buffer)
    const reader = new NBTReader(view)
    expect(reader.readUnsignedByte()).to.be.eq(127)
    expect(() => reader.readUnsignedByte()).to.throw(Error)
    expect(reader.toString()).to.contain('pos: 2')
  })
  it('read typed array', () => {
    // TAG_BYTE_ARRAY: [0, 1, 2, 3]
    const bArray = read(new Uint8Array([7, 0, 0, 0, 0, 0, 4, 0, 1, 2, 3]))
    expect(bArray)
      .to.have.property(P_TYPE)
      .that.is.eq(NBTTypes.TAG_BYTE_ARRAY)
    expect(bArray)
      .to.have.property(P_VALUE)
      .that.have.same.members([0, 1, 2, 3])
      .with.lengthOf(4)
    // TAG_INT_ARRAY: [0, 1]
    const iArray = read(new Uint8Array([11, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1]))
    expect(iArray)
      .to.have.property(P_TYPE)
      .that.is.eq(NBTTypes.TAG_INT_ARRAY)
    expect(iArray)
      .to.have.property(P_VALUE)
      .that.have.same.members([0, 1])
      .with.lengthOf(2)
    // TAG_LONG_ARRAY: [1]
    const lArray = read(new Uint8Array([12, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1]))
    expect(lArray)
      .to.have.property(P_TYPE)
      .that.is.eq(NBTTypes.TAG_LONG_ARRAY)
    expect(lArray)
      .to.have.property(P_VALUE)
      .with.lengthOf(1)
    expect(lArray.__value__[0].eq(Long.fromValue(1))).to.be.true
  })
  it('read tag list', () => {
    // TAG_LIST: [TAG_BYTE(1), TAG_BYTE(2)]
    const tag = read(new Uint8Array([9, 0, 0, 1, 0, 0, 0, 2, 1, 2]))
    expect(tag)
      .to.have.property(P_TYPE)
      .that.is.eq(NBTTypes.TAG_LIST)
    expect(tag)
      .to.have.property(P_ELEMENT)
      .that.is.eq(NBTTypes.TAG_BYTE)
    expect(tag)
      .to.have.property(P_VALUE)
      .that.have.same.members([1, 2])
      .with.lengthOf(2)
  })
  it('read ascii character', () => {
    const tag = read(new Uint8Array([8, 0, 0, 0, 4, 0x0, 0x11, 0x32, 111]))
    expect(tag)
      .to.have.property(P_VALUE)
      .that.is.eq('\u{0}\u{11}\u{32}o')
  })
  it('read unicode length 2', () => {
    const tag = read(new Uint8Array([8, 0, 0, 0, 2, 194, 128]))
    expect(tag)
      .to.have.property(P_VALUE)
      .that.is.eq('\u0080')
  })
  it('read chinese character', () => {
    // See: tag-string.spec.ts Line 32
    const tag = read(new Uint8Array([8, 0, 0, 0, 6, 228, 184, 173, 230, 150, 135]))
    expect(tag)
      .to.have.property(P_TYPE)
      .that.is.eq(NBTTypes.TAG_STRING)
    expect(tag)
      .to.have.property(P_VALUE)
      .that.is.eq('中文')
  })
})
