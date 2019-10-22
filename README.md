# Jot

A simple interface for telemetry.

## Installation

```sh
npm install --save bluefin-jot
```

or

```sh
yarn add bluefin-jot
```

## Basic Usage

```javascript
// example.js
const {Jot} = require('bluefin-jot')

// create a new jot instance
const jot = new Jot()

// emit log messages
jot.debug('excruciating detail', {withStructuredData: true})
jot.info('normal verbosity', {more: 'details'})
jot.warning('worrisome event')

// emit metrics
jot.magnitude('intensity', 100, {force: 'magnetism'})
jot.count('widgets', 3)

// emit a stack trace
const error = new Error('made a mistake')
jot.error('job failed', error, {jobName: 'setup'})
```

Run the script with an environment variable:

```sh
DEBUG=jot node example.js
```
