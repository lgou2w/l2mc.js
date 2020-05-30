import { BaseComponent } from './base'

export class ScoreComponent extends BaseComponent {
  constructor (
    public name: string,
    public objective: string,
    public value?: string
  ) {
    super()
  }

  equals (other: any): other is this {
    return super.equals(other) &&
      other instanceof ScoreComponent &&
      this.name === other.name &&
      this.objective === other.objective &&
      this.value === other.value
  }
}
