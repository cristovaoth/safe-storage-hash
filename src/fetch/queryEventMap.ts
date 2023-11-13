import { Hex, Log, PublicClient, getAddress, parseAbiItem } from 'viem'
import createFetchAggregator from './createFetchAgregator'

export default async function queryEventMap(
  publicClient: PublicClient,
  fromBlock: bigint,
  toBlock: bigint
) {
  console.log('Creating EventMap for all Safes')
  const result = new Map<
    Hex,
    { signMsgEvents: Log[]; approveHashEvents: Log[] }
  >()

  const fetchSignMsg = createFetchAggregator(
    Number(fromBlock),
    Number(toBlock),
    (currFrom, currTo) =>
      publicClient.getLogs({
        fromBlock: BigInt(currFrom),
        toBlock: BigInt(currTo),
        event: parseAbiItem('event SignMsg(bytes32)'),
      }),
    createReporter()
  )

  console.log('Fetching all SignMsg events...')
  for (const log of await fetchSignMsg()) {
    const address = getAddress(log.address)
    if (!result.has(address)) {
      result.set(address, { signMsgEvents: [], approveHashEvents: [] })
    }
    result.get(address)?.signMsgEvents.push(log)
  }

  const fetchAproveHash = createFetchAggregator(
    Number(fromBlock),
    Number(toBlock),
    (currFrom, currTo) =>
      publicClient.getLogs({
        fromBlock: BigInt(currFrom),
        toBlock: BigInt(currTo),
        event: parseAbiItem('event ApproveHash(bytes32,address)'),
      }),
    createReporter()
  )

  console.log('Fetching all ApproveHash events...')
  for (const log of await fetchAproveHash()) {
    const address = getAddress(log.address)
    if (!result.has(address)) {
      result.set(address, { signMsgEvents: [], approveHashEvents: [] })
    }
    result.get(address)?.approveHashEvents.push(log)
  }

  return result
}

function createReporter() {
  const set = new Set<number>()

  return ({ to, currTo }: { to: number; currTo: number }) => {
    const progress = Math.floor((currTo * 100) / to)
    const rounded = Math.floor(progress / 10) * 10

    if (rounded == 0 || (rounded == 100 && set.size == 0) || set.has(rounded)) {
      return
    }

    set.add(rounded)
    console.info(`Fetched ${rounded}%`)
  }
}