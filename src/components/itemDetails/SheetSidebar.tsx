import { Link } from 'react-router-dom'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import type { DetailSheet } from '../../data/types'

interface SheetSidebarProps {
  sheetsByItemNo: Map<number, DetailSheet>
  /** Item numbers with a detail sheet, in sidebar order — derived from the
   *  active project's own items (ItemDetailsPage.tsx), not a hardcoded
   *  MAR-specific list, so a custom template's detail sheets list correctly. */
  detailSheetOrder: number[]
  selectedItemNo: number
  basePath: string
}

export function SheetSidebar({ sheetsByItemNo, detailSheetOrder, selectedItemNo, basePath }: SheetSidebarProps) {
  return (
    <nav aria-label="Item Detail Sheets" className="w-72 shrink-0 border-r">
      <h2 className="border-b px-4 py-3 text-sm font-semibold">Item Detail Sheets</h2>
      <ScrollArea className="h-[calc(100%-2.75rem)]">
        <ul className="p-2">
          {detailSheetOrder.map((no) => {
            const sheet = sheetsByItemNo.get(no)
            if (!sheet) return null
            const isSelected = no === selectedItemNo
            return (
              <li key={no}>
                <Link
                  to={`${basePath}/items?item=${no}`}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`flex items-center gap-2 rounded px-2 py-2 text-sm ${
                    isSelected ? 'bg-secondary font-medium' : 'hover:bg-muted'
                  }`}
                >
                  <Badge variant="outline" className="shrink-0">
                    {no}
                  </Badge>
                  <span className="truncate">{sheet.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </ScrollArea>
    </nav>
  )
}
