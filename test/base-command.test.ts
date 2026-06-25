/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import {stub} from 'sinon'

import {BaseCommand} from '../src/base-command.js'

class TestCommand extends BaseCommand {
  public async run(): Promise<void> {}
}

const mockConfig = {
  root: process.cwd(),
  runHook: stub().resolves({failures: [], successes: []}),
} as any

describe('BaseCommand', () => {
  it('disables JSON output when --toon is passed before the separator', () => {
    const command = new TestCommand(['--toon'], mockConfig)

    expect(command.jsonEnabled()).to.be.false
  })

  it('keeps JSON output enabled when --toon appears after the separator', () => {
    const command = new TestCommand(['--', '--toon'], mockConfig)

    expect(command.jsonEnabled()).to.be.true
  })
})
