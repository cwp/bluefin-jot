import {DebugTarget} from './debug-target'
import {level} from './level'

const targets = new Set()

export class Jot {
  constructor(_span, _context, _target) {
    if (typeof _span === 'object' && 'metric' in _span) {
      _target = _span
      _context = {}
      _span = undefined
    } else if (typeof _context === 'object' && 'metric' in _context) {
      _target = _context
      _context = _span
      _span = undefined
    } else if (_context === undefined && typeof _span === 'object' && _span.constructor === Object) {
      _context = _span
      _span = undefined
    }

    this.context = _context || Jot.context
    Object.defineProperty(this, '_target', {
      enumerable: false,
      writeable: true,
      value: _target
    })
    this.span = typeof _span === 'string' ? this.target.start(_span) : _span
  }

  /*
   * Lifecycle
   */

  static async finalize() {
    const vows = [...targets.values()].map(ea => ea.finalize())
    await Promise.all(vows)
  }

  start(name, ...rest) {
    const span = this.target.start(name, this.span)
    const context = Object.assign({}, this.context, ...rest)
    return new this.constructor(span, context, this._target)
  }

  finish(...objects) {
    const context = Object.assign({}, this.context, ...objects)
    this.target.finish(this.span, context)
    this.span = undefined
  }

  /*
   * Error handling
   */

  fail(message, cause, ...rest) {
    overrideStack(cause, rest)

    const effect = new Error(message)
    Error.captureStackTrace(effect, Jot.prototype.fail)
    assign(effect, rest)
    Object.defineProperty(effect, 'cause', {value: cause, enumerable: false})

    return effect
  }

  error(message, cause, ...rest) {
    overrideStack(cause, rest)

    const effect = new Error(message)
    Error.captureStackTrace(effect, Jot.prototype.error)
    Object.defineProperty(effect, 'cause', {value: cause, enumerable: false})
    const context = assign({}, rest)
    this.target.error(this.span, effect, context)
    Object.assign(effect, context)

    return effect
  }

  /*
   * Logging
   */

  debug(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest)
    this.target.log(this.span, level.debug, message, context)
  }

  info(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest)
    this.target.log(this.span, level.info, message, context)
  }

  warning(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest)
    this.target.log(this.span, level.warning, message, context)
  }

  /*
   * Metrics
   */

  magnitude(name, value, ...rest) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      const error = new Error('Not a number')
      this.error('Cannot record metric', error, {name}, ...rest)
      return
    }

    const context = Object.assign({}, this.context, ...rest)
    this.target.metric(this.span, 'magnitude', name, value, context)
  }

  count(name, value, ...rest) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      const error = new Error('Not a number')
      this.error('Cannot record metric', error, {name}, ...rest)
      return
    }

    const context = Object.assign({}, this.context, ...rest)
    this.target.metric(this.span, 'count', name, value, context)
  }

  // for compatibility with bluefin-link
  formatPath(filePath) {
    return filePath
  }
}

Jot.target = new DebugTarget()
Jot.context = {}

Object.defineProperty(Jot.prototype, 'target', {
  enumerable: true,

  get() {
    return this._target || Jot.target
  },

  set(value) {
    this._target = value
    targets.add(value)
  },
})

const overrideStack = (error, rest) => {
  for (const ctx of rest) {
    if ('stack' in ctx) {
      error.stack = ctx.stack.replace('Error\n', `Error: ${error.message}\n`)
      break
    }
  }
}

const assign = (object, rest) => {
  for (const obj of rest) {
    for (const p in obj) {
      if (p !== 'stack' && obj[p] !== undefined) object[p] = obj[p]
    }
  }
  return object
}
