import {DebugTarget} from '../src/debug-target'
import {level} from '../src/level'
import must from 'must'
import mustSinon from 'must-sinon'
import sinon from 'sinon'

describe('debug-target', function() {
  let target
  let stub

  before(function() {
    mustSinon(must)
    target = new DebugTarget()
    stub = sinon.stub(target, 'debug')
  })

  this.beforeEach(function() {
    stub.reset()
  })

  it('logs', function() {
    target.log(level.debug, 'gloff', {zin: 45})
    stub.must.have.been.calledWith('debug %o', 'gloff', {zin: 45})
  })

  it('metrics', function() {
    target.metric('magnitude', 'nurp', 12, {clath: 1})
    stub.must.have.been.calledWith('magnitude %s %d %o', 'nurp', 12, {clath: 1})
  })

  it('errors', function () {
    const error = new Error('gonk')
    error.cause = new Error('blint')
    target.error(error, {siffy: 99})
    stub.must.have.been.calledOnce()
    const entry = stub.firstCall.args[0]
    entry.must.startWith('Error { siffy: 99 }\n  blint\n')
    entry.must.match('  gonk\n')
    entry.must.match('/bluefin-jot/test/debug-target.js:')
  })
})
