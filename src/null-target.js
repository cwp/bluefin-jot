import {level} from './level'

var nextId = 1

export class NullTarget {
  constructor(_level = level.all) {
    this.logLevel = _level
  }

  async finalize() {}

  start(name, parent) {
    const span = {name, id: nextId++, start: process.hrtime.bigint()}
    if (parent) span.parentId = parent.id
    return span
  }

  finish(span, context) {
    if (span && span.start) {
      const nanoseconds = process.hrtime.bigint() - span.start
      const milliseconds = Number(nanoseconds) / 1e6
      span.duration = milliseconds
    }
  }

  log(span, level, message, context) {}

  metric(span, kind, name, value, context) {}

  error(span, error, context) {}
}
