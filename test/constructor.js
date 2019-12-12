import demand from 'must'

import {DebugTarget, Jot, level} from '../src/main'

describe('constructor', function() {
  it('no arguments', function() {
    const jot = new Jot()
    jot.must.be.an.instanceOf(Jot)
    demand(jot.span).undefined()
    demand(jot.context).eql({})
    demand(jot.target).be(Jot.target)
  })

  it('just context', function() {
    const context = {fnoob: 3}
    const jot = new Jot(context)
    jot.must.be.an.instanceOf(Jot)
    demand(jot.span).undefined()
    demand(jot.context).eql(context)
    demand(jot.target).be(Jot.target)
  })

  it('just target', function() {
    const target = new DebugTarget()
    const jot = new Jot(target)
    jot.must.be.an.instanceOf(Jot)
    demand(jot.context).eql({})
    demand(jot.target).be(target)
    demand(jot.span).undefined()
  })

  it('context and target', function() {
    const context = {nork: 9}
    const target = new DebugTarget()
    const jot = new Jot(context, target)
    jot.must.be.an.instanceOf(Jot)
    demand(jot.target).be(target)
    demand(jot.context).eql(context)
    demand(jot.span).undefined()
  })

  it('span and context', function() {
    const span = {}
    const jot = new Jot(span, {nork: 9})
    jot.must.be.an.instanceOf(Jot)
    demand(jot.span).be(span)
    demand(jot.context).eql({nork: 9})
    demand(jot.target).be(Jot.target)
  })

  it('span, context, target', function() {
    const span = {}
    const context = {nork: 9}
    const target = new DebugTarget()

    const jot = new Jot(span, context, target)
    jot.must.be.an.instanceOf(Jot)
    demand(jot.span).be(span)
    demand(jot.context).eql(context)
    demand(jot.target).be(target)
  })

  it('no span, context, target', function() {
    const target = new DebugTarget()
    const context = {nork: 9}
    const jot = new Jot(undefined, context, target)
    jot.must.be.an.instanceOf(Jot)
    demand(jot.span).be.undefined()
    demand(jot.context).eql(context)
    demand(jot.target).be(target)
  })

  it('name, context, target', function() {
    const target = new DebugTarget()
    const context = {nork: 9}
    const jot = new Jot('gonk', context, target)
    jot.must.be.an.instanceOf(Jot)
    demand(jot.target).be(target)
    demand(jot.context).eql(context)
    demand(jot.span).be.an.object()
    jot.span.name.must.be('gonk')
  })

})
