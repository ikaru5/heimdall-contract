[back to root](../../README.md#Documentation)

# isEmail Validator

The `isEmail` validator checks if a string input is a valid email address. This validator can be set to `true`, `false`, or a function returning `true` or `false`.

- `isEmail: true` — the value must be a valid email address.
- `isEmail: false` — the value must **not** be an email address.

## Basic Usage

```javascript
{
  fieldName: {dType: "String", isEmail: true}
}
```

In the above example, `fieldName` must be a valid email address. If it is not, the validation will fail.

## Dynamic Validation

```javascript
{
  fieldName: {dType: "String", isEmail: (value, contract, dType, depth) => contract.contactType === "email"}
}
```

In this case, a function is provided that returns `true` or `false`.
This allows for dynamic determination based on the current state of the field value, the contract, the datatype, and the depth.

## What Counts as a Valid Email Address?

`isEmail` uses the [WHATWG HTML specification definition](https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address) of a valid email address — the same definition browsers use for `<input type="email">`. In particular this means:

- Plus addressing is valid: `user+tag@example.com`
- Top-level domains of any length are valid: `user@company.systems`
- Dotless domains are considered valid, just like in browsers: `user@localhost`. If you need to require a dot in the domain, add an additional [match](match.md) validation.
- Internationalized addresses (e.g. umlauts) are not matched; they need to be punycode-encoded first, which is also the behavior of browser email inputs.

The underlying regular expression runs in linear time, so it is safe to use on untrusted input (no catastrophic backtracking / ReDoS).

## Validation Error Messages

The default error message is "must be a valid E-Mail" for `isEmail: true` and "must not be an E-Mail" for `isEmail: false`.

These messages can be localized using the translation keys `errors:isEmail.true` and `errors:isEmail.false` through your `customLocalization` callback.

[back to root](../../README.md#Documentation)
