# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**spb** is an Oclif-based CLI tool (`bin: spb`) for interacting with Supabase databases via the PostgREST REST API. It supports single-credential connection management and multiple output formats.

## Development Commands

```bash
# Build
npm run build

# Run all tests
npm test

# Run a single test file
npx mocha test/path/to/test.test.ts

# Run tests with coverage
npm run test:coverage

# Lint and format
npm run lint
npm run format

# Find dead code
npm run find-deadcode
```

## Architecture

```
src/
├── commands/supabase/      # Oclif CLI commands (namespace: supabase)
│   ├── auth/               # auth add, auth test, auth update
│   ├── query.ts            # GET rows with PostgREST filter string
│   ├── create.ts           # POST rows (insert)
│   ├── update.ts           # PATCH rows with filters
│   ├── delete.ts           # DELETE rows with required filters
│   ├── tables.ts           # List tables via PostgREST schema introspection
│   └── table-columns.ts    # List columns for a table
├── supabase/
│   ├── supabase-api.ts     # SupabaseApi class — low-level HTTP client, filter builders
│   └── supabase-client.ts  # High-level functions (getTables, getTableColumns, testConnection, execute)
├── config.ts               # readConfig(), AuthConfig interface
├── format.ts               # formatAsToon() — wraps @toon-format/toon encode()
└── index.ts                # Entry point
```

### Key Architectural Patterns

**1. Command Pattern:**

Commands are thin Oclif wrappers that:

1. Call `readConfig(this.config.configDir, this.log.bind(this))` to load credentials
2. Return early (silently) if config is missing — `readConfig` already logs the error
3. Call a function from `src/supabase/supabase-client.js`
4. Output with `this.log(formatAsToon(result))` or `this.logJson(result)` based on `--toon` flag

**2. Supabase API Layer:**

`SupabaseApi` (`supabase-api.ts`) is a low-level HTTP client initialized with an `AuthConfig`. It provides:

- `request(method, resource, body, qs, uri, headers)` — generic fetch wrapper, sets `apikey` + `Authorization` headers
- `buildQuery/buildGetQuery/buildOrQuery` — assemble PostgREST filter query params from `FilterCondition` objects
- `getSchemaHeader(method, schema)` — returns `Content-Profile` or `Accept-Profile` for non-public schemas
- `validateCredentials()` — tests connection by GETting `/rest/v1/`

`supabase-client.ts` exposes the singleton init pattern and exports:

- `getTables(config)` — GET `/rest/v1/` and extract path keys
- `getTableColumns(config, tableName)` — GET `/rest/v1/` and extract definition properties
- `testConnection(config)` — calls `validateCredentials()`
- `execute(config, options)` — unified CRUD: `create` (POST), `get` (GET with pagination), `update` (PATCH), `delete` (DELETE)

**3. Configuration (`AuthConfig`):**

```typescript
interface AuthConfig {
  apiToken: string
  email: string
  host: string
}
```

Stored at `<configDir>/spb-config.json`:

```json
{
  "auth": {
    "apiToken": "your-api-token",
    "email": "user@example.com",
    "host": "https://your-project.supabase.co"
  }
}
```

`auth add` creates the file with mode `0o600`. `readConfig` returns `undefined` (and logs) if the file is missing or unreadable.

**4. Filter System:**

Commands accept PostgREST filter strings (e.g. `"age=gte.18&status=eq.active"`). The `execute` function supports two modes:

- `filterMode: 'string'` — raw PostgREST query string via `filtersString`
- `filterMode: 'manual'` — structured `FilterCondition[]` with `matchType: 'allFilters'` (AND) or `'anyFilter'` (OR)

**5. Output Formats:**

All commands support `--toon` flag (uses `@toon-format/toon` TOON encoding) or default JSON (`this.logJson`).

## Adding a New Command

1. Create `src/commands/supabase/<name>.ts` extending `Command`
2. Follow the pattern from `src/commands/supabase/tables.ts`:

```typescript
import {Command, Flags} from '@oclif/core'
import {readConfig} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {getTables} from '../../supabase/supabase-client.js'

export default class SupabaseTables extends Command {
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SupabaseTables)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const result = await getTables(config.auth)

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
```

## Testing

- Tests mirror source structure in `test/` (e.g. `test/commands/supabase/query.test.ts`)
- Mocha + Chai, `esmock` for ES module mocking, `sinon` for stubs
- 60-second timeout for all tests

**Command tests** — use `esmock` to mock config and client modules, instantiate the command directly:

```typescript
const imported = await esmock('../../../src/commands/supabase/tables.js', {
  '../../../src/config.js': {readConfig: readConfigStub},
  '../../../src/supabase/supabase-client.js': {getTables: getTablesStub},
  '../../../src/format.js': {formatAsToon: formatAsToonStub},
})
const SupabaseTables = imported.default
const cmd = new SupabaseTables([], {
  root: process.cwd(),
  runHook: stub().resolves({failures: [], successes: []}),
} as any)
stub(cmd, 'log')
stub(cmd, 'logJson')
await cmd.run()
```

**Auth command tests** — mock `@inquirer/prompts` input function to avoid blocking on stdin:

```typescript
const mockInput = async ({message}: {message: string}) => {
  if (message.includes('token')) return 'test-token'
  if (message.includes('URL')) return 'https://example.supabase.co'
  return ''
}
```

## Important Notes

- All imports use `.js` extensions (ES modules)
- The `static override args` block must be wrapped with `/* eslint-disable/enable perfectionist/sort-objects */` — Oclif parses args positionally
- Functions with more than 3 parameters require `// eslint-disable-next-line max-params` above the signature
- JSDoc `@param` for inline objects must use dot-notation per property (e.g. `@param options.description`)
- Pre-commit hook runs `npm run format && npm run find-deadcode`
- Node.js >=18.0.0 required
- Supabase API uses native `fetch` (Node.js built-in); use `// eslint-disable-next-line n/no-unsupported-features/node-builtins` when calling `fetch` directly
- `delete` command requires `--filters` (always required — no filter-less deletes)

## Commit Message Convention

**Always use Conventional Commits format:**

- `feat:` — new features
- `fix:` — bug fixes
- `refactor:` — refactoring without behavior change
- `test:` — tests only
- `docs:` — documentation only
- `chore:` — maintenance, deps, build config
