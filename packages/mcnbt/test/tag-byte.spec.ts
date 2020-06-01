/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import { NBTTypes, tagByte } from '../src'

describe('@lgou2w/mcnbt - tagByte', () => {
  it('basic', () => {
    const tag = tagByte(1)
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_BYTE)
    expect(tag)
      .to.have.property(P_VALUE)
      .that.is.eq(1)
  })
  it('empty value or undefined, the value is 0', () => {
    expect(tagByte())
      .to.have.property(P_VALUE)
      .that.is.eq(0)
    expect(tagByte(undefined))
      .to.have.property(P_VALUE)
      .that.is.eq(0)
  })
  it('illegal value then throw error', () => {
    expect(() => tagByte(null)).to.throw(Error)
    expect(() => tagByte('')).to.throw(Error)
  })
})
