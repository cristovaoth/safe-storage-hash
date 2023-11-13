import assert from 'assert'
import { Hex, PublicClient, decodeAbiParameters, toHex } from 'viem'

import { findSafeSingletonVersion } from '@/deployments'

export default async function querySafeVersion(
  client: PublicClient,
  safe: Hex,
  blockNumber: bigint
) {
  const chainId = client.chain?.id
  assert(typeof chainId == 'number')

  const storageValue = await client.getStorageAt({
    address: safe,
    slot: toHex(0),
    blockNumber,
  })
  if (!storageValue || storageValue == '0x') {
    return null
  }

  const [singleton] = decodeAbiParameters([{ type: 'address' }], storageValue)

  return findSafeSingletonVersion({ chainId, singleton })
}
