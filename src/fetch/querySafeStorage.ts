import {
  Hex,
  PublicClient,
  decodeAbiParameters,
  decodeFunctionResult,
  encodeFunctionData,
  getContract,
  zeroAddress,
} from 'viem'

import multicallAbi, { address as multicallAddress } from '../abis/multicall'
import safeAbi from '../abis/safe'
import {
  slotFallback,
  slotGuard,
  slotSeparator,
  slotSingleton,
} from '../storageSlot'

const SENTINEL: Hex = '0x0000000000000000000000000000000000000001'
const ZERO_HASH: Hex =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

export default async function querySafeStorage(
  client: PublicClient,
  safe: Hex,
  blockNumber: bigint
) {
  const multicall = getContract({
    abi: multicallAbi,
    address: multicallAddress,
    publicClient: client,
  })

  const { result } = await multicall.simulate.aggregate3(
    [
      [
        {
          target: safe,
          allowFailure: true,
          callData: encodeFunctionData({
            abi: safeAbi,
            functionName: 'getStorageAt',
            args: [BigInt(slotSingleton()), BigInt(1)],
          }),
        },
        {
          target: safe,
          allowFailure: true,
          callData: encodeFunctionData({
            abi: safeAbi,
            functionName: 'getModulesPaginated',
            args: [SENTINEL, BigInt(10000)],
          }),
        },
        {
          target: safe,
          allowFailure: true,
          callData: encodeFunctionData({
            abi: safeAbi,
            functionName: 'getOwners',
          }),
        },
        {
          target: safe,
          allowFailure: true,
          callData: encodeFunctionData({
            abi: safeAbi,
            functionName: 'getThreshold',
          }),
        },
        {
          target: safe,
          allowFailure: true,
          callData: encodeFunctionData({
            abi: safeAbi,
            functionName: 'nonce',
          }),
        },
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
      ],
    ],
    { blockNumber }
  )

  const [
    { success, returnData: singletonResult },
    { returnData: modulesResult },
    { returnData: ownersResult },
    { returnData: thresholdResult },
    { returnData: nonceResult },
    { returnData: separatorResult },
    { returnData: guardResult },
    { returnData: fallbackResult },
  ] = result

  if (!success) {
    // this might happen when script is fed an address which is not a safe
    return {
      singleton: zeroAddress,
      modules: [],
      owners: [],
      threshold: BigInt(0),
      nonce: BigInt(0),
      separator: ZERO_HASH,
      guard: zeroAddress,
      fallback: zeroAddress,
      blockNumber: BigInt(0),
    }
  }

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

  return {
    singleton,
    modules: [...modules],
    owners: [...owners],
    threshold,
    nonce,
    separator,
    guard,
    fallback,
  }
}
