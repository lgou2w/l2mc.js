/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import {
  NBTTypes,
  tagIntArray
} from '../src'

describe('@lgou2w/mcnbt - tagIntArray', () => {
  it('basic', () => {
    const tag = tagIntArray([1])
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_INT_ARRAY)
    expect(tag)
      .to.have.property(P_VALUE)
      .that.have.same.members([1])
      .with.lengthOf(1)
  })
  it('empty value or undefined, the value is empty array', () => {
    expect(tagIntArray())
      .to.have.property(P_VALUE)
      .that.is.empty
    expect(tagIntArray(undefined))
      .to.have.property(P_VALUE)
      .that.is.empty
  })
  it('illegal value then throw error', () => {
    expect(() => tagIntArray(null)).to.throw(Error)
    expect(() => tagIntArray(['1'])).to.throw(Error)
  })
})
