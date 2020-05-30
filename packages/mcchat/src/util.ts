/* eslint-disable no-unused-vars */

import { BaseComponent, TextComponent } from './base'
import { ChatColor } from './color'
import { ChatStyle } from './style'

const CHAR_COLOR = '§'
const CHAR_NO_COLOR = '&'
const CHAR_CODES = '0123456789AaBbCcDdEeFfKkLlMmNnOoRr'
const STRIP_COLOR = /§[0-9A-FK-OR]/i

function toRaw0 (result: string[], component: BaseComponent, withoutColor: boolean) {
  if (withoutColor) {
    const style = component.style
    const color = style.color
    if (ChatColor.isFormatting(color)) {
      result.push(CHAR_COLOR + color.code)
    }
    if (style.isBold()) {
      result.push(CHAR_COLOR + ChatColor.BOLD.code)
    }
    if (style.isItalic()) {
      result.push(CHAR_COLOR + ChatColor.ITALIC.code)
    }
    if (style.isUnderlined()) {
      result.push(CHAR_COLOR + ChatColor.UNDERLINE.code)
    }
    if (style.isStrikethrough()) {
      result.push(CHAR_COLOR + ChatColor.STRIKETHROUGH.code)
    }
    if (style.isObfuscated()) {
      result.push(CHAR_COLOR + ChatColor.OBFUSCATED.code)
    }
  }

  if (component instanceof TextComponent) {
    result.push(component.text)
  }
  for (const sibling of component.siblings) {
    toRaw0(result, sibling, withoutColor)
  }
}

class RawMessage {
  private readonly raw: string
  private readonly regex = /(§[0-9A-FK-OR])/ig
  private current?: TextComponent
  private style = ChatStyle.EMPTY
  private index = 0
  constructor (raw: string) {
    this.raw = raw
  }

  private append (index: number) {
    if (index > this.index) {
      const text = this.raw.substring(this.index, index)
      const sibling = new TextComponent(text)
      sibling.setStyle(this.style)
      this.index = index
      this.style = this.style.copy()
      if (!this.current) {
        this.current = new TextComponent('')
      }
      this.current.append(sibling)
    }
  }

  get (): TextComponent {
    let array: RegExpExecArray | null
    while ((array = this.regex.exec(this.raw)) !== null) {
      this.append(array.index)
      const match = array[0]
      const color = ChatColor.parseSafely(match[1])
      if (ChatColor.RESET.equals(color)) {
        this.style = ChatStyle.EMPTY
      } else if (ChatColor.BOLD.equals(color)) {
        this.style = this.style.withBold(true)
      } else if (ChatColor.ITALIC.equals(color)) {
        this.style = this.style.withItalic(true)
      } else if (ChatColor.UNDERLINE.equals(color)) {
        this.style = this.style.withUnderlined(true)
      } else if (ChatColor.STRIKETHROUGH.equals(color)) {
        this.style = this.style.withStrikethrough(true)
      } else if (ChatColor.OBFUSCATED.equals(color)) {
        this.style = this.style.withObfuscated(true)
      } else {
        this.style = this.style.withColor(color)
      }
      this.index = this.regex.lastIndex
    }
    if (this.index < this.raw.length) {
      this.append(this.raw.length)
    }
    return this.current || new TextComponent('')
  }
}

// exports

export function stripColor (input: string): string {
  return input.replace(STRIP_COLOR, '')
}

export function toColor (input: string, altColorChar?: string): string {
  altColorChar = altColorChar || CHAR_NO_COLOR
  const chars = input.split('')
  const length = chars.length
  for (let i = 0; i < length; i++) {
    if (chars[i] === altColorChar && CHAR_CODES.indexOf(chars[i + 1]) > -1) {
      chars[i] = CHAR_COLOR
      chars[i + 1] = chars[i + 1].toLowerCase()
    }
  }
  return chars.join('')
}

export function toRaw (component: BaseComponent, withoutColor?: boolean): string {
  const result: string[] = []
  toRaw0(result, component, !!withoutColor)
  return result.join('')
}

export function fromRaw (raw: string, altColorChar?: string): TextComponent {
  const rawWithColor = toColor(raw, altColorChar)
  const rawMessage = new RawMessage(rawWithColor)
  return rawMessage.get()
}
