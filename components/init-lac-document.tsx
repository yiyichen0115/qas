'use client'

/**
 * LAC单据类型自动初始化组件
 * 在应用启动时自动检查并初始化LAC索赔单据类型
 */

import { useEffect, useState } from 'react'
import { documentTypeStorage, workflowStorage, fieldGroupStorage } from '@/lib/storage'
import type { DocumentType, FormField, DocumentNumberRule, ActionButton, WorkflowConfig, WorkflowNode, WorkflowEdge, FlowEvent, DocumentStatusConfig } from '@/lib/types'

// LAC单据类型配置
const lacDocumentType: DocumentType = {
  id: 'doctype_lac',
  name: 'LAC索赔单',
  code: 'LAC',
  icon: 'FileWarning',
  description: '物流索赔单，用于记录配件发货过程中的错发、漏发、损坏等问题的索赔申请',
  
  numberRule: {
    prefix: 'LAC',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
    resetCycle: 'daily',
  } as DocumentNumberRule,

  // 使用统一的基础信息字段组
  fieldGroups: [
    {
      fieldGroupId: 'system_basic_info',
      enabled: true,
      overrideFields: [
        {
          id: 'doc_number',
          hidden: false, // 确保显示单据号
        },
      ],
    },
  ],

  fields: [
    // 移除了重复的基础字段（application_no、upload_time等），现在使用字段组
    // 保留业务特定字段
    {
      id: 'related_application_no',
      type: 'text',
      label: '关联单号',
      name: 'related_application_no',
      required: false,
      placeholder: '关联的其他申请单号',
      width: 'third',
    },
    
    // 发货信息区
    {
      id: 'section_shipping',
      type: 'divider',
      label: '发货信息',
      name: 'section_shipping',
      required: false,
      width: 'full',
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
      ],
      width: 'third',
    },
    {
      id: 'shipping_date',
      type: 'date',
      label: '发货日期',
      name: 'shipping_date',
      required: true,
      width: 'third',
    },
    {
      id: 'receiving_date',
      type: 'date',
      label: '收货日期',
      name: 'receiving_date',
      required: true,
      width: 'third',
    },
    {
      id: 'delivery_number',
      type: 'text',
      label: '发货号',
      name: 'delivery_number',
      required: true,
      placeholder: '请输入发货号',
      width: 'third',
      // 发货号联动配置
      linkage: {
        sourceField: 'delivery_number',
        sourceType: 'custom',
        targetMappings: [
          { targetField: 'shipping_warehouse', sourceProperty: 'warehouse' },
        ],
      },
    },
    
    // 问题描述区
    {
      id: 'section_problem',
      type: 'divider',
      label: '问题描述',
      name: 'section_problem',
      required: false,
      width: 'full',
    },
    {
      id: 'problem_remark',
      type: 'textarea',
      label: '问题备注',
      name: 'problem_remark',
      required: true,
      placeholder: '请详细描述问题情况，如：配件状态错误、颜色不一样等',
      width: 'full',
    },
    
    // 服务中心信息区
    {
      id: 'section_service_center',
      type: 'divider',
      label: '服务中心信息',
      name: 'section_service_center',
      required: false,
      width: 'full',
    },
    {
      id: 'sap_code',
      type: 'text',
      label: 'SAP代码',
      name: 'sap_code',
      required: true,
      placeholder: '请输入SAP代码',
      width: 'third',
    },
    {
      id: 'service_center_name',
      type: 'text',
      label: '服务中心名称',
      name: 'service_center_name',
      required: true,
      placeholder: '服务中心名称',
      width: 'third',
    },
    {
      id: 'handler_name',
      type: 'text',
      label: '经办人',
      name: 'handler_name',
      required: true,
      placeholder: '经办人姓名',
      width: 'third',
    },
    {
      id: 'contact_phone',
      type: 'text',
      label: '联系电话',
      name: 'contact_phone',
      required: true,
      placeholder: '联系电话',
      width: 'third',
    },
    
    // 索赔单状态区
    {
      id: 'section_claim_status',
      type: 'divider',
      label: '索赔单状态',
      name: 'section_claim_status',
      required: false,
      width: 'full',
    },
    {
      id: 'claim_status',
      type: 'select',
      label: '索赔单状态',
      name: 'claim_status',
      required: false,
      options: [
        { label: '未处理', value: '未处理' },
        { label: '处理中', value: '处理中' },
        { label: '已完成', value: '已完成' },
        { label: '已关闭', value: '已关闭' },
      ],
      defaultValue: '未处理',
      width: 'third',
    },
    {
      id: 'close_date',
      type: 'date',
      label: '关闭日期',
      name: 'close_date',
      required: false,
      width: 'third',
    },
    {
      id: 'first_reply_person',
      type: 'text',
      label: '初次回复人',
      name: 'first_reply_person',
      required: false,
      placeholder: '初次回复人',
      width: 'third',
    },
    {
      id: 'first_reply_time',
      type: 'datetime',
      label: '初次回复时间',
      name: 'first_reply_time',
      required: false,
      width: 'third',
    },
    {
      id: 'last_reply_person',
      type: 'text',
      label: '最后回复人',
      name: 'last_reply_person',
      required: false,
      placeholder: '最后回复人',
      width: 'third',
    },
    {
      id: 'last_reply_time',
      type: 'datetime',
      label: '最后回复时间',
      name: 'last_reply_time',
      required: false,
      width: 'third',
    },
    {
      id: 'submit_year',
      type: 'number',
      label: '提交日期-年',
      name: 'submit_year',
      required: false,
      width: 'third',
    },
    {
      id: 'submit_month',
      type: 'number',
      label: '提交日期-月',
      name: 'submit_month',
      required: false,
      width: 'third',
    },
    {
      id: 'year_week',
      type: 'number',
      label: '当年第几周',
      name: 'year_week',
      required: false,
      width: 'third',
    },
    {
      id: 'month_week',
      type: 'number',
      label: '当月第几周',
      name: 'month_week',
      required: false,
      width: 'third',
    },
    
    // 索赔明细区
    {
      id: 'section_claim_detail',
      type: 'divider',
      label: '索赔明细',
      name: 'section_claim_detail',
      required: false,
      width: 'full',
    },
    {
      id: 'claim_box_no',
      type: 'text',
      label: '索赔箱号',
      name: 'claim_box_no',
      required: true,
      placeholder: '请输入索赔箱号',
      width: 'half',
    },
    {
      id: 'package_status',
      type: 'select',
      label: '外包装状态',
      name: 'package_status',
      required: true,
      options: [
        { label: '外包装完好', value: '外包装完好' },
        { label: '外包装破损', value: '外包装破损' },
        { label: '外包装严重破损', value: '外包装严重破损' },
      ],
      width: 'half',
    },
    {
      id: 'part_drawing_no',
      type: 'text',
      label: '配件编码',
      name: 'part_drawing_no',
      required: true,
      placeholder: '请输入配件编码',
      width: 'third',
      // 配件编码联动配置
      linkage: {
        sourceField: 'part_drawing_no',
        sourceType: 'custom',
        targetMappings: [
          { targetField: 'part_name', sourceProperty: 'partName' },
          { targetField: 'unit_price', sourceProperty: 'price' },
        ],
      },
    },
    {
      id: 'part_name',
      type: 'text',
      label: '配件名称',
      name: 'part_name',
      required: true,
      placeholder: '配件名称（自动带出）',
      width: 'third',
    },
    {
      id: 'claim_quantity',
      type: 'number',
      label: '索赔数量',
      name: 'claim_quantity',
      required: true,
      placeholder: '数量',
      width: 'third',
    },
    {
      id: 'problem_type',
      type: 'select',
      label: '问题类型',
      name: 'problem_type',
      required: true,
      options: [
        { label: '错发', value: '错发' },
        { label: '漏发', value: '漏发' },
        { label: '多发', value: '多发' },
        { label: '破损', value: '破损' },
        { label: '质量问题', value: '质量问题' },
        { label: '其他', value: '其他' },
      ],
      width: 'third',
    },
    {
      id: 'unit_price',
      type: 'number',
      label: '单价(元)',
      name: 'unit_price',
      required: false,
      placeholder: '单价',
      width: 'third',
    },
    {
      id: 'total_amount',
      type: 'number',
      label: '金额(元)',
      name: 'total_amount',
      required: false,
      placeholder: '金额',
      width: 'third',
    },
    
    // 处理信息区
    {
      id: 'section_processing',
      type: 'divider',
      label: '处理信息',
      name: 'section_processing',
      required: false,
      width: 'full',
    },
    {
      id: 'responsibility_judgment',
      type: 'select',
      label: '责任判定',
      name: 'responsibility_judgment',
      required: false,
      options: [
        { label: '物流责任', value: '物流责任' },
        { label: '仓库责任', value: '仓库责任' },
        { label: '供应商责任', value: '供应商责任' },
        { label: '经销商责任', value: '经销商责任' },
        { label: '待定', value: '待定' },
      ],
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
    {
      id: 'claim_complete_time',
      type: 'datetime',
      label: '补发、换发、索赔完成时间',
      name: 'claim_complete_time',
      required: false,
      width: 'third',
    },
    {
      id: 'return_part_receive_date',
      type: 'date',
      label: '退换配件(退货材料)接收日期',
      name: 'return_part_receive_date',
      required: false,
      width: 'third',
    },
    {
      id: 'reissue_delivery_no',
      type: 'text',
      label: '补开票发货号',
      name: 'reissue_delivery_no',
      required: false,
      placeholder: '补开票发货号',
      width: 'third',
    },
    {
      id: 'claim_detail_status',
      type: 'select',
      label: '索赔状态',
      name: 'claim_detail_status',
      required: false,
      options: [
        { label: '待处理', value: '待处理' },
        { label: '处理中', value: '处理中' },
        { label: '已完成', value: '已完成' },
      ],
      width: 'third',
    },
    {
      id: 'remark_status',
      type: 'text',
      label: '备注状态',
      name: 'remark_status',
      required: false,
      placeholder: '备注状态',
      width: 'third',
    },
    {
      id: 'detail_close_date',
      type: 'date',
      label: '关闭日期',
      name: 'detail_close_date',
      required: false,
      width: 'third',
    },
    {
      id: 'remark_text',
      type: 'textarea',
      label: '备注文本',
      name: 'remark_text',
      required: false,
      placeholder: '备注文本',
      width: 'full',
    },
    
    // 关联回货单区
    {
      id: 'section_return_goods',
      type: 'divider',
      label: '关联回货单',
      name: 'section_return_goods',
      required: false,
      width: 'full',
    },
    {
      id: 'return_goods_list',
      type: 'related_documents',
      label: '回货单列表',
      name: 'return_goods_list',
      required: false,
      width: 'full',
      relatedDocConfig: {
        docTypeId: 'doctype_return_goods',
        docTypeName: '回货单',
        linkField: 'claim_no',
        linkSourceField: 'document_number', // 使用统一的基础字段
        displayColumns: [
          { field: 'return_goods_no', label: '回货单号', width: '120px' },
          { field: 'return_goods_status', label: '状态', width: '80px' },
          { field: 'material_quantity', label: '回货数量', width: '80px' },
          { field: 'shipping_warehouse', label: '发货地', width: '100px' },
          { field: 'warehouse_receive_date', label: '签收日期', width: '100px' },
          { field: 'receive_status', label: '收货状态', width: '80px' },
          { field: 'quality_audit_result', label: '审核结果', width: '80px' },
        ],
        actions: [
          { code: 'view', label: '查看', icon: 'Eye' },
          { code: 'print', label: '打印', icon: 'Printer' },
        ],
        emptyText: '暂无关联回货单',
        allowCreate: true,
        createButtonText: '生成回货单',
        createButtonIcon: 'PackagePlus',
      },
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
      visibleStatus: ['draft', 'pending'],
      visibleRoles: ['dealer', 'admin'],
      actionType: 'custom',
      confirmRequired: false,
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_submit',
      name: '提交',
      code: 'submit',
      type: 'primary',
      icon: 'Send',
      position: 'footer',
      visibleStatus: ['draft'],
      visibleRoles: ['dealer', 'admin'],
      actionType: 'status_change',
      toStatus: 'pending',
      confirmRequired: true,
      confirmMessage: '确定要提交此索赔单吗？',
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_update_price',
      name: '更新索赔价',
      code: 'update_price',
      type: 'primary',
      icon: 'RefreshCw',
      position: 'footer',
      visibleStatus: ['pending', 'processing'],
      visibleRoles: ['engineer', 'admin'],
      actionType: 'custom',
      confirmRequired: false,
      order: 2,
      enabled: true,
    },
    {
      id: 'btn_judge',
      name: '整箱判定',
      code: 'judge',
      type: 'primary',
      icon: 'CheckSquare',
      position: 'footer',
      visibleStatus: ['pending', 'processing'],
      visibleRoles: ['engineer', 'admin'],
      actionType: 'custom',
      confirmRequired: false,
      order: 3,
      enabled: true,
    },
    {
      id: 'btn_generate_return_goods',
      name: '生成回货单',
      code: 'generate_return_goods',
      type: 'primary',
      icon: 'PackageCheck',
      position: 'footer',
      visibleStatus: ['draft', 'pending', 'replied', 'processing', 'approved'],
      visibleRoles: ['engineer', 'admin', 'role_engineer', 'role_admin'],
      actionType: 'generate_doc',
      generateDocTypeId: 'doctype_return_goods',
      // 字段映射：LAC源字段 -> 回货单目标字段
      fieldMapping: {
        'document_number': 'claim_no', // 使用统一的基础字段
        'sap_code': 'service_station_code',
        'service_center_name': 'service_station_name',
        'contact_phone': 'contact_phone',
        'service_station_address': 'service_station_address',
        'part_drawing_no': 'part_drawing_no',
        'part_name': 'part_name',
        'claim_quantity': 'material_quantity',
        'shipping_warehouse': 'shipping_warehouse',
        'problem_type': 'problem_type',
        'defect_description': 'problem_remark',
      },
      confirmRequired: true,
      confirmMessage: '确定要根据此索赔单生成回货单吗？',
      order: 4,
      enabled: true,
    },
    {
      id: 'btn_close',
      name: '关闭单据',
      code: 'close',
      type: 'secondary',
      icon: 'CheckCircle',
      position: 'footer',
      visibleStatus: ['pending', 'processing', 'replied'],
      visibleRoles: ['admin', 'engineer'],
      actionType: 'status_change',
      toStatus: 'closed',
      confirmRequired: true,
      confirmMessage: '确定要关闭此索赔单吗？关闭后将无法继续处理。',
      order: 5,
      enabled: true,
    },
    {
      id: 'btn_print_return_goods',
      name: '打印回货单',
      code: 'print_return_goods',
      type: 'secondary',
      icon: 'Printer',
      position: 'toolbar',
      visibleStatus: ['replied', 'processing', 'closed'],
      actionType: 'custom',
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_view_return_goods',
      name: '查看回货单',
      code: 'view_return_goods',
      type: 'link',
      icon: 'ExternalLink',
      position: 'toolbar',
      visibleStatus: ['replied', 'processing', 'closed'],
      actionType: 'open_url',
      openUrl: '/runtime/documents?type=doctype_return_goods&claim_no={document_number}', // 使用统一的基础字段
      openInNewTab: false,
      order: 2,
      enabled: true,
    },
  ] as ActionButton[],
  
  status: 'published',
  order: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// LAC单据状态配置
const lacStatuses: DocumentStatusConfig[] = [
  { id: 'status_draft', code: 'draft', name: '草稿', color: '#6B7280', isInitial: true, isFinal: false, order: 1 },
  { id: 'status_pending', code: 'pending', name: '待处理', color: '#F59E0B', isInitial: false, isFinal: false, order: 2 },
  { id: 'status_processing', code: 'processing', name: '处理中', color: '#3B82F6', isInitial: false, isFinal: false, order: 3 },
  { id: 'status_replied', code: 'replied', name: '已回复', color: '#10B981', isInitial: false, isFinal: false, order: 4 },
  { id: 'status_closed', code: 'closed', name: '已关闭', color: '#6B7280', isInitial: false, isFinal: true, order: 5 },
  { id: 'status_rejected', code: 'rejected', name: '已驳回', color: '#EF4444', isInitial: false, isFinal: true, order: 6 },
]

// LAC工作流节点配置
const lacWorkflowNodes: WorkflowNode[] = [
  // 开始节点
  {
    id: 'node_start',
    type: 'start',
    position: { x: 250, y: 50 },
    data: {
      label: '开始',
      description: '流程开始',
    },
  },
  // 创建单据节点
  {
    id: 'node_create',
    type: 'create',
    position: { x: 250, y: 150 },
    data: {
      label: '创建索赔单',
      description: '服务中心创建LAC索赔单',
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
  // 提交审核节点
  {
    id: 'node_submit',
    type: 'submit',
    position: { x: 250, y: 250 },
    data: {
      label: '提交',
      description: '提交索赔单等待处理',
    },
  },
  // 索赔审核节点
  {
    id: 'node_review',
    type: 'approve',
    position: { x: 250, y: 350 },
    data: {
      label: '索赔审核',
      description: '审核索赔申请并判定责任',
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
      timeout: 72,
      timeoutAction: 'notify',
    },
  },
  // 条件分支节点
  {
    id: 'node_condition',
    type: 'condition',
    position: { x: 250, y: 450 },
    data: {
      label: '处理结果',
      description: '根据审核结果分流',
      conditions: [
        {
          id: 'cond_approve',
          name: '通过',
          rules: [],
          logic: 'and',
          targetNodeId: 'node_process',
        },
        {
          id: 'cond_reject',
          name: '驳回',
          rules: [],
          logic: 'and',
          targetNodeId: 'node_rejected',
        },
      ],
    },
  },
  // 处理中节点
  {
    id: 'node_process',
    type: 'fill',
    position: { x: 100, y: 550 },
    data: {
      label: '索赔处理',
      description: '处理索赔申请，安排补发/换发/退款',
      permissions: [
        {
          roleId: 'engineer',
          fieldPermissions: {},
          canView: true,
          canEdit: true,
          canApprove: false,
          canReject: false,
          canTransfer: true,
          canComment: true,
        },
      ],
    },
  },
  // 索赔方式判定节点
  {
    id: 'node_claim_method_condition',
    type: 'condition',
    position: { x: 100, y: 650 },
    data: {
      label: '索赔方式判定',
      description: '根据索赔方式决定是否需要生成回货单',
      conditions: [
        {
          id: 'cond_need_return',
          name: '需要回货',
          rules: [
            { field: 'claim_method', operator: 'eq', value: '换发' },
          ],
          logic: 'or',
          targetNodeId: 'node_generate_return_goods',
        },
        {
          id: 'cond_no_return',
          name: '无需回货',
          rules: [
            { field: 'claim_method', operator: 'eq', value: '补发' },
            { field: 'claim_method', operator: 'eq', value: '退款' },
          ],
          logic: 'or',
          targetNodeId: 'node_complete',
        },
      ],
    },
  },
  // 生成回货单节点
  {
    id: 'node_generate_return_goods',
    type: 'action',
    position: { x: -50, y: 750 },
    data: {
      label: '生成回货单',
      description: 'LAC系统生成回货单，回货单上须有条码，仓库可直接扫码签收',
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
  // 回货流程节点（子流程）
  {
    id: 'node_return_goods_flow',
    type: 'subprocess',
    position: { x: -50, y: 850 },
    data: {
      label: '回货处理流程',
      description: '进入回货处理子流程：打印回货单 -> 服务站发货 -> 仓库扫码签收 -> 收货入库 -> 质量审核',
    },
  },
  // 完成节点
  {
    id: 'node_complete',
    type: 'approve',
    position: { x: 250, y: 850 },
    data: {
      label: '索赔完成',
      description: '索赔处理��成，等待服务中心确认',
      permissions: [
        {
          roleId: 'dealer',
          fieldPermissions: {},
          canView: true,
          canEdit: false,
          canApprove: true,
          canReject: true,
          canTransfer: false,
          canComment: true,
        },
      ],
    },
  },
  // 驳回节点
  {
    id: 'node_rejected',
    type: 'end',
    position: { x: 400, y: 550 },
    data: {
      label: '已驳回',
      description: '索赔申请已驳回',
    },
  },
  // 关闭节点
  {
    id: 'node_closed',
    type: 'end',
    position: { x: 250, y: 950 },
    data: {
      label: '已关闭',
      description: '索赔已完成并关闭',
    },
  },
]

// LAC工作流连线配置
const lacWorkflowEdges: WorkflowEdge[] = [
  { id: 'edge_1', source: 'node_start', target: 'node_create' },
  { id: 'edge_2', source: 'node_create', target: 'node_submit' },
  { id: 'edge_3', source: 'node_submit', target: 'node_review' },
  { id: 'edge_4', source: 'node_review', target: 'node_condition' },
  { id: 'edge_5', source: 'node_condition', target: 'node_process', label: '通过', conditionId: 'cond_approve' },
  { id: 'edge_6', source: 'node_condition', target: 'node_rejected', label: '驳回', conditionId: 'cond_reject' },
  { id: 'edge_7', source: 'node_process', target: 'node_claim_method_condition' },
  { id: 'edge_8', source: 'node_claim_method_condition', target: 'node_generate_return_goods', label: '需要回货', conditionId: 'cond_need_return' },
  { id: 'edge_9', source: 'node_claim_method_condition', target: 'node_complete', label: '无需回货', conditionId: 'cond_no_return' },
  { id: 'edge_10', source: 'node_generate_return_goods', target: 'node_return_goods_flow' },
  { id: 'edge_11', source: 'node_return_goods_flow', target: 'node_complete', label: '回货完成' },
  { id: 'edge_12', source: 'node_complete', target: 'node_closed', label: '确认完成' },
  { id: 'edge_13', source: 'node_complete', target: 'node_process', label: '继续处理' },
]

// LAC工作流事件配置
const lacFlowEvents: FlowEvent[] = [
  // 提交事件
  {
    id: 'evt_submit',
    type: 'submit',
    name: '提交索赔',
    description: '服务中心提交索赔单',
    enabled: true,
    fromStatus: ['draft'],
    toStatus: 'pending',
    permissions: ['dealer', 'admin', 'role_admin'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['engineer'],
          template: '您有新的LAC索赔单待处理',
        },
      },
    ],
  },
  // 审核通过事件
  {
    id: 'evt_approve',
    type: 'approve',
    name: '审核通过',
    description: '索赔审核通过，开始处理',
    enabled: true,
    fromStatus: ['pending'],
    toStatus: 'processing',
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['dealer'],
          template: '您的索赔单已审核通过，正在处理中',
        },
      },
    ],
  },
  // 驳回事件
  {
    id: 'evt_reject',
    type: 'reject',
    name: '驳回索赔',
    description: '驳回索赔申请',
    enabled: true,
    fromStatus: ['pending'],
    toStatus: 'rejected',
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['dealer'],
          template: '您的索赔单已被驳回，请查看驳回原因',
        },
      },
    ],
  },
  // 处理完成事件
  {
    id: 'evt_complete',
    type: 'complete',
    name: '处理完成',
    description: '索赔处理完成',
    enabled: true,
    fromStatus: ['processing', 'pending'],
    toStatus: 'replied',
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['dealer'],
          template: '您的索赔已处理完成，请确认',
        },
      },
    ],
  },
  // 生成回货单事件
  {
    id: 'evt_generate_return_goods',
    type: 'submit',
    name: '生成回货单',
    description: '根据索赔单生成回货单，用于配件回货管理',
    enabled: true,
    fromStatus: ['processing', 'replied'],
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['dealer', 'warehouse'],
          template: '回货单已生成，请打印并准备发货',
        },
      },
    ],
  },
  // 关闭事件
  {
    id: 'evt_close',
    type: 'complete',
    name: '关闭单据',
    description: '索赔已完成，关闭单据',
    enabled: true,
    fromStatus: ['replied', 'processing', 'pending'],
    toStatus: 'closed',
    permissions: ['dealer', 'engineer', 'admin', 'role_admin', 'role_dealer', 'role_engineer'],
  },
  // 继续处理事件
  {
    id: 'evt_reprocess',
    type: 'resubmit',
    name: '继续处理',
    description: '服务中心要求继续处理',
    enabled: true,
    fromStatus: ['replied'],
    toStatus: 'processing',
    permissions: ['dealer', 'admin', 'role_admin', 'role_dealer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['engineer'],
          template: '服务中心要求继续处理索赔',
        },
      },
    ],
  },
  // 转单事件
  {
    id: 'evt_transfer',
    type: 'transfer',
    name: '转单',
    description: '将索赔转给其他人处理',
    enabled: true,
    fromStatus: ['pending', 'processing'],
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
  },
]

