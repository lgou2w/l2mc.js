import { BaseComponent } from './base'

export abstract class NBTComponent extends BaseComponent {
  constructor (
    public nbt: string,
    public interpret?: boolean,
    public path?: string
  ) {
    super()
  }

  equals (other: any): other is this {
    return super.equals(other) &&
      other instanceof NBTComponent &&
      this.nbt === other.nbt &&
      this.interpret === other.interpret &&
      this.path === other.path
  }
}

export class BlockNBTComponent extends NBTComponent {}
export class EntityNBTComponent extends NBTComponent {}
export class StorageNBTComponent extends NBTComponent {}
