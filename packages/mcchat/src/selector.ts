import { BaseComponent } from './base'

export class SelectorComponent extends BaseComponent {
  constructor (public selector: string) {
    super()
  }

  equals (other: any): other is this {
    return super.equals(other) &&
      other instanceof SelectorComponent &&
      this.selector === other.selector
  }
}
