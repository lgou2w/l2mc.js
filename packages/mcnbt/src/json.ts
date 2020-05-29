/* eslint-disable no-unused-vars */

import {
  NBT,
  NBTType,
  NBTTypes,
  NBTList,
  NBTCompound,
  tag,
  tagByte,
  tagShort,
  tagInt,
  tagLong,
  tagFloat,
  tagDouble,
  tagByteArray,
  tagString,
  tagList,
  tagCompound,
  tagIntArray,
  tagLongArray,
  resolve
} from './nbt'

/// Write Mojangson

function writeJsonValue (result: string[], nbt: NBT, color: boolean) {
  const type = nbt.__type__
  switch (type) {
    case NBTTypes.TAG_BYTE:
      result.push(color ? `§6${nbt.__value__}§cb§r` : `${nbt.__value__}b`)
      break
    case NBTTypes.TAG_SHORT:
      result.push(color ? `§6${nbt.__value__}§cs§r` : `${nbt.__value__}s`)
      break
    case NBTTypes.TAG_INT:
      result.push(color ? `§6${nbt.__value__}§r` : `${nbt.__value__}`)
      break
    case NBTTypes.TAG_LONG:
      result.push(color ? `§6${nbt.__value__.toString(10)}§cL§r` : `${nbt.__value__.toString(10)}L`)
      break
    case NBTTypes.TAG_FLOAT:
      result.push(color ? `§6${nbt.__value__}§cf§r` : `${nbt.__value__}f`)
      break
    case NBTTypes.TAG_DOUBLE:
      result.push(color ? `§6${nbt.__value__}§cd§r` : `${nbt.__value__}d`)
      break
    case NBTTypes.TAG_BYTE_ARRAY:
    case NBTTypes.TAG_INT_ARRAY:
    case NBTTypes.TAG_LONG_ARRAY:
      writeJsonArray(result, nbt, type, color)
      break
    case NBTTypes.TAG_STRING:
      result.push(color
        ? `"§a${nbt.__value__.replace(/"/g, '\\"')}§r"`
        : `"${nbt.__value__.replace(/"/g, '\\"')}"`)
      break
    case NBTTypes.TAG_LIST:
      writeJsonList(result, nbt, color)
      break
    case NBTTypes.TAG_COMPOUND:
      writeJsonCompound(result, nbt as NBTCompound, color)
      break
    default:
      throw new Error(`Unsupported nbt type id: ${type}`)
  }
}

function writeJsonArray (result: string[], nbt: NBT, type: NBTType, color: boolean) {
  result.push(color ? '[§c' : '[')
  const suffix = type === NBTTypes.TAG_BYTE_ARRAY
    ? 'B'
    : type === NBTTypes.TAG_INT_ARRAY
      ? ''
      : 'L'
  result.push(color ? `${suffix}§r;` : `${suffix};`)
  const values: (number | bigint)[] = nbt.__value__
  const len = values.length
  let i = 0
  for (const el of values) {
    if (i >= 1 && i < len) {
      result.push(color ? ', ' : ',')
    }
    const val = typeof el === 'bigint'
      ? el.toString(10)
      : el
    result.push(color ? `§6${val}§c${suffix}§r` : `${val}${suffix}`)
    i++
  }
  result.push(']')
}

function writeJsonList (result: string[], nbt: NBTList, color: boolean) {
  result.push('[')
  const elementType = nbt.__elementType__
  const values: any[] = nbt.__value__
  const len = values.length
  let i = 0
  for (const el of values) {
    const val = elementType !== undefined
      ? tag(elementType, el)
      : el
    if (i >= 1 && i < len) {
      result.push(color ? ', ' : ',')
    }
    writeJsonValue(result, val, color)
    i++
  }
  result.push(']')
}

function writeJsonCompound (result: string[], nbt: NBTCompound, color: boolean) {
  result.push('{')
  const values = nbt.__value__
  for (const key in values) {
    const val: NBT = values[key]
    result.push(color ? `"§b${key}§r": ` : `"${key}":`)
    writeJsonValue(result, val, color)
    result.push(color ? ', ' : ',')
  }
  const last = result.pop()
  if (last && last.trim() !== ',') {
    result.push(last)
  }
  result.push('}')
}

export function writeMojangson (nbt: NBT, color?: boolean): string {
  const result: string[] = []
  writeJsonValue(result, nbt, !!color)
  return result.join('')
}

/// Read Mojangson

class StringReader {
  private static SYNTAX_ESCAPE = '\\'
  private static SYNTAX_DOUBLE_QUOTE = '"'
  private static SYNTAX_SINGLE_QUOTE = '\''
  private static WHITESPACE_PATTERN = /\s/

