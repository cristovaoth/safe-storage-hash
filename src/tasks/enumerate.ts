import path from 'path'
import fs from 'fs'

import { Chain, PublicClient } from 'viem'
import { mainnet } from 'viem/chains'

import { SAFE_PROXY_CREATION, decodeSafeProxyCreation } from '../events'
import createFetchAggregator, {
  createReporter,
} from '../fetch/createFetchAgregator'
import createClient from '../fetch/createClient'
import { proxyFactoryAddress } from '@/deployments'
import { parseNetworkInput } from './parseInput'

type SafeDeployment = {
  address: `0x${string}`
  mastercopy: `0x${string}`
  blockNumber: number
}

async function run(chain: Chain) {
  const publicClient = createClient(mainnet)

  const to = Number(await publicClient.getBlockNumber())

  let result: SafeDeployment[] = []

  let factory = proxyFactoryAddress({
    chainId: publicClient.chain.id,
    version: '1.3.0',
  })
  if (factory) {
    result = [
      ...result,
      ...(await listSafesFromFactory(publicClient, factory, to)),
    ]
  }

  factory = proxyFactoryAddress({
    chainId: publicClient.chain.id,
    version: '1.4.1',
  })
  if (factory) {
    result = [
      ...result,
      ...(await listSafesFromFactory(publicClient, factory, to)),
    ]
  }

  result = result.sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : 1))

  const outputPath = path.join(
    __dirname,
    '..',
    '..',
    'artifacts',
    'safes',
    `${publicClient.chain.id}.json`
  )
  console.log(`Writing safes into ${outputPath}`)
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
}

async function listSafesFromFactory(
  client: PublicClient,
  factory: `0x${string}`,
  blockTo: number
): Promise<SafeDeployment[]> {
  console.log(`Finding Safes created by ${factory}`)

  const fetch = createFetchAggregator(
    0,
    blockTo,
    async (currFrom, currTo) =>
      (
        await client.getLogs({
          fromBlock: BigInt(currFrom),
          toBlock: BigInt(currTo),
          address: factory,
        })
      )
        .filter((log) => log.topics[0] == SAFE_PROXY_CREATION)
        .map(decodeSafeProxyCreation)
        .map(({ proxy, singleton, blockNumber }) => ({
          address: proxy,
          mastercopy: singleton,
          blockNumber,
        })),
    createReporter()
  )
  const result = await fetch()

  console.log(`Found ${result.length} Safes from factory ${factory}`)

  return result
}

run(parseNetworkInput(process.argv))
