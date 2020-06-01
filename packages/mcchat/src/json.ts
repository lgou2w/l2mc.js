/* eslint-disable no-unused-vars */

import { ChatStyle } from './style'
import { ChatClickEvent } from './click'
import { ChatHoverEvent } from './hover'
import { ChatColor, friendlyColorRGB } from './color'
import { Style, Component } from './type'
import { BaseComponent, TextComponent } from './base'
import { TranslationComponent } from './translation'
import { SelectorComponent } from './selector'
import { KeybindComponent } from './keybind'
import { ScoreComponent } from './score'
import {
  NBTComponent,
  BlockNBTComponent,
  EntityNBTComponent,
  StorageNBTComponent
} from './nbt'

/// Style serializer & deserializer

function styleSerializer (style: ChatStyle): Style | undefined {
  if (style.isEmpty()) {
    return undefined
  }
  const value = <Style> {}
  if (style.color) {
    value.color = ChatColor.isFormatting(style.color)
      ? style.color.name
      : friendlyColorRGB(style.color.rgb)
  }
  if (style.bold !== undefined) {
    value.bold = style.bold
  }
  if (style.italic !== undefined) {
    value.italic = style.italic
  }
  if (style.underlined !== undefined) {
    value.underlined = style.underlined
  }
  if (style.strikethrough !== undefined) {
    value.strikethrough = style.strikethrough
  }
  if (style.obfuscated !== undefined) {
    value.obfuscated = style.obfuscated
  }
  if (style.insertion !== undefined) {
    value.insertion = style.insertion
  }
  if (style.clickEvent) {
    value.clickEvent = {
      // @ts-ignore
      action: style.clickEvent.action,
      value: style.clickEvent.value
    }
  }
  if (style.hoverEvent) {
    // Use the old value format, not the contents format
    value.hoverEvent = {
      // @ts-ignore
      action: style.hoverEvent.action,
      value: style.hoverEvent.value instanceof BaseComponent
        ? toJson(style.hoverEvent.value)
        : style.hoverEvent.value
    }
  }
  if (style.font !== undefined) {
    value.font = style.font
  }
  return value
}

function styleDeserializer (style: Style): ChatStyle | undefined {
  if (typeof style !== 'object') {
    return undefined
  }
  const bold = typeof style.bold === 'boolean' ? style.bold : undefined
  const italic = typeof style.italic === 'boolean' ? style.italic : undefined
  const underlined = typeof style.underlined === 'boolean' ? style.underlined : undefined
  const strikethrough = typeof style.strikethrough === 'boolean' ? style.strikethrough : undefined
  const obfuscated = typeof style.obfuscated === 'boolean' ? style.obfuscated : undefined
  const insertion = typeof style.insertion === 'string' ? style.insertion : undefined
  const font = typeof style.font === 'string' ? style.font : undefined
  const color = typeof style.color === 'string' ? ChatColor.parseSafely(style.color) : undefined

  let clickEvent: any
  if (typeof style.clickEvent === 'object') {
    clickEvent = new ChatClickEvent(
      style.clickEvent.action,
      style.clickEvent.value
    )
  }
  let hoverEvent: any
  if (typeof style.hoverEvent === 'object') {
    hoverEvent = new ChatHoverEvent(
      style.hoverEvent.action,
      componentDeserializer(style.hoverEvent.value)
    )
  }

  return new ChatStyle(color, bold, italic, underlined, strikethrough, obfuscated,
    clickEvent, hoverEvent, insertion, font)
}

/// Component serializer & deserializer

