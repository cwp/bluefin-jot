import 'must'

import {DebugTarget, Jot, level} from '../src/main'

describe('jot', function() {
  let jot

  before(function() {
    jot = new Jot({nurp: 42}, new DebugTarget(level.all))
  })

  after(async function() {
    await Jot.finalize()
  })

  it('child', function() {
    const child = jot.child({bork: 88})
    child.must.be.a(Jot)
    child.context.must.eql({nurp: 42, bork: 88})
    child.target.must.be(jot.target)
  })

  it('debug', function() {
    jot.debug('extremely subtle', {lif: 'nnn'}, {orc: 44})
  })

  it('info', function() {
    jot.info('something going on', {glick: 56})
  })

  it('warning', function() {
    jot.warning('dire circumstances', {nork: 'jjjj'})
  })

  it('magnitude', function() {
    jot.magnitude('jot.duration', 45, {a: 5})
  })

  it('count', function() {
    jot.count('jot.requests', 45, {a: 5})
  })

  it('begin', async function() {
    const done = jot.begin('jot.timer', {before: 99})
    await new Promise(resolve => setTimeout(resolve, 12))
    done({after: 45})
  })

  it('fail', function() {
    try {
      throw new Error('bungled')
    } catch (e) {
      e.stack.must.match(/^Error: bungled/)
      const e2 = jot.fail('stumbled', e, {skiz: 62})
      e2.must.not.be(e)
      e2.stack.must.match(/^Error: stumbled/)
    }
  })

  it('error', function() {
    try {
      throw new Error('bungled')
    } catch (e) {
      const e2 = jot.error('stumbled', e, {skiz: 62})
      e2.must.not.be(e)
      e2.stack.must.match(/^Error: stumbled/)
      e.stack.must.match(/^Error: bungled/)
    }
  })

  it('preserves specialized stacks', function() {
    let ctx
    const toss = () => {
      ctx = {}
      Error.captureStackTrace(ctx, toss)
      throw new Error('bungled')
    }

    try {
      toss()
    } catch (e) {
      const e2 = jot.fail('very very bad', e, ctx)
      e.message.must.be('bungled')
      e.stack.must.be.a.string()
      e.stack.must.startWith('Error: bungled')
      e2.message.must.be('very very bad')
      e2.stack.must.be.a.string()
      e2.stack.must.startWith('Error: very very bad')
    }
  })
})
