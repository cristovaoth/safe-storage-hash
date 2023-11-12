import dotenv from 'dotenv'
import { createPublicClient, http } from 'viem'

dotenv.config()

export default function () {
  return createPublicClient({
    transport: http(process.env.RPC_NODE_URL, {
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${process.env.RPC_NODE_KEY}`,
        },
      },
    }),
  })
}
