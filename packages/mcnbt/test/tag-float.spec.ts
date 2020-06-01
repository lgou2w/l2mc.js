/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import {
  NBTTypes,
  tagFloat
} from '../src'

describe('@lgou2w/mcnbt - tagFloat', () => {
  it('basic', () => {
    const tag = tagFloat(1)
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_FLOAT)
    expect(tag).to.have.property(P_VALUE).to.be.eq(1)
  })
})
