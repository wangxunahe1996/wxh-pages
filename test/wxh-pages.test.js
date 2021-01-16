const test = require('ava')
const wxhPages = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => wxhPages(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(wxhPages('w'), 'w@zce.me')
  t.is(wxhPages('w', { host: 'wedn.net' }), 'w@wedn.net')
})
