import util from 'util';
import makeDebugFn from 'debug';

const level = {
  all: Number.MIN_SAFE_INTEGER,
  debug: 10,
  info: 20,
  warning: 30,
  error: 40,
  critical: 50,
  none: Number.MAX_SAFE_INTEGER,
};

const levelName = {};
for (const name in level) levelName[level[name]] = name;

var nextId = 1;

class NullTarget {
  constructor(_level = level.all) {
    this.logLevel = _level;
  }

  async finalize() {}

  start(name, parent) {
    const span = {name, id: nextId++, start: process.hrtime.bigint()};
    if (parent) span.parentId = parent.id;
    return span
  }

  finish(span, context) {
    if (span && span.start) {
      const nanoseconds = process.hrtime.bigint() - span.start;
      const milliseconds = Number(nanoseconds) / 1e6;
      span.duration = milliseconds;
    }
  }

  log(span, level, message, context) {}

  metric(span, kind, name, value, context) {}

  error(span, error, context) {}
}

const debugFunctions = new Map();

class DebugTarget extends NullTarget {
  static write(name, format, ...args) {
    name = name || 'jot';
    let fn = debugFunctions.get(name);
    if (fn === undefined) {
      fn = makeDebugFn(name);
      debugFunctions.set(name, fn);
    }
    fn(format, ...args);
  }

  finish(span, context) {
    span = span || {};
    super.finish(span, context);
    context.id = span.id;
    if (span.parentId) context.parentId = span.parentId;
    const format = `duration %dms %o`;
    this.constructor.write(span.name, format, span.duration, context);
  }

  log(span, level, message, context = {}) {
    span = span || {};
    if (level < this.logLevel) return
    const format = levelName[level] + ' %o';
    this.constructor.write(span.name, format, message, context);
  }

  metric(span, kind, name, value, context) {
    span = span || {};
    context.id = span.id;
    if (span.parentId) context.parentId = span.parentId;
    const format = `${kind} %s %d %o`;
    this.constructor.write(span.name, format, name, value, context);
  }

  error(span, error, context) {
    span = span || {};
    const chunks = [];
    let e = error;
    while (e) {
      chunks.unshift(e.stack.replace('Error: ', '  '));
      e = e.cause;
    }
    if (context) chunks.unshift(util.format('%s %o', 'Error', context));

    this.constructor.write(span.name, chunks.join('\n'));
  }
}

const targets = new Set();

class Jot {
  constructor(_span, _context, _target) {
    if (typeof _span === 'object' && 'metric' in _span) {
      _target = _span;
      _context = {};
      _span = undefined;
    } else if (typeof _context === 'object' && 'metric' in _context) {
      _target = _context;
      _context = _span;
      _span = undefined;
    } else if (_context === undefined && typeof _span === 'object' && _span.constructor === Object) {
      _context = _span;
      _span = undefined;
    }

    this.context = _context || Jot.context;
    Object.defineProperty(this, '_target', {
      enumerable: false,
      writeable: true,
      value: _target
    });
    this.span = typeof _span === 'string' ? this.target.start(_span) : _span;
  }

  /*
   * Lifecycle
   */

  static async finalize() {
    const vows = [...targets.values()].map(ea => ea.finalize());
    await Promise.all(vows);
  }

  start(name, ...rest) {
    const span = this.target.start(name, this.span);
    const context = Object.assign({}, this.context, ...rest);
    return new this.constructor(span, context, this._target)
  }

  finish(...objects) {
    const context = Object.assign({}, this.context, ...objects);
    this.target.finish(this.span, context);
    this.span = undefined;
  }

  /*
   * Error handling
   */

  fail(message, cause, ...rest) {
    overrideStack(cause, rest);

    const effect = new Error(message);
    Error.captureStackTrace(effect, Jot.prototype.fail);
    assign(effect, rest);
    Object.defineProperty(effect, 'cause', {value: cause, enumerable: false});

    return effect
  }

  error(message, cause, ...rest) {
    overrideStack(cause, rest);

    const effect = new Error(message);
    Error.captureStackTrace(effect, Jot.prototype.error);
    Object.defineProperty(effect, 'cause', {value: cause, enumerable: false});
    const context = assign({}, rest);
    this.target.error(this.span, effect, context);
    Object.assign(effect, context);

    return effect
  }

  /*
   * Logging
   */

  debug(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest);
    this.target.log(this.span, level.debug, message, context);
  }

  info(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest);
    this.target.log(this.span, level.info, message, context);
  }

  warning(message, ...rest) {
    const context = Object.assign({}, this.context, ...rest);
    this.target.log(this.span, level.warning, message, context);
  }

  /*
   * Metrics
   */

  magnitude(name, value, ...rest) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      const error = new Error('Not a number');
      this.error('Cannot record metric', error, {name}, ...rest);
      return
    }

    const context = Object.assign({}, this.context, ...rest);
    this.target.metric(this.span, 'magnitude', name, value, context);
  }

  count(name, value, ...rest) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      const error = new Error('Not a number');
      this.error('Cannot record metric', error, {name}, ...rest);
      return
    }

    const context = Object.assign({}, this.context, ...rest);
    this.target.metric(this.span, 'count', name, value, context);
  }

  // for compatibility with bluefin-link
  formatPath(filePath) {
    return filePath
  }
}

Jot.target = new DebugTarget();
Jot.context = {};

Object.defineProperty(Jot.prototype, 'target', {
  enumerable: true,

  get() {
    return this._target || Jot.target
  },

  set(value) {
    this._target = value;
    targets.add(value);
  },
});

const overrideStack = (error, rest) => {
  for (const ctx of rest) {
    if ('stack' in ctx) {
      error.stack = ctx.stack.replace('Error\n', `Error: ${error.message}\n`);
      break
    }
  }
};

const assign = (object, rest) => {
  for (const obj of rest) {
    for (const p in obj) {
      if (p !== 'stack' && obj[p] !== undefined) object[p] = obj[p];
    }
  }
  return object
};

export default Jot;
export { DebugTarget, Jot, NullTarget, level, levelName };
