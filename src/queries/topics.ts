import assert from 'assert'
import { Log, decodeAbiParameters, keccak256, toBytes } from 'viem'
import { EthLogEntry } from './ethGetLogs'

export const TRANSFER_SIGNATURE = keccak256(
  toBytes('Transfer(address,address,uint256)')
)

export const APPROVAL_SIGNATURE = keccak256(
  toBytes('Approval(address,address,uint256)')
)

export const SAFE_PROXY_CREATION = keccak256(
  toBytes('ProxyCreation(address,address)')
)

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
    return { proxy, singleton }
  } else {
    assert(log.topics.length == 2)
    const [proxy] = decodeAbiParameters([{ type: 'address' }], log.topics[1])
    const [singleton] = decodeAbiParameters([{ type: 'address' }], log.data)
    return { proxy, singleton }
  }
}

export const SAFE_SETUP = keccak256(
  toBytes('SafeSetup(address,address[],uint256,address,address)')
)

export function decodeSafeSetup(log: EthLogEntry) {
  assert(log.topics[0] == SAFE_SETUP)

  const [owners, threshold, , fallbackHandler] = decodeAbiParameters(
    [
      { type: 'address[]' },
      { type: 'uint256' },
      { type: 'address' },
      { type: 'address' },
    ],
    log.data as `0x${string}`
  )

  return { owners: [...owners], threshold, fallbackHandler }
}

export const APPROVE_HASH = keccak256(toBytes('ApproveHash(address,address)'))
export function decodeApproveHash(log: Log) {
  assert(log.topics[0] == APPROVE_HASH)
  assert(log.topics.length == 3)

  const [approvedHash] = decodeAbiParameters(
    [{ type: 'bytes32' }],
    log.topics[1]
  )
  const [owner] = decodeAbiParameters([{ type: 'address' }], log.topics[2])

  return { approvedHash, owner }
}

export const SIGN_MSG = keccak256(toBytes('SignMsg(bytes32)'))
export function decodeSignMsg(log: Log) {
  assert(log.topics[0] == SIGN_MSG)
  assert(log.topics.length == 2)

  const [msgHash] = decodeAbiParameters([{ type: 'bytes32' }], log.topics[1])

  return { msgHash }
}
