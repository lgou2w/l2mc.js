/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import {
  NBTTypes,
  tagDouble
} from '../src'

describe('@lgou2w/mcnbt - tagDouble', () => {
  it('basic', () => {
    const tag = tagDouble(1)
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_DOUBLE)
    expect(tag).to.have.property(P_VALUE).to.be.eq(1)
  })
})
