import assert from 'assert'

type fetchCallback<T> = (startBlock: number, endBlock: number) => Promise<T[]>
type progressCallback = ({
  from,
  to,
  currFrom,
  currTo,
}: {
  from: number
  to: number
  currFrom: number
  currTo: number
}) => void

export default function createRpcAggregator<T>(
  from: number,
  to: number,
  fetch: fetchCallback<T>,
  progress?: progressCallback
): () => Promise<T[]> {
  let result: T[] = []
  let [currFrom, currTo] = [from, to]
  return async () => {
    while (true) {
      try {
        result = result.concat(await fetch(currFrom, currTo))

        if (progress) progress({ from, to, currFrom, currTo })
        // have we already fetched all?
        if (currTo == to) {
          return [...result]
        }
        ;[currFrom, currTo] = next({ from, to, currFrom, currTo })
      } catch (e) {
        if (currFrom < currTo) {
          ;[currFrom, currTo] = narrow(currFrom, currTo)
        } else {
          throw e
        }
      }
    }
  }
}

export function createReporter() {
  const set = new Set<number>()

  return ({ to, currTo }: { to: number; currTo: number }) => {
    const progress = Math.floor((currTo * 100) / to)
    const rounded = Math.floor(progress / 10) * 10

    if (rounded == 0 || (rounded == 100 && set.size == 0) || set.has(rounded)) {
      return
    }

    set.add(rounded)
    console.info(`Fetched ${rounded}%`)
  }
}

function next(
  {
    from,
    to,
    currFrom,
    currTo,
  }: { from: number; to: number; currFrom: number; currTo: number },
  maxBlockRange?: number
) {
  assert(from <= to)
  assert(currFrom <= currTo)

  const nextFrom = currTo < to ? currTo + 1 : currFrom

  return withMaxRange(nextFrom, to, maxBlockRange)
}

function narrow(left: number, right: number, maxBlockRange?: number) {
  assert(left <= right)
  const width = right - left + 1

  const nextRight = width < 10 ? left : left + Math.floor(width / 10)

  return withMaxRange(left, nextRight, maxBlockRange)
}

function withMaxRange(
  from: number,
  to: number,
  maxBlockRange: number = Number.MAX_VALUE
) {
  return [from, Math.min(from + maxBlockRange, to)]
}