function componentSerializer (component: BaseComponent | any): Component {
  if (!(component instanceof BaseComponent)) {
    return component
  }

  const value = <Component> {}
  if (!component.style.isEmpty()) {
    const style = styleSerializer(component.style)
    for (const key in style) {
      // @ts-ignore
      value[key] = style[key]
    }
  }
  if (component.siblings.length > 0) {
    const extra: Component[] = []
    for (const sibling of component.siblings) {
      extra.push(componentSerializer(sibling))
    }
    value.extra = extra
  }

  if (component instanceof TextComponent) {
    value.text = component.text
  } else if (component instanceof TranslationComponent) {
    value.translate = component.key
    const args = component.args
    if (args && args.length > 0) {
      const withs: string[] = []
      for (let arg of args) {
        if (arg instanceof BaseComponent) {
          arg = toJsonObject(arg)
        } withs.push(arg)
      }
      value.with = withs
    }
  } else if (component instanceof ScoreComponent) {
    value.score = {
      name: component.name,
      objective: component.objective,
      value: component.value
    }
  } else if (component instanceof SelectorComponent) {
    value.selector = component.selector
  } else if (component instanceof KeybindComponent) {
    value.keybind = component.key
  } else if (component instanceof NBTComponent) {
    value.nbt = component.nbt
    value.interpret = component.interpret
    if (component instanceof BlockNBTComponent) {
      value.block = component.path
    } else if (component instanceof EntityNBTComponent) {
      value.entity = component.path
    } else if (component instanceof StorageNBTComponent) {
      value.storage = component.path
    } else {
      throw new Error(`Don't know how to serialize ${value} as a Component`)
    }
  } else {
    throw new Error(`Don't know how to serialize ${value} as a Component`)
  }
  return value
}

function componentDeserializer (component: string | string[] | Component | Component[]): BaseComponent {
  if (typeof component === 'string') {
    return new TextComponent(component)
  }
  if (typeof component === 'object' && !Array.isArray(component)) {
    let value: BaseComponent
    if (typeof component.text === 'string') {
      value = new TextComponent(component.text)
    } else if (typeof component.translate === 'string') {
      const key = component.translate
      const args: any[] = []
      if (Array.isArray(component.with)) {
        let i = 0
        for (const arg of component.with) {
          args[i] = componentDeserializer(arg)
          if (args[i] instanceof TextComponent) {
            if (args[i].style.isEmpty() && args[i].siblings.length <= 0) {
              args[i] = args[i].text
            }
          }
          i++
        }
      }
      value = new TranslationComponent(key, args)
    } else if (typeof component.score === 'object') {
      const { name, objective } = component.score
      if (typeof name !== 'string' || typeof objective !== 'string') {
        throw new Error('A score component needs a least a name and an objective')
      }
      value = new ScoreComponent(name, objective, component.score.value)
    } else if (typeof component.selector === 'string') {
      value = new SelectorComponent(component.selector)
    } else if (typeof component.keybind === 'string') {
      value = new KeybindComponent(component.keybind)
    } else if (typeof component.nbt === 'string') {
      const nbt = component.nbt
      const interpret = !!component.interpret
      if (typeof component.block === 'string') {
        value = new BlockNBTComponent(nbt, interpret, component.block)
      } else if (typeof component.entity === 'string') {
        value = new EntityNBTComponent(nbt, interpret, component.entity)
      } else if (typeof component.storage === 'string') {
        value = new StorageNBTComponent(nbt, interpret, component.storage)
      } else {
        throw new Error(`Don't know how to turn ${component} into a Component`)
      }
    } else {
      throw new Error(`Don't know how to turn ${component} into a Component`)
    }
    if (Array.isArray(component.extra)) {
      if (component.extra.length <= 0) {
        throw new Error('Unexpected empty array of components')
      }
      for (const ext of component.extra) {
        const sibling = componentDeserializer(ext)
        if (sibling) {
          value.append(sibling)
        }
      }
    }
    value.style = styleDeserializer(component) || new ChatStyle()
    return value
  } else if (Array.isArray(component)) {
    let value: any
    for (const ext of component) {
      const sibling = componentDeserializer(ext)
      if (!value) {
        value = sibling
      } else if (sibling) {
        value.append(sibling)
      }
    }
    return value
  } else {
    throw new Error(`Don't know how to turn ${component} into a Component`)
  }
}

/// Json to & from

export function toJson (component: BaseComponent): string {
  return JSON.stringify(component, (_, value) => componentSerializer(value))
}

export function toJsonObject (component: BaseComponent): Component {
  return componentSerializer(component)
}

export function fromJson (component: string | string[] | Component | Component[]): BaseComponent {
  return componentDeserializer(
    typeof component === 'string'
      ? JSON.parse(component)
      : component
  )
}
