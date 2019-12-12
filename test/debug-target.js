import must from 'must'
import mustSinon from 'must-sinon'
import sinon from 'sinon'

import {DebugTarget} from '../src/debug-target'
import {level} from '../src/level'

describe('debug-target', function() {
  let target
  let span
  let stub

  before(function() {
    mustSinon(must)
    target = new DebugTarget()
    stub = sinon.stub(DebugTarget, 'write')
  })

  this.beforeEach(function() {
    span = target.start('test')
    stub.reset()
  })

  it('logs', function() {
    target.log(span, level.debug, 'gloff', {zin: 45})
    stub.must.have.been.calledWith('test', 'debug %o', 'gloff', {zin: 45})
  })

  it('metrics', function() {
    target.metric(span, 'magnitude', 'nurp', 12, {clath: 1})
    stub.must.have.been.calledWith('test', 'magnitude %s %d %o', 'nurp', 12, {
      clath: 1,
      id: sinon.match.number,
    })
  })

  it('errors', function() {
    const error = new Error('gonk')
    error.cause = new Error('blint')
    target.error(span, error, {siffy: 99})
    stub.must.have.been.calledOnce()
    const name = stub.firstCall.args[0]
    name.must.be('test')
    const entry = stub.firstCall.args[1]
    entry.must.startWith('Error { siffy: 99 }\n  blint\n')
    entry.must.match('  gonk\n')
    entry.must.match('/bluefin-jot/test/debug-target.js:')
  })
})
