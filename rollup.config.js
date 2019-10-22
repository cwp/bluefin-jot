import pkg from './package.json'

export default [
  {
    input: 'src/main.js',
    external: ['debug', 'util'],
    output: [
      {file: pkg.main, format: 'cjs', exports: 'named'},
      {file: pkg.module, format: 'es', exports: 'named'},
    ],
  },
]
