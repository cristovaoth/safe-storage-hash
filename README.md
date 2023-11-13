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

## Calculating Storage Hash for a Safe

The issue of shadow safes has come to light recently on Twitter ([tweet](https://twitter.com/bkiepuszewski/status/1722287321997779427)).

This package handles detection by independently calculating a Safe's storage hash and comparing it with the value retrieved via [**eth_getProof**](https://docs.infura.io/networks/ethereum/json-rpc-methods/eth_getproof). The calculation pulls the necessary inputs from public contract functions and event logs.

## Make it quicker

Populate the **.env** values to speed up the script. Otherwise public RPC urls will be used.
