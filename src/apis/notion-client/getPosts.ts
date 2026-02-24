import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */

// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string

  if (!id) {
    console.error('❌ NOTION_PAGE_ID is not set!')
    return []
  }

  const api = new NotionAPI()

  try {
    const response = await api.getPage(id)
    id = idToUuid(id)

    const collectionValue = Object.values(response.collection)[0]?.value as any
    const collection = collectionValue?.value ?? collectionValue
    const block = response.block
    const schema = collection?.schema

    const rawMetadata = (block[id].value as any)?.value ?? block[id].value

    // Check Type
    if (
      rawMetadata?.type !== "collection_view_page" &&
      rawMetadata?.type !== "collection_view"
    ) {
      console.error('❌ Page type is not a database! Type:', rawMetadata?.type)
      return []
    }
    // Construct Data
    const pageIds = getAllPageIds(response)
    const data = []
    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i]
      const properties = (await getPageProperties(id, block, schema)) || null
      // Add fullwidth, createdtime to properties
      const blockValue = (block[id].value as any)?.value ?? block[id].value
      properties.createdTime = new Date(blockValue?.created_time).toString()
      properties.fullWidth = blockValue?.format?.page_full_width ?? false

      data.push(properties)
    }

    // Sort by date
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a?.date?.start_date || a.createdTime)
      const dateB: any = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })

    const posts = data as TPosts
    return posts
  } catch (error) {
    console.error('❌ Error fetching posts from Notion:', error)
    return []
  }
}
