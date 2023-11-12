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

This package detects a shadow safe by calculating the expected storage hash based on public contract functions and event logs. It then compares it with the actual storage hash obtained from **eth_getProof**. If a difference exists, there are shadow storage writes.

## Enhancing RPC Performance

This package uses the public default network RPC URLs. Insert keys on .env to speed up the script.
