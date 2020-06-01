/* eslint-disable no-unused-vars */

import { BaseComponent, TextComponent } from './base'
import { Color, Formatting, ChatColor } from './color'
import { ChatClickEvent } from './click'
import { ChatHoverEvent } from './hover'

export class FancyMessage {
  protected siblings: BaseComponent[] = []
  protected get last () {
    return this.siblings[this.siblings.length - 1]
  }

  static of (text: string): FancyMessage {
    return new FancyMessage()
      .then(text)
  }

  then (sibling: string | BaseComponent): this {
    this.siblings.push(
      typeof sibling === 'string'
        ? new TextComponent(sibling)
        : sibling
    )
    return this
  }

  thenNewline (): this {
    this.then('\n')
    return this
  }

  color (color: Color | Formatting | string | number): this {
    if (typeof color === 'string' || typeof color === 'number') {
      color = ChatColor.parse(color)
    }
    this.last.style.color = color
    return this
  }

  withBold (bold?: boolean): this {
    this.last.style.bold = bold
    return this
  }

  withItalic (italic?: boolean): this {
    this.last.style.italic = italic
    return this
  }

  withUnderlined (underlined?: boolean): this {
    this.last.style.underlined = underlined
    return this
  }

  withStrikethrough (strikethrough?: boolean): this {
    this.last.style.strikethrough = strikethrough
    return this
  }

  withObfuscated (obfuscated?: boolean): this {
    this.last.style.obfuscated = obfuscated
    return this
  }

  withClickEvent (clickEvent?: ChatClickEvent): this {
    this.last.style.clickEvent = clickEvent
    return this
  }

  withHoverEvent (hoverEvent?: ChatHoverEvent): this {
    this.last.style.hoverEvent = hoverEvent
    return this
  }

  withInsertion (insertion?: string): this {
    this.last.style.insertion = insertion
    return this
  }

  withFont (font?: string): this {
    this.last.style.font = font
    return this
  }

  join (other: FancyMessage): this {
    this.siblings.push(...other.siblings)
    return this
  }

  clear (): this {
    this.siblings = []
    return this
  }

  build (): TextComponent {
    const component = new TextComponent('')
    component.siblings.push(...this.siblings)
    return component
  }
}
