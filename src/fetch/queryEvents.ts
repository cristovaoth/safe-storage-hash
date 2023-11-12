import { Hex, PublicClient } from 'viem'
import { APPROVE_HASH, SIGN_MSG } from '../abis/events'
import createFetchAggregator from './createFetchAgregator'

export async function querySafeEvents(
  publicClient: PublicClient,
  safe: Hex,
  fromBlock: bigint,
  toBlock: bigint,
  progress: boolean = false
) {
  const fetch = createFetchAggregator(
    Number(fromBlock),
    Number(toBlock),
    (currFrom, currTo) =>
      publicClient.getLogs({
        fromBlock: BigInt(currFrom),
        toBlock: BigInt(currTo),
        address: safe,
      }),
    progress ? createReporter() : undefined
  )
  const logs = await fetch()

  return {
    signMsgEvents: logs.filter((log) => log.topics[0] == SIGN_MSG),
    approveHashEvents: logs.filter((log) => log.topics[0] == APPROVE_HASH),
  }
}

function createReporter() {
  const set = new Set<number>()

  return ({
    from,
    to,
    currFrom,
    currTo,
  }: {
    from: number
    to: number
    currFrom: number
    currTo: number
  }) => {
    const progress = Math.floor((currTo * 100) / to)
    const rounded = Math.floor(progress / 10) * 10

    if (rounded == 0 || (rounded == 100 && set.size == 0) || set.has(rounded)) {
      return
    }

    set.add(rounded)
    console.info(`Fetched ${rounded}%`)
  }
}
