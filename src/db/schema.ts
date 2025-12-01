// src/db/schema.ts
export type Post = {
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

export type DatabaseSchema = {
  post: Post
}
