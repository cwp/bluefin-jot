
export default function(jot) {
  it('debug', function() {
    this.jot.debug('extremely subtle', {lif: 'nnn'}, {orc: 44})
  })

  it('info', function() {
    this.jot.info('something going on', {glick: 56})
  })

  it('warning', function() {
    this.jot.warning('dire circumstances', {nork: 'jjjj'})
  })

  it('magnitude', function() {
    this.jot.magnitude('jot.duration', 45, {a: 5})
  })

  it('count', function() {
    this.jot.count('jot.requests', 45, {a: 5})
  })

  it('fail', function() {
    try {
      throw new Error('bungled')
    } catch (e) {
      e.stack.must.match(/^Error: bungled/)
      const e2 = this.jot.fail('stumbled', e, {skiz: 62})
      e2.must.not.be(e)
      e2.stack.must.match(/^Error: stumbled/)
    }
  })

  it('error', function() {
    try {
      throw new Error('bungled')
    } catch (e) {
      const e2 = this.jot.error('stumbled', e, {skiz: 62})
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
      const e2 = this.jot.fail('very very bad', e, ctx)
      e.message.must.be('bungled')
      e.stack.must.be.a.string()
      e.stack.must.startWith('Error: bungled')
      e2.message.must.be('very very bad')
      e2.stack.must.be.a.string()
      e2.stack.must.startWith('Error: very very bad')
    }
  })
}
