import { Hex, PublicClient } from 'viem'

import ethGetProof from '@/fetch/eth_getProof'
import { querySafeEvents } from '@/fetch/queryEvents'
import { querySafeStorage, querySafeVersion } from '@/fetch/queryContract'

import calculateStorageHash from '@/calculate'

import parseInput from './parseInput'
import createClient from '@/fetch/createClient'

async function run(publicClient: PublicClient, safe: Hex) {
  const version = await querySafeVersion(publicClient, safe)
  if (!version) {
    console.error(`Address ${safe} is not a Safe`)
    return
  }
  console.info(
    `Safe is v${version} in ${publicClient.chain?.name} (chainId ${publicClient.chain?.id})`
  )
  if (version != '1.3.0' && version != '1.4.1') {
    console.error(`Safe v${version} is not supported`)
    return
  }
  console.log(`fetching storage values...`)
  const {
    singleton,
    modules,
    owners,
    threshold,
    nonce,
    separator,
    guard,
    fallback,
    blockNumber,
  } = await querySafeStorage(publicClient, safe)
  console.log(`fetching events...`)
  const { signMsgEvents, approveHashEvents } = await querySafeEvents(
    publicClient,
    safe,
    BigInt(0),
    blockNumber,
    true
  )
  console.log(`fetching eth_getProof...`)
  const storageHash = await ethGetProof(publicClient, safe, blockNumber)
  const calculated = await calculateStorageHash({
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
  console.log('Expected : ' + calculated)
  console.log('Actual   : ' + storageHash)
}

const { safe, chain } = parseInput(process.argv)
run(createClient(chain), safe)
