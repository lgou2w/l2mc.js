/* eslint-disable no-unused-vars */

import { Formatting } from './color'
import { ChatStyle } from './style'

/// Base component

export abstract class BaseComponent {
  style = ChatStyle.EMPTY
  siblings: BaseComponent[] = []

  setStyle (style: ChatStyle): this {
    this.style = style
    return this
  }

  fillStyle (style: ChatStyle): this {
    this.setStyle(style.withParent(this.style))
    return this
  }

  formatted (formatting: Formatting): this {
    this.setStyle(this.style.withFormatting(formatting))
    return this
  }

  styled (updater: (style: ChatStyle) => ChatStyle): this {
    this.setStyle(updater(this.style))
    return this
  }

  append (text: BaseComponent | string): this {
    if (typeof text === 'string') {
      text = new TextComponent(text)
    } else if (!(text instanceof BaseComponent)) {
      throw new Error(`Invalid text type: ${text}. (Expected: BaseComponent | string)`)
    }
    this.siblings.push(text)
    return this
  }

  equals (other: any): other is this {
    return other instanceof BaseComponent &&
      this.style.equals(other.style) &&
      compareSiblings(this.siblings, other.siblings)
  }
}

/// Text component

export class TextComponent extends BaseComponent {
  constructor (public text: string) {
    super()
  }

  equals (other: any): other is this {
    return super.equals(other) &&
      other instanceof TextComponent &&
      this.text === other.text
  }

  static EMPTY = new TextComponent('')
}

/// util

function compareSiblings (a: BaseComponent[], b: BaseComponent[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (!a[i].equals(b[i])) {
      return false
    }
  }
  return true
}
