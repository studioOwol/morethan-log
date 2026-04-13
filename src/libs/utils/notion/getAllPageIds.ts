import { idToUuid } from "notion-utils"
import { ExtendedRecordMap, ID } from "notion-types"

export default function getAllPageIds(
  response: ExtendedRecordMap,
  viewId?: string
) {
  const collectionQuery = response.collection_query
  const views = (Object.values(collectionQuery)[0] || {}) as any

  const unwrap = (v: any) => v?.value ?? v

  let pageIds: ID[] = []
  if (viewId) {
    const vId = idToUuid(viewId)
    const view = unwrap(views[vId])
    pageIds = view?.blockIds ?? view?.collection_group_results?.blockIds ?? []
  } else {
    const pageSet = new Set<ID>()
    Object.values(views).forEach((rawView: any) => {
      const view = unwrap(rawView)
      const ids: ID[] =
        view?.collection_group_results?.blockIds ?? view?.blockIds ?? []
      ids.forEach((id) => pageSet.add(id))
    })
    pageIds = [...pageSet]
  }

  // Fallback: scan blocks for pages parented to the collection
  if (pageIds.length === 0) {
    const block = (response as any).block || {}
    const pageSet = new Set<ID>()
    Object.entries(block).forEach(([blockId, entry]: [string, any]) => {
      const value = entry?.value?.value ?? entry?.value
      if (
        value?.type === "page" &&
        value?.parent_table === "collection"
      ) {
        pageSet.add(blockId)
      }
    })
    pageIds = [...pageSet]
  }

  return pageIds
}
