import { expect } from 'chai'
import { encode, decode } from '../src/base64'

describe('@lgou2w/mcnbt - base64', () => {
  it('encode unsupported character should throw error', () => {
    expect(() => encode('中文')).to.throw(Error)
  })
  it('decode block ~ 1 should throw error', () => {
    expect(() => decode('a')).to.throw(Error)
    expect(() => decode('abcde')).to.throw(Error)
  })
})
