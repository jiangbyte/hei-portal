/** Author: Charlie */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Empty, Flex, Pagination, Space, Spin, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { auditApi } from '@/api'
import { formatDateTime } from '@/utils'
import { readPageMeta, wireBool } from '@/utils/wire'

type ActivityLogMode = 'login' | 'operations'

type Props = {
  mode?: ActivityLogMode
}

export function MyActivityLogPanel({ mode = 'login' }: Props) {
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  const fetchPage = useCallback(async () => {
    setLoading(true)
    try {
      const response = await auditApi.myPage({
        current: page,
        size: pageSize,
        ...(mode === 'login' ? { action: 'login' } : { exclude_action: 'login' }),
      } as any)
      const data = response.data ?? {}
      setRows(Array.isArray(data.records) ? data.records : [])
      const pageMeta = readPageMeta(data, { current: page, size: pageSize })
      setTotal(pageMeta.total)
      setPage(pageMeta.current)
      setPageSize(pageMeta.size)
    } finally {
      setLoading(false)
    }
  }, [mode, page, pageSize])

  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  const columns = useMemo<ColumnsType<any>>(
    () => [
      {
        title: '操作时间',
        dataIndex: 'created_at',
        width: 170,
        render: (value) => formatDateTime(value),
      },
      {
        title: '操作结果',
        dataIndex: 'success',
        width: 88,
        render: (value) => {
          const ok = wireBool(value)
          return (
            <Tag bordered={false} color={ok ? 'success' : 'error'}>
              {ok ? '成功' : '失败'}
            </Tag>
          )
        },
      },
      {
        title: '操作内容',
        dataIndex: 'summary',
        ellipsis: true,
        render: (value) => value || '-',
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        width: 130,
        render: (value) => value || '-',
      },
      {
        title: 'User-Agent',
        dataIndex: 'user_agent',
        ellipsis: true,
        render: (value) => value || '-',
      },
    ],
    [],
  )

  return (
    <div className="w-full min-w-0">
      <Flex justify="flex-end" style={{ marginBottom: 8 }}>
        <Button type="link" loading={loading} onClick={() => void fetchPage()}>
          刷新
        </Button>
      </Flex>

      <Spin spinning={loading}>
        {!loading && !rows.length ? (
          <Empty description={mode === 'login' ? '暂无登录记录' : '暂无操作记录'} />
        ) : (
          <Table
            size="small"
            rowKey="id"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 960 }}
          />
        )}
      </Spin>

      {total > 0 ? (
        <Space className="mt-3 w-full justify-end" align="center">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={[10, 20, 30]}
            onChange={(nextPage, nextSize) => {
              setPage(nextPage)
              setPageSize(nextSize)
            }}
          />
        </Space>
      ) : null}
    </div>
  )
}
