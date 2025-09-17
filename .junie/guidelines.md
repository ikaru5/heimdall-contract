# Heimdall Contract - AI Development Guidelines

## What is Heimdall Contract?

**Heimdall Contract** is a lightweight JavaScript validation library for creating data objects with intuitive validation schemas. Think of it like Ruby's Trailblazer-Reform for JavaScript - you define contracts that validate and manage your data with support for inheritance, nested objects, and custom validations.

**Key Features:**
- Framework-agnostic (works with React, Vue, Node.js, etc.)
- Lightweight (3.1kb minified + gzipped)  
- 100% test coverage
- Built-in i18n support
- Nested object validation
- Schema inheritance

## Quick Start

```bash
# Install dependencies
npm install

# Run tests (the main workflow)
npm test
```

That's it! No build step needed - the project uses ES modules directly.

## Essential Workflow

**Main development command:**
```bash
npm test  # Runs Jest with coverage reporting
```

This is the primary tool you'll use. It runs all tests and shows coverage statistics.

## Project Structure

```
heimdall-contract/
├── index.js                    # Main Contract class (~400 lines)
├── validation-base.js          # Core validation logic (~200 lines)  
├── validations.js             # All validation definitions (~450 lines)
├── test/                      # Test files
│   ├── breaker/              # Tests for breaker validations
│   └── validations/          # Tests for normal validations
├── doc/                       # Comprehensive documentation
│   ├── api.md               # API documentation
│   ├── validation/          # Individual validation docs
│   └── ...                  # Usage guides
└── package.json              # Only has `npm test` script
```

### Core Files Explained

**`index.js`** - The main Contract class
- Exports the default Contract class that users extend
- Handles schema definition, property management, validation orchestration
- Supports hooks (init, initNested, initAll) and configuration

**`validation-base.js`** - Validation engine
- Core functions: `validate()`, `validateArray()`, `validateProperty()`
- Handles recursive validation of nested objects and arrays  
- Manages validation flow (breakers first, then normal validations)

**`validations.js`** - Validation definitions
- Defines all available validations in two categories:
  - **Breaker validations**: `allowBlank`, `on` (skip remaining if matched)
  - **Normal validations**: `dType`, `presence`, `isEmail`, etc.
- Each validation has `check()` and `message()` functions

## How to Add Features/Fix Issues

### 1. Understand the Pattern
Contracts extend the base class and define schemas:

```javascript
class MyContract extends Contract {
  defineSchema() {
    return {
      name: {dType: "String", presence: true},
      email: {dType: "String", isEmail: true}
    }
  }
}
```

### 2. Common Tasks

**Adding new validation:**
1. Add definition to `validations.js` (breaker or normal section)
2. Create test file in `test/validations/` or `test/breaker/`
3. Add documentation in `doc/validation/`

**Modifying core logic:**
1. Edit `index.js` (Contract class) or `validation-base.js` (validation engine)
2. Run `npm test` to ensure nothing breaks
3. Add tests for new functionality

**Testing pattern:**
```javascript
import {describe, expect, it} from '@jest/globals';
import ContractBase from "../index.js"

describe("Feature Test", () => {
  class TestContract extends ContractBase {
    defineSchema() {
      return {
        field: {dType: "String", yourNewValidation: true}
      }
    }
  }

  it('should validate correctly', () => {
    const contract = new TestContract()
    contract.field = "test value"
    
    expect(contract.isValid()).toBe(true)
    expect(contract.errors).toStrictEqual({})
  })
})
```

### 3. Key Concepts

**Validation Flow:**
1. Breaker validations run first (`allowBlank`, `on`)
2. If breaker passes, remaining validations are skipped  
3. Normal validations run in schema definition order

**Data Types:**
- `"String"`, `"Number"`, `"Boolean"`, `"Array"`, `"Contract"`, `"Generic"`

**Reserved:**
- `dType` is required and reserved
- Configuration keys: `["default", "errorMessage", "arrayOf", "innerValidate", "contract", "as", "parseAs", "renderAs"]`

### 4. Documentation Updates

> **⚠️ IMPORTANT**: After any code change, check if you need to update:
> - This guidelines file
> - README.md  
> - Files in `doc/` directory

The project maintains comprehensive documentation - keep it current!

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