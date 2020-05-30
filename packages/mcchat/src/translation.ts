import { BaseComponent } from './base'

export class TranslationComponent extends BaseComponent {
  constructor (
    public key: string,
    public args: any[]
  ) {
    super()
  }

  equals (other: any): other is this {
    return super.equals(other) &&
      other instanceof TranslationComponent &&
      this.key === other.key &&
      compareArgs(this.args, other.args)
  }
}

function compareArgs (a: any[], b: any[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if ((a instanceof BaseComponent && !a.equals(b)) || a !== b) {
      return false
    }
  }
  return true
}
