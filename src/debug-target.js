import {level, levelName} from './level'

import makeDebugFn from 'debug'
import util from 'util'

export class DebugTarget {
  constructor(_level = level.all, name = 'jot') {
    this.debug = makeDebugFn(name)
    this.logLevel = _level
  }

  async finalize() {}

  log(level, message, context = {}) {
    if (level > this.logLevel) return
    const format = levelName[level] + ' %o'
    this.debug(format, message, context)
  }

  metric(kind, name, value, context) {
    const format = `${kind} %s %d %o`
    this.debug(format, name, value, context)
  }

  error(error, context) {
    const chunks = []
    let e = error
    while (e) {
      chunks.unshift(e.stack.replace('Error: ', '  '))
      e = e.cause
    }
    if (context) chunks.unshift(util.format('%s %o', 'Error', context))

    this.debug(chunks.join('\n'))
  }
}
