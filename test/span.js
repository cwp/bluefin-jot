import {DebugTarget, Jot, level} from '../src/main'
import common from './lib/jot-interface'

describe('span', function() {
  let parent

  before(function() {
    const target = new DebugTarget(level.all)
    parent = new Jot('pluff', {nurp: 42}, target)
  })

  after(async function() {
    await Jot.finalize()
  })

  this.beforeEach(function () {
    this.jot = parent.start('flink')
  })

  this.afterEach(function() {
    this.jot.finish({pwif: 8})
  })

  common()
})
