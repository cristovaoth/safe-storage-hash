import path from 'path'
import fs from 'fs'
import { Chain } from 'viem/chains'

import createClient from '@/fetch/createClient'
import eth_getProof from '@/fetch/eth_getProof'
import queryEventMap from '@/fetch/queryEventMap'
import querySafeStorage from '@/fetch/querySafeStorage'
import querySafeVersion from '@/fetch/querySafeVersion'

import calculateStorageHash from '@/calculate'
import { Hex, getAddress } from 'viem'
import { parseNetworkInput } from './parseInput'

async function run(chain: Chain) {
  const safes = loadSafes(chain.id)
  const publicClient = createClient(chain)
  const blockNumber = await publicClient.getBlockNumber()
  const eventMap = await queryEventMap(publicClient, BigInt(0), blockNumber)

  let counter = 0
  const success = []
  const failures = []
  const errors = []
  const unsupported = []
  const notASafe = []

  for (const safe of safes) {
    console.info(`${counter} ${safe}`)
    try {
      const [
        version,
        {
          singleton,
          modules,
          owners,
          threshold,
          nonce,
          separator,
          guard,
          fallback,
        },
        storageHash,
      ] = await Promise.all([
        querySafeVersion(publicClient, safe, blockNumber),
        querySafeStorage(publicClient, safe, blockNumber),
        eth_getProof(publicClient, safe, blockNumber),
      ])

      if (!version) {
        console.info(`Address ${safe} is not a Safe`)
        notASafe.push(safe)
        continue
      }
      console.info(
        `Safe is v${version} in ${publicClient.chain?.name} (chainId ${publicClient.chain?.id})`
      )
      if (!['1.3.0', '1.4.1'].includes(version)) {
        console.info(`v${version} is not supported`)
        unsupported.push(safe)
        continue
      }

      const { signMsgEvents, approveHashEvents } = eventMap.get(safe) || {
        signMsgEvents: [],
        approveHashEvents: [],
      }

      const calculatedStorageHash = await calculateStorageHash({
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
      })

      if (storageHash == calculatedStorageHash) {
        console.log(`\x1B[32m✔ \x1B[0m`)
        success.push({ safe, storageHash })
      } else {
        console.log('\x1B[31m✘ \x1B[0m')
        failures.push({
          safe,
          storageHash,
          calculatedStorageHash,
        })
      }
    } catch (e) {
      console.log('\x1B[31m Something went wrong \x1B[0m')
      errors.push(safe)
    } finally {
      if (++counter % 100 == 0) {
        storeResults(chain.id, {
          success,
          failures,
          errors,
          unsupported,
          notASafe,
        })
      }
    }
  }
}

function loadSafes(chainId: number) {
  const safes = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', '..', 'artifacts', 'safes', `${chainId}.json`),
      'utf8'
    )
  )
  return safes.map(({ address }: { address: Hex }) => getAddress(address))
}

function storeResults(chainId: number, data: any) {
  fs.writeFileSync(
    path.join(__dirname, '..', '..', 'artifacts', 'results', `${chainId}.json`),
    JSON.stringify(data, null, 2),
    'utf8'
  )
}

run(parseNetworkInput(process.argv))
