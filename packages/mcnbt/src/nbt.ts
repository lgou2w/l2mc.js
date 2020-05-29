/// NBT Types

export type NBTType =
  0x0 | 0x1 | 0x2 | 0x3 | 0x4 | 0x5 | 0x6 |
  0x7 | 0x8 | 0x9 | 0xA | 0xB | 0xC

export const NBTTypes = {
  TAG_END: 0x0 as NBTType,
  TAG_BYTE: 0x1 as NBTType,
  TAG_SHORT: 0x2 as NBTType,
  TAG_INT: 0x3 as NBTType,
  TAG_LONG: 0x4 as NBTType,
  TAG_FLOAT: 0x5 as NBTType,
  TAG_DOUBLE: 0x6 as NBTType,
  TAG_BYTE_ARRAY: 0x7 as NBTType,
  TAG_STRING: 0x8 as NBTType,
  TAG_LIST: 0x9 as NBTType,
  TAG_COMPOUND: 0xA as NBTType,
  TAG_INT_ARRAY: 0xB as NBTType,
  TAG_LONG_ARRAY: 0xC as NBTType
}

/// NBT

export type NBT<T = any> = {
  __value__: T
  readonly __type__: NBTType
  readonly __nbt__: true
}

export type NBTList = NBT<any[]> & {
  // only defined if the element type is not TAG_COMPOUND
  readonly __elementType__?: NBTType
}

export type NBTCompound = NBT<{ [key: string]: NBT }> & {
  [key: string]: any
}

export type NBTMetadata = {
  readonly type: NBTType
  readonly name: string
}

export function isNBT (obj: any): obj is NBT {
  return typeof obj === 'object' &&
    obj.__type__ >= NBTTypes.TAG_END &&
    obj.__type__ <= NBTTypes.TAG_LONG_ARRAY &&
    typeof obj.__value__ !== 'undefined' &&
    typeof obj.__nbt__ === 'boolean' &&
    obj.__nbt__
}

/// NBT Tags

export function tag (type: NBTType, value: any): NBT {
  return Object.defineProperties({}, {
    __value__: {
      value,
      writable: true,
      configurable: true,
      enumerable: true
    },
    __type__: {
      value: type,
      writable: false,
      configurable: false,
      enumerable: true
    },
    __nbt__: {
      value: true,
      writable: false,
      configurable: false,
      enumerable: true
    }
  }) as NBT
}

/// Tag Validation

function checkNumber (value?: any): number | never {
  if (typeof value === 'number' || typeof value === 'undefined') {
    return value || 0
  } throw new Error(`Invalid tagNumber value: ${value}. (Expected: number)`)
}

function tagNumber (type: NBTType, value?: any): NBT<number> | never {
  value = checkNumber(value)
  return tag(type, value)
}

export function tagByte (value?: number) {
  return tagNumber(NBTTypes.TAG_BYTE, value)
}

export function tagShort (value?: number) {
  return tagNumber(NBTTypes.TAG_SHORT, value)
}

export function tagInt (value?: number) {
  return tagNumber(NBTTypes.TAG_INT, value)
}

export function tagLong (value?: number | string | bigint): NBT<bigint> {
  if (typeof value === 'undefined') {
    value = BigInt(0)
  }
  if (typeof value === 'number' || typeof value === 'string') {
    value = BigInt(value)
  } else if (typeof value !== 'bigint') {
    throw new Error(`Invalid tag long value: ${value}. (Expected: number | string | bigint)`)
  }
  return tag(NBTTypes.TAG_LONG, value)
}

export function tagFloat (value?: number) {
  return tagNumber(NBTTypes.TAG_FLOAT, value)
}

export function tagDouble (value?: number) {
  return tagNumber(NBTTypes.TAG_DOUBLE, value)
}

export function tagByteArray (value?: number[]): NBT<number[]> {
  if (typeof value === 'undefined') {
    value = []
  }
  if (!(value instanceof Array)) {
    throw new Error(`Invalid tagByteArray value: ${value} (Expected: number Array)`)
  }
  for (const el of value) {
    if (typeof el !== 'number') {
      throw new Error(`Invalid tagByteArray value: ${el}. (Expected: number Array)`)
    }
  }
  return tag(NBTTypes.TAG_BYTE_ARRAY, value)
}

export function tagString (value?: string): NBT<string> {
  if (typeof value === 'undefined') {
    value = ''
  }
  if (typeof value !== 'string') {
    throw new Error(`Invalid tagString value: ${value}. (Expected: string)`)
  }
  return tag(NBTTypes.TAG_STRING, value)
}

