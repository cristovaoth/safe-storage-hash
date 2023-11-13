import assert from 'assert'
import { toHex, isHash, Hex, Log } from 'viem'

import { decodeApproveHash, decodeSignMsg } from './events'
import {
  createAccountStorageTrie,
  slotApprovedHash,
  slotFallback,
  slotGuard,
  slotModule,
  slotNonce,
  slotOwner,
  slotOwnerCount,
  slotSeparator,
  slotSignedMessage,
  slotSingleton,
  slotThreshold,
} from './storageSlot'

export default async function calculateStorageHash({
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
}: {
  singleton: Hex
  modules: Hex[]
  owners: Hex[]
  threshold: bigint
  nonce: bigint
  separator: Hex
  signMsgEvents: Log[]
  approveHashEvents: Log[]
  guard: Hex
  fallback: Hex
}) {
  const moduleEntries = toSafeLinkedList(modules).map(([module, value]) => [
    slotModule(module),
    value,
  ])
  const ownerEntries = toSafeLinkedList(owners).map(([owner, value]) => [
    slotOwner(owner),
    value,
  ])
  const signedMessageEntries = signMsgEvents
    .map(decodeSignMsg)
    .map(({ msgHash }) => [slotSignedMessage(msgHash), 1])

  const approveHashEntries = approveHashEvents
    .map(decodeApproveHash)
    .map(({ owner, msgHash }) => [slotApprovedHash(owner, msgHash), 1])

  const entries = [
    [slotSingleton(), singleton],
    ...moduleEntries,
    ...ownerEntries,
    [slotOwnerCount(), owners.length],
    [slotThreshold(), threshold],
    [slotNonce(), nonce],
    [slotSeparator(), separator],
    ...signedMessageEntries,
    ...approveHashEntries,
    [slotGuard(), guard],
    [slotFallback(), fallback],
  ] as [Hex, Hex | bigint | number][]

  for (const [key] of entries) {
    assert(isHash(key) == true)
  }

  const trie = await createAccountStorageTrie(entries)

  return toHex(trie.root())
}

/*
 * Gets a collection and reconstructs the Safe-style linked list, used for
 * representing the owner/module pseudo-collections in smart contract storage
 */
function toSafeLinkedList(entries: Hex[]): [Hex, Hex][] {
  const SENTINEL = '0x0000000000000000000000000000000000000001'
  return new Array(entries.length + 1)
    .fill(null)
    .map((_, index) => [
      index == 0 ? SENTINEL : entries[index - 1],
      index == entries.length ? SENTINEL : entries[index],
    ])
}
