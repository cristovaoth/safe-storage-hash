import { Hex, PublicClient, createPublicClient, http } from 'viem'

const ANKR = createPublicClient({
  transport: http('https://rpc.ankr.com/gnosis'),
})

export default async function ethGetProof(
  client: PublicClient,
  address: Hex,
  blockNumber: bigint
) {
  if (client.chain?.id == 100) {
    // the GNOSIS RPCs don't support getProof
    client = ANKR
  }

  const { storageHash } = await client.getProof({
    address,
    blockNumber,
    storageKeys: [],
  })

  return storageHash
}
