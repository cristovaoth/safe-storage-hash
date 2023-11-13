# Safe Storage Hash

A project that detects whether a deployed Safe has shadow storage values.

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

The issue of shadow safes has come to light recently on Twitter ([tweet](https://twitter.com/bkiepuszewski/status/1722287321997779427)).

This package handles detection by independently calculating the storage hash and then comparing it with the actual storage hash retrieved using eth_getProof. It pulls the necessary inputs from public contract functions and event logs for the calculation.

## Enhancing RPC Performance

Populate the .env values to speed up the script. Otherwise the public RPC URLs will be used, which is slower.
