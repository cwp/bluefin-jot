import util from 'util'

import makeDebugFn from 'debug'

import {levelName} from './level'
import {NullTarget} from './null-target'

const debugFunctions = new Map()

export class DebugTarget extends NullTarget {
  static write(name, format, ...args) {
    name = name || 'jot'
    let fn = debugFunctions.get(name)
    if (fn === undefined) {
      fn = makeDebugFn(name)
      debugFunctions.set(name, fn)
    }
    fn(format, ...args)
  }

  finish(span, context) {
    span = span || {}
    super.finish(span, context)
    context.id = span.id
    if (span.parentId) context.parentId = span.parentId
    const format = `duration %dms %o`
    this.constructor.write(span.name, format, span.duration, context)
  }

  log(span, level, message, context = {}) {
    span = span || {}
    if (level < this.logLevel) return
    const format = levelName[level] + ' %o'
    this.constructor.write(span.name, format, message, context)
  }

  metric(span, kind, name, value, context) {
    span = span || {}
    context.id = span.id
    if (span.parentId) context.parentId = span.parentId
    const format = `${kind} %s %d %o`
    this.constructor.write(span.name, format, name, value, context)
  }

  error(span, error, context) {
    span = span || {}
    const chunks = []
    let e = error
    while (e) {
      chunks.unshift(e.stack.replace('Error: ', '  '))
      e = e.cause
    }
    if (context) chunks.unshift(util.format('%s %o', 'Error', context))

    this.constructor.write(span.name, chunks.join('\n'))
  }
}
