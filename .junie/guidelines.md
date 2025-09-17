# Heimdall Contract - Development Guidelines

*Last updated: 2025-09-17*

> **⚠️ CRITICAL REMINDER**: After every code change, you must verify whether this guidelines document, the README.md, or any files in the `doc/` directory need to be updated or extended. Documentation maintenance is essential for project integrity and developer experience.

## Build/Configuration Instructions

### Prerequisites
- **Node.js version**: 24.8.0 (specified in `.tool-versions`)
- **Package manager**: npm (lock file present)

### Setup
```bash
# Install dependencies
npm install

# No build step required - project uses ES modules directly
```

### Configuration Files
- **Babel**: `babel.config.json` - configured with `@babel/preset-env` targeting current Node.js version
- **Jest**: `jest.config.js` - comprehensive configuration with:
  - v8 coverage provider
  - Node.js test environment
  - Babel transformation for JS/TS files
  - Setup file at `test/setup.js` (mocks console methods)
  - Coverage reporting enabled

## Testing Information

### Running Tests
```bash
# Run all tests with coverage
npm test

# Run specific test file
npm test -- test/example-demo.test.js

# Jest is configured to run with --coverage by default
```

### Test Structure
- Tests located in `test/` directory
- Subdirectories: `test/breaker/`, `test/validations/`
- Current coverage: 99.56% statements, 96.42% branches, 100% functions

### Adding New Tests
Follow the established patterns:

```javascript
import {describe, expect, it} from '@jest/globals';
import ContractBase from "../index.js"

describe("Your Test Suite", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return {
        ...super.defineSchema(),
        ...{
          // Define your test schema
          name: {dType: "String", presence: true},
          email: {dType: "String", presence: true, isEmail: true}
        }
      }
    }
  }

  it('should validate correctly', () => {
    const contract = new TestContract()
    contract.name = "Test"
    contract.email = "test@example.com"
    
    expect(contract.isValid()).toBe(true)
    expect(contract.errors).toStrictEqual({})
  })
})
```

### Key Testing Conventions
- Use ES6 imports from `@jest/globals`
- Create test contracts extending `ContractBase`
- Test both valid and invalid scenarios
- Check `isValid()` method and `errors` object structure
- Error messages follow specific formats (e.g., "must be a valid E-Mail")

## Development Information

### Code Style & Architecture

#### ES Module Structure
- Project uses ES6 modules with `import`/`export`
- Main entry: `index.js` (exports default Contract class)
- Validation logic: `validation-base.js` (exported functions)
- Validation definitions: `validations.js` (exported object)

#### Key Architectural Patterns

**Contract Class Design:**
- Constructor accepts options object with optional schema, hooks
- Uses method binding for validation functions
- Implements hook pattern (`init()`, `initNested()`, `initAll()`)
- Configuration through `contractConfig` object

**Validation System:**
- Two-tier validation: "breaker" and "normal" validations
- Breaker validations run first, can skip remaining validations
- Each validation has `check()`, `message()`, and `i18next()` functions
- Support for custom validations and error messages

**Data Types:**
- Supported dTypes: "String", "Number", "Boolean", "Array", "Contract", "Generic"
- Schema definition through `defineSchema()` method
- Nested object support with recursive validation

#### JSDoc Standards
- Comprehensive JSDoc comments for all public methods
- Type definitions using `@typedef`
- Parameter documentation with types and descriptions

#### Error Handling Conventions
- Validation errors stored in `errors` object
- Error structure: `{fieldName: {messages: ["error message"]}}`
- Generic error fallback with localization support
- Console error logging for undefined validations

#### Internationalization
- Built-in i18next integration
- Configurable localization method
- Custom error message support (string or function)
- Translation key fallback patterns

### Project-Specific Conventions

#### Reserved Keywords
- `dType` is reserved and cannot be used as property name
- Underscore-prefixed fields can be ignored via config
- Non-validation configs: `["default", "errorMessage", "arrayOf", "innerValidate", "contract", "as", "parseAs", "renderAs"]`

#### Validation Context
- Support for validation contexts (e.g., different rules for create vs update)
- Context matching through `on` breaker validation
- Array context support for multiple contexts

#### Schema Inheritance
- Use `...super.defineSchema()` for inheritance
- Contracts can extend other contracts
- Validation configuration inheritance supported

### Debugging Tips

#### Common Error Messages
- `"Field invalid!"` - Generic fallback message
- `"not present"` - Presence validation failure
- `"must be a valid E-Mail"` - Email validation failure
- `"Undefined validation: [name]"` - Typo in validation name

#### Testing Console Output
- Console methods are mocked in tests (see `test/setup.js`)
- Error logging for undefined validations helps catch typos
- Use specific test cases to verify error message formats

#### Validation Flow Debug
1. Breaker validations run first (`allowBlank`, `validateIf`, `on`)
2. If breaker succeeds, normal validations are skipped
3. Normal validations run in schema definition order
4. Custom validations via `validate` function supported
5. Error aggregation at field level

### Performance Considerations
- Validation runs synchronously
- Early exit via breaker validations for performance
- Method binding in constructor for context preservation
- Shallow cloning for nested object validation

## Git Commit Message Style Guide

### Format
All commit messages must follow: `[TYPE] brief description in lowercase`

### Types
- **`[FEATURE]`** - New functionality, enhancements, or additions
- **`[BUGFIX]`** - Bug fixes, error corrections, or issue resolutions  
- **`[TASK]`** - Maintenance work, documentation updates, configuration changes, or housekeeping

### Rules
- Use lowercase after the prefix
- Use imperative mood (e.g., "add", "fix", "update")
- Keep messages concise but descriptive
- One logical change per commit

---

*This project maintains 100% test coverage. Always add tests for new features and ensure existing tests pass before submitting changes.*