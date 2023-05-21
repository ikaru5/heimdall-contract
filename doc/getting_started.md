[back to root](../README.md#Documentation)

# Getting Started

It is dead simple to use this library. ;)

## Installation

NPM

```bash
npm install @ikaru5/heimdall-contract
```

Yarn

```bash
yarn add @ikaru5/heimdall-contract
```

Create a base class for your contracts:

```Javascript
import ContractBase from "@ikaru5/heimdall-contract"

import i18n from "i18next" // only needed if you want to use i18next to localize your validation messages

export default class Contract extends ContractBase {
  setConfig() { // again only needed if you want to use i18next, but might be useful for other things in the future too
    this.contractConfig.localizationMethod = "i18next"
    this.contractConfig.i18next = i18n
  }
}
```

Inherit from your base class and define your contracts! That's it! Have Fun!

[back to root](../README.md#Documentation)