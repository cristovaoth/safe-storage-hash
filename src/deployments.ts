import {
  SingletonDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments'
import assert from 'assert'
import { Hex, getAddress } from 'viem'

export function proxyFactoryAddress({
  chainId,
  version,
}: {
  chainId: number
  version: string
}): Hex | null {
  return deploymentToAddress(
    getProxyFactoryDeployment({
      version: version,
      network: String(chainId),
      released: true,
    }),
    chainId
  )
}

const cache = new Map<string, string>()
export function findSafeSingletonVersion({
  chainId,
  singleton,
}: {
  chainId: number
  singleton: Hex
}) {
  const key = `${chainId}-${singleton}`
  if (cache.has(key)) {
    return cache.get(key)
  }

  const version = _findSafeSingletonVersion({ chainId, singleton })
  if (version) {
    cache.set(key, version)
  }

  return version
}

function _findSafeSingletonVersion({
  chainId,
  singleton,
}: {
  chainId: number
  singleton: Hex
}) {
  if (
    singleton == safeSingletonAddress({ chainId, version: '1.0.0' }) ||
    singleton == safeL2SingletonAddress({ chainId, version: '1.0.0' })
  ) {
    return '1.0.0'
  }

  if (
    singleton == safeSingletonAddress({ chainId, version: '1.1.1' }) ||
    singleton == safeL2SingletonAddress({ chainId, version: '1.1.1' })
  ) {
    return '1.1.1'
  }

  if (
    singleton == safeSingletonAddress({ chainId, version: '1.2.0' }) ||
    singleton == safeL2SingletonAddress({ chainId, version: '1.2.0' })
  ) {
    return '1.2.0'
  }

  if (
    singleton == safeSingletonAddress({ chainId, version: '1.3.0' }) ||
    singleton == safeL2SingletonAddress({ chainId, version: '1.3.0' })
  ) {
    return '1.3.0'
  }

  if (
    singleton == safeSingletonAddress({ chainId, version: '1.4.1' }) ||
    singleton == safeL2SingletonAddress({ chainId, version: '1.4.1' })
  ) {
    return '1.4.1'
  }

  return null
}

function safeSingletonAddress({
  chainId,
  version,
}: {
  chainId: number
  version: string
}): Hex | null {
  return deploymentToAddress(
    getSafeSingletonDeployment({
      network: String(chainId),
      version,
      released: true,
    }),
    chainId
  )
}

function safeL2SingletonAddress({
  chainId,
  version,
}: {
  chainId: number
  version: string
}): Hex | null {
  return deploymentToAddress(
    getSafeL2SingletonDeployment({
      network: String(chainId),
      version,
      released: true,
    }),
    chainId
  )
}

function deploymentToAddress(
  deployment: SingletonDeployment | undefined,
  chainId: number
): Hex | null {
  if (!deployment) {
    return null
  }

  const result = deployment.networkAddresses[String(chainId)]
  assert(typeof result == 'string')
  return getAddress(result)
}
