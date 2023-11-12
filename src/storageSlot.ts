/*
 * See layout at github.com/safe-global/safe-contracts/blob/v1.4.0/test/libraries/Safe.spec.ts
 */

import { Hex, concat, encodeAbiParameters, keccak256 } from 'viem'

export const slotSingleton = () => {
  const SLOT_0 =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  return SLOT_0
}

export const slotModule = (module: Hex) => {
  // modules -> mapping(address => address) internal modules;
  const SLOT_1 =
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [module, SLOT_1]
    )
  )
}

export const slotOwner = (owner: Hex) => {
  // owners -> mapping(address => address) internal owners;
  const SLOT_2 =
    '0x0000000000000000000000000000000000000000000000000000000000000002'
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'bytes32' }],
      [owner, SLOT_2]
    )
  )
}
export const slotOwnerCount = () => {
  const SLOT_3 =
    '0x0000000000000000000000000000000000000000000000000000000000000003'
  return SLOT_3
}
export const slotThreshold = () => {
  const SLOT_4 =
    '0x0000000000000000000000000000000000000000000000000000000000000004'
  return SLOT_4
}

export const slotNonce = () => {
  const SLOT_5 =
    '0x0000000000000000000000000000000000000000000000000000000000000005'
  return SLOT_5
}

export const slotSeparator = () => {
  const SLOT_6 =
    '0x0000000000000000000000000000000000000000000000000000000000000006'
  return SLOT_6
}

export const slotSignedMessage = (msgHash: Hex) => {
  // signedMessages -> mapping(bytes32 => uint256) internal signedMessages;
  const SLOT_7 =
    '0x0000000000000000000000000000000000000000000000000000000000000007'
  return keccak256(concat([msgHash, SLOT_7]))
}

export const slotApprovedHashes = (owner: Hex, msgHash: Hex) => {
  // approvedHashes -> mapping(address => mapping(bytes32 => uint256)) internal approvedHashes;
  const SLOT_8 =
    '0x0000000000000000000000000000000000000000000000000000000000000007'
  const left = msgHash
  const center = encodeAbiParameters([{ type: 'address' }], [owner])
  const right = SLOT_8

  return keccak256(concat([left, keccak256(concat([center, right]))]))
}

export const slotGuard = () => {
  return '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8'
}

export const slotFallback = () => {
  return '0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5'
}
