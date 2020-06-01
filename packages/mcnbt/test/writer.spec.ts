/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, dataArray } from './constants'
import { tag as tagInternal } from '../src/nbt'
import {
  NBTTypes,
  NBTWriter,
  write,
  writeBase64,
  tagCompound,
  tagByte,
  tagShort,
  tagInt,
  tagLong,
  tagFloat,
  tagDouble,
  tagByteArray,
  tagString,
  tagList,
  tagIntArray,
  tagLongArray
} from '../src'
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

describe('@lgou2w/mcnbt - writer', () => {
  it('write basic', () => {
    const tag = tagCompound({ foo: tagByte(1) })
    const binary = write(tag)
    expect(binary instanceof Int8Array).to.be.true
    expect(binary).to.be.lengthOf(BINARY.length)
    expect(binary[0]).to.be.eq(NBTTypes.TAG_COMPOUND)
    expect(binary[3]).to.be.eq(NBTTypes.TAG_BYTE)
  })
  it('write base64', () => {
    const tag = tagCompound({ foo: tagByte(1) })
    const base64 = writeBase64(tag)
    expect(base64).to.be.a('string')
    expect(base64).to.be.eq(BASE64)
  })
  it('write all tag types', () => {
    const tag = tagCompound({
      // Total: 102 bytes
      // 3 bytes: [10, 0, 0]
      b: tagByte(), // 5 bytes: [1, 0, 1, 98, 0]
      s: tagShort(), // 6 bytes: [2, 0, 1, 115, 0, 0]
      i: tagInt(), // 8 bytes: [3, 0, 1, 105, 0, 0, 0, 0]
      l: tagLong(), // 12 bytes: [4, 0, 1, 108, 0, 0, 0, 0, 0, 0, 0, 0]
      f: tagFloat(), // 8 bytes: [5, 0, 1, 102, 0, 0, 0, 0]
      d: tagDouble(), // 12 bytes: [6, 0, 1, 100, 0, 0, 0, 0, 0, 0, 0, 0]
      '[b': tagByteArray(), // 9 bytes: [7, 0, 2, 91, 98, 0, 0, 0, 0]
      '"': tagString(), // 6 bytes: [8, 0, 1, 34, 0, 0]
      '[': tagList(), // 9 bytes: [9, 0, 1, 91, 0, 0, 0, 0, 0]
      '{': tagCompound(), // 5 bytes: [10, 0, 1, 123, 0]
      '[i': tagIntArray(), // 9 bytes: [11, 0, 2, 91, 105, 0, 0, 0, 0]
      '[l': tagLongArray() // 9 bytes: [12, 0, 2, 91, 108, 0, 0, 0, 0]
      // 1 bytes: [0]
    })
    const data = write(tag)
    const subarray = (begin: number, end: number): number[] => {
      const result: number[] = []
      for (let i = begin; i < end; i++) {
        result.push(data[i])
      } return result
    }
    expect(data).to.be.lengthOf(102)
    expect(subarray(0, 3))
      .to.have.same.members([10, 0, 0])
      .that.with.lengthOf(3)
    expect(subarray(3, 8))
      .to.have.same.members([1, 0, 1, 98, 0])
      .that.with.lengthOf(5)
    expect(subarray(8, 14))
      .to.have.same.members([2, 0, 1, 115, 0, 0])
      .that.with.lengthOf(6)
    expect(subarray(14, 22))
      .to.have.same.members([3, 0, 1, 105, 0, 0, 0, 0])
      .that.with.lengthOf(8)
    expect(subarray(22, 34))
      .to.have.same.members([4, 0, 1, 108, 0, 0, 0, 0, 0, 0, 0, 0])
      .that.with.lengthOf(12)
    expect(subarray(34, 42))
      .to.have.same.members([5, 0, 1, 102, 0, 0, 0, 0])
      .that.with.lengthOf(8)
    expect(subarray(42, 54))
      .to.have.same.members([6, 0, 1, 100, 0, 0, 0, 0, 0, 0, 0, 0])
      .that.with.lengthOf(12)
    expect(subarray(54, 63))
      .to.have.same.members([7, 0, 2, 91, 98, 0, 0, 0, 0])
      .that.with.lengthOf(9)
    expect(subarray(63, 69))
      .to.have.same.members([8, 0, 1, 34, 0, 0])
      .that.with.lengthOf(6)
    expect(subarray(69, 78))
      .to.have.same.members([9, 0, 1, 91, 0, 0, 0, 0, 0])
      .that.with.lengthOf(9)
    expect(subarray(78, 83))
      .to.have.same.members([10, 0, 1, 123, 0])
      .that.with.lengthOf(5)
    expect(subarray(83, 92))
      .to.have.same.members([11, 0, 2, 91, 105, 0, 0, 0, 0])
      .that.with.lengthOf(9)
    expect(subarray(92, 101))
      .to.have.same.members([12, 0, 2, 91, 108, 0, 0, 0, 0])
      .that.with.lengthOf(9)
    expect(subarray(101, 102))
      .to.have.same.members([0])
      .that.with.lengthOf(1)
  })
  it('write typed array', () => {
    // Binary: [7, 0, 0, 0, 0, 0, 4, 0, 1, 2, 3]
    const bArray = write(tagByteArray([0, 1, 2, 3]))
    expect(dataArray(bArray))
      .to.have.same.members([7, 0, 0, 0, 0, 0, 4, 0, 1, 2, 3])
      .that.with.lengthOf(11)
    // Binary: [11, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1]
    const iArray = write(tagIntArray([0, 1]))
    expect(dataArray(iArray))
      .to.have.same.members([11, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1])
      .that.with.lengthOf(15)
    // Binary: [12, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1]
    const lArray = write(tagLongArray([1]))
    expect(dataArray(lArray))
      .to.have.same.members([12, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1])
      .that.with.lengthOf(15)
  })
  it('write long support number, string and bigint type', () => {
    const writer = new NBTWriter()
    writer.writeLong(1)
    writer.writeLong('1')
    writer.writeLong(Long.fromValue(1))
    expect(writer.toString()).to.be.contain('pos: 24')
    expect(writer.writtenLength()).to.be.eq(24) // three longs is 24 bytes
  })
  it('write unsupported nbt type should throw an error', () => {
    const tag = tagInternal(0x404, 1)
    expect(tag)
      .to.have.property(P_TYPE)
      .that.is.eq(0x404)
    expect(() => write(tag)).to.throw(Error)
  })
})
