# Forta Agent for Phishing Attacks via ERC20 approvals

## Description

Transferring tokens to Web3 applications usually requires an approve transaction before the actual transfer, since the contract needs the right to pull funds from the user and use them on its behalf. Given said that, having users approving token transfers to contracts is a regular behavior. However, approving token transfers to EOAs (Externally Owned Account) addresses can be considered as a suspicious behavior since this kind of transaction is not needed for tokens transfers between EOAs.

Making token transfer approvals to EOAs has been seen as a characteristic behavior of phishing attacks on Web3 applications, like the one happened to [BadgerDAO](https://rekt.news/badger-rekt/) on December 2021. In that case, the front-end was manipulated in the way users were approving token transfers to the attacker's EOA address instead of the correct contract address. The attacker was able to drain over $120 million in various forms of wBTC and ERC20 assets.

This agent detects ERC20 token transfers approvals to EOAs addresses. It takes into account two kind of approvals:

1. `function approve(address spender, uint256 amount)`: the sender of the transaction approves the `spender` to move `amount` of tokens on its behalf.
2. `function increaseAllowance(address spender, uint256 addedValue)`: the sender of the transaction increases the allowance granted to the `spender` in `addedValue` tokens.

If there are more than **10** approvals during the fixed period of time of **1 day**, the behavior is considered as suspicious and thus, a possible **ERC20 Phishing Attack**.

## Configuration

The agent allows to configure two parameters used to identify suspicious behaviors:

- MINIMUM_NUMBER_OF_APPROVALS: It is the minimum number of token transfer approvals to EOA addresses in order to consider a behavior as suspicious (10 by default).
- OBSERVATION_PERIOD_DURATION: It is the period duration (in blocks) of observation of token transfer approvals (6000 blocks by default, which is around 1 day).

Therefore, the agent will trigger an alert if it detects more than `MINIMUM_NUMBER_OF_APPROVALS` during the period of time given by `OBSERVATION_PERIOD_DURATION`. You can find the configuration file of these parameters [here](src/config.ts),

## Supported Chains

- Ethereum
- List any other chains this agent can support e.g. BSC

## Alerts

Describe each of the type of alerts fired by this agent

- ERC20-PHISHING-ATTACK-1

  - Fired when a suspicious behavior has been detected: more than _10 token transfer approvals have been made during a day_.
  - Severity is always set to `high` since further investigation should be done
  - Type is always set to `suspicious`
  - Additional metadata fields:

    - `asset`: the address of the ERC20 asset involved
    - `attackerAddress`: the EOA address was allowed to pull assets from the users
    - `startingAtBlock`: the block number the suspicious behavior has been started at
    - `affectedAddressesJSON`: a JSON object with the list of affected addresses in the form of: `[[address, amount]]`

## Try it out yourself

- `npm run block 9842772`, in Rinkeby and using `MINIMUM_NUMBER_OF_APPROVALS = 1` will trigger the following alert:
```JSON
{
  "name": "ERC20 Phishing Attack via Approvals",
  "description": "Evidence of Phishing Attack. Suspicious behavior detected: more than 0 users approved token transfers to a same EOA target over one day",
  "alertId": "ERC20-PHISHING-ATTACK-1",
  "protocol": "ethereum",
  "severity": "High",
  "type": "Suspicious",
  "metadata": {
    "asset": "0x6a9865ade2b6207daac49f8bcba9705deb0b0e6d",
    "attackerAddress": "0xBc281b36D91Aa9c7a6D0eF6312845c01c4666a7c",
    "startingAtBlock": "9842772",
    "affectedAddressesJSON": "[[\"0xbc281b36d91aa9c7a6d0ef6312845c01c4666a7c\",\"-1\"],[\"0x75ef3f79d945a00765d0e23277c9774599ff3f2c\",\"10000000000000000000\"]]"
  }
}
```
- `npm run tx 0x5e4c7966b0eaddaf63f1c89fc1c4c84812905ea79c6bee9d2ada2d2e5afe1f34`, in Mainnet and  `MINIMUM_NUMBER_OF_APPROVALS = 0` will trigger the following alert:
```JSON
{
  "name": "ERC20 Phishing Attack via Approvals",
  "description": "Evidence of Phishing Attack. Suspicious behavior detected: more than 0 users approved token transfers to a same EOA target over one day",
  "alertId": "ERC20-PHISHING-ATTACK-1",
  "protocol": "ethereum",
  "severity": "High",
  "type": "Suspicious",
  "metadata": {
    "asset": "0x4b92d19c11435614cd49af1b589001b7c08cd4d5",
    "attackerAddress": "0x1FCdb04d0C5364FBd92C73cA8AF9BAA72c269107",
    "startingAtBlock": "13722487",
    "affectedAddressesJSON": "[[\"0x53461e4fddcc1385f1256ae24ce3505be664f249\",\"-1\"]]"
  }
}
```


- `npm run range 13727733..13831811` in Mainnet to detect the BadgerDAO attack

