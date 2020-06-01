/* eslint-disable key-spacing, no-multi-spaces */

/// Type

export type Color = {
  readonly rgb: number
  equals (other: any): boolean
}

export type Formatting = Color & {
  readonly rgb?: number
  readonly name: string
  readonly code: string
  readonly modifier: boolean
}

/// Defined formatting

function define (
  rgb: number | undefined,
  name: string,
  code: string,
  modifier?: boolean
): Formatting {
  modifier = !!modifier
  return Object.defineProperties({}, {
    rgb: {
      value: rgb,
      enumerable: true,
      configurable: false,
      writable: false
    },
    name: {
      value: name,
      enumerable: true,
      configurable: false,
      writable: false
    },
    code: {
      value: code,
      enumerable: true,
      configurable: false,
      writable: false
    },
    modifier: {
      value: modifier,
      enumerable: true,
      configurable: false,
      writable: false
    },
    equals: {
      value: (other: any) => {
        return ChatColor.isFormatting(other) &&
          rgb === other.rgb &&
          name === other.name &&
          code === other.code &&
          modifier === other.modifier
      },
      enumerable: true,
      configurable: false,
      writable: false
    }
  })
}

export const ChatColor = {
  BLACK           : define(0x000000, 'black',         '0'),
  DARK_BLUE       : define(0x0AA000, 'dark_blue',     '1'),
  DARK_GREEN      : define(0x00AA00, 'dark_green',    '2'),
  DARK_AQUA       : define(0x00AAAA, 'dark_aqua',     '3'),
  DARK_RED        : define(0xAA0000, 'dark_red',      '4'),
  DARK_PURPLE     : define(0xAA00AA, 'dark_purple',   '5'),
  GOLD            : define(0xFFAA00, 'gold',          '6'),
  GRAY            : define(0xAAAAAA, 'gray',          '7'),
  DARK_GRAY       : define(0x555555, 'dark_gray',     '8'),
  BLUE            : define(0x5555FF, 'blue',          '9'),
  GREEN           : define(0x55FF55, 'green',         'a'),
  AQUA            : define(0x55FFFF, 'aqua',          'b'),
  RED             : define(0xFF5555, 'red',           'c'),
  LIGHT_PURPLE    : define(0xFF55FF, 'light_purple',  'd'),
  YELLOW          : define(0xFFFF55, 'yellow',        'e'),
  WHITE           : define(0xFFFFFF, 'white',         'f'),

  OBFUSCATED      : define(undefined, 'obfuscated',    'k', true),
  BOLD            : define(undefined, 'bold',          'l', true),
  STRIKETHROUGH   : define(undefined, 'strikethrough', 'm', true),
  UNDERLINE       : define(undefined, 'underline',     'n', true),
  ITALIC          : define(undefined, 'italic',        'o', true),

  RESET           : define(undefined, 'reset',         'r'),

  /// Object type

  isFormatting (obj: any): obj is Formatting {
    return typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      typeof obj.code === 'string' &&
      typeof obj.modifier === 'boolean' &&
      (typeof obj.rgb === 'number' || typeof obj.rgb === 'undefined')
  },

  /// Parse color

  parse (v: string | number): Formatting | Color | never {
    const color = typeof v === 'string' ? this.fromCode(v) || this.fromRGB(v) : this.fromRGB(v)
    if (!color) {
      throw new Error(`Invalid color value: ${v}`)
    } return color
  },
  parseSafely (v: string | number): Formatting | Color | undefined {
    try {
      return this.parse(v)
    } catch (e) {
      return undefined
    }
  },

  fromCode (code: string): Formatting | undefined {
    if (typeof code === 'string' && code.length > 0) {
      code = code.toLowerCase()
      for (const key in ChatColor) {
        // @ts-ignore
        const val = ChatColor[key]
        if (ChatColor.isFormatting(val) && (val.code === code || val.name === code)) {
          return val
        }
      }
    } return undefined
  },

  fromRGB (rgb: string | number): Color | never {
    if (typeof rgb !== 'number' && typeof rgb !== 'string') {
      throw new Error(`Invalid argument rgb: ${rgb}. (Expected: number | string)`)
    }
    if (typeof rgb === 'number' && rgb >> 24 !== 0) {
      throw new Error(`Invalid rgb value: ${rgb}`)
    }
    if (typeof rgb === 'string' && !/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(rgb)) {
      throw new Error(`Invalid rgb hex: ${rgb}`)
    }

    const value = typeof rgb === 'number' ? rgb : hexToRGB(rgb)
    return <Color> {
      rgb: value,
      equals (other: any): boolean {
        return typeof other === 'object' && other.rgb === this.rgb
      }
    }
  }
}

function hexCompletion (hex: string): string {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  } return hex
}

export function hexToRGB (hex: string): number {
  return parseInt(hexCompletion(hex), 16)
}

function componentToHex (c: number): string {
  const hex = c.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

export function rgbToHex (rgb: number): string {
  const r = (rgb >> 16) & 0xFF
  const g = (rgb >> 8) & 0xFF
  const b = rgb & 0xFF
  return '#' +
    componentToHex(r) +
    componentToHex(g) +
    componentToHex(b)
}

//
// RGB hex color is a feature of minecraft 1.16, this function can convert
// the color rgb that supports the old version to a unified color type name
//
// e.g.: #f55 | #ff5555 -> red
//

const RGB_FORMATTING_TABLE: { [key: number]: string } = {}

for (const key in ChatColor) {
  // @ts-ignore
  const val = ChatColor[key]
  if (typeof val === 'object' && val.rgb !== undefined) {
    RGB_FORMATTING_TABLE[val.rgb] = val.name
  }
}

export function friendlyColorRGB (rgb: number): string {
  return RGB_FORMATTING_TABLE[rgb] || rgbToHex(rgb)
}
