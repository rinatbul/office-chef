import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'

const columnHelper = createColumnHelper()

const statusLabel = (row) => {
  if (row.paymentStatus === 'initiator') return 'Инициатор'
  if (row.paymentStatus === 'paid') return 'Оплачено'
  return 'Ждёт оплаты'
}

export const SplitTable = ({ split }) => {
  const data = useMemo(() => split?.rows || [], [split])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Кто' }),
      columnHelper.accessor('total', {
        header: 'Сумма',
        cell: (info) => <strong>{info.getValue()} ₸</strong>,
      }),
      columnHelper.accessor('paymentStatus', {
        header: 'Статус',
        cell: (info) => {
          const row = info.row.original
          return (
            <span className={`pay-status pay-status--${row.paymentStatus}`}>
              {statusLabel(row)}
            </span>
          )
        },
      }),
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!split || data.length === 0) {
    return <p className="empty">Добавьте позиции, чтобы посчитать чек.</p>
  }

  return (
    <div className="split-block">
      <div className="split-summary">
        <div>
          <span>Подытог</span>
          <strong>{split.subtotal} ₸</strong>
        </div>
        <div>
          <span>Скидка {split.discountPercent}%</span>
          <strong>−{split.discountAmount} ₸</strong>
        </div>
        <div>
          <span>Доставка</span>
          <strong>{split.deliveryFee} ₸</strong>
        </div>
        <div className="split-total">
          <span>Итого</span>
          <strong>{split.grandTotal} ₸</strong>
        </div>
      </div>

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
    </div>
  )
}
