//github.com/safe-global/safe-contracts/blob/v1.4.0/test/libraries/Safe.spec.ts

import { concat, encodeAbiParameters, keccak256 } from 'viem'

export const SLOT_0 =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

// modules -> mapping(address => address) internal modules;
const SLOT_1 =
  '0x0000000000000000000000000000000000000000000000000000000000000001'
// owners -> mapping(address => address) internal owners;
const SLOT_2 =
  '0x0000000000000000000000000000000000000000000000000000000000000002'
export const SLOT_3 =
  '0x0000000000000000000000000000000000000000000000000000000000000003'
export const SLOT_4 =
  '0x0000000000000000000000000000000000000000000000000000000000000004'
export const SLOT_5 =
  '0x0000000000000000000000000000000000000000000000000000000000000005'
// signedMessages -> mapping(bytes32 => uint256) internal signedMessages;
const SLOT_7 =
  '0x0000000000000000000000000000000000000000000000000000000000000007'
// approvedHashes -> mapping(address => mapping(bytes32 => uint256)) internal approvedHashes;
const SLOT_8 =
  '0x0000000000000000000000000000000000000000000000000000000000000007'
export const SLOT_GUARD =
  '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8'
export const SLOT_FALLBACK =
  '0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5'

export const slotModules = (module: `0x${string}`) => {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [module, SLOT_1]
    )
  )
}

export const slotOwners = (owner: `0x${string}`) => {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [owner, SLOT_2]
    )
  )
}
export const slotSignedMessages = (msgHash: `0x${string}`) => {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [msgHash, SLOT_7]
    )
  )
}

export const slotApprovedHashes = (
  owner: `0x${string}`,
  msgHash: `0x${string}`
) => {
  const left = msgHash
  const center = encodeAbiParameters([{ type: 'address' }], [owner])
  const right = SLOT_8

  return keccak256(concat([left, keccak256(concat([center, right]))]))
}
