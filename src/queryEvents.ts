import { PublicClient } from 'viem'
import { APPROVE_HASH, SIGN_MSG } from './queries/topics'

export async function queryEvents(
  publicClient: PublicClient,
  safe: `0x${string}`
) {
  const logs = await publicClient.getLogs({
    fromBlock: BigInt(0),
    address: safe,
  })

  return {
    signMsgEvents: logs.filter((log) => log.topics[0] == SIGN_MSG),
    approveHashEvents: logs.filter((log) => log.topics[0] == APPROVE_HASH),
  }
}
