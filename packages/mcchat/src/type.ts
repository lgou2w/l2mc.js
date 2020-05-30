/// Type define

export type Style = {
  color?: string
  bold?: boolean
  italic?: boolean
  underlined?: boolean
  strikethrough?: boolean
  obfuscated?: boolean
  font?: string
  insertion?: string
  clickEvent?: {
    action: 'open_url' | 'open_file' | 'run_command' | 'suggest_command' | 'change_page' | 'copy_to_clipboard'
    value: string
  }
  hoverEvent?: {
    action: 'show_text' | 'show_item' | 'show_entity' | 'show_achievement'
    value: string
  }
}

export type Component = Style & {
  text: string
  extra?: Component[]
  translate?: string
  with?: any[]
  score?: {
    name: string
    objective: string
    value?: string
  }
  selector?: string
  keybind?: string
  nbt?: string
  interpret?: boolean
  block?: string
  entity?: string
  storage?: string
}
