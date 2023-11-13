import { Hex, PublicClient, createPublicClient, http } from 'viem'

const ankrClient = createPublicClient({
  transport: http('https://rpc.ankr.com/gnosis'),
})

export default async function ethGetProof(
  client: PublicClient,
  address: Hex,
  blockNumber: bigint
) {
  if (client.chain?.id == 100) {
    // the Gnosis default RPCs don't support getProof
    client = ankrClient
  }

  const { storageHash } = await client.getProof({
    address,
    blockNumber,
    storageKeys: [],
  })

  return storageHash
}
