# supabase

CLI for Supabase API interaction

[![Version](https://img.shields.io/npm/v/@hesed/supabase.svg)](https://npmjs.org/package/@hesed/supabase)
[![Downloads/week](https://img.shields.io/npm/dw/@hesed/supabase.svg)](https://npmjs.org/package/@hesed/supabase)

# Install

```bash
sdkck plugins install @hesed/supabase
```

<!-- toc -->
* [supabase](#supabase)
* [Install](#install)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @hesed/supabase
$ spb COMMAND
running command...
$ spb (--version)
@hesed/supabase/0.1.0 darwin-arm64 node-v22.14.0
$ spb --help [COMMAND]
USAGE
  $ spb COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`spb supabase auth add`](#spb-supabase-auth-add)
* [`spb supabase auth test`](#spb-supabase-auth-test)
* [`spb supabase auth update`](#spb-supabase-auth-update)
* [`spb supabase create TABLE DATA`](#spb-supabase-create-table-data)
* [`spb supabase delete TABLE`](#spb-supabase-delete-table)
* [`spb supabase query TABLE SELECT`](#spb-supabase-query-table-select)
* [`spb supabase table-columns TABLE`](#spb-supabase-table-columns-table)
* [`spb supabase tables`](#spb-supabase-tables)
* [`spb supabase update TABLE DATA`](#spb-supabase-update-table-data)

## `spb supabase auth add`

Add a Supabase connection

```
USAGE
  $ spb supabase auth add [--json] [--token <value>] [--url <value>]

FLAGS
  --token=<value>  API Token:
  --url=<value>    Supabase API URL:

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Add a Supabase connection

EXAMPLES
  $ spb supabase auth add
```

_See code: [src/commands/supabase/auth/add.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/auth/add.ts)_

## `spb supabase auth test`

Test Supabase authentication and connection

```
USAGE
  $ spb supabase auth test [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Test Supabase authentication and connection

EXAMPLES
  $ spb supabase auth test
```

_See code: [src/commands/supabase/auth/test.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/auth/test.ts)_

## `spb supabase auth update`

Update existing Supabase authentication

```
USAGE
  $ spb supabase auth update [--json] [--token <value>] [--url <value>]

FLAGS
  --token=<value>  API Token:
  --url=<value>    Supabase API URL:

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Update existing Supabase authentication

EXAMPLES
  $ spb supabase auth update
```

_See code: [src/commands/supabase/auth/update.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/auth/update.ts)_

## `spb supabase create TABLE DATA`

Insert row(s) into a Supabase database table

```
USAGE
  $ spb supabase create TABLE DATA [--format json|toon] [--schema <value>] [--select <value>] [--toon]

ARGUMENTS
  TABLE  Table name
  DATA   JSON object or array of objects to insert

FLAGS
  --format=<option>  [default: json] Output format
                     <options: json|toon>
  --schema=<value>   PostgREST schema name
  --select=<value>   Comma-separated columns to return after insert
  --toon             Format output as toon

DESCRIPTION
  Insert row(s) into a Supabase database table

EXAMPLES
  $ spb supabase create users '{"name":"Alice","email":"alice@example.com"}'

  $ spb supabase create users '[{"name":"Alice"},{"name":"Bob"}]'

  $ spb supabase create products '{"name":"Widget","price":9.99}' --select id,name
```

_See code: [src/commands/supabase/create.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/create.ts)_

## `spb supabase delete TABLE`

Delete row(s) from a Supabase database table

```
USAGE
  $ spb supabase delete TABLE --filters <value> [--schema <value>] [--select <value>] [--toon]

ARGUMENTS
  TABLE  Table name

FLAGS
  --filters=<value>  (required) PostgREST filter string (e.g. "id=eq.42")
  --schema=<value>   PostgREST schema name
  --select=<value>   Comma-separated columns to return after delete
  --toon             Format output as toon

DESCRIPTION
  Delete row(s) from a Supabase database table

EXAMPLES
  $ spb supabase delete users --filters "id=eq.42"

  $ spb supabase delete orders --filters "status=eq.cancelled&created_at=lt.2024-01-01"

  $ spb supabase delete sessions --filters "user_id=eq.5" --select id

FLAG DESCRIPTIONS
  --filters=<value>  PostgREST filter string (e.g. "id=eq.42")

    format: <column>=<operator>.<value>, combine multiple filters with & (AND)
    comparison: eq, neq, gt, gte, lt, lte
    pattern: like (case-sensitive, use * as wildcard), ilike (case-insensitive)
    regex: match (~), imatch (~*)
    list: in.(v1,v2), not.in.(v1,v2)
    bool: is.null, is.true, is.false
    logic: or=(col1.op.val,col2.op.val), not.<op>.<val>
    array: cs.{v1,v2} (contains), cd.{v1,v2} (contained by)
    full-text: fts.query, plfts.query, phfts.query, wfts.query
```

_See code: [src/commands/supabase/delete.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/delete.ts)_

## `spb supabase query TABLE SELECT`

Execute query on Supabase database table

```
USAGE
  $ spb supabase query TABLE SELECT --filters <value> [--limit <value>] [--toon]

ARGUMENTS
  TABLE   Table name
  SELECT  Columns to return in the result

FLAGS
  --filters=<value>  (required) PostgREST filter string (e.g. "age=gte.18&status=eq.active")
  --limit=<value>    Max rows to return
  --toon             Format output as toon

DESCRIPTION
  Execute query on Supabase database table

EXAMPLES
  $ spb supabase query users first_name,last_name,email --filters "created_at=gt.2017-01-01"

  $ spb supabase query users id,email --filters "age=gte.18&status=eq.active"

  $ spb supabase query products name,price --filters "name=ilike.*phone*"

  $ spb supabase query orders id,total --filters "status=in.(pending,processing)&total=gte.100"

  $ spb supabase query posts id,title --filters "or=(author_id.eq.5,featured.is.true)"

  $ spb supabase query events id,name --filters "tags=cs.{sale,featured}"

  $ spb supabase query articles id,title --filters "body=fts.climate%20change"

FLAG DESCRIPTIONS
  --filters=<value>  PostgREST filter string (e.g. "age=gte.18&status=eq.active")

    format: <column>=<operator>.<value>, combine multiple filters with & (AND)
    comparison: eq, neq, gt, gte, lt, lte
    pattern: like (case-sensitive, use * as wildcard), ilike (case-insensitive)
    regex: match (~), imatch (~*)
    list: in.(v1,v2), not.in.(v1,v2)
    bool: is.null, is.true, is.false
    logic: or=(col1.op.val,col2.op.val), not.<op>.<val>
    array: cs.{v1,v2} (contains), cd.{v1,v2} (contained by)
    full-text: fts.query, plfts.query, phfts.query, wfts.query
```

_See code: [src/commands/supabase/query.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/query.ts)_

## `spb supabase table-columns TABLE`

List all columns in a table in Supabase database

```
USAGE
  $ spb supabase table-columns TABLE [--toon]

ARGUMENTS
  TABLE  Table name to get columns

FLAGS
  --toon  Format output as toon

DESCRIPTION
  List all columns in a table in Supabase database

EXAMPLES
  $ spb supabase table-columns
```

_See code: [src/commands/supabase/table-columns.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/table-columns.ts)_

## `spb supabase tables`

List all tables in Supabase database

```
USAGE
  $ spb supabase tables [--toon]

FLAGS
  --toon  Format output as toon

DESCRIPTION
  List all tables in Supabase database

EXAMPLES
  $ spb supabase tables
```

_See code: [src/commands/supabase/tables.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/tables.ts)_

## `spb supabase update TABLE DATA`

Update row(s) in a Supabase database table

```
USAGE
  $ spb supabase update TABLE DATA --filters <value> [--schema <value>] [--select <value>] [--toon]

ARGUMENTS
  TABLE  Table name
  DATA   JSON object with fields to update

FLAGS
  --filters=<value>  (required) PostgREST filter string (e.g. "id=eq.42")
  --schema=<value>   PostgREST schema name
  --select=<value>   Comma-separated columns to return after update
  --toon             Format output as toon

DESCRIPTION
  Update row(s) in a Supabase database table

EXAMPLES
  $ spb supabase update users '{"status":"active"}' --filters "id=eq.42"

  $ spb supabase update products '{"price":19.99}' --filters "name=eq.Widget" --select id,name,price

  $ spb supabase update orders '{"status":"shipped"}' --filters "status=eq.pending&total=gte.100"

FLAG DESCRIPTIONS
  --filters=<value>  PostgREST filter string (e.g. "id=eq.42")

    format: <column>=<operator>.<value>, combine multiple filters with & (AND)
    comparison: eq, neq, gt, gte, lt, lte
    pattern: like (case-sensitive, use * as wildcard), ilike (case-insensitive)
    regex: match (~), imatch (~*)
    list: in.(v1,v2), not.in.(v1,v2)
    bool: is.null, is.true, is.false
    logic: or=(col1.op.val,col2.op.val), not.<op>.<val>
    array: cs.{v1,v2} (contains), cd.{v1,v2} (contained by)
    full-text: fts.query, plfts.query, phfts.query, wfts.query
```

_See code: [src/commands/supabase/update.ts](https://github.com/hesedcasa/supabase/blob/v0.1.0/src/commands/supabase/update.ts)_
<!-- commandsstop -->
