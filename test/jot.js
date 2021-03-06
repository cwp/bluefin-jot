import {DebugTarget, Jot, level} from '../src/main'
import common from './lib/jot-interface'

describe('jot', function() {
  before(function() {
    const target = new DebugTarget(level.all)
    this.jot = new Jot('pluff', {nurp: 42}, target)
  })

  after(async function() {
    await Jot.finalize()
  })

  common()
})
