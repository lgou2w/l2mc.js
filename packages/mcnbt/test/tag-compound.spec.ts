/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import {
  NBTTypes,
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
} from '../src'
import * as Long from 'long'

describe('@lgou2w/mcnbt - tagCompound', () => {
  it('basic', () => {
    const tag = tagCompound()
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_COMPOUND)
    expect(tag)
      .to.have.property(P_VALUE)
      .that.is.empty
  })
  it('nested compound', () => {
    const tag = tagCompound({
      foo: tagByte(1),
      bar: tagLong(2),
      display: tagCompound({
        name: tagString('HelloWorld')
      })
    })
    expect(tag).to.have.property('foo').that.is.eq(1)
    expect(tag).to.have.property('bar')
    expect(tag.bar.eq(Long.fromValue(2)))
    expect(tag)
      .to.have.property('display')
      .that.have.property('name')
      .that.is.eq('HelloWorld')
  })
  describe('all child tag type', () => {
    const tag = tagCompound({
      byte: tagByte(1),
      short: tagShort(2),
      int: tagInt(3),
      long: tagLong(4),
      float: tagFloat(1.234),
      double: tagDouble(3.14159),
      barray: tagByteArray([1]),
      string: tagString('string'),
      list: tagList([tagCompound({ foo: tagByte(1) })]),
      compound: tagCompound({ foo: tagByte(1) }),
      iarray: tagIntArray([2]),
      larray: tagLongArray([3])
    })
    it('validation', () => {
      expect(tag.byte).to.be.eq(1)
      expect(tag.short).to.be.eq(2)
      expect(tag.int).to.be.eq(3)
      expect(tag.long.eq(Long.fromValue(4))).to.be.true
      expect(tag.float).to.be.eq(1.234)
      expect(tag.double).to.be.eq(3.14159)
      expect(tag.barray).to.have.same.members([1]).with.lengthOf(1)
      expect(tag.string).to.be.eq('string')
      expect(tag.list[0].foo).to.be.eq(1)
      expect(tag.compound.foo).to.be.eq(1)
      expect(tag.iarray).to.have.same.members([2]).with.lengthOf(1)
      expect(tag.larray).with.lengthOf(1)
      expect(tag.larray[0].eq(Long.fromValue(3))).to.be.true
    })
    it('change value', () => {
      tag.byte = 1
      tag.short = 1
      tag.int = 1
      tag.long = 1
      tag.float = 1
      tag.double = 1
      tag.barray = [1]
      tag.string = '1'
      tag.list = [tagByte(1)]
      tag.compound = { foo: tagByte(1) }
      tag.iarray = [1]
      tag.larray = [1]
    })
    it('change invalid value should throw error', () => {
      expect(() => (tag.byte = '')).to.throw(Error)
      expect(() => (tag.short = '')).to.throw(Error)
      expect(() => (tag.int = '')).to.throw(Error)
      expect(() => (tag.long = [])).to.throw(Error)
      expect(() => (tag.float = '')).to.throw(Error)
      expect(() => (tag.double = '')).to.throw(Error)
    })
  })
  it('illegal value then throw error', () => {
    expect(() => tagCompound(null)).to.throw(Error)
    expect(() => tagCompound('1')).to.throw(Error)
  })
  it('if there is an invalid attribute and it is not deleted should throw error', () => {
    expect(() => tagCompound({ foo: 1 }, false))
      .to.throw(Error)
  })
  it('if there is an invalid attribute and delete is true should deleted', () => {
    expect(tagCompound({ foo: 1 }, true))
      .to.not.have.property('foo')
  })
})
