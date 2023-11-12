import dotenv from 'dotenv'

import {
  PublicClient,
  decodeAbiParameters,
  decodeFunctionResult,
  encodeFunctionData,
  getContract,
} from 'viem'

import multicallAbi, { address as multicallAddress } from './abis/multicall'
import safeAbi from './abis/safe'
import { SLOT_0, SLOT_FALLBACK, SLOT_GUARD } from './storageSlot'

dotenv.config()

const AddressOne = '0x0000000000000000000000000000000000000001'

export default async function (client: PublicClient, safe: `0x${string}`) {
  const contract = getContract({
    abi: multicallAbi,
    address: multicallAddress,
    publicClient: client,
  })

  const { result } = await contract.simulate.aggregate3([
    [
      // https://github.com/safe-global/safe-contracts/blob/main/test/libraries/Safe.spec.ts

      // 0
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getStorageAt',
          args: [BigInt(SLOT_0), BigInt(1)],
        }),
      },
      // slot1 modules
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getModulesPaginated',
          args: [AddressOne, BigInt(1000)],
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
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getStorageAt',
          args: [BigInt(SLOT_GUARD), BigInt(1)],
        }),
      },
      {
        target: safe,
        allowFailure: true,
        callData: encodeFunctionData({
          abi: safeAbi,
          functionName: 'getStorageAt',
          args: [BigInt(SLOT_FALLBACK), BigInt(1)],
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
    guard,
    fallback,
    blockNumber,
  }
}
