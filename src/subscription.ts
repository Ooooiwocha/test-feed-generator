// src/subscription.ts
import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

// ゲーム関連キーワード・サービスの簡易リスト
const GAME_KEYWORDS = [
  'ゲーム',
  'ゲーム実況',
  '配信',
  '生配信',
  '実況プレイ',
  'rta',
  'RTA in Japan',
  'スクエニ',
  'sqex',
  'スクウェア・エニックス',
  'エニックス',
  'スクウェア',
  'やり込み',
  'FF',
  'DQ',
  'ドラクエ',
  'ドラゴンクエスト',
  'クロノトリガー',
]

const VIDEO_SITES = [
  'youtu.be',
  'youtube.com',
  'twitch.tv',
  'nicovideo.jp',
  'nico.ms',
]

function computeGameScore(text: string): number {
  const lower = text.toLowerCase()
  let score = 0

  // キーワード命中
  for (const kw of GAME_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      score += 2
    }
  }

  // ハッシュタグ
  if (/#(ゲーム|game|gaming|配信|実況)/i.test(text)) {
    score += 2
  }

  // 動画サイトリンク
  for (const domain of VIDEO_SITES) {
    if (lower.includes(domain)) {
      score += 3
    }
  }

  return score
}

type NewPostRow = {
  uri: string
  cid: string
  text: string
  authorDid: string
  replyParent: string | null
  replyRoot: string | null
  indexedAt: string
  gameScore: number
  likeCount: number
  repostCount: number
  authorFollowers: number
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)

    // ここでゲームスコアを計算してから DB 行にマッピング
    const postsToCreate: NewPostRow[] = ops.posts.creates
      .map((create) => {
        const text = create.record.text ?? ''
        const gameScore = computeGameScore(text)

        // ゲーム要素ゼロならインデックスしない
        if (gameScore <= 0) {
          return null
        }

        return {
          uri: create.uri,
          cid: create.cid,
          text,
          authorDid: create.author, // 投稿者 DID
          replyParent: create.record?.reply?.parent?.uri ?? null,
          replyRoot: create.record?.reply?.root?.uri ?? null,
          indexedAt: new Date().toISOString(),
          gameScore,
          likeCount: 0,         // ★ いいね数などは別途実装するときに更新
          repostCount: 0,
          authorFollowers: 0,
        }
      })
      .filter((row): row is NewPostRow => row !== null)

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }

    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }

    /**
     * 【将来拡張ポイント】
     * - ops.likes / ops.reposts / ops.follows を取得できるように util 側を広げて、
     *   ここで likeCount / repostCount / authorFollowers を UPDATE する。
     * - あるいは AppView / PDS からプロフィールを定期的に取得して
     *   authorFollowers を更新するバッチを別に走らせる。
     */
  }
}
