
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-rich-mentions.cjs.production.min.js')
} else {
  module.exports = require('./react-rich-mentions.cjs.development.js')
}