// LAC工作流配置
const lacWorkflow: WorkflowConfig = {
  id: 'workflow_lac',
  name: 'LAC索赔处理流程',
  categoryId: 'doctype_lac',
  description: 'LAC物流索赔处理工作流，包含提交、审核、判定、处理、关闭等环节',
  nodes: lacWorkflowNodes,
  edges: lacWorkflowEdges,
  events: lacFlowEvents,
  statuses: lacStatuses,
  status: 'published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function InitLacDocument() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // 初始化系统内置字段组
    fieldGroupStorage.initSystemGroups()

    // 检查是否已存在LAC类型
    const existingTypes = documentTypeStorage.getAll()
    const existingLac = existingTypes.find(t => t.code === 'LAC' || t.id === 'doctype_lac')

    if (!existingLac) {
      // 不存在则创建
      documentTypeStorage.save(lacDocumentType)
      console.log('LAC单据类型已自动创建')
    } else {
      // 检查是否需要更新（字段组或字段配置）
      const needsUpdate =
        !existingLac.fieldGroups || existingLac.fieldGroups.length === 0 ||
        JSON.stringify(existingLac.fields) !== JSON.stringify(lacDocumentType.fields)

      if (needsUpdate) {
        const updatedType = {
          ...existingLac,
          fieldGroups: lacDocumentType.fieldGroups,
          fields: lacDocumentType.fields,
          actionButtons: lacDocumentType.actionButtons,
          enableReply: true,
          numberRule: lacDocumentType.numberRule,
          updatedAt: new Date().toISOString(),
        }
        documentTypeStorage.save(updatedType)
        console.log('LAC单据类型已更新配置（包含基础信息字段组）')
      }
    }
    
    // 检查是否已存在LAC工作流
    const existingWorkflows = workflowStorage.getAll()
    const existingLacWorkflow = existingWorkflows.find(w => w.id === 'workflow_lac' || w.categoryId === 'doctype_lac')
    
    if (!existingLacWorkflow) {
      // 不存在则创建工作流
      workflowStorage.save(lacWorkflow)
      console.log('LAC工作流已自动创建')
    } else {
      // 更新工作流配置
      const updatedWorkflow = {
        ...existingLacWorkflow,
        nodes: lacWorkflowNodes,
        edges: lacWorkflowEdges,
        events: lacFlowEvents,
        statuses: lacStatuses,
        updatedAt: new Date().toISOString(),
      }
      workflowStorage.save(updatedWorkflow)
      console.log('LAC工作流已更新配置')
    }
    
    setInitialized(true)
  }, [])

  // 组件不渲染任何内容
  return null
}
