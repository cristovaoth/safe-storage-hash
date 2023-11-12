import dotenv from 'dotenv'
import { createPublicClient, http, toBytes, toHex, toRlp } from 'viem'
import { Trie } from '@ethereumjs/trie'

import ethGetProof from './queries/ethGetProof'
import querySafe from './querySafe'
import {
  SLOT_0,
  SLOT_3,
  SLOT_4,
  SLOT_5,
  SLOT_FALLBACK,
  SLOT_GUARD,
  slotModules,
  slotOwners,
} from './storageSlot'

const AddressOne = '0x0000000000000000000000000000000000000001'

dotenv.config()

const freshSafe = '0xEeb09F4BA12bA23d9A2CCFF07a87945832D9F91C'

const publicClient = createPublicClient({
  transport: http(process.env.RPC_NODE_URL, {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${process.env.RPC_NODE_KEY}`,
      },
    },
  }),
})

async function run(safe: `0x${string}`) {
  const storageRoot = await ethGetProof(safe)

  const {
    singleton,
    modules,
    owners,
    threshold,
    nonce,
    guard,
    fallback,
    blockNumber,
  } = await querySafe(publicClient, safe)

  await computeRootHash({
    singleton,
    modules,
    owners,
    threshold,
    nonce,
    guard,
    fallbackHandler: fallback,
  })
  console.log('Safe root: ' + storageRoot)
}

async function computeRootHash({
  singleton,
  modules,
  owners,
  threshold,
  nonce,
  fallbackHandler,
  guard,
}: {
  singleton: `0x${string}`
  modules: `0x${string}`[]
  owners: `0x${string}`[]
  threshold: bigint
  nonce: bigint
  fallbackHandler: `0x${string}`
  guard: `0x${string}`
}) {
  const entries = [
    [SLOT_0, BigInt(singleton)],
    ...reconstructLinkedList(modules).map(([key, value]) => [
      slotModules(key),
      BigInt(value),
    ]),
    ...reconstructLinkedList(owners).map(([key, value]) => [
      slotOwners(key),
      BigInt(value),
    ]),
    [SLOT_3, BigInt(owners.length)],
    [SLOT_4, BigInt(threshold)],
    [SLOT_5, BigInt(nonce)],
    [SLOT_GUARD, BigInt(guard)],
    [SLOT_FALLBACK, BigInt(fallbackHandler)],
  ].map(([key, value]) => [toBytes(key), toBytes(toRlp(toHex(value)))])

  const trie = await Trie.create({ useKeyHashing: true })
  for (const [key, value] of entries) {
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

  console.log('Trie root:', toHex(trie.root()))
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

run(freshSafe)