  private static isQuotedStringStart = (c: string) =>
    c === StringReader.SYNTAX_DOUBLE_QUOTE ||
    c === StringReader.SYNTAX_SINGLE_QUOTE

  private static isAllowedInUnquotedString = (c: string) =>
    (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ||
    c === '_' || c === '-' || c === '.' || c === '+'

  private readonly str: string
  cursor = 0

  constructor (str: string) {
    this.str = str
  }

  canRead (length: number = 1): boolean {
    return this.cursor + length <= this.str.length
  }

  peek (offset?: number): string {
    offset = offset || 0
    return this.str.charAt(this.cursor + offset)
  }

  read (): string {
    return this.str[this.cursor++]
  }

  skip () {
    this.cursor++
  }

  skipWhitespace () {
    while (this.canRead() && StringReader.WHITESPACE_PATTERN.test(this.peek())) {
      this.skip()
    }
  }

  readUnquotedString (): string {
    const start = this.cursor
    while (this.canRead() && StringReader.isAllowedInUnquotedString(this.peek())) {
      this.skip()
    }
    return this.str.substring(start, this.cursor)
  }

  readQuotedString (): string {
    if (!this.canRead()) {
      return ''
    }
    const next = this.peek()
    if (!StringReader.isQuotedStringStart(next)) {
      throw new Error('Expected quote to start a string')
    }
    this.skip()
    return this.readStringUntil(next)
  }

  readStringUntil (terminator: string): string {
    const result: string[] = []
    let escaped = false
    while (this.canRead()) {
      const c = this.read()
      if (escaped) {
        if (c === terminator || c === StringReader.SYNTAX_ESCAPE) {
          result.push(c)
          escaped = false
        } else {
          this.cursor -= 1
          throw new Error(`Invalid escape sequence '${c}' in quoted string`)
        }
      } else if (c === StringReader.SYNTAX_ESCAPE) {
        escaped = true
      } else if (c === terminator) {
        return result.join('')
      } else {
        result.push(c)
      }
    }
    throw new Error('Unclosed quoted string')
  }

  readString (): string {
    if (!this.canRead()) {
      return ''
    }
    const next = this.peek()
    if (StringReader.isQuotedStringStart(next)) {
      this.skip()
      return this.readStringUntil(next)
    }
    return this.readUnquotedString()
  }

  expect (c: string) {
    if (!this.canRead() || this.peek() !== c) {
      throw new Error(`Expected '${c}'`)
    }
    this.skip()
  }
}

class MojangsonParser {
  private static DOUBLE_PATTERN_NOSUFFIX = /^[-+]?(?:[0-9]+[.]|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?$/i
  private static DOUBLE_PATTERN = /^[-+]?(?:[0-9]+[.]|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?d$/i
  private static FLOAT_PATTERN = /^[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?f$/i
  private static BYTE_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)b$/i
  private static LONG_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)l$/i
  private static SHORT_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)s$/i
  private static INT_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)$/

  private readonly reader: StringReader
  constructor (reader: StringReader) {
    this.reader = reader
  }

  readSingleStruct (): NBT {
    const compound = this.readStruct()
    this.reader.skipWhitespace()
    if (this.reader.canRead()) {
      throw new Error('Unexpected trailing data')
    }
    return compound
  }

  readValue (): NBT {
    this.reader.skipWhitespace()
    if (!this.reader.canRead()) {
      throw new Error('Expected value')
    }
    switch (this.reader.peek()) {
      case '{': return this.readStruct()
      case '[': return this.readList()
      default: return this.readTypedValue()
    }
  }

  private readKey (): string {
    this.reader.skipWhitespace()
    if (!this.reader.canRead()) {
      throw new Error('Expected key')
    }
    return this.reader.readString()
  }

  private readTypedValue (): NBT {
    this.reader.skipWhitespace()
    const start = this.reader.cursor
    if (this.reader.peek() === '"') {
      return tagString(this.reader.readQuotedString())
    } else {
      const str = this.reader.readUnquotedString()
      if (str.length <= 0) {
        this.reader.cursor = start
        throw new Error('Expected value')
      }
      return this.type(str)
    }
  }

