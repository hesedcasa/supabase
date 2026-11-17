/* eslint-disable @typescript-eslint/no-explicit-any */
import {Args, Flags} from '@oclif/core'
import {expect} from 'chai'
import {stub} from 'sinon'

import {BaseCommand} from '../src/base-command.js'

class TestCommand extends BaseCommand {
  public getParsed(): boolean {
    return this.parsed
  }

  public parseForTest(options?: any, argv?: string[]): Promise<any> {
    return this.parse(options, argv)
  }

  public async run(): Promise<void> {}

  public toErrorJsonForTest(err: unknown): {error: string} {
    return this.toErrorJson(err)
  }
}

const mockConfig = {
  root: process.cwd(),
  runHook: stub().resolves({failures: [], successes: []}),
} as any

describe('BaseCommand', () => {
  it('keeps JSON output enabled by default', () => {
    const command = new TestCommand([], mockConfig)

    expect(command.jsonEnabled()).to.be.true
  })

  it('disables JSON output when --toon is passed before the separator', () => {
    const command = new TestCommand(['--toon'], mockConfig)

    expect(command.jsonEnabled()).to.be.false
  })

  it('keeps JSON output enabled when --toon appears after the separator', () => {
    const command = new TestCommand(['--', '--toon'], mockConfig)

    expect(command.jsonEnabled()).to.be.true
  })

  it('sets parsed after a successful parse', async () => {
    const command = new TestCommand(['--toon'], mockConfig)

    const parsed = await command.parseForTest({flags: {toon: Flags.boolean()}})

    expect(parsed.flags.toon).to.be.true
    expect(command.getParsed()).to.be.true
  })

  it('still sets parsed when parsing fails on a required argument', async () => {
    const command = new TestCommand([], mockConfig)

    let caught: unknown
    try {
      await command.parseForTest({args: {table: Args.string({required: true})}})
    } catch (error: unknown) {
      caught = error
    }

    expect(caught, 'parse should reject on a missing required arg').to.be.instanceOf(Error)
    expect((caught as Error).message).to.include('required arg')
    expect(command.getParsed()).to.be.true
  })

  it('serializes an Error as {error: message}', () => {
    const command = new TestCommand([], mockConfig)

    expect(command.toErrorJsonForTest(new Error('boom'))).to.deep.equal({error: 'boom'})
  })

  it('serializes a non-Error as {error: String(value)}', () => {
    const command = new TestCommand([], mockConfig)

    expect(command.toErrorJsonForTest('not-an-error')).to.deep.equal({error: 'not-an-error'})
  })
})
