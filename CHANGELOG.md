# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions before 0.7.0 were not tracked in this changelog.

## [0.10.1] - 2026-07-08

### Changed

- `min` and `max` no longer log a `console.error` when the runtime value does not match the
  field's `dType` (e.g. a string sitting in a `Number` field while the user is typing). That
  state is reachable through legitimate user input and is already reported to the user by the
  `dType` validation - the log only duplicated it as console noise and forced consumers to
  suppress it. Schema-level mistakes (`min`/`max` on an unsupported `dType`) remain covered
  by the schema lint.

## [0.10.0] - 2026-07-03

### Changed

- **BREAKING**: the `errors` object was redesigned. Each node now separates its own failures,
  erroneous child fields and erroneous array elements into three namespaces (`issues`, `fields`,
  `elements`) instead of mixing message arrays with field keys. This removes the `messages`
  reserved word (a field could never be named `messages` before) and the ambiguous mixing of
  array element keys with the outer `messages`. Each failure is now an object `{validation, message}`
  carrying the name of the failed validation, not a bare string. See [Errors](doc/errors.md).

  Migration: `errors.email.messages` -> `errors.fields.email.issues.map(i => i.message)`;
  nested `errors.address.street` -> `errors.fields.address.fields.street`; array elements
  `errors.items[0]` -> `errors.fields.items.elements[0]`, with the outer array errors under
  `errors.fields.items.issues`. In most cases the new `errorsAt(path)` and `flatErrors()`
  helpers replace manual traversal entirely.

### Added

- `errorsAt(path)`: returns the error node at a field path (dotted string or array, array
  elements addressed by index), or `undefined`. The form friendly way to read field errors.
- `flatErrors()`: returns all errors as a flat list of `{path, validation, message}`.
- Type inference for the `errors` tree of factory built contracts (`InferErrors`), and the
  `Issue` / `ErrorNode` / `FlatError` types exported from the types subpath.

## [0.9.0] - 2026-07-02

### Added

- **Schema linting**: schemas are checked in two phases and problems are collected into a single
  `SchemaError` with a path per problem - structure (valid dTypes, `arrayOf` on Array fields,
  `contract` on Contract fields, node shapes, `validate`/`validateIf` must be functions) at
  construction time, validation keywords on the first `isValid()` call (inherited additional
  validations are only known then). See [Schema Linting](doc/schema.md#schema-linting).
- New `strictSchema` config (default `true`): throw a `SchemaError` on schema problems.
  Set it to `false` via `setConfig` or constructor option to restore the previous lenient
  behavior (problems are logged to the console, offending schema parts are ignored).
  It is passed down to nested contracts. See [Configuration](doc/configuration.md#strictschema).
- `SchemaError` is exported from the main module.
- **`contractClass(schema, base?)` factory**: create a contract class from a schema without the
  class boilerplate. Pass a base class to inherit its schema, hooks and additional validations.
  See [General Usage](doc/general_usage.md).
- **TypeScript declarations**, no `@types` package needed: generated from the JSDoc for the API,
  handwritten schema type vocabulary in `types.d.ts` (exported via the new
  `@ikaru5/heimdall-contract/types` subpath). Custom validations extend `PropertyDefinition`
  through declaration merging, underscore meta keywords are typed via a template literal index
  signature. See [TypeScript](doc/typescript.md).
- **Type inference** for factory built contracts: instance fields (`InferContract`), `toObject()`
  return types including `renderAs`/`as` key remapping (`InferObject`), compile time keyword
  linting (`ValidateSchema`) including `innerValidate` and the breakers-only rule for contract
  arrays, and default narrowing (a Number/Boolean field with a matching `default` loses
  `null`/`undefined` from its type). See [Type Inference](doc/typescript.md#type-inference).
- Type test pipeline: `npm run build:types` and `npm run test:types`, both wired into CI
  and `prepublishOnly`.

### Changed

- **BREAKING**: schema problems throw a `SchemaError` by default instead of being logged to
  the console. Migration: fix the problems listed in the error (typically typos in validation
  keywords, a missing `arrayOf` or an invalid `dType`) or set `strictSchema: false`.
- **BREAKING**: `dType: "Array"` requires `arrayOf` in strict mode. Use `arrayOf: "Generic"`
  for arrays of arbitrary values.
- `as`, `parseAs` and `renderAs` accept `ReadonlyArray<string>`, so the array form can be
  declared `as const` for precise key inference.
- `toObject()` is declared as `Record<string, unknown>` instead of `Record<string, any>`
  (factory built contracts get a precise type instead).
- The scattered `console.error` reporting for unknown validations in the validation hot path
  is replaced by the schema lint.

### Fixed

- `validateArray` no longer mutates the user provided schema (`innerValidate` is copied before
  stubbing) - locked in by a test that validates against a deeply frozen schema.
- String schema nodes like `{name: "String"}` no longer cause infinite recursion in define,
  assign, validate and toObject.

## [0.8.0] - 2026-07-02

### Security

- **Fixed a ReDoS vulnerability in the `isEmail` validation**: the previous regular expression
  suffered catastrophic backtracking - a crafted input of ~40 characters could freeze the
  process for minutes, a real denial of service vector for backend usage. Replaced with the
  linear time [WHATWG HTML email regex](https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address).

### Changed

- `isEmail` follows the WHATWG definition (the behavior of `<input type="email">`): plus
  addressing and top level domains of any length are now valid, and dotless domains like
  `user@localhost` are considered valid.
- `max` error messages now say "at most" / "less than or equal to", matching the inclusive
  comparison.
- CI tests against a Node 20/22/24 matrix instead of a single pinned version.

### Fixed

- Falsy array values (`0`, `false`, `""`) survive `assign()` instead of being replaced by
  default empty values.
- `isValid()` no longer throws when an Array field or an element of a contract array is
  `null`/`undefined` - dType and presence report errors instead, and null elements become
  empty contracts (with `isAssignedEmpty`), mirroring what `assign()` does.
- `assign(null)` is skipped like `undefined` instead of throwing.
- Custom `validate` functions returning anything other than a boolean or string (e.g. a
  missing `return`) yield the generic error message instead of pushing `null` into the errors.
- The `isEmail` documentation accidentally contained a copy of the `match` validator docs.

## [0.7.0] - 2026-06-24

### Added

- Flexible `customLocalization` callback for error message translation (i18next friendly,
  with translation key fallback chains and interpolation context).
- `tryTranslateMessages` config: automatic translation of custom error messages.
- `ignoreUnderscoredFields` also skips underscored validation keywords in field definitions
  and `innerValidate`.
- Comprehensive JSDoc annotations; validations refactored to named parameters.

### Changed

- The npm package ships only the runtime modules, docs, README, LICENSE and coverage badge.

### Fixed

- Empty values (`null`/`undefined`) are no longer run through `min`/`max` checks, which
  previously logged a spurious console error for empty Number/Generic fields.
