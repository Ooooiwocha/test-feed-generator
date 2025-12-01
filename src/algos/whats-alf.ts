// src/algos/game-creators-hot.ts
import { InvalidRequestError } from '@atproto/xrpc-server'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

export const shortname = 'game-creators-hot'

type Handler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

export const handler: Handler = async (ctx, params) => {
  const limit = Math.min(params.limit ?? 50, 100)

  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .where('gameScore', '>', 0)
    // ゲームスコア → 新しさ → CID でソート
    .orderBy('gameScore', 'desc')
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(limit)

  // 簡易版: cursor があれば "indexedAt::cid" として扱う
  if (params.cursor) {
    const [indexedAtMillis, cid] = params.cursor.split('::')
    if (!indexedAtMillis || !cid) {
      throw new InvalidRequestError('malformed cursor')
    }
    const timeStr = new Date(parseInt(indexedAtMillis, 10)).toISOString()

    builder = builder
      .where('indexedAt', '<', timeStr)
      .where('cid', '<', cid)
  }

  const rows = await builder.execute()

  const feed = rows.map((row) => ({
    post: row.uri,
  }))

  let cursor: string | undefined
  const last = rows.at(-1)
  if (last) {
    cursor = `${new Date(last.indexedAt).getTime()}::${last.cid}`
  }

  return {
    cursor,
    feed,
  }
}
