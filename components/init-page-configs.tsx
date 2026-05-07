'use client'

/**
 * 页面配置初始化组件
 * 为 PAC、LAC、回货单 等单据类型创建对应的页面配置
 * 使配置出来的列表页面能够正确显示单据数据
 */

import { useEffect, useState } from 'react'
import { pageStorage } from '@/lib/storage'
import type { PageConfig, ListColumn, PageAction } from '@/lib/types'

// 工具栏操作（页面顶部按钮）
const toolbarActions: PageAction[] = [
  { id: 'create', label: '新建', icon: 'Plus', type: 'primary', position: 'toolbar' },
  { id: 'search', label: '搜索', icon: 'Search', type: 'secondary', position: 'toolbar' },
  { id: 'export', label: '导出', icon: 'Download', type: 'secondary', position: 'toolbar' },
]

// 行操作（每行数据的操作按钮）
const rowActions: PageAction[] = [
  { id: 'view', label: '查看', icon: 'Eye', type: 'primary', position: 'row' },
  { id: 'edit', label: '编辑', icon: 'Edit', type: 'secondary', position: 'row' },
  { id: 'delete', label: '删除', icon: 'Trash', type: 'danger', position: 'row', confirm: true, confirmMessage: '确定要删除此单据吗？' },
]

// 所有默认操作
const defaultActions: PageAction[] = [...toolbarActions, ...rowActions]

