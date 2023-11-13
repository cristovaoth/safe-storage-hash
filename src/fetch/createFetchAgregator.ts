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

export default function createFetchAggregator<T>(
  from: number,
  to: number,
  fetch: fetchCallback<T>,
  progress?: progressCallback
): () => Promise<T[]> {
  let result: T[] = []
  let [currFrom, currTo] = next(from, to)

  return async () => {
    while (true) {
      // have we already fetched all?
      if (currFrom > currTo) {
        return [...result]
      }

      try {
        result = result.concat(await fetch(currFrom, currTo))
        if (progress) progress({ from, to, currFrom, currTo })
        ;[currFrom, currTo] = next(currTo + 1, to)
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

function narrow(start: number, end: number) {
  assert(start <= end)
  const width = end - start + 1
  const nextEnd = Math.max(start, start + Math.floor(width / 10) - 1)
  return next(...[start, nextEnd])
}

function next(left: number, right: number, maxBlockRange: number = 100000) {
  return [left, right]
}
