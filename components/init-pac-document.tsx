'use client'

/**
 * PAC单据类型自动初始化组件
 * 在应用启动时自动检查并初始化PAC单据类型
 */

import { useEffect, useState } from 'react'
import { documentTypeStorage, workflowStorage } from '@/lib/storage'
import type { DocumentType, FormField, DocumentNumberRule, ActionButton, WorkflowConfig, WorkflowNode, WorkflowEdge, FlowEvent, DocumentStatusConfig } from '@/lib/types'

// PAC单据类型配置
const pacDocumentType: DocumentType = {
  id: 'doctype_pac',
  name: 'PAC单据',
  code: 'PAC',
  icon: 'FileQuestion',
  description: '产品售后问题反馈单，用于记录经销商反馈的产品质量问题、配件咨询等',
  
  numberRule: {
    prefix: 'PAC',
    dateFormat: 'YYYYMMDD',
    sequenceLength: 4,
    resetCycle: 'daily',
  } as DocumentNumberRule,
  
  fields: [
    // 基本信息区
    {
      id: 'section_header',
      type: 'divider',
      label: '基本信息',
      name: 'section_header',
      required: false,
      width: 'full',
    },
    {
      id: 'problem_id',
      type: 'text',
      label: '问题编号',
      name: 'problem_id',
      required: true,
      placeholder: '系统自动生成',
      disabled: true,
      width: 'third',
    },
    {
      id: 'submit_time',
      type: 'datetime',
      label: '提问时间',
      name: 'submit_time',
      required: true,
      width: 'third',
    },
    {
      id: 'reply_count',
      type: 'number',
      label: '回复次数',
      name: 'reply_count',
      required: false,
      defaultValue: 0,
      disabled: true,
      width: 'third',
    },
    {
      id: 'is_complaint',
      type: 'radio',
      label: '是否用户投诉',
      name: 'is_complaint',
      required: true,
      options: [
        { label: '是', value: 'yes' },
        { label: '否', value: 'no' },
      ],
      defaultValue: 'no',
      width: 'third',
    },
    
    // 经销商信息区
    {
      id: 'section_dealer',
      type: 'divider',
      label: '经销商信息',
      name: 'section_dealer',
      required: false,
      width: 'full',
    },
    {
      id: 'dealer_code',
      type: 'text',
      label: '经销商编码',
      name: 'dealer_code',
      required: true,
      placeholder: '请输入经销商编码',
      width: 'third',
      linkage: {
        sourceField: 'dealer_code',
        sourceType: 'dealer_code',
        targetMappings: [
          { targetField: 'user_name', sourceProperty: 'username' },
          { targetField: 'contact_person', sourceProperty: 'contact' },
          { targetField: 'contact_phone', sourceProperty: 'phone' },
          { targetField: 'contact_email', sourceProperty: 'email' },
          { targetField: 'province', sourceProperty: 'province' },
        ],
      },
    },
    {
      id: 'user_name',
      type: 'text',
      label: '用户名',
      name: 'user_name',
      required: false,
      placeholder: '用户名',
      width: 'third',
    },
    {
      id: 'contact_person',
      type: 'text',
      label: '联系人',
      name: 'contact_person',
      required: true,
      placeholder: '请输入联系人姓名',
      width: 'third',
    },
    {
      id: 'contact_phone',
      type: 'text',
      label: '联系方式',
      name: 'contact_phone',
      required: true,
      placeholder: '请输入联系电话',
      width: 'third',
    },
    {
      id: 'contact_email',
      type: 'text',
      label: '电子邮箱',
      name: 'contact_email',
      required: false,
      placeholder: '请输入电子邮箱',
      width: 'third',
    },
    {
      id: 'province',
      type: 'text',
      label: '省份',
      name: 'province',
      required: false,
      placeholder: '省份',
      width: 'third',
    },
    
    // 问题详情区
    {
      id: 'section_problem',
      type: 'divider',
      label: '问题详情',
      name: 'section_problem',
      required: false,
      width: 'full',
    },
    {
      id: 'problem_type',
      type: 'select',
      label: '问题类型',
      name: 'problem_type',
      required: true,
      placeholder: '请选择问题类型',
      options: [
        { label: '配件状态咨询', value: 'parts_status' },
        { label: '配件质量问题', value: 'parts_quality' },
        { label: '技术咨询', value: 'technical' },
        { label: '售后服务', value: 'after_sales' },
        { label: '其他', value: 'other' },
      ],
      width: 'third',
    },
    {
      id: 'problem_category_level3',
      type: 'select',
      label: '问题类别三级',
      name: 'problem_category_level3',
      required: false,
      placeholder: '请选择三级分类',
      options: [
        { label: '配件质量问题', value: 'parts_quality' },
        { label: '配件供应问题', value: 'parts_supply' },
        { label: '配件价格问题', value: 'parts_price' },
        { label: '技术支持问题', value: 'tech_support' },
        { label: '其他问题', value: 'other' },
      ],
      width: 'third',
    },
    {
      id: 'problem_category_level4',
      type: 'select',
      label: '问题类别四级',
      name: 'problem_category_level4',
      required: false,
      placeholder: '请选择四级分类',
      options: [
        { label: '外观缺陷', value: 'appearance_defect' },
        { label: '功能故障', value: 'function_fault' },
        { label: '包装问题', value: 'packaging' },
        { label: '其他', value: 'other' },
      ],
      width: 'third',
    },
    {
      id: 'subject',
      type: 'text',
      label: '主题',
      name: 'subject',
      required: true,
      placeholder: '请输入问题主题',
      width: 'full',
      maxLength: 200,
    },
    {
      id: 'problem_description',
      type: 'textarea',
      label: '问题描述',
      name: 'problem_description',
      required: true,
      placeholder: '请详细描述您遇到的问题',
      rows: 4,
      width: 'full',
    },
    {
      id: 'attachments',
      type: 'file',
      label: '附件',
      name: 'attachments',
      required: false,
      accept: 'image/*,.pdf,.doc,.docx',
      multiple: true,
      maxSize: 10,
      width: 'full',
    },
    
    // 车辆信息区
    {
      id: 'section_vehicle',
      type: 'divider',
      label: '车辆信息',
      name: 'section_vehicle',
      required: false,
      width: 'full',
    },
    {
      id: 'vin',
      type: 'text',
      label: 'VIN',
      name: 'vin',
      required: false,
      placeholder: '请输入17位车辆识别号',
      maxLength: 17,
      pattern: '^[A-HJ-NPR-Z0-9]{17}$',
      width: 'third',
      linkage: {
        sourceField: 'vin',
        sourceType: 'vin',
        targetMappings: [
          { targetField: 'vehicle_model', sourceProperty: 'model' },
          { targetField: 'production_date', sourceProperty: 'productionDate' },
        ],
      },
    },
    {
      id: 'vehicle_model',
      type: 'text',
      label: '车型',
      name: 'vehicle_model',
      required: false,
      placeholder: '车型',
      width: 'third',
    },
    {
      id: 'production_date',
      type: 'date',
      label: '生产日期',
      name: 'production_date',
      required: false,
      width: 'third',
    },
    
    // 配件信息区
    {
      id: 'section_parts',
      type: 'divider',
      label: '配件信息',
      name: 'section_parts',
      required: false,
      width: 'full',
    },
    {
      id: 'part_number',
      type: 'text',
      label: '配件编号',
      name: 'part_number',
      required: false,
      placeholder: '请输入配件编号',
      width: 'half',
    },
    {
      id: 'part_name',
      type: 'text',
      label: '配件名称',
      name: 'part_name',
      required: false,
      placeholder: '配件名称',
      width: 'half',
    },
    
    // 订单信息区
    {
      id: 'section_order',
      type: 'divider',
      label: '订单信息',
      name: 'section_order',
      required: false,
      width: 'full',
    },
    {
      id: 'order_number',
      type: 'text',
      label: '订单号',
      name: 'order_number',
      required: false,
      placeholder: '请输入订单号',
      width: 'third',
    },
    {
      id: 'delivery_number',
      type: 'text',
      label: '发货号',
      name: 'delivery_number',
      required: false,
      placeholder: '请输入发货号',
      width: 'third',
    },
    {
      id: 'warehouse',
      type: 'text',
      label: '发货库',
      name: 'warehouse',
      required: false,
      placeholder: '发货库',
      width: 'third',
    },
  ] as FormField[],
  
  layout: 'vertical',
  workflowEnabled: true,
  enableReply: true,
  
  actionButtons: [
    {
      id: 'btn_submit',
      name: '提交',
      code: 'submit',
      type: 'primary',
      icon: 'Send',
      position: 'footer',
      visibleStatus: ['draft'],
      actionType: 'status_change',
      toStatus: 'pending',
      confirmRequired: true,
      confirmMessage: '确定要提交此单据吗？',
      order: 1,
      enabled: true,
    },
    {
      id: 'btn_reply',
      name: '回复方案',
      code: 'reply',
      type: 'primary',
      icon: 'MessageSquare',
      position: 'footer',
      visibleStatus: ['pending'],
      visibleRoles: ['engineer', 'admin'],
      actionType: 'custom',
      confirmRequired: false,
      order: 2,
      enabled: true,
    },
    {
      id: 'btn_close',
      name: '关闭单据',
      code: 'close',
      type: 'secondary',
      icon: 'CheckCircle',
      position: 'footer',
      visibleStatus: ['pending', 'replied'],
      visibleRoles: ['admin', 'dealer'],
      actionType: 'status_change',
      toStatus: 'closed',
      confirmRequired: true,
      confirmMessage: '确定要关闭此单据吗？关闭后将无法继续处理。',
      order: 3,
      enabled: true,
    },
  ] as ActionButton[],
  
  status: 'published',
  order: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// PAC单据状态配置
const pacStatuses: DocumentStatusConfig[] = [
  { id: 'status_draft', code: 'draft', name: '草稿', color: '#6B7280', isInitial: true, isFinal: false, order: 1 },
  { id: 'status_pending', code: 'pending', name: '待处理', color: '#F59E0B', isInitial: false, isFinal: false, order: 2 },
  { id: 'status_processing', code: 'processing', name: '处理中', color: '#3B82F6', isInitial: false, isFinal: false, order: 3 },
  { id: 'status_replied', code: 'replied', name: '已回复', color: '#10B981', isInitial: false, isFinal: false, order: 4 },
  { id: 'status_closed', code: 'closed', name: '已关闭', color: '#6B7280', isInitial: false, isFinal: true, order: 5 },
  { id: 'status_rejected', code: 'rejected', name: '已驳回', color: '#EF4444', isInitial: false, isFinal: true, order: 6 },
]

// PAC工作流节点配置
const pacWorkflowNodes: WorkflowNode[] = [
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
      label: '创建单据',
      description: '经销商创建PAC问题单',
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
      description: '提交问题等待处理',
    },
  },
  // 工程师审核节点
  {
    id: 'node_review',
    type: 'approve',
    position: { x: 250, y: 350 },
    data: {
      label: '工程师审核',
      description: '工程师审核问题并决定处理方式',
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
          canEdit: false,
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
      timeout: 48,
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
      label: '问题处理',
      description: '工程师处理问题并回复方案',
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
  // 回复方案节点
  {
    id: 'node_reply',
    type: 'approve',
    position: { x: 100, y: 650 },
    data: {
      label: '回复方案',
      description: '工程师回复处理方案，等待经销商确认',
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
      description: '问题已驳回',
    },
  },
  // 关闭节点
  {
    id: 'node_closed',
    type: 'end',
    position: { x: 100, y: 750 },
    data: {
      label: '已关闭',
      description: '问题已解决并关闭',
    },
  },
]

// PAC工作流连线配置
const pacWorkflowEdges: WorkflowEdge[] = [
  { id: 'edge_1', source: 'node_start', target: 'node_create' },
  { id: 'edge_2', source: 'node_create', target: 'node_submit' },
  { id: 'edge_3', source: 'node_submit', target: 'node_review' },
  { id: 'edge_4', source: 'node_review', target: 'node_condition' },
  { id: 'edge_5', source: 'node_condition', target: 'node_process', label: '通过', conditionId: 'cond_approve' },
  { id: 'edge_6', source: 'node_condition', target: 'node_rejected', label: '驳回', conditionId: 'cond_reject' },
  { id: 'edge_7', source: 'node_process', target: 'node_reply' },
  { id: 'edge_8', source: 'node_reply', target: 'node_closed', label: '确认关闭' },
  { id: 'edge_9', source: 'node_reply', target: 'node_process', label: '继续处理' },
]

// PAC工作流事件配置
const pacFlowEvents: FlowEvent[] = [
  // 提交事件
  {
    id: 'evt_submit',
    type: 'submit',
    name: '提交问题',
    description: '经销商提交问题单',
    enabled: true,
    fromStatus: ['draft'],
    toStatus: 'pending',
    permissions: ['dealer', 'admin', 'role_admin'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['engineer'],
          template: '您有新的PAC问题单待处理',
        },
      },
    ],
  },
  // 审核通过事件
  {
    id: 'evt_approve',
    type: 'approve',
    name: '审核通过',
    description: '工程师审核通过，开始处理问题',
    enabled: true,
    fromStatus: ['pending'],
    toStatus: 'processing',
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['dealer'],
          template: '您的问题单已审核通过，正在处理中',
        },
      },
    ],
  },
  // 驳回事件
  {
    id: 'evt_reject',
    type: 'reject',
    name: '驳回问题',
    description: '工程师驳回问题单',
    enabled: true,
    fromStatus: ['pending'],
    toStatus: 'rejected',
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['dealer'],
          template: '您的问题单已被驳回，请查看驳回原因',
        },
      },
    ],
  },
  // 回复方案事件
  {
    id: 'evt_reply',
    type: 'complete',
    name: '回复方案',
    description: '工程师回复处理方案',
    enabled: true,
    fromStatus: ['processing', 'pending'],
    toStatus: 'replied',
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['dealer'],
          template: '工程师已回复处理方案，请查看',
        },
      },
    ],
  },
  // 关闭事件
  {
    id: 'evt_close',
    type: 'complete',
    name: '关闭单据',
    description: '问题已解决，关闭单据',
    enabled: true,
    fromStatus: ['replied', 'processing', 'pending'],
    toStatus: 'closed',
    permissions: ['dealer', 'engineer', 'admin', 'role_admin', 'role_dealer', 'role_engineer'],
  },
  // 重新处理事件
  {
    id: 'evt_reprocess',
    type: 'resubmit',
    name: '继续处理',
    description: '经销商要求继续处理',
    enabled: true,
    fromStatus: ['replied'],
    toStatus: 'processing',
    permissions: ['dealer', 'admin', 'role_admin', 'role_dealer'],
    actions: [
      {
        type: 'notify',
        config: {
          recipients: ['engineer'],
          template: '经销商要求继续处理问题',
        },
      },
    ],
  },
  // 转单事件
  {
    id: 'evt_transfer',
    type: 'transfer',
    name: '转单',
    description: '将问题转给其他工程师处理',
    enabled: true,
    fromStatus: ['pending', 'processing'],
    permissions: ['engineer', 'admin', 'role_admin', 'role_engineer'],
  },
]

