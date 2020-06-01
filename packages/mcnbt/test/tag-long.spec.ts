/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import { NBTTypes, tagLong } from '../src'
import * as Long from 'long'

describe('@lgou2w/mcnbt - tagLong', () => {
  it('basic', () => {
    const tag = tagLong(1)
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_LONG)
    expect(tag).to.have.property(P_VALUE)
    expect(tag.__value__.eq(Long.fromValue(1))).to.be.true
  })
  it('empty value or undefined, the value is 0', () => {
    expect(tagLong()).to.have.property(P_VALUE)
    expect(tagLong().__value__.eq(Long.ZERO)).to.be.true
    expect(tagLong(undefined)).to.have.property(P_VALUE)
    expect(tagLong(undefined).__value__.eq(Long.ZERO)).to.be.true
  })
  it('illegal value then throw error', () => {
    expect(() => tagLong(null)).to.throw(Error)
    expect(() => tagLong([])).to.throw(Error)
  })
})
