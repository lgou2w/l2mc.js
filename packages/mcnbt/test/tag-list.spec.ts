/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE, P_ELEMENT, dataArray } from './constants'
import {
  NBTTypes,
  tagList,
  tagByte,
  tagInt,
  tagCompound,
  write
} from '../src'

describe('@lgou2w/mcnbt - tagList', () => {
  it('basic', () => {
    const tag = tagList()
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_LIST)
    expect(tag)
      .to.have.property(P_VALUE)
      .that.is.empty
  })
  it('illegal value then throw error', () => {
    expect(() => tagList(null)).to.throw(Error)
    expect(() => tagList('')).to.throw(Error)
  })
  it('if any element is not tag should throw error', () => {
    expect(() => tagList([tagByte(1), 2, 3]))
      .to.throw(Error)
  })
  it('if element has multiple tag types should throw error', () => {
    expect(() => tagList([tagByte(1), tagInt(2), tagByte(3)]))
      .to.throw(Error)
  })
  it('write tagList compounds', () => {
    const tag = tagList([tagCompound({ foo: tagByte(1) })])
    // only defined if the element type is not TAG_COMPOUND
    expect(tag).to.not.have.property(P_ELEMENT)
    // Binary: [9, 0, 0, 10, 0, 0, 0, 1, 1, 0, 3, 102, 111, 111, 1, 0]
    const data = write(tag)
    expect(dataArray(data))
      .to.be.same.members([9, 0, 0, 10, 0, 0, 0, 1, 1, 0, 3, 102, 111, 111, 1, 0])
      .that.with.lengthOf(16)
  })
  it('write tagList bytes', () => {
    const tag = tagList([tagByte(1), tagByte(2)])
    expect(tag)
      .to.have.property(P_ELEMENT)
      .that.is.eq(NBTTypes.TAG_BYTE)
    // Binary: [9, 0, 0, 1, 0, 0, 0, 2, 1, 2]
    const data = write(tag)
    expect(dataArray(data))
      .to.be.same.members([9, 0, 0, 1, 0, 0, 0, 2, 1, 2])
      .that.with.lengthOf(10)
  })
})
