import assert from 'assert'
import { Log, decodeAbiParameters, keccak256, toBytes } from 'viem'

export const SAFE_PROXY_CREATION = keccak256(
  toBytes('ProxyCreation(address,address)')
)

export const APPROVE_HASH = keccak256(toBytes('ApproveHash(address,address)'))
export const SIGN_MSG = keccak256(toBytes('SignMsg(bytes32)'))

export function decodeSafeProxyCreation(log: Log) {
  assert(log.topics[0] == SAFE_PROXY_CREATION)

  /*
   *
   * v1.3 has no indexed argument
   * v1.4 indexes the first argument
   *
   */
  if (log.topics.length == 1) {
    const [proxy, singleton] = decodeAbiParameters(
      [{ type: 'address' }, { type: 'address' }],
      log.data
    )
    return { proxy, singleton, blockNumber: Number(log.blockNumber) }
  } else {
    assert(log.topics.length == 2)
    const [proxy] = decodeAbiParameters([{ type: 'address' }], log.topics[1])
    const [singleton] = decodeAbiParameters([{ type: 'address' }], log.data)
    return { proxy, singleton, blockNumber: Number(log.blockNumber) }
  }
}

export function decodeApproveHash(log: Log) {
  assert(log.topics[0] == APPROVE_HASH)
  assert(log.topics.length == 3)

  const [msgHash] = decodeAbiParameters([{ type: 'bytes32' }], log.topics[1])
  const [owner] = decodeAbiParameters([{ type: 'address' }], log.topics[2])

  return { owner: owner, msgHash }
}

export function decodeSignMsg(log: Log) {
  assert(log.topics[0] == SIGN_MSG)
  assert(log.topics.length == 2)

  const [msgHash] = decodeAbiParameters([{ type: 'bytes32' }], log.topics[1])

  return { msgHash }
}
