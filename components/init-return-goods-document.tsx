'use client'

/**
 * 回货单单据类型自动初始化组件
 * 参考LAC整体流程图，用于处理索赔后的回货管理
 * 
 * 流程说明：
 * 1. LAC系统生成回货单，回货单上须有条码，仓库可直接扫码签收
 * 2. 扫码录入生成记录（非实物收货生成库存）
 * 3. 仓库在SILP收货后，信息回传至LAC
 * 4. 人工审核 - 返回的结件，质量件通过人工审核判断是否需要推送至供应商
 */

import { useEffect, useState } from 'react'
import { documentTypeStorage, workflowStorage } from '@/lib/storage'
import type { 
  DocumentType, 
  FormField, 
  DocumentNumberRule, 
  ActionButton, 
  WorkflowConfig, 
  WorkflowNode, 
  WorkflowEdge, 
  FlowEvent, 
  DocumentStatusConfig 
} from '@/lib/types'

// 回货单单据类型配置
const returnGoodsDocumentType: DocumentType = {
  id: 'doctype_return_goods',
  name: '回货单',
  code: 'RG',
  icon: 'PackageCheck',
  description: '物流回货单，用于索赔处理后的配件回货管理，支持扫码签收、仓库收货及质量审核',
  
  // 回货单不允许手动创建，只能通过LAC索赔单自动生成
  allowManualCreate: false,
  parentDocTypeId: 'doctype_lac', // 父单据类型为LAC索赔单
  
  numberRule: {
    prefix: 'RG',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
    resetCycle: 'daily',
  } as DocumentNumberRule,
  
  fields: [
    // ========== 服务站信息区域 ==========
    {
      id: 'section_service_station',
      type: 'divider',
      label: '服务站信息',
      name: 'section_service_station',
      required: false,
      width: 'full',
    },
    {
      id: 'service_station_code',
      type: 'text',
      label: '服务站代码',
      name: 'service_station_code',
      required: true,
      placeholder: '请输入服务站代码，如 J130020',
      width: 'third',
    },
    {
      id: 'service_station_name',
      type: 'text',
      label: '服务站名称',
      name: 'service_station_name',
      required: true,
      placeholder: '服务站名称',
      width: 'third',
    },
    {
      id: 'contact_phone',
      type: 'text',
      label: '联系电话',
      name: 'contact_phone',
      required: true,
      placeholder: '如 1393157XXXX',
      width: 'third',
    },
    {
      id: 'service_station_address',
      type: 'textarea',
      label: '服务站地址',
      name: 'service_station_address',
      required: false,
      placeholder: '服务站详细地址',
      rows: 2,
      width: 'full',
    },
    
    // ========== 关联索赔信息区域 ==========
    {
      id: 'section_claim_info',
      type: 'divider',
      label: '关联索赔信息',
      name: 'section_claim_info',
      required: false,
      width: 'full',
    },
    {
      id: 'claim_no',
      type: 'text',
      label: '索赔单号',
      name: 'claim_no',
      required: true,
      placeholder: '关联的LAC索赔单号',
      width: 'third',
      // 索赔单号联动配置
      linkage: {
        sourceField: 'claim_no',
        sourceType: 'custom',
        targetMappings: [
          { targetField: 'service_station_code', sourceProperty: 'sap_code' },
          { targetField: 'service_station_name', sourceProperty: 'service_center_name' },
          { targetField: 'contact_phone', sourceProperty: 'contact_phone' },
        ],
      },
    },
    {
      id: 'claim_date',
      type: 'date',
      label: '索赔日期',
      name: 'claim_date',
      required: false,
      width: 'third',
    },
    {
      id: 'claim_method',
      type: 'select',
      label: '索赔方式',
      name: 'claim_method',
      required: false,
      options: [
        { label: '补发', value: '补发' },
        { label: '换发', value: '换发' },
        { label: '退款', value: '退款' },
        { label: '折价', value: '折价' },
      ],
      width: 'third',
    },
    
    // ========== 回货物料明细区域 ==========
    {
      id: 'section_material_detail',
      type: 'divider',
      label: '回货物料明细',
      name: 'section_material_detail',
      required: false,
      width: 'full',
      description: '数量允许按照实际数量进行修改，但不得超过索赔数量',
    },
    {
      id: 'part_drawing_no',
      type: 'text',
      label: '物料图号',
      name: 'part_drawing_no',
      required: true,
      placeholder: '请输入物料图号',
      width: 'third',
      // 配件编码联动配置
      linkage: {
        sourceField: 'part_drawing_no',
        sourceType: 'custom',
        targetMappings: [
          { targetField: 'part_name', sourceProperty: 'partName' },
        ],
      },
    },
    {
      id: 'part_name',
      type: 'text',
      label: '物料名称',
      name: 'part_name',
      required: true,
      placeholder: '物料名称（自动带出）',
      width: 'third',
    },
    {
      id: 'material_quantity',
      type: 'number',
      label: '物料数量',
      name: 'material_quantity',
      required: true,
      placeholder: '数量',
      min: 1,
      width: 'third',
      description: '允许按实际数量修改，但不得超过索赔数量',
    },
    {
      id: 'claim_quantity',
      type: 'number',
      label: '索赔数量',
      name: 'claim_quantity',
      required: false,
      placeholder: '原索赔数量',
      disabled: true,
      width: 'third',
    },
    {
      id: 'shipping_warehouse',
      type: 'select',
      label: '发货地',
      name: 'shipping_warehouse',
      required: true,
      options: [
        { label: '柳州库', value: '柳州库' },
        { label: '青岛分库', value: '青岛分库' },
        { label: '成都分库', value: '成都分库' },
        { label: '武汉分库', value: '武汉分库' },
        { label: '重庆库', value: '重庆库' },
      ],
      width: 'third',
    },
    {
      id: 'problem_type',
      type: 'select',
      label: '问题类型',
      name: 'problem_type',
      required: true,
      options: [
        { label: '损坏', value: '损坏' },
        { label: '错发', value: '错发' },
        { label: '漏发', value: '漏发' },
        { label: '多发', value: '多发' },
        { label: '质量问题', value: '质量问题' },
        { label: '其他', value: '其他' },
      ],
      width: 'third',
    },
    {
      id: 'problem_remark',
      type: 'textarea',
      label: '问题备注',
      name: 'problem_remark',
      required: false,
      placeholder: '如：顶盖总成23746055P变形无法使用',
      rows: 2,
      width: 'full',
    },
    
    // ========== 物流信息区域 ==========
    {
      id: 'section_logistics',
      type: 'divider',
      label: '物流信息',
      name: 'section_logistics',
      required: false,
      width: 'full',
    },
    {
      id: 'carrier_name',
      type: 'text',
      label: '承运商',
      name: 'carrier_name',
      required: false,
      placeholder: '承运商名称',
      width: 'third',
    },
    {
      id: 'carrier_sign_date',
      type: 'date',
      label: '承运商签收日期',
      name: 'carrier_sign_date',
      required: false,
      width: 'third',
    },
    {
      id: 'carrier_sign_person',
      type: 'text',
      label: '承运商签收人',
      name: 'carrier_sign_person',
      required: false,
      placeholder: '签收人姓名',
      width: 'third',
    },
    {
      id: 'tracking_number',
      type: 'text',
      label: '物流单号',
      name: 'tracking_number',
      required: false,
      placeholder: '物流追踪单号',
      width: 'half',
    },
    {
      id: 'shipping_date',
      type: 'date',
      label: '发货日期',
      name: 'shipping_date',
      required: false,
      width: 'half',
    },
    
    // ========== 仓库收货信息区域 ==========
    {
      id: 'section_warehouse_receipt',
      type: 'divider',
      label: '仓库收货信息',
      name: 'section_warehouse_receipt',
      required: false,
      width: 'full',
    },
    {
      id: 'barcode',
      type: 'text',
      label: '回货单条码',
      name: 'barcode',
      required: false,
      placeholder: '系统自动生成，仓库扫码签收用',
      disabled: true,
      width: 'third',
      description: '仓库可直接扫码签收',
    },
    {
      id: 'warehouse_sign_date',
      type: 'date',
      label: '仓库签收日期',
      name: 'warehouse_sign_date',
      required: false,
      width: 'third',
    },
    {
      id: 'warehouse_sign_person',
      type: 'text',
      label: '仓库签收人',
      name: 'warehouse_sign_person',
      required: false,
      placeholder: '签收人姓名',
      width: 'third',
    },
    {
      id: 'actual_receive_quantity',
      type: 'number',
      label: '实际收货数量',
      name: 'actual_receive_quantity',
      required: false,
      placeholder: '实际收到的数量',
      width: 'third',
    },
    {
      id: 'receive_status',
      type: 'select',
      label: '收货状态',
      name: 'receive_status',
      required: false,
      options: [
        { label: '待收货', value: 'pending' },
        { label: '已扫码', value: 'scanned' },
        { label: '已收货', value: 'received' },
        { label: '异常', value: 'abnormal' },
      ],
      defaultValue: 'pending',
      width: 'third',
    },
    {
      id: 'receive_remark',
      type: 'textarea',
      label: '收货备注',
      name: 'receive_remark',
      required: false,
      placeholder: '收货时的备注信息',
      rows: 2,
      width: 'full',
    },
    
    // ========== 质量审核信息区域 ==========
    {
      id: 'section_quality_review',
      type: 'divider',
      label: '质量审核信息',
      name: 'section_quality_review',
      required: false,
      width: 'full',
      description: '返回的结件，质量件通过人工审核判断是否需要推送至供应商',
    },
    {
      id: 'quality_review_result',
      type: 'select',
      label: '质量审核结果',
      name: 'quality_review_result',
      required: false,
      options: [
        { label: '待审核', value: 'pending' },
        { label: '合格-入库', value: 'qualified' },
        { label: '不合格-报废', value: 'scrapped' },
        { label: '需推送至供应商', value: 'to_supplier' },
        { label: '需退还经销商', value: 'return_dealer' },
        { label: '错误申报', value: 'wrong_claim' },
      ],
      width: 'third',
    },
    {
      id: 'quality_reviewer',
      type: 'text',
      label: '审核人',
      name: 'quality_reviewer',
      required: false,
      placeholder: '审核人姓名',
      width: 'third',
    },
    {
      id: 'quality_review_date',
      type: 'datetime',
      label: '审核时间',
      name: 'quality_review_date',
      required: false,
      width: 'third',
    },
    {
      id: 'supplier_push_required',
      type: 'radio',
      label: '是否需要推送至供应商',
      name: 'supplier_push_required',
      required: false,
      options: [
        { label: '是', value: 'yes' },
        { label: '否', value: 'no' },
      ],
      defaultValue: 'no',
      width: 'third',
      description: '手工填报供应商信息、错误申报等提供备注功能',
    },
    {
      id: 'supplier_code',
      type: 'text',
      label: '供应商代码',
      name: 'supplier_code',
      required: false,
      placeholder: '供应商代码',
      width: 'third',
    },
    {
      id: 'supplier_name',
      type: 'text',
      label: '供应商名称',
      name: 'supplier_name',
      required: false,
      placeholder: '供应商名称',
      width: 'third',
    },
    {
      id: 'quality_review_remark',
      type: 'textarea',
      label: '审核备注',
      name: 'quality_review_remark',
      required: false,
      placeholder: '审核相关备注信息',
      rows: 2,
      width: 'full',
    },
    
    // ========== 状态追踪区域 ==========
    {
      id: 'section_status_tracking',
      type: 'divider',
      label: '状态追踪',
      name: 'section_status_tracking',
      required: false,
      width: 'full',
    },
    {
      id: 'return_goods_status',
      type: 'select',
      label: '回货单状态',
      name: 'return_goods_status',
      required: false,
      options: [
        { label: '待生成', value: 'pending_generate' },
        { label: '已生成', value: 'generated' },
        { label: '已发货', value: 'shipped' },
        { label: '待签收', value: 'pending_sign' },
        { label: '已扫码', value: 'scanned' },
        { label: '已收货', value: 'received' },
        { label: '质检中', value: 'quality_checking' },
        { label: '已完成', value: 'completed' },
        { label: '已取消', value: 'cancelled' },
      ],
      defaultValue: 'pending_generate',
      width: 'third',
    },
    {
      id: 'silp_sync_status',
      type: 'select',
      label: 'SILP同步状态',
      name: 'silp_sync_status',
      required: false,
      options: [
        { label: '未同步', value: 'not_synced' },
        { label: '同步中', value: 'syncing' },
        { label: '已同步', value: 'synced' },
        { label: '同步失败', value: 'sync_failed' },
      ],
      defaultValue: 'not_synced',
      width: 'third',
    },
    {
      id: 'return_part_receive_date',
      type: 'date',
      label: '退配件接收日期',
      name: 'return_part_receive_date',
      required: false,
      width: 'third',
      description: 'SILP收货后信息回传',
    },
    {
      id: 'lac_update_date',
      type: 'datetime',
      label: 'LAC更新时间',
      name: 'lac_update_date',
      required: false,
      width: 'third',
    },
  ] as FormField[],
  
  // 启用回复功能
  enableReply: true,
  
  // 操作按钮配置
  actionButtons: [
    {
      id: 'btn_save',
      name: '保存',
      code: 'save',
      type: 'secondary',
      icon: 'Save',
      position: 'header',
      visibleStatus: ['draft', 'generated'],
      visibleRoles: ['dealer', 'admin', 'engineer', 'warehouse'],
      actionType: 'custom',
      confirmRequired: false,
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_generate_barcode',
      name: '生成条码',
      code: 'generate_barcode',
      type: 'primary',
      icon: 'QrCode',
      position: 'header',
      visibleStatus: ['draft'],
      visibleRoles: ['admin', 'engineer'],
      actionType: 'custom',
      confirmRequired: true,
      confirmMessage: '确定要生成回货单条码吗？生成后仓库可直接扫码签收。',
      order: 2,
      enabled: true,
    },
    {
      id: 'btn_print',
      name: '打印回货单',
      code: 'print',
      type: 'secondary',
      icon: 'Printer',
      position: 'header',
      visibleStatus: ['generated', 'shipped', 'pending_sign', 'scanned', 'received', 'completed'],
      actionType: 'custom',
      order: 3,
      enabled: true,
    },
    {
      id: 'btn_scan_receive',
      name: '扫码签收',
      code: 'scan_receive',
      type: 'primary',
      icon: 'ScanLine',
      position: 'footer',
      visibleStatus: ['generated', 'shipped', 'pending_sign'],
      visibleRoles: ['warehouse', 'admin'],
      actionType: 'status_change',
      toStatus: 'scanned',
      confirmRequired: true,
      confirmMessage: '确定已扫码签收此回货单吗？',
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_confirm_receive',
      name: '确认收货',
      code: 'confirm_receive',
      type: 'primary',
      icon: 'PackageCheck',
      position: 'footer',
      visibleStatus: ['scanned'],
      visibleRoles: ['warehouse', 'admin'],
      actionType: 'status_change',
      toStatus: 'received',
      confirmRequired: true,
      confirmMessage: '确定已完成收���吗？收货后将进入质检流程。',
      order: 2,
      enabled: true,
    },
    {
      id: 'btn_quality_review',
      name: '质量审核',
      code: 'quality_review',
      type: 'primary',
      icon: 'ClipboardCheck',
      position: 'footer',
      visibleStatus: ['received', 'quality_checking'],
      visibleRoles: ['engineer', 'admin'],
      actionType: 'custom',
      confirmRequired: false,
      order: 3,
      enabled: true,
    },
    {
      id: 'btn_push_supplier',
      name: '推送至供应商',
      code: 'push_supplier',
      type: 'primary',
      icon: 'Send',
      position: 'footer',
      visibleStatus: ['received', 'quality_checking'],
      visibleRoles: ['engineer', 'admin'],
      actionType: 'api_call',
      apiUrl: '/api/supplier/push',
      apiMethod: 'POST',
      confirmRequired: true,
      confirmMessage: '确定要将此回货信息推送至供应商吗？',
      order: 4,
      enabled: true,
    },
    {
      id: 'btn_complete',
      name: '完成处理',
      code: 'complete',
      type: 'primary',
      icon: 'CheckCircle',
      position: 'footer',
      visibleStatus: ['received', 'quality_checking'],
      visibleRoles: ['engineer', 'admin'],
      actionType: 'status_change',
      toStatus: 'completed',
      confirmRequired: true,
      confirmMessage: '确定已完成此回货单的所有处理吗？',
      order: 5,
      enabled: true,
    },
    {
      id: 'btn_cancel',
      name: '取消',
      code: 'cancel',
      type: 'danger',
      icon: 'XCircle',
      position: 'footer',
      visibleStatus: ['draft', 'generated'],
      visibleRoles: ['admin'],
      actionType: 'status_change',
      toStatus: 'cancelled',
      confirmRequired: true,
      confirmMessage: '确定要取消此回货单吗？取消后无法恢复。',
      order: 6,
      enabled: true,
    },
    {
      id: 'btn_view_claim',
      name: '查看关联索赔单',
      code: 'view_claim',
      type: 'link',
      icon: 'ExternalLink',
      position: 'toolbar',
      actionType: 'open_url',
      openUrl: '/runtime/documents/{claim_no}',
      openInNewTab: false,
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_sync_silp',
      name: '同步至SILP',
      code: 'sync_silp',
      type: 'secondary',
      icon: 'RefreshCw',
      position: 'toolbar',
      visibleStatus: ['received', 'completed'],
      visibleRoles: ['admin', 'engineer'],
      actionType: 'api_call',
      apiUrl: '/api/silp/sync',
      apiMethod: 'POST',
      confirmRequired: true,
      confirmMessage: '确定要同步收货信息至SILP系统吗？',
      order: 2,
      enabled: true,
    },
  ] as ActionButton[],
  
  layout: 'vertical',
  status: 'published',
  order: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// 回货单状态配置
const returnGoodsStatuses: DocumentStatusConfig[] = [
  { id: 'status_draft', code: 'draft', name: '草稿', color: '#6B7280', isInitial: true, isFinal: false, order: 1 },
  { id: 'status_generated', code: 'generated', name: '已生成', color: '#3B82F6', isInitial: false, isFinal: false, order: 2 },
  { id: 'status_shipped', code: 'shipped', name: '已发货', color: '#8B5CF6', isInitial: false, isFinal: false, order: 3 },
  { id: 'status_pending_sign', code: 'pending_sign', name: '待签收', color: '#F59E0B', isInitial: false, isFinal: false, order: 4 },
  { id: 'status_scanned', code: 'scanned', name: '已扫码', color: '#06B6D4', isInitial: false, isFinal: false, order: 5 },
  { id: 'status_received', code: 'received', name: '已收货', color: '#10B981', isInitial: false, isFinal: false, order: 6 },
  { id: 'status_quality_checking', code: 'quality_checking', name: '质检中', color: '#EC4899', isInitial: false, isFinal: false, order: 7 },
  { id: 'status_completed', code: 'completed', name: '已完成', color: '#059669', isInitial: false, isFinal: true, order: 8 },
  { id: 'status_cancelled', code: 'cancelled', name: '已取消', color: '#9CA3AF', isInitial: false, isFinal: true, order: 9 },
]

// 回货单工作流节点配置
const returnGoodsWorkflowNodes: WorkflowNode[] = [
  // 开始节点
  {
    id: 'node_start',
    type: 'start',
    position: { x: 250, y: 50 },
    data: {
      label: '开始',
      description: '回货流程开始',
    },
  },
  // 生成回货单节点
  {
    id: 'node_generate',
    type: 'create',
    position: { x: 250, y: 150 },
    data: {
      label: '生成回货单',
      description: 'LAC系统生成回货单，生成条码供仓库扫码签收',
      permissions: [
        {
          roleId: 'engineer',
          fieldPermissions: {},
          canView: true,
          canEdit: true,
          canApprove: false,
          canReject: false,
          canTransfer: false,
          canComment: true,
        },
      ],
    },
  },
  // 打印回货单节点
  {
    id: 'node_print',
    type: 'action',
    position: { x: 250, y: 250 },
    data: {
      label: '打印回货单',
      description: '服务站打印回货单据（回货单上须有条码）',
    },
  },
  // 配件发货节点
  {
    id: 'node_ship',
    type: 'fill',
    position: { x: 250, y: 350 },
    data: {
      label: '配件发货',
      description: '服务站将配件按回货单发货至仓库',
      permissions: [
        {
          roleId: 'dealer',
          fieldPermissions: {},
          canView: true,
          canEdit: true,
          canApprove: false,
          canReject: false,
          canTransfer: false,
          canComment: true,
        },
      ],
    },
  },
  // 仓库扫码节点
  {
    id: 'node_scan',
    type: 'action',
    position: { x: 250, y: 450 },
    data: {
      label: '仓库扫码签收',
      description: '仓库扫码录入生成收货记录（非实物收货生成库存）',
      permissions: [
        {
          roleId: 'warehouse',
          fieldPermissions: {},
          canView: true,
          canEdit: true,
          canApprove: false,
          canReject: false,
          canTransfer: false,
          canComment: true,
        },
      ],
    },
  },
  // 仓库收货节点
  {
    id: 'node_receive',
    type: 'fill',
    position: { x: 250, y: 550 },
    data: {
      label: '仓库实物收货',
      description: '仓库在SILP收货后，信息回传至LAC',
      permissions: [
        {
          roleId: 'warehouse',
          fieldPermissions: {},
          canView: true,
          canEdit: true,
          canApprove: false,
          canReject: false,
          canTransfer: false,
          canComment: true,
        },
      ],
    },
  },
  // 质量审核节点
  {
    id: 'node_quality_review',
    type: 'approve',
    position: { x: 250, y: 650 },
    data: {
      label: '人工质量审核',
      description: '返回的结件、质量件通过人工审核判断是否需要推送至供应商',
      approvers: {
        type: 'role',
        value: ['engineer', 'role_engineer'],
        multiApprove: 'any',
      },
      permissions: [
        {
          roleId: 'engineer',
          fieldPermissions: {},
          canView: true,
          canEdit: true,
          canApprove: true,
          canReject: true,
          canTransfer: true,
          canComment: true,
        },
        {
          roleId: 'admin',
          fieldPermissions: {},
          canView: true,
          canEdit: true,
          canApprove: true,
          canReject: true,
          canTransfer: true,
          canComment: true,
        },
      ],
    },
  },
  // 条件分支节点
  {
    id: 'node_condition',
    type: 'condition',
    position: { x: 250, y: 750 },
    data: {
      label: '处理方式判定',
      description: '根据审核结果决定处理方式',
      conditions: [
        {
          id: 'cond_to_supplier',
          name: '推送供应商',
          rules: [],
          logic: 'and',
          targetNodeId: 'node_push_supplier',
        },
        {
          id: 'cond_to_stock',
          name: '入库',
          rules: [],
          logic: 'and',
          targetNodeId: 'node_complete',
        },
        {
          id: 'cond_scrap',
          name: '报废',
          rules: [],
          logic: 'and',
          targetNodeId: 'node_complete',
        },
      ],
    },
  },
  // 推送供应商节点
  {
    id: 'node_push_supplier',
    type: 'action',
    position: { x: 100, y: 850 },
    data: {
      label: '推送至供应商',
      description: '将质量问题推送至供应商处理（手工填报供应商信息）',
    },
  },
  // 完成节点
  {
    id: 'node_complete',
    type: 'end',
    position: { x: 250, y: 950 },
    data: {
      label: '流程完成',
      description: '回货处理完成',
    },
  },
]

// 回货单工作流连线配置
const returnGoodsWorkflowEdges: WorkflowEdge[] = [
  { id: 'edge_1', source: 'node_start', target: 'node_generate' },
  { id: 'edge_2', source: 'node_generate', target: 'node_print' },
  { id: 'edge_3', source: 'node_print', target: 'node_ship' },
  { id: 'edge_4', source: 'node_ship', target: 'node_scan' },
  { id: 'edge_5', source: 'node_scan', target: 'node_receive' },
  { id: 'edge_6', source: 'node_receive', target: 'node_quality_review' },
  { id: 'edge_7', source: 'node_quality_review', target: 'node_condition' },
  { id: 'edge_8', source: 'node_condition', target: 'node_push_supplier', label: '推送供应商', conditionId: 'cond_to_supplier' },
  { id: 'edge_9', source: 'node_condition', target: 'node_complete', label: '入库/报废', conditionId: 'cond_to_stock' },
  { id: 'edge_10', source: 'node_push_supplier', target: 'node_complete' },
]

// 回货单工作流事件配置
const returnGoodsFlowEvents: FlowEvent[] = [
  // 创建/生成事件
  {
    id: 'evt_create',
    type: 'create',
    name: '生成回货单',
    description: '从索赔单生成回货单',
    enabled: true,
    toStatus: 'draft',
    permissions: ['engineer', 'admin', 'role_engineer', 'role_admin'],
  },
  // 生成条码事件
  {
    id: 'evt_generate_barcode',
    type: 'submit',
    name: '生成条码',
    description: '生成回货单条码，供仓库扫码签收',
    enabled: true,
    fromStatus: ['draft'],
    toStatus: 'generated',
    permissions: ['engineer', 'admin', 'role_engineer', 'role_admin'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['dealer'],
          template: '回货单已生成，请打印并发货',
        },
      },
    ],
  },
  // 发货事件
  {
    id: 'evt_ship',
    type: 'submit',
    name: '确认发货',
    description: '服务站确认已发货',
    enabled: true,
    fromStatus: ['generated'],
    toStatus: 'shipped',
    permissions: ['dealer', 'admin', 'role_dealer', 'role_admin'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['warehouse'],
          template: '有新的回货配件待签收',
        },
      },
    ],
  },
  // 扫码签收事件
  {
    id: 'evt_scan',
    type: 'approve',
    name: '扫码签收',
    description: '仓库扫码录入生成收货记录',
    enabled: true,
    fromStatus: ['generated', 'shipped', 'pending_sign'],
    toStatus: 'scanned',
    permissions: ['warehouse', 'admin', 'role_warehouse', 'role_admin'],
  },
  // 确认收货事件
  {
    id: 'evt_receive',
    type: 'approve',
    name: '确认收货',
    description: '仓库确认实物收货，信息回传至LAC',
    enabled: true,
    fromStatus: ['scanned'],
    toStatus: 'received',
    permissions: ['warehouse', 'admin', 'role_warehouse', 'role_admin'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['engineer'],
          template: '回货配件已收货，请进行质量审核',
        },
      },
    ],
  },
  // 开始质检事件
  {
    id: 'evt_start_quality_check',
    type: 'approve',
    name: '开始质检',
    description: '开始人工质量审核',
    enabled: true,
    fromStatus: ['received'],
    toStatus: 'quality_checking',
    permissions: ['engineer', 'admin', 'role_engineer', 'role_admin'],
  },
  // 质检完成事件
  {
    id: 'evt_complete_quality_check',
    type: 'complete',
    name: '完成质检',
    description: '完成人工质量审核',
    enabled: true,
    fromStatus: ['quality_checking'],
    toStatus: 'completed',
    permissions: ['engineer', 'admin', 'role_engineer', 'role_admin'],
  },
  // 直接完成事件
  {
    id: 'evt_complete',
    type: 'complete',
    name: '完成处理',
    description: '完成回货单所有处理',
    enabled: true,
    fromStatus: ['received', 'quality_checking'],
    toStatus: 'completed',
    permissions: ['engineer', 'admin', 'role_engineer', 'role_admin'],
  },
  // 取消事件
  {
    id: 'evt_cancel',
    type: 'cancel',
    name: '取消回货单',
    description: '取消回货单',
    enabled: true,
    fromStatus: ['draft', 'generated'],
    toStatus: 'cancelled',
    permissions: ['admin', 'role_admin'],
  },
  // 通知事件
  {
    id: 'evt_notify',
    type: 'notify',
    name: '发送通知',
    description: '发送状态变更通知',
    enabled: true,
  },
]

