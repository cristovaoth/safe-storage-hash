import { Hex, Log, toBytes, toHex, toRlp } from 'viem'
import { Trie } from '@ethereumjs/trie'

import { decodeApproveHash, decodeSignMsg } from './abis/events'
import {
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
  const moduleEntries = reconstructLinkedList(modules).map(([key, value]) => [
    slotModule(key),
    BigInt(value),
  ])
  const ownerEntries = reconstructLinkedList(owners).map(([key, value]) => [
    slotOwner(key),
    BigInt(value),
  ])
  const signedMessageEntries = signMsgEvents
    .map(decodeSignMsg)
    .map(({ msgHash }) => [slotSignedMessage(msgHash), BigInt(1)])

  const approveHashEntries = approveHashEvents
    .map(decodeApproveHash)
    .map(({ owner, msgHash }) => [slotApprovedHash(owner, msgHash), BigInt(1)])

  const entries = [
    [slotSingleton(), BigInt(singleton)],
    ...moduleEntries,
    ...ownerEntries,
    [slotOwnerCount(), BigInt(owners.length)],
    [slotThreshold(), BigInt(threshold)],
    [slotNonce(), BigInt(nonce)],
    [slotSeparator(), BigInt(separator)],
    ...signedMessageEntries,
    ...approveHashEntries,
    [slotGuard(), BigInt(guard)],
    [slotFallback(), BigInt(fallback)],
  ]

  const entriesRLP = entries.map(([key, value]) => [
    toBytes(key),
    toBytes(toRlp(toHex(value))),
  ])

  const trie = await Trie.create({ useKeyHashing: true })
  for (const [key, value] of entriesRLP) {
    if (value.every((v) => v == 0)) {
      // is zero value
      await trie.del(key)
    } else {
      await trie.put(key, value)
    }
  }

  return toHex(trie.root())
}

function reconstructLinkedList(entries: Hex[]): [Hex, Hex][] {
  const SENTINEL = '0x0000000000000000000000000000000000000001'
  return new Array(entries.length + 1)
    .fill(null)
    .map((_, index) => [
      index == 0 ? SENTINEL : entries[index - 1],
      index == entries.length ? SENTINEL : entries[index],
    ])
}
