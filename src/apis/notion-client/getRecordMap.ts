import { NotionAPI } from "notion-client"

export const getRecordMap = async (pageId: string) => {
  const api = new NotionAPI()
  const recordMap = await api.getPage(pageId)

  const unwrapMap = (map: Record<string, any> | undefined) => {
    if (!map) return
    for (const key of Object.keys(map)) {
      const entry = map[key]
      if (entry?.value?.value) {
        map[key] = { ...entry, value: entry.value.value }
      }
    }
  }

  unwrapMap(recordMap.block as any)
  unwrapMap(recordMap.collection as any)
  unwrapMap(recordMap.collection_view as any)
  unwrapMap((recordMap as any).notion_user)

  return recordMap
}