// 回货单工作流配置
const returnGoodsWorkflow: WorkflowConfig = {
  id: 'workflow_return_goods',
  name: '回货处理流程',
  categoryId: 'doctype_return_goods',
  description: '回货单处理工作流，包含生成条码、打印、发货、扫码签收、仓库收货、质量审核等环节',
  nodes: returnGoodsWorkflowNodes,
  edges: returnGoodsWorkflowEdges,
  events: returnGoodsFlowEvents,
  statuses: returnGoodsStatuses,
  status: 'published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function InitReturnGoodsDocument() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // 检查是否已存在回货单类型
    const existingTypes = documentTypeStorage.getAll()
    const existingReturnGoods = existingTypes.find(t => t.code === 'RG' || t.id === 'doctype_return_goods')
    
    if (!existingReturnGoods) {
      // 不存在则创建
      documentTypeStorage.save(returnGoodsDocumentType)
      console.log('回货单单据类型已自动创建')
    } else if ((existingReturnGoods.fields?.length || 0) < returnGoodsDocumentType.fields.length) {
      // 如果字段数量少于配置，更新字段
      const updatedType = {
        ...existingReturnGoods,
        fields: returnGoodsDocumentType.fields,
        actionButtons: returnGoodsDocumentType.actionButtons,
        enableReply: true,
        numberRule: returnGoodsDocumentType.numberRule,
        description: returnGoodsDocumentType.description,
        updatedAt: new Date().toISOString(),
      }
      documentTypeStorage.save(updatedType)
      console.log('回货单单据类型已更新字段配置')
    }
    
    // 检查是否已存在回货单工作流
    const existingWorkflows = workflowStorage.getAll()
    const existingReturnGoodsWorkflow = existingWorkflows.find(w => w.id === 'workflow_return_goods' || w.categoryId === 'doctype_return_goods')
    
    if (!existingReturnGoodsWorkflow) {
      // 不存在则创建工作流
      workflowStorage.save(returnGoodsWorkflow)
      console.log('回货单工作流已自动创建')
    } else {
      // 更新工作流配置
      const updatedWorkflow = {
        ...existingReturnGoodsWorkflow,
        nodes: returnGoodsWorkflowNodes,
        edges: returnGoodsWorkflowEdges,
        events: returnGoodsFlowEvents,
        statuses: returnGoodsStatuses,
        updatedAt: new Date().toISOString(),
      }
      workflowStorage.save(updatedWorkflow)
      console.log('回货单工作流已更新配置')
    }
    
    setInitialized(true)
  }, [])

  // 组件不渲染任何内容
  return null
}

// 导出配置供其他模块使用
export { returnGoodsDocumentType, returnGoodsWorkflow, returnGoodsStatuses }
