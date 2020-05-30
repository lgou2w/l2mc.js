/// Click event

export class ChatClickEvent {
  // eslint-disable-next-line no-useless-constructor
  constructor (
    readonly action: string,
    readonly value: string
  ) {
  }

  equals (other: any): other is this {
    return other instanceof ChatClickEvent &&
      this.action === other.action &&
      this.value === other.value
  }

  static Action = {
    OPEN_URL: 'open_url',
    OPEN_FILE: 'open_file',
    SUGGEST_COMMAND: 'suggest_command',
    RUN_COMMAND: 'run_command',
    CHANGE_PAGE: 'change_page',
    COPY_TO_CLIPBOARD: 'copy_to_clipboard'
  }
}
