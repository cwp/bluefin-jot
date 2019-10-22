import {DebugTarget} from './debug-target'
import {level} from './level'

const targets = new Set()

export class Jot {
  constructor(_context, _target) {
    this.context = _context || Jot.context
    Object.defineProperty(this, 'target', {
      enumerable: false,
      get() {
        return _target || Jot.target
      },
      set(value) {
        _target = value
        targets.add(value)
      },
    })
  }

  /*
   * Lifecycle
   */

  static async finalize() {
    const vows = [...targets.values()].map(ea => ea.finalize())
    await Promise.all(vows)
  }

  child(...objects) {
    const context = Object.assign({}, this.context, ...objects)
    return new Jot(context, this.target)
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
    this.target.error(effect, context)
    Object.assign(effect, context)

    return effect
  }

  /*
   * Logging
   */

  debug(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest)
    this.target.log(level.debug, message, context)
  }

  info(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest)
    this.target.log(level.info, message, context)
  }

  warning(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest)
    this.target.log(level.warning, message, context)
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
    this.target.metric('magnitude', name, value, context)
  }

  count(name, value, ...rest) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      const error = new Error('Not a number')
      this.error('Cannot record metric', error, {name}, ...rest)
      return
    }

    const context = Object.assign({}, this.context, ...rest)
    this.target.metric('count', name, value, context)
  }

  /*
   * Timing
   */

  begin(name, ...rest1) {
    const began = process.hrtime.bigint()
    return (...rest2) => {
      const context = Object.assign({}, this.context, ...rest1, ...rest2)
      const nanoseconds = process.hrtime.bigint() - began
      const milliseconds = Number(nanoseconds / 1000000n)
      this.magnitude(name, milliseconds, context)
      return milliseconds
    }
  }

  // for compatibility with bluefin-link
  formatPath(filePath) {
    return filePath
  }
}

Jot.target = new DebugTarget()
Jot.context = {}

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
