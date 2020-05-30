import { BaseComponent } from './base'

export class KeybindComponent extends BaseComponent {
  constructor (public key: string) {
    super()
  }

  equals (other: any): other is this {
    return super.equals(other) &&
      other instanceof KeybindComponent &&
      this.key === other.key
  }
}
