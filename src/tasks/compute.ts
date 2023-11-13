import { Hex, PublicClient } from 'viem'

import createClient from '@/fetch/createClient'
import ethGetProof from '@/fetch/eth_getProof'
import querySafeEvents from '@/fetch/querySafeEvents'
import querySafeStorage from '@/fetch/querySafeStorage'
import querySafeVersion from '@/fetch/querySafeVersion'

import calculateStorageHash from '@/calculate'

import parseInput from './parseInput'

async function run(publicClient: PublicClient, safe: Hex) {
  const blockNumber = await publicClient.getBlockNumber()
  const version = await querySafeVersion(publicClient, safe, blockNumber)
  if (!version) {
    console.error(`Address ${safe} is not a Safe`)
    return
  }
  console.info(
    `Safe is v${version} in ${publicClient.chain?.name} (chainId ${publicClient.chain?.id})`
  )
  if (!['1.3.0', '1.4.1'].includes(version)) {
    console.error(`v${version} is not supported`)
    return
  }

  console.info(`fetching storage values...`)
  const {
    singleton,
    modules,
    owners,
    threshold,
    nonce,
    separator,
    guard,
    fallback,
  } = await querySafeStorage(publicClient, safe, blockNumber)

  console.log(`fetching events...`)
  const { signMsgEvents, approveHashEvents } = await querySafeEvents(
    publicClient,
    safe,
    BigInt(0),
    blockNumber
  )
  console.info(`fetching eth_getProof...`)
  const storageHash = await ethGetProof(publicClient, safe, blockNumber)
  const calculatedStorageHash = await calculateStorageHash({
    singleton,
    modules,
    owners,
    threshold,
    nonce,
    separator,
    signMsgEvents,
    approveHashEvents,
    guard,
    fallback,
  })
  console.info('Expected : ' + calculatedStorageHash)
  console.info('Actual   : ' + storageHash)
  if (storageHash == calculatedStorageHash) {
    console.info(`\x1B[32m✔ Hashes match \x1B[0m`)
  } else {
    console.info('\x1B[31m✘ \x1B[0m')
  }
}

const { safe, chain } = parseInput(process.argv)
run(createClient(chain), safe)
