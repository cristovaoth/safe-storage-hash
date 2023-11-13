import assert from 'assert'
import { Hex, PublicClient, decodeAbiParameters, getAddress, toHex } from 'viem'

import {
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments'

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
  if (!storageValue) {
    return null
  }

  const network = String(chainId)
  const [singleton] = decodeAbiParameters([{ type: 'address' }], storageValue)

  return (
    versionMatch(singleton, network, '1.3.0') ||
    versionMatch(singleton, network, '1.4.1') ||
    versionMatch(singleton, network, '1.0.0') ||
    versionMatch(singleton, network, '1.1.1') ||
    versionMatch(singleton, network, '1.2.0')
  )
}

function versionMatch(singleton: Hex, network: string, version: string) {
  let deployment = getSafeSingletonDeployment({
    network,
    version,
  })

  if (
    deployment &&
    getAddress(deployment.networkAddresses[network]) == getAddress(singleton)
  ) {
    return deployment.version
  }

  deployment = getSafeL2SingletonDeployment({
    network,
    version,
  })
  if (
    deployment &&
    getAddress(deployment.networkAddresses[network]) == getAddress(singleton)
  ) {
    return deployment.version
  }

  return null
}
