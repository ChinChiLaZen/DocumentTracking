import { ChevronDown, Download } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { exportProjectExcel, type ExportableProject } from '../../domain/export/excelExport'
import { exportProjectWord } from '../../domain/export/wordExport'

export function ExportMenu({ project }: { project: ExportableProject }) {
  const isAdsb = (project.meta.templateKind ?? 'mar') === 'adsb'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="no-print">
          <Download />
          Export
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void exportProjectExcel(project)}>
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        {isAdsb ? (
          <>
            <DropdownMenuItem
              onSelect={async () => {
                const { exportAdsbContractorWord } = await import('../../domain/export/adsbWordExport')
                void exportAdsbContractorWord(project.items, project.meta)
              }}
            >
              Export Contractor (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                const { exportAdsbEmployerWord } = await import('../../domain/export/adsbWordExport')
                void exportAdsbEmployerWord(project.items, project.meta)
              }}
            >
              Export Employer (.docx)
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={() => void exportProjectWord(project)}>
            Export as Word (.docx)
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
