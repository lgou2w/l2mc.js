/* eslint-disable no-unused-vars */

import { BaseComponent } from './base'

/// Hover event

export class ChatHoverEvent {
  // eslint-disable-next-line no-useless-constructor
  constructor (
    readonly action: string,
    readonly value: BaseComponent | string
  ) {
  }

  equals (other: any): other is this {
    return other instanceof ChatHoverEvent &&
      this.action === other.action &&
      (this.value instanceof BaseComponent
        ? this.value.equals(other.value)
        : this.value === other.value)
  }

  static Action = {
    SHOW_TEXT: 'show_text',
    SHOW_ITEM: 'show_item',
    SHOW_ENTITY: 'show_entity',
    /**
     * @deprecated 1.11.x and Before
     */
    SHOW_ACHIEVEMENT: 'show_achievement'
  }
}
