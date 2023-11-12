import path from 'path'
import fs from 'fs'
import { Chain, mainnet } from 'viem/chains'

import { querySafeVersion, querySafeStorage } from '@/fetch/queryContract'
import createClient from '@/fetch/createClient'
import { querySafeEvents } from '@/fetch/queryEvents'
import ethGetProof from '@/fetch/eth_getProof'
import calculateStorageHash from '@/calculate'

async function run(chain: Chain) {
  const safes = loadSafes(chain.id)
  const publicClient = createClient(chain)

  let counter = 0
  const success = []
  const failures = []
  const errors = []
  const unsupported = []
  const notASafe = []

  for (const { address: safe } of safes) {
    console.log(`${counter} ${safe}`)
    try {
      const version = await querySafeVersion(publicClient, safe)
      if (!version) {
        console.log('Not a Safe')
        notASafe.push(safe)
        continue
      }

      console.info(
        `Safe is v${version} in ${publicClient.chain?.name} (chainId ${publicClient.chain?.id})`
      )

      if (version != '1.3.0' && version != '1.4.1') {
        console.log('Unsupported')
        unsupported.push(safe)
        continue
      }

      console.log(`fetching storage values...`)
      const {
        singleton,
        modules,
        owners,
        threshold,
        nonce,
        separator,
        guard,
        fallback,
        blockNumber,
      } = await querySafeStorage(publicClient, safe)

      console.log(`fetching events...`)
      const [{ signMsgEvents, approveHashEvents }, expected] =
        await Promise.all([
          querySafeEvents(publicClient, safe, BigInt(0), blockNumber),
          ethGetProof(publicClient, safe, blockNumber),
        ])
      const calculated = await calculateStorageHash({
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

      if (expected == calculated) {
        console.log(`\x1B[32m✔ \x1B[0m`)
        success.push({ safe, storageHash: expected })
      } else {
        console.log('\x1B[31m✘ \x1B[0m')
        failures.push({
          safe,
          actual: expected,
          expected: calculated,
        })
      }
    } catch (e) {
      console.log('\x1B[31m Something went wrong \x1B[0m')
      console.log(errors.push(safe))
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
  return safes
}

function storeResults(chainId: number, data: any) {
  fs.writeFileSync(
    path.join(__dirname, '..', '..', 'artifacts', 'results', `${chainId}.json`),
    JSON.stringify(data, null, 2),
    'utf8'
  )
}

run(mainnet)
