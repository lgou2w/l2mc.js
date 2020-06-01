/* eslint-disable no-unused-expressions */
// @ts-nocheck

import { expect } from 'chai'
import { P_TYPE, P_VALUE } from './constants'
import {
  NBTTypes,
  tagString,
  write
} from '../src'

describe('@lgou2w/mcnbt - tagString', () => {
  it('basic', () => {
    const tag = tagString('1')
    expect(tag).to.have.property(P_TYPE, NBTTypes.TAG_STRING)
    expect(tag)
      .to.have.property(P_VALUE)
      .to.be.eq('1')
  })
  it('empty value or undefined, the value is empty string', () => {
    expect(tagString())
      .to.have.property(P_VALUE)
      .that.is.empty
    expect(tagString(undefined))
      .to.have.property(P_VALUE)
      .that.is.empty
  })
  it('illegal value then throw error', () => {
    expect(() => tagString(null)).to.throw(Error)
    expect(() => tagString(1)).to.throw(Error)
  })
  it('write chinese character', () => {
    // Binary: [8, 0, 0, 0, 6, 228, 184, 173, 230, 150, 135]
    //
    // '中' : U+4E2D (HEX) = 20013 (DEC) = [228, 184, 173] (UTF-8 Bytes)
    // ((228 & 0x0F) << 12) | ((184 & 0x3F) << 6) | ((173 & 0x3F) << 0)
    // 16384 | 3584 | 45 = 20013 (DEC) = U+4E2D (HEX)
    //
    // '文' : U+6587 (HEX) = 25991 (DEC) = [230, 150, 135] (UTF-8 Bytes)
    // ((230 & 0x0F) << 12) | ((150 & 0x3F) << 6) | ((135 & 0x3F) << 0)
    // 24576 | 1408 | 7 = 25991 (DEC) = U+6587 (HEX)
    //
    const data = new Uint8Array(write(tagString('中文')))
    expect(data[0]).to.be.eq(8) // TAG_STRING
    expect(data[4]).to.be.eq(6) // 两个 UTF-8 字符可变长度为 6
    // '中'
    const z1 = data[5]; const z2 = data[6]; const z3 = data[7]
    const z = ((z1 & 0x0F) << 12) | ((z2 & 0x3F) << 6) | ((z3 & 0x3F) << 0)
    expect(z).to.be.eq(0x4E2D)
    // '文'
    const w1 = data[8]; const w2 = data[9]; const w3 = data[10]
    const w = ((w1 & 0x0F) << 12) | ((w2 & 0x3F) << 6) | ((w3 & 0x3F) << 0)
    expect(w).to.be.eq(0x6587)
  })
  it('write unicode length 2', () => {
    // Binary: [8, 0, 0, 0, 2, 194, 128]
    const data = new Uint8Array(write(tagString('\u0080')))
    expect(data).to.be.lengthOf(7)
    expect(data[4]).to.be.eq(2) // \u0080 > 0x007F & < 0x07FF, so length is 2
    const c1 = data[5]; const c2 = data[6]
    const c = ((c1 & 0x1F) << 6) | (c2 & 0x3F)
    expect(c).to.be.eq(0x0080)
  })
  it('write maximum UTF length of the string is 65535 because it is a short data type storage', () => {
    const arr: string[] = []
    for (let i = 0; i < 0xFFFF; i++) {
      arr.push('0')
    }
    const str = arr.join('')
    const data = new Uint8Array(write(tagString(str)))
    const l1 = data[3]
    const l2 = data[4]
    const len = ((l1 & 0xFF) << 8) | (l2 & 0xFF)
    expect(len).to.be.eq(0xFFFF)

    // because the maximum length is 65535
    const str2 = str + '0'
    expect(() => write(tagString(str2))).to.throw(Error)
  })
})
