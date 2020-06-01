/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import { NBTTypes, tagByteArray } from '../src'

describe('@lgou2w/mcnbt - tagByteArray', () => {
  it('basic', () => {
    const tag = tagByteArray([1])
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_BYTE_ARRAY)
    expect(tag)
      .to.have.property(P_VALUE)
      .that.have.same.members([1])
      .with.lengthOf(1)
  })
  it('empty value or undefined, the value is empty array', () => {
    expect(tagByteArray())
      .to.have.property(P_VALUE)
      .that.is.empty
    expect(tagByteArray(undefined))
      .to.have.property(P_VALUE)
      .that.is.empty
  })
  it('illegal value then throw error', () => {
    expect(() => tagByteArray(null)).to.throw(Error)
    expect(() => tagByteArray(['1'])).to.throw(Error)
  })
})
