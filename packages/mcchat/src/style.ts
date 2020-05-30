/* eslint-disable no-unused-vars */

import { Color, Formatting, ChatColor } from './color'
import { ChatClickEvent } from './click'
import { ChatHoverEvent } from './hover'

export class ChatStyle {
  static EMPTY = new ChatStyle()
  static DEFAULT_FONT = 'minecraft:default'

  // eslint-disable-next-line no-useless-constructor
  constructor (
    public color?: Color,
    public bold?: boolean,
    public italic?: boolean,
    public underlined?: boolean,
    public strikethrough?: boolean,
    public obfuscated?: boolean,
    public clickEvent?: ChatClickEvent,
    public hoverEvent?: ChatHoverEvent,
    public insertion?: string,
    public font?: string
  ) {
  }

  isBold () { return this.bold === true }
  isItalic () { return this.italic === true }
  isUnderlined () { return this.underlined === true }
  isStrikethrough () { return this.strikethrough === true }
  isObfuscated () { return this.obfuscated === true }
  isEmpty () { return this.equals(ChatStyle.EMPTY) }
  getFont () { return this.font || ChatStyle.DEFAULT_FONT }

  withColor (color?: Color): ChatStyle {
    return new ChatStyle(color, this.bold, this.italic, this.underlined, this.strikethrough, this.obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  withBold (bold?: boolean): ChatStyle {
    return new ChatStyle(this.color, bold, this.italic, this.underlined, this.strikethrough, this.obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  withItalic (italic?: boolean): ChatStyle {
    return new ChatStyle(this.color, this.bold, italic, this.underlined, this.strikethrough, this.obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  withUnderlined (underlined?: boolean): ChatStyle {
    return new ChatStyle(this.color, this.bold, this.italic, underlined, this.strikethrough, this.obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  withStrikethrough (strikethrough?: boolean): ChatStyle {
    return new ChatStyle(this.color, this.bold, this.italic, this.underlined, strikethrough, this.obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  withObfuscated (obfuscated?: boolean): ChatStyle {
    return new ChatStyle(this.color, this.bold, this.italic, this.underlined, this.strikethrough, obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  withClickEvent (clickEvent?: ChatClickEvent): ChatStyle {
    return new ChatStyle(this.color, this.bold, this.italic, this.underlined, this.strikethrough, this.obfuscated,
      clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  withHoverEvent (hoverEvent?: ChatHoverEvent): ChatStyle {
    return new ChatStyle(this.color, this.bold, this.italic, this.underlined, this.strikethrough, this.obfuscated,
      this.clickEvent, hoverEvent, this.insertion, this.font)
  }

  withInsertion (insertion?: string): ChatStyle {
    return new ChatStyle(this.color, this.bold, this.italic, this.underlined, this.strikethrough, this.obfuscated,
      this.clickEvent, this.hoverEvent, insertion, this.font)
  }

  withFont (font?: string): ChatStyle {
    return new ChatStyle(this.color, this.bold, this.italic, this.underlined, this.strikethrough, this.obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, font)
  }

  withFormatting (formatting: Formatting): ChatStyle {
    let color = this.color
    let bold = this.bold
    let italic = this.italic
    let underlined = this.underlined
    let strikethrough = this.strikethrough
    let obfuscated = this.obfuscated
    switch (formatting) {
      case ChatColor.BOLD:
        bold = true
        break
      case ChatColor.ITALIC:
        italic = true
        break
      case ChatColor.UNDERLINE:
        underlined = true
        break
      case ChatColor.STRIKETHROUGH:
        strikethrough = true
        break
      case ChatColor.OBFUSCATED:
        obfuscated = true
        break
      case ChatColor.RESET:
        return ChatStyle.EMPTY
      default:
        bold = italic = underlined = strikethrough = obfuscated = false
        color = formatting
        break
    }
    return new ChatStyle(color, bold, italic, underlined, strikethrough, obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  withParent (parent: ChatStyle): ChatStyle {
    return this.equals(ChatStyle.EMPTY)
      ? parent
      : parent.equals(ChatStyle.EMPTY)
        ? this
        : new ChatStyle(
          this.color || parent.color,
          this.bold || parent.bold,
          this.italic || parent.italic,
          this.underlined || parent.underlined,
          this.strikethrough || parent.strikethrough,
          this.obfuscated || parent.obfuscated,
          this.clickEvent || parent.clickEvent,
          this.hoverEvent || parent.hoverEvent,
          this.insertion || parent.insertion,
          this.font || parent.font
        )
  }

  copy (): ChatStyle {
    return new ChatStyle(this.color, this.bold, this.italic, this.underlined, this.strikethrough, this.obfuscated,
      this.clickEvent, this.hoverEvent, this.insertion, this.font)
  }

  equals (other: any): other is this {
    return other instanceof ChatStyle &&
      (this.color === undefined ? other.color === undefined : this.color.equals(other)) &&
      this.bold === other.bold &&
      this.italic === other.italic &&
      this.underlined === other.underlined &&
      this.strikethrough === other.strikethrough &&
      this.obfuscated === other.obfuscated &&
      (this.clickEvent === undefined ? other.clickEvent === undefined : this.clickEvent.equals(other.clickEvent)) &&
      (this.hoverEvent === undefined ? other.hoverEvent === undefined : this.hoverEvent.equals(other.hoverEvent)) &&
      this.insertion === other.insertion &&
      this.font === other.font
  }
}
