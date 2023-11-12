import dotenv from 'dotenv'
import { Chain, createPublicClient, http } from 'viem'

dotenv.config()

export default function (chain: Chain) {
  let url = ''

  if (
    process.env.ALCHEMY_API_KEY &&
    typeof chain.rpcUrls.alchemy !== 'undefined'
  ) {
    console.info('CreateClient: using Alchemy with API key')
    url = `${chain.rpcUrls.alchemy.http[0]}/${process.env.ALCHEMY_API_KEY}`
  } else if (
    process.env.INFURA_API_KEY &&
    typeof chain.rpcUrls.infura !== 'undefined'
  ) {
    console.info('CreateClient: using Infura with API key')
    url = `${chain.rpcUrls.infura.http[0]}/${process.env.INFURA_API_KEY}`
  } else {
    console.info(`CreateClient: using default RPC node for chainID ${chain.id}`)
  }

  return createPublicClient({
    chain,
    transport: url ? http(url) : http(),
  })
}
