/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import {
  NBTTypes,
  tagInt
} from '../src'

describe('@lgou2w/mcnbt - tagInt', () => {
  it('basic', () => {
    const tag = tagInt(1)
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_INT)
    expect(tag).to.have.property(P_VALUE).to.be.eq(1)
  })
})
