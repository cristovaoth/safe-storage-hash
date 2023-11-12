import assert from 'assert'

import {
  Hex,
  PublicClient,
  decodeAbiParameters,
  decodeFunctionResult,
  encodeFunctionData,
  getAddress,
  getContract,
  toHex,
} from 'viem'

import {
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments'

import multicallAbi, { address as multicallAddress } from '../abis/multicall'
import safeAbi from '../abis/safe'
import {
  slotFallback,
  slotGuard,
  slotSeparator,
  slotSingleton,
} from '../storageSlot'

const SENTINEL = '0x0000000000000000000000000000000000000001'

export async function querySafeStorage(client: PublicClient, safe: Hex) {
  const multicall = getContract({
    abi: multicallAbi,
    address: multicallAddress,
    publicClient: client,
  })

  const { result } = await multicall.simulate.aggregate3([
    [
      // https://github.com/safe-global/safe-contracts/blob/main/test/libraries/Safe.spec.ts
      // 0
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getStorageAt',
          args: [BigInt(slotSingleton()), BigInt(1)],
        }),
      },
      // slot1 modules
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getModulesPaginated',
          args: [SENTINEL, BigInt(10000)],
        }),
      },
      // slot2 owners
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getOwners',
        }),
      },
      // slot4 threshold
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getThreshold',
        }),
      },
      // slot5 nonce
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'nonce',
        }),
      },
      // slot6 separator
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getStorageAt',
          args: [BigInt(slotSeparator()), BigInt(1)],
        }),
      },
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getStorageAt',
          args: [BigInt(slotGuard()), BigInt(1)],
        }),
      },
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getStorageAt',
          args: [BigInt(slotFallback()), BigInt(1)],
        }),
      },
      {
        target: multicallAddress,
        allowFailure: false,
        callData: encodeFunctionData({
          abi: multicallAbi,
          functionName: 'getBlockNumber',
        }),
      },
    ],
  ])

  const [
    { returnData: singletonResult },
    { returnData: modulesResult },
    { returnData: ownersResult },
    { returnData: thresholdResult },
    { returnData: nonceResult },
    { returnData: separatorResult },
    { returnData: guardResult },
    { returnData: fallbackResult },
    { returnData: blockNumberResult },
  ] = result

  const [singleton] = decodeAbiParameters(
    [{ type: 'address' }],
    decodeFunctionResult({
      abi: safeAbi,
      functionName: 'getStorageAt',
      data: singletonResult,
    })
  )

  const [modules] = decodeFunctionResult({
    abi: safeAbi,
    functionName: 'getModulesPaginated',
    data: modulesResult,
  })

  const owners = decodeFunctionResult({
    abi: safeAbi,
    functionName: 'getOwners',
    data: ownersResult,
  })

  const threshold = decodeFunctionResult({
    abi: safeAbi,
    functionName: 'getThreshold',
    data: thresholdResult,
  })

  const nonce = decodeFunctionResult({
    abi: safeAbi,
    functionName: 'nonce',
    data: nonceResult,
  })

  const [separator] = decodeAbiParameters(
    [{ type: 'bytes32' }],
    decodeFunctionResult({
      abi: safeAbi,
      functionName: 'getStorageAt',
      data: separatorResult,
    })
  )

  const [guard] = decodeAbiParameters(
    [{ type: 'address' }],
    decodeFunctionResult({
      abi: safeAbi,
      functionName: 'getStorageAt',
      data: guardResult,
    })
  )

  const [fallback] = decodeAbiParameters(
    [{ type: 'address' }],
    decodeFunctionResult({
      abi: safeAbi,
      functionName: 'getStorageAt',
      data: fallbackResult,
    })
  )

  const blockNumber = decodeFunctionResult({
    abi: multicallAbi,
    functionName: 'getBlockNumber',
    data: blockNumberResult,
  })

  return {
    singleton,
    modules: [...modules],
    owners: [...owners],
    threshold,
    nonce,
    separator,
    guard,
    fallback,
    blockNumber,
  }
}

export async function querySafeVersion(client: PublicClient, safe: Hex) {
  const chainId = client.chain?.id
  assert(typeof chainId == 'number')

  const storageValue = await client.getStorageAt({
    address: safe,
    slot: toHex(0),
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
