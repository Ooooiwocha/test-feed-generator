// src/db/migrations.ts
import { Kysely } from 'kysely'

type Migration = {
  up(db: Kysely<unknown>): Promise<void>
  down(db: Kysely<unknown>): Promise<void>
}

export const migrations: Record<string, Migration> = {}

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('post')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('cid', 'varchar', (col) => col.notNull())
      .addColumn('text', 'text', (col) => col.notNull())        // 本文
      .addColumn('authorDid', 'varchar', (col) => col.notNull())// 投稿者 DID
      .addColumn('replyParent', 'varchar')
      .addColumn('replyRoot', 'varchar')
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .addColumn('gameScore', 'real', (col) =>                 // ゲームスコア
        col.notNull().defaultTo(0)
      )
      // 将来拡張用 (いいね数・リポスト数・フォロワー数)
      .addColumn('likeCount', 'integer', (col) =>
        col.notNull().defaultTo(0)
      )
      .addColumn('repostCount', 'integer', (col) =>
        col.notNull().defaultTo(0)
      )
      .addColumn('authorFollowers', 'integer', (col) =>
        col.notNull().defaultTo(0)
      )
      .execute()
  },

  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('post').execute()
  },
}
