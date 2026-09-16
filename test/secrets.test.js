import assert from 'node:assert/strict'
import test from 'node:test'
import * as secrets from '../lib/secrets.js'

test('diagnostic redaction removes credentials while retaining useful package errors', () => {
  assert.equal(typeof secrets.redactDiagnostic, 'function')
  const output = secrets.redactDiagnostic([
    'npm ERR! package build failed',
    'npmAuthToken=plain-token',
    'Authorization: Bearer bearer-token',
    'registry=https://url-user-99:url-pass-99@example.test/pkg?download=1&api_key=query-token',
    'password: plain-password',
  ].join('\n'))
  for (const secret of ['plain-token', 'bearer-token', 'url-user-99', 'url-pass-99', 'query-token', 'plain-password']) {
    assert.equal(output.includes(secret), false, `must redact ${secret}`)
  }
  assert.match(output, /package build failed/)
  assert.match(output, /download=1/)
})
