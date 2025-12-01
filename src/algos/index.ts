// src/algos/index.ts
import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'

// import * as whatsAlf from './whats-alf'
import * as gameCreatorsHot from './game-creators-hot'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  // [whatsAlf.shortname]: whatsAlf.handler,
  [gameCreatorsHot.shortname]: gameCreatorsHot.handler,
}

export default algos