// PAC单据页面配置
const pacPageConfig: PageConfig = {
  id: 'page_pac_list',
  name: 'PAC单据列表',
  type: 'list',
  formId: 'doctype_pac',
  columns: [
    {
      field: 'status',
      label: '状态',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'status',
      width: '100px',
    },
    {
      field: 'dealer_code',
      label: '经销商编码',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '120px',
    },
    {
      field: 'user_name',
      label: '用户名',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '100px',
    },
    {
      field: 'problem_type',
      label: '问题类型',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '120px',
    },
    {
      field: 'subject',
      label: '主题',
      sortable: false,
      filterable: true,
      hidden: false,
      format: 'text',
    },
    {
      field: 'vin',
      label: 'VIN',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '180px',
    },
    {
      field: 'is_complaint',
      label: '是否投诉',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '90px',
    },
    {
      field: 'createdAt',
      label: '创建时间',
      sortable: true,
      filterable: false,
      hidden: false,
      format: 'date',
      width: '160px',
    },
  ] as ListColumn[],
  actions: defaultActions,
  filters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// LAC索赔单页面配置
const lacPageConfig: PageConfig = {
  id: 'page_lac_list',
  name: 'LAC索赔单列表',
  type: 'list',
  formId: 'doctype_lac',
  columns: [
    {
      field: 'status',
      label: '状态',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'status',
      width: '100px',
    },
    {
      field: 'sap_code',
      label: 'SAP代码',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '100px',
    },
    {
      field: 'service_center_name',
      label: '服务中心',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '150px',
    },
    {
      field: 'shipping_warehouse',
      label: '发货地',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '100px',
    },
    {
      field: 'delivery_number',
      label: '发货号',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '120px',
    },
    {
      field: 'problem_type',
      label: '问题类型',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '100px',
    },
    {
      field: 'part_drawing_no',
      label: '配件编码',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '120px',
    },
    {
      field: 'part_name',
      label: '配件名称',
      sortable: false,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '150px',
    },
    {
      field: 'claim_quantity',
      label: '索赔数量',
      sortable: true,
      filterable: false,
      hidden: false,
      format: 'number',
      width: '90px',
    },
    {
      field: 'shipping_date',
      label: '发货日期',
      sortable: true,
      filterable: false,
      hidden: false,
      format: 'date',
      width: '120px',
    },
    {
      field: 'createdAt',
      label: '创建时间',
      sortable: true,
      filterable: false,
      hidden: false,
      format: 'date',
      width: '160px',
    },
  ] as ListColumn[],
  actions: defaultActions,
  filters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// 回货单页面配置
const returnGoodsPageConfig: PageConfig = {
  id: 'page_return_goods_list',
  name: '回货单列表',
  type: 'list',
  formId: 'doctype_return_goods',
  columns: [
    {
      field: 'status',
      label: '状态',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'status',
      width: '100px',
    },
    {
      field: 'claim_no',
      label: '索赔单号',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '140px',
    },
    {
      field: 'service_station_code',
      label: '服务站代码',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '110px',
    },
    {
      field: 'service_station_name',
      label: '服务站名称',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '150px',
    },
    {
      field: 'part_drawing_no',
      label: '物料图号',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '120px',
    },
    {
      field: 'part_name',
      label: '物料名称',
      sortable: false,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '150px',
    },
    {
      field: 'material_quantity',
      label: '物料数量',
      sortable: true,
      filterable: false,
      hidden: false,
      format: 'number',
      width: '90px',
    },
    {
      field: 'shipping_warehouse',
      label: '发货地',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '100px',
    },
    {
      field: 'problem_type',
      label: '问题类型',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '100px',
    },
    {
      field: 'createdAt',
      label: '创建时间',
      sortable: true,
      filterable: false,
      hidden: false,
      format: 'date',
      width: '160px',
    },
  ] as ListColumn[],
  actions: defaultActions,
  filters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// 求援反馈单页面配置
const supportFeedbackPageConfig: PageConfig = {
  id: 'page_support_feedback_list',
  name: '求援反馈单列表',
  type: 'list',
  formId: 'doctype_support_feedback',
  columns: [
    {
      field: 'status',
      label: '状态',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'status',
      width: '100px',
    },
    {
      field: 'qualityCategory',
      label: '质量信息类别',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '120px',
    },
    {
      field: 'faultType',
      label: '故障��别',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '100px',
    },
    {
      field: 'vin',
      label: 'VIN码',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '180px',
    },
    {
      field: 'platform_name',
      label: '车型平台',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '120px',
    },
    {
      field: 'dealer_code',
      label: '经销商编码',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '110px',
    },
    {
      field: 'dealer_name',
      label: '经销商名称',
      sortable: true,
      filterable: true,
      hidden: false,
      format: 'text',
      width: '150px',
    },
    {
      field: 'mileage',
      label: '行驶里程',
      sortable: true,
      filterable: false,
      hidden: false,
      format: 'text',
      width: '100px',
    },
    {
      field: 'createdAt',
      label: '创建时间',
      sortable: true,
      filterable: false,
      hidden: false,
      format: 'date',
      width: '160px',
    },
  ] as ListColumn[],
  actions: defaultActions,
  filters: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// 所有需要初始化的页面配置
const pageConfigs = [
  pacPageConfig,
  lacPageConfig,
  returnGoodsPageConfig,
  supportFeedbackPageConfig,
]

export function InitPageConfigs() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // 获取所有已存在的页面配置
    const existingPages = pageStorage.getAll()

    // 遍历需要初始化的配置
    for (const config of pageConfigs) {
      // 检查是否已存在该页面配置（通过 id 或 formId）
      const existingByFormId = existingPages.find(p => p.formId === config.formId)
      const existingById = existingPages.find(p => p.id === config.id)

      if (!existingByFormId && !existingById) {
        // 不存在则创建
        pageStorage.save(config)
        console.log(`页面配置 "${config.name}" 已自动创建`)
      } else {
        // 如果存在，检查是否需要更新
        const existing = existingByFormId || existingById
        if (existing) {
          // 检查是否需要更新列配置或操作配置
          const needsColumnUpdate = !existing.columns || existing.columns.length === 0
          // 检查 actions 是否需要更新：
          // 1. 没有 actions
          // 2. 没有工具栏操作
          // 3. actions 格式不正确（没有 position 属性）
          const needsActionsUpdate = !existing.actions || 
            existing.actions.length === 0 || 
            !existing.actions.some(a => a.position === 'toolbar') ||
            existing.actions.some(a => !a.position) // 有 action 没有 position

          if (needsColumnUpdate || needsActionsUpdate) {
            const updatedConfig = {
              ...existing,
              columns: needsColumnUpdate ? config.columns : existing.columns,
              actions: config.actions, // 始终使用最新的 actions 配置
              updatedAt: new Date().toISOString(),
            }
            pageStorage.save(updatedConfig)
            console.log(`页面配置 "${config.name}" 已更新`)
          }
        }
      }
    }

    setInitialized(true)
  }, [])

  // 此组件不渲染任何UI
  return null
}

export default InitPageConfigs
