import assert from 'assert'

export default function createFetchAggregator<T>(
  from: number,
  to: number,
  fetch: (startBlock: number, endBlock: number) => Promise<T[]>
): () => Promise<T[]> {
  let result: T[] = []
  let [currLeft, currRight] = next(from, to)

  return async () => {
    while (true) {
      // have we already fetched all?
      if (currLeft > currRight) {
        return [...result]
      }

      try {
        console.log(`${currLeft} ${currRight}`)
        result = result.concat(await fetch(currLeft, currRight))
        ;[currLeft, currRight] = next(currRight + 1, to)
      } catch (e) {
        if (currLeft < currRight) {
          ;[currLeft, currRight] = narrow(currLeft, currRight)
        } else {
          throw e
        }
      }
    }
  }
}

function narrow(start: number, end: number) {
  assert(start <= end)
  const width = end - start + 1
  const nextEnd = Math.max(start, start + Math.floor(width / 10) - 1)
  return next(...[start, nextEnd])
}

function next(left: number, right: number, maxBlockRange: number = 100000) {
  return [left, Math.min(left + (maxBlockRange - 1), right)]
}

// function isPaginationError(e: any) {
//   // https://docs.infura.io/networks/ethereum/json-rpc-methods/eth_getlogs#constraints
//   return e?.error?.code == -32005;
// }
