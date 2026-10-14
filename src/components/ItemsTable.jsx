import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'

const columnHelper = createColumnHelper()

export const ItemsTable = ({
  items,
  employees,
  currentUserId,
  onDelete,
  isDeleting,
}) => {
  const employeeMap = useMemo(() => {
    return Object.fromEntries(employees.map((e) => [e.id, e.name]))
  }, [employees])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Позиция',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('employeeId', {
        header: 'Кто',
        cell: (info) => employeeMap[info.getValue()] || '—',
      }),
      columnHelper.accessor('price', {
        header: 'Цена',
        cell: (info) => `${info.getValue()} ₸`,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          if (row.original.employeeId !== currentUserId) {
            return null
          }

          return (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={isDeleting}
              onClick={() => onDelete(row.original.id)}
            >
              Удалить
            </button>
          )
        },
      }),
    ],
    [currentUserId, employeeMap, isDeleting, onDelete],
  )

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (items.length === 0) {
    return <p className="empty">Пока пусто — добавьте позиции или вставьте список.</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
