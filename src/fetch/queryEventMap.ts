import { Hex, Log, PublicClient, getAddress, parseAbiItem } from 'viem'
import createFetchAggregator, { createReporter } from './createFetchAgregator'

export default async function queryEventMap(
  publicClient: PublicClient,
  fromBlock: bigint,
  toBlock: bigint
) {
  console.log('Creating global EventMap')
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

  const fetchApproveHash = createFetchAggregator(
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
  for (const log of await fetchApproveHash()) {
    const address = getAddress(log.address)
    if (!result.has(address)) {
      result.set(address, { signMsgEvents: [], approveHashEvents: [] })
    }
    result.get(address)?.approveHashEvents.push(log)
  }

  return result
}