export function tagList (value?: NBT[]): NBTList {
  if (typeof value === 'undefined') {
    value = []
  }
  if (!(value instanceof Array)) {
    throw new Error(`Invalid tagList value type: '${value}' (Expected: NBT Array)`)
  }
  let elementType: NBTType = NBTTypes.TAG_END
  for (const el of value) {
    if (!isNBT(el)) {
      throw new Error(`NBTList elements must be of type NBT: ${el}`)
    }
    if (elementType === NBTTypes.TAG_END) {
      elementType = el.__type__
    } else if (el.__type__ !== elementType) {
      throw new Error(`Invalid element '${el}' type: ${el.__type__}. (Expected: ${elementType})`)
    }
  }
  if (elementType === NBTTypes.TAG_COMPOUND) {
    const nbt = tag(NBTTypes.TAG_LIST, value)
    return resolve(nbt)
  } else {
    // Defined pure list elements
    const result: any[] = []
    for (const el of value) {
      result.push(el.__value__)
    }
    const nbt = tag(NBTTypes.TAG_LIST, result)
    return Object.defineProperties(nbt, {
      __elementType__: {
        value: elementType,
        writable: false,
        configurable: false,
        enumerable: true
      }
    })
  }
}

export function tagCompound (
  value?: { [key: string]: NBT },
  deleteNotNBT?: boolean
): NBTCompound {
  if (typeof value === 'undefined') {
    value = {}
  }
  if (value === null || typeof value !== 'object') {
    throw new Error(`Invalid tagCompound value type: '${value}' (Expected: { [key: string}: NBT })`)
  }
  for (const key in value) {
    const val = value[key]
    if (!isNBT(val)) {
      if (deleteNotNBT === true) {
        delete value[key]
      } else {
        throw new Error(`Invalid compound entry: key = ${key}, value = ${val}`)
      }
    }
  }
  const nbt = tag(NBTTypes.TAG_COMPOUND, value)
  return resolve(nbt) as NBTCompound
}

export function tagIntArray (value?: number[]): NBT<number[]> {
  if (typeof value === 'undefined') {
    value = []
  }
  if (!(value instanceof Array)) {
    throw new Error(`Invalid tagIntArray value: ${value} (Expected: number Array)`)
  }
  for (const el of value) {
    if (typeof el !== 'number') {
      throw new Error(`Invalid tagIntArray value: ${el}. (Expected: number Array)`)
    }
  }
  return tag(NBTTypes.TAG_INT_ARRAY, value)
}

export function tagLongArray (value?: (number | string | bigint)[]): NBT<bigint[]> {
  if (typeof value === 'undefined') {
    value = []
  }
  if (!(value instanceof Array)) {
    throw new Error(`Invalid tagLongArray value: ${value} (Expected: (number | string | bigint) of Array)`)
  }
  const result: bigint[] = []
  for (let el of value) {
    if (typeof el === 'number' || typeof el === 'string') {
      el = BigInt(el)
    } else if (typeof el !== 'bigint') {
      throw new Error(`Invalid tagLongArray value: ${el}. (Expected: (number | string | bigint) of Array)`)
    }
    result.push(el)
  }
  return tag(NBTTypes.TAG_LONG_ARRAY, result)
}

export function resolve (nbt: NBT): NBT {
  if (nbt.__type__ === NBTTypes.TAG_LIST) {
    for (const el of nbt.__value__) {
      if (el.__type__ === NBTTypes.TAG_LIST ||
        el.__type__ === NBTTypes.TAG_COMPOUND) {
        resolve(el)
      }
    }
  } else if (nbt.__type__ === NBTTypes.TAG_COMPOUND) {
    const values: { [key: string]: NBT } = nbt.__value__
    for (const key in values) {
      const val = values[key] as NBT
      Object.defineProperty(nbt, key, {
        configurable: true,
        enumerable: true,
        get (): any {
          return val.__type__ === NBTTypes.TAG_COMPOUND
            ? val
            : val.__value__
        },
        set (newVal: any) {
          const type = val.__type__
          switch (type) {
            case NBTTypes.TAG_BYTE:
            case NBTTypes.TAG_SHORT:
            case NBTTypes.TAG_INT:
            case NBTTypes.TAG_FLOAT:
            case NBTTypes.TAG_DOUBLE:
              val.__value__ = tagNumber(type, newVal).__value__
              break
            case NBTTypes.TAG_LONG:
              val.__value__ = tagLong(newVal).__value__
              break
            case NBTTypes.TAG_BYTE_ARRAY:
              val.__value__ = tagByteArray(newVal).__value__
              break
            case NBTTypes.TAG_STRING:
              val.__value__ = tagString(newVal).__value__
              break
            case NBTTypes.TAG_LIST:
              val.__value__ = tagList(newVal).__value__
              break
            case NBTTypes.TAG_COMPOUND:
              val.__value__ = tagCompound(newVal).__value__
              break
            case NBTTypes.TAG_INT_ARRAY:
              val.__value__ = tagIntArray(newVal).__value__
              break
            case NBTTypes.TAG_LONG_ARRAY:
              val.__value__ = tagLongArray(newVal).__value__
              break
            default:
              throw new Error(`Illegal state: unsupported nbt value type: ${type} of key '${key}'.`)
          }
        }
      })
      if (val.__type__ === NBTTypes.TAG_LIST ||
        val.__type__ === NBTTypes.TAG_COMPOUND) {
        resolve(val)
      }
    }
  }
  return nbt
}
