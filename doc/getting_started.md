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

import i18next from "i18next" // only needed if you want to use i18next to localize your validation messages

export default class Contract extends ContractBase {
  setConfig() { // optional - useful for setting up localization or other configurations
    // Set up custom localization callback (e.g., for i18next integration)
    this.contractConfig.customLocalization = ({translationKey, translationKeys, fallbackValue, context}) => {
      const key = translationKeys && translationKeys.length > 1 ? translationKeys : translationKey
      return i18next.t(key, { defaultValue: fallbackValue, ...context })
    }
  }
}
```

Inherit from your base class and define your contracts! That's it! Have Fun!

[back to root](../README.md#Documentation)