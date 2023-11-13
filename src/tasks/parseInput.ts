import { Chain, Hex, getAddress, isAddress } from 'viem'
import * as chains from 'viem/chains'

export default function parseInput(argv: string[]): {
  safe: Hex
  chain: Chain
} {
  const left = argv.length > 2 ? argv[argv.length - 2] : ''
  const right = argv.length > 1 ? argv[argv.length - 1] : ''

  if (isAddress(left) && isAddress(right)) {
    throw new Error('Bad Arguments. Expected safe-address [network]')
  }

  if (!isAddress(left) && !isAddress(right)) {
    throw new Error('Bad Arguments. Expected safe-address [network]')
  }

  const safe = isAddress(left) ? getAddress(left) : getAddress(right)
  let chain = toChain(left) || toChain(right)

  if (!chain) {
    console.warn('Using mainnet as default network')
    chain = chains.mainnet
  }

  return { safe, chain }
}

export function parseNetworkInput(argv: string[]): Chain {
  const last = argv[argv.length - 1]

  const chain = toChain(last)
  if (!chain) {
    console.warn('Using mainnet as default network')
    return chains.mainnet
  }

  return chain
}

function toChain(network: string) {
  network = network.toLowerCase()

  if (network == 'mainnet') {
    return chains.mainnet
  }

  for (const chain of Object.values(chains)) {
    if (String(chain.name).toLowerCase() == network) {
      return chain
    }

    if (String(chain.network).toLowerCase() == network) {
      return chain
    }

    if (chain.id == Number(network)) {
      return chain
    }
  }
  return null
}