  private type (str: string): NBT {
    if (MojangsonParser.FLOAT_PATTERN.test(str)) {
      return tagFloat(parseFloat(str.substring(0, str.length - 1)))
    }
    if (MojangsonParser.BYTE_PATTERN.test(str)) {
      return tagByte(parseInt(str.substring(0, str.length - 1)))
    }
    if (MojangsonParser.LONG_PATTERN.test(str)) {
      return tagLong(BigInt(str.substring(0, str.length - 1)))
    }
    if (MojangsonParser.SHORT_PATTERN.test(str)) {
      return tagShort(parseInt(str.substring(0, str.length - 1)))
    }
    if (MojangsonParser.INT_PATTERN.test(str)) {
      return tagInt(parseInt(str))
    }
    if (MojangsonParser.DOUBLE_PATTERN.test(str)) {
      return tagDouble(parseFloat(str.substring(0, str.length - 1)))
    }
    if (MojangsonParser.DOUBLE_PATTERN_NOSUFFIX.test(str)) {
      return tagDouble(parseFloat(str))
    }
    if (str === 'true') {
      return tagByte(1)
    }
    if (str === 'false') {
      return tagByte(0)
    }
    return tagString(str)
  }

  private readList (): NBT {
    if (this.reader.canRead(3) && this.reader.peek(1) !== '"' && this.reader.peek(2) === ';') {
      return this.readArrayTag()
    } else {
      return this.readListTag()
    }
  }

  private readStruct (): NBT {
    this.expect('{')
    const compound = tagCompound()
    this.reader.skipWhitespace()
    while (this.reader.canRead() && this.reader.peek() !== '}') {
      const start = this.reader.cursor
      const key = this.readKey()
      if (key.length <= 0) {
        this.reader.cursor = start
        throw new Error('Expected key')
      }
      this.expect(':')
      compound.__value__[key] = this.readValue()
      if (!this.hasElementSeparator()) {
        break
      }
      if (!this.reader.canRead()) {
        throw new Error('Expected key')
      }
    }
    this.expect('}')
    return compound
  }

  private readListTag (): NBT {
    this.expect('[')
    this.reader.skipWhitespace()
    if (!this.reader.canRead()) {
      throw new Error('Expected value')
    }
    const elements: any[] = []
    let elementType = NBTTypes.TAG_END
    while (this.reader.peek() !== ']') {
      const start = this.reader.cursor
      const element = this.readValue()
      if (elementType === NBTTypes.TAG_END) {
        elementType = element.__type__
      } else if (element.__type__ !== elementType) {
        this.reader.cursor = start
        throw new Error(`Can't insert ${element.__type__} into list of ${elementType}`)
      }
      elements.push(element)
      if (!this.hasElementSeparator()) {
        break
      }
      if (!this.reader.canRead()) {
        throw new Error('Expected value')
      }
    }
    this.expect(']')
    return tagList(elements)
  }

  private readArrayTag (): NBT {
    this.expect('[')
    const start = this.reader.cursor
    const c = this.reader.read()
    this.reader.read()
    this.reader.skipWhitespace()
    if (!this.reader.canRead()) {
      throw new Error('Expected value')
    }
    switch (c) {
      case 'B':
        return tagByteArray(this.readArray(NBTTypes.TAG_BYTE_ARRAY, NBTTypes.TAG_BYTE))
      case 'I':
        return tagIntArray(this.readArray(NBTTypes.TAG_INT_ARRAY, NBTTypes.TAG_INT))
      case 'L':
        return tagLongArray(this.readArray(NBTTypes.TAG_LONG_ARRAY, NBTTypes.TAG_LONG))
      default:
        this.reader.cursor = start
        throw new Error(`Invalid array type '${c}'`)
    }
  }

  private readArray (arrayType: NBTType, elementType: NBTType): number[] {
    const array: number[] = []
    while (true) {
      if (this.reader.peek() !== ']') {
        const start = this.reader.cursor
        const value = this.readValue()
        if (value.__type__ !== elementType) {
          this.reader.cursor = start
          throw new Error(`Can't insert ${value.__type__} into ${arrayType}`)
        }
        array.push(value.__value__)
        if (this.hasElementSeparator()) {
          if (!this.reader.canRead()) {
            throw new Error('Expected value')
          }
          continue
        }
      }
      this.expect(']')
      return array
    }
  };

  private hasElementSeparator (): boolean {
    this.reader.skipWhitespace()
    if (this.reader.canRead() && this.reader.peek() === ',') {
      this.reader.skip()
      this.reader.skipWhitespace()
      return true
    } else {
      return false
    }
  }

  private expect (expected: string) {
    this.reader.skipWhitespace()
    this.reader.expect(expected)
  }
}

export function readMojangson (mojangsonWithoutColor: string): NBT {
  const reader = new StringReader(mojangsonWithoutColor)
  const parser = new MojangsonParser(reader)
  const tag = parser.readValue()
  return resolve(tag)
}

export function readMojangsonCompound (mojangsonWithoutColor: string): NBTCompound {
  const reader = new StringReader(mojangsonWithoutColor)
  const parser = new MojangsonParser(reader)
  const compound = parser.readSingleStruct() as NBTCompound
  return resolve(compound)
}