// PAC工作流配置
const pacWorkflow: WorkflowConfig = {
  id: 'workflow_pac',
  name: 'PAC问题处理流程',
  categoryId: 'doctype_pac',
  description: 'PAC产品售后问题处理工作流，包含提交、审核、处理、回复、关闭等环节',
  nodes: pacWorkflowNodes,
  edges: pacWorkflowEdges,
  events: pacFlowEvents,
  statuses: pacStatuses,
  status: 'published',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function InitPacDocument() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // 检查是否已存在PAC类型
    const existingTypes = documentTypeStorage.getAll()
    const existingPac = existingTypes.find(t => t.code === 'PAC' || t.id === 'doctype_pac')
    
    if (!existingPac) {
      // 不存在则创建
      documentTypeStorage.save(pacDocumentType)
      console.log('PAC单据类型已自动创建')
    } else if ((existingPac.fields?.length || 0) < pacDocumentType.fields.length) {
      // 如果字段数量少于配置，更新字段
      const updatedType = {
        ...existingPac,
        fields: pacDocumentType.fields,
        actionButtons: pacDocumentType.actionButtons,
        enableReply: true,
        numberRule: pacDocumentType.numberRule,
        updatedAt: new Date().toISOString(),
      }
      documentTypeStorage.save(updatedType)
      console.log('PAC单据类型已更新字段配置')
    }
    
    // 检查是否已存在PAC工作流
    const existingWorkflows = workflowStorage.getAll()
    const existingPacWorkflow = existingWorkflows.find(w => w.id === 'workflow_pac' || w.categoryId === 'doctype_pac')
    
    if (!existingPacWorkflow) {
      // 不存在则创建工作流
      workflowStorage.save(pacWorkflow)
      console.log('PAC工作流已自动创建')
    } else if ((existingPacWorkflow.events?.length || 0) < pacFlowEvents.length) {
      // 如果事件数量少于配置，更新工作流
      const updatedWorkflow = {
        ...existingPacWorkflow,
        nodes: pacWorkflowNodes,
        edges: pacWorkflowEdges,
        events: pacFlowEvents,
        statuses: pacStatuses,
        updatedAt: new Date().toISOString(),
      }
      workflowStorage.save(updatedWorkflow)
      console.log('PAC工作流已更新配置')
    }
    
    setInitialized(true)
  }, [])

  // 此组件不渲染任何UI
  return null
}

export default InitPacDocument
