# Calculate Safe Storage Hash

A project that detects whether a deployed Safe has experienced shadow storage writes.

## Installation

```bash
yarn install
```

## Usage

```bash
yarn compute {safe-address} {network-name-or-id}

# example with network name
yarn compute 0x757e00a88b4cB59D614800f56B6D19Ac8ED2ee3a gnosis

# example with chain id
yarn compute 0xF4BC398d1A3dE41B753cA9a3E16d599C265B9EB2 100
```

## About Storage Hash Calculating

The issue of shadow safes has come to light recently on Twitter (refer to this [Tweet](https://twitter.com/bkiepuszewski/status/1722287321997779427)).

This package detects a shadow safe through reverse engineering, determining the expected storage state based on public contract functions and event logs. It then compares this derived storage hash with the actual storage hash obtained from **eth_getProof**. If a difference exists, it indicates the existence of shadow storage writes.

## Enhancing RPC Performance

This package uses the default RPC URLs for each network. To speed up calculations on networks supported by Alchemy or Infura, insert the corresponding key in the .env file.

```env
# put either one in your .env file for faster answers
INFURA_API_KEY=
ALCHEMY_API_KEY=
```
