/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import { NBTTypes, tagLongArray } from '../src'
import * as Long from 'long'

describe('@lgou2w/mcnbt - tagLongArray', () => {
  it('basic', () => {
    const tag = tagLongArray([1, '2', Long.fromValue(3)])
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_LONG_ARRAY)
    expect(tag).to.have.property(P_VALUE).with.lengthOf(3)
    expect(tag.__value__[0].eq(Long.fromValue(1))).to.be.true
    expect(tag.__value__[1].eq(Long.fromValue(2))).to.be.true
    expect(tag.__value__[2].eq(Long.fromValue(3))).to.be.true
  })
  it('empty value or undefined, the value is empty array', () => {
    expect(tagLongArray())
      .to.have.property(P_VALUE)
      .that.is.empty
    expect(tagLongArray(undefined))
      .to.have.property(P_VALUE)
      .that.is.empty
  })
  it('illegal value then throw error', () => {
    expect(() => tagLongArray(null)).to.throw(Error)
    expect(() => tagLongArray([null])).to.throw(Error)
  })
})
