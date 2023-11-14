import { Hex, PublicClient } from 'viem'
import { APPROVE_HASH, SIGN_MSG } from '../events'
import createRpcAggregator, { createReporter } from './createRpcAgregator'

export default async function querySafeEvents(
  publicClient: PublicClient,
  safe: Hex,
  fromBlock: bigint,
  toBlock: bigint
) {
  const fetch = createRpcAggregator(
    Number(fromBlock),
    Number(toBlock),
    (currFrom, currTo) =>
      publicClient.getLogs({
        fromBlock: BigInt(currFrom),
        toBlock: BigInt(currTo),
        address: safe,
      }),
    createReporter()
  )
  const logs = await fetch()

  return {
    signMsgEvents: logs.filter((log) => log.topics[0] == SIGN_MSG),
    approveHashEvents: logs.filter((log) => log.topics[0] == APPROVE_HASH),
  }
}
