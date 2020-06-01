/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import {
  tag as tagInternal,
  tagByte,
  tagString,
  tagCompound,
  writeMojangson,
  readMojangson,
  readMojangsonCompound,
  tagShort,
  tagInt,
  tagLong,
  tagFloat,
  tagDouble,
  tagByteArray,
  tagList,
  tagIntArray,
  tagLongArray
} from '../src'
import * as Long from 'long'

describe('@lgou2w/mcnbt - mojangson', () => {
  it('write', () => {
    const tag = tagCompound({
      foo: tagByte(1),
      bar: tagString('"HelloWorld"')
    })
    const mojangson = writeMojangson(tag)
    expect(mojangson).to.be.eq('{"foo":1b,"bar":"\\"HelloWorld\\""}')
    writeMojangson(tag, true)
  })
  it('write invalid tag type should throw error', () => {
    const tag = tagInternal(127, 1)
    expect(() => writeMojangson(tag)).to.throw(Error)
  })
  it('write all tag types', () => {
    const tag = tagCompound({
      byte: tagByte(1),
      short: tagShort(2),
      int: tagInt(3),
      long: tagLong(4),
      float: tagFloat(1.234),
      double: tagDouble(3.14159),
      barray: tagByteArray([1, 2, 3]),
      string: tagString('string'),
      list: tagList([tagCompound({ foo: tagByte(1) })]),
      list2: tagList([tagByte(1), tagByte(2), tagByte(3)]),
      compound: tagCompound({ foo: tagByte(1), bar: tagInt(2) }),
      compound2: tagCompound(),
      iarray: tagIntArray([1, 2, 3]),
      larray: tagLongArray([1, 2, 3])
    })
    writeMojangson(tag)
    writeMojangson(tag, true)
  })
  it('read some incorrect mojangson string', () => {
    expect(() => readMojangson('')).to.throw(Error)
    expect(() => readMojangson('{ foo : bar  ')).to.throw(Error)
    expect(() => readMojangson('{  : value  }  ')).to.throw(Error)
    expect(() => readMojangson('{ foo: 1b,   ')).to.throw(Error)
    expect(() => readMojangson('{   ')).to.throw(Error)
    expect(() => readMojangson('[   ')).to.throw(Error)
    expect(() => readMojangson('{ a: "\\"escape without end  }')).to.throw(Error)
  })
  it('read elements of the array and list must be of the same type', () => {
    expect(() => readMojangson('[B; 1b, 2B, 3L ]')).to.throw(Error)
    expect(() => readMojangson('[1, 2, 3b]')).to.throw(Error)
    // Unsupported nbt type suffix
    expect(() => readMojangson('[F; 1f, 2f]')).to.throw(Error)
  })
  it('read compound with unexpected trailing data should throw error', () => {
    expect(() => readMojangsonCompound('{foo:1b}unexpected')).to.throw(Error)
  })
  it('read all tag types', () => {
    const mojanson = `{
      byte: 1b,
      short: 1s,
      int: 1,
      long: 1L,
      float: 1.234f,
      double: 3.14159d,
      barr: [B; 1b],
      string: "hello",
      list: [1b],
      compound: {
        foo: 1b
      },
      iarr: [I; 1],
      larr: [L; 1L],
      doubleNoSuffix: 3.14159,
      t: true,
      f: false,
      invalidAlwaysString: abcd,
      "quotedKey": efg,
      escapeStr: "\\"hello\\""
    }`
    const tag = readMojangsonCompound(mojanson)
    expect(tag.byte).to.be.eq(1)
    expect(tag.short).to.be.eq(1)
    expect(tag.int).to.be.eq(1)
    expect(tag.long.eq(Long.fromValue(1))).to.be.true
    expect(tag.float).to.be.eq(1.234)
    expect(tag.double).to.be.eq(3.14159)
    expect(tag.barr).to.have.same.members([1])
    expect(tag.string).to.be.eq('hello')
    expect(tag.list).to.have.same.members([1])
    expect(tag.compound.foo).to.be.eq(1)
    expect(tag.iarr).to.have.same.members([1])
    expect(tag.larr[0].eq(Long.fromValue(1))).to.be.true
    expect(tag.doubleNoSuffix).to.be.eq(3.14159)
    expect(tag.t).to.be.eq(1) // true = 1
    expect(tag.f).to.be.eq(0) // false = 0
    expect(tag.invalidAlwaysString).to.be.eq('abcd')
    expect(tag.quotedKey).to.be.eq('efg')
    expect(tag.escapeStr).to.be.eq('"hello"')
    readMojangson(mojanson)
  })
})
