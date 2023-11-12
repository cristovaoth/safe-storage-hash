import { Log, toBytes, toHex, toRlp } from 'viem'
import { Trie } from '@ethereumjs/trie'

import {
  SLOT_0,
  SLOT_3,
  SLOT_4,
  SLOT_5,
  SLOT_FALLBACK,
  SLOT_GUARD,
  slotApprovedHashes,
  slotModules,
  slotOwners,
  slotSignedMessages,
} from './storageSlot'
import { decodeApproveHash, decodeSignMsg } from './queries/topics'

const AddressOne = '0x0000000000000000000000000000000000000001'

export default async function calculateStorageHash({
  singleton,
  modules,
  owners,
  threshold,
  nonce,
  signMsgEvents,
  approveHashEvents,
  guard,
  fallback,
}: {
  singleton: `0x${string}`
  modules: `0x${string}`[]
  owners: `0x${string}`[]
  threshold: bigint
  nonce: bigint
  signMsgEvents: Log[]
  approveHashEvents: Log[]
  guard: `0x${string}`
  fallback: `0x${string}`
}) {
  const moduleSlots = reconstructLinkedList(modules).map(([key, value]) => [
    slotModules(key),
    BigInt(value),
  ])
  const ownerSlots = reconstructLinkedList(owners).map(([key, value]) => [
    slotOwners(key),
    BigInt(value),
  ])
  const signedMessagesSlots = signMsgEvents
    .map(decodeSignMsg)
    .map(({ msgHash }) => [slotSignedMessages(msgHash), BigInt(1)])

  const approveHashSlots = approveHashEvents
    .map(decodeApproveHash)
    .map(({ owner, msgHash }) => [
      slotApprovedHashes(owner, msgHash),
      BigInt(1),
    ])

  const entries = [
    [SLOT_0, BigInt(singleton)],
    ...moduleSlots,
    ...ownerSlots,
    [SLOT_3, BigInt(owners.length)],
    [SLOT_4, BigInt(threshold)],
    [SLOT_5, BigInt(nonce)],
    ...signedMessagesSlots,
    ...approveHashSlots,
    [SLOT_GUARD, BigInt(guard)],
    [SLOT_FALLBACK, BigInt(fallback)],
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

  // entries
  //   .map(([key, value]) => [toHex(key), fromRlp(value)])
  //   .sort(([k1], [k2]) => (k1 < k2 ? -1 : 1))
  //   .forEach(([key, value]) => console.log(key, value))

  return toHex(trie.root())
}

function reconstructLinkedList(
  entries: `0x${string}`[]
): [`0x${string}`, `0x${string}`][] {
  return new Array(entries.length + 1)
    .fill(null)
    .map((_, index) => [
      index == 0 ? AddressOne : entries[index - 1],
      index == entries.length ? AddressOne : entries[index],
    ])
}
