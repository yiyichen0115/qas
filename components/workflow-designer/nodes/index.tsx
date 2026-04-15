'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import {
  Play,
  StopCircle,
  UserCheck,
  GitBranch,
  GitMerge,
  Users,
  Bell,
  Workflow,
  FilePlus,
  FileEdit,
  Send,
  Eye,
  ArrowRightLeft,
  RefreshCw,
  Zap,
} from 'lucide-react'
import type { NodeType, WorkflowNodeData } from '@/lib/types'

interface CustomNodeData extends WorkflowNodeData {
  selected?: boolean
}

const nodeConfigs: Record<
  NodeType,
  { icon: React.ReactNode; color: string; bgColor: string; borderColor: string; label: string }
> = {
  start: {
    icon: <Play className="h-5 w-5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    label: '开始',
  },
  end: {
    icon: <StopCircle className="h-5 w-5" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
    label: '结束',
  },
  create: {
    icon: <FilePlus className="h-5 w-5" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    label: '创建单据',
  },
  fill: {
    icon: <FileEdit className="h-5 w-5" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-300',
    label: '填写信息',
  },
  submit: {
    icon: <Send className="h-5 w-5" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-300',
    label: '提交',
  },
  approve: {
    icon: <UserCheck className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    label: '审批',
  },
  review: {
    icon: <Eye className="h-5 w-5" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    label: '审核',
  },
  condition: {
    icon: <GitBranch className="h-5 w-5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    label: '条件',
  },
  parallel: {
    icon: <GitMerge className="h-5 w-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    label: '并行',
  },
  countersign: {
    icon: <Users className="h-5 w-5" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    label: '会签',
  },
  notify: {
    icon: <Bell className="h-5 w-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    label: '通知',
  },
  subprocess: {
    icon: <Workflow className="h-5 w-5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    label: '子流程',
  },
  transfer: {
    icon: <ArrowRightLeft className="h-5 w-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    label: '转单',
  },
  convert: {
    icon: <RefreshCw className="h-5 w-5" />,
    color: 'text-lime-600',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-300',
    label: '转换单据',
  },
  action: {
    icon: <Zap className="h-5 w-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    label: '自定义',
  },
}

// 圆形节点（开始/结束）
const CircleNode = memo(({ data, selected, type }: NodeProps<CustomNodeData> & { type: 'start' | 'end' }) => {
  const config = nodeConfigs[type]

  return (
    <div
      className={cn(
        'flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-all',
        config.borderColor,
        selected && 'ring-2 ring-primary ring-offset-2 shadow-md'
      )}
    >
      <div className={cn('flex flex-col items-center', config.color)}>
        {config.icon}
        <span className="mt-0.5 text-[10px] font-medium">{data.label || config.label}</span>
      </div>
      {type === 'start' && (
        <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-emerald-500 !bg-white" />
      )}
      {type === 'end' && (
        <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-rose-500 !bg-white" />
      )}
    </div>
  )
})
CircleNode.displayName = 'CircleNode'

export const StartNode = memo((props: NodeProps<CustomNodeData>) => (
  <CircleNode {...props} type="start" />
))
StartNode.displayName = 'StartNode'

export const EndNode = memo((props: NodeProps<CustomNodeData>) => (
  <CircleNode {...props} type="end" />
))
EndNode.displayName = 'EndNode'

// 通用矩形节点
const RectNode = memo(({ data, selected, type }: NodeProps<CustomNodeData> & { type: NodeType }) => {
  const config = nodeConfigs[type]

  const getSubtitle = () => {
    switch (type) {
      case 'create':
        return data.approvers ? `创建人: ${data.approvers.type}` : '点击配置创建人'
      case 'fill':
        return data.approvers ? `填写人: ${data.approvers.type}` : '点击配置填写人'
      case 'submit':
        return '提交到下一环节'
      case 'approve':
        return data.approvers ? `审批人: ${data.approvers.type}` : '点击配置审批人'
      case 'review':
        return data.approvers ? `审核人: ${data.approvers.type}` : '点击配置审核人'
      case 'countersign':
        return data.approvers ? `会签人: ${data.approvers.value?.length || 0}人` : '点击配置会签人'
      case 'transfer':
        return '转给其他处理人'
      case 'convert':
        return '转换为其他单据'
      case 'notify':
        return '发送通知消息'
      case 'subprocess':
        return '调用子流程'
      case 'action':
        return '执行自定义动作'
      default:
        return ''
    }
  }

  return (
    <div
      className={cn(
        'min-w-[140px] rounded-lg border-2 bg-white shadow-sm transition-all',
        config.borderColor,
        selected && 'ring-2 ring-primary ring-offset-2 shadow-md'
      )}
    >
      <Handle type="target" position={Position.Top} className={cn('!h-3 !w-3 !border-2 !bg-white', `!${config.borderColor.replace('border-', 'border-')}`)} />
      <div className={cn('flex items-center gap-2 rounded-t-md px-3 py-2', config.bgColor)}>
        <div className={config.color}>{config.icon}</div>
        <span className="text-sm font-medium text-foreground">{data.label || config.label}</span>
      </div>
      <div className="px-3 py-2 text-xs text-muted-foreground">
        {getSubtitle()}
      </div>
      <Handle type="source" position={Position.Bottom} className={cn('!h-3 !w-3 !border-2 !bg-white', `!${config.borderColor.replace('border-', 'border-')}`)} />
    </div>
  )
})
RectNode.displayName = 'RectNode'

// 各业务节点
export const CreateNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="create" />
))
CreateNode.displayName = 'CreateNode'

export const FillNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="fill" />
))
FillNode.displayName = 'FillNode'

export const SubmitNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="submit" />
))
SubmitNode.displayName = 'SubmitNode'

export const ApproveNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="approve" />
))
ApproveNode.displayName = 'ApproveNode'

export const ReviewNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="review" />
))
ReviewNode.displayName = 'ReviewNode'

export const CountersignNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="countersign" />
))
CountersignNode.displayName = 'CountersignNode'

export const TransferNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="transfer" />
))
TransferNode.displayName = 'TransferNode'

export const ConvertNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="convert" />
))
ConvertNode.displayName = 'ConvertNode'

export const NotifyNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="notify" />
))
NotifyNode.displayName = 'NotifyNode'

export const SubprocessNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="subprocess" />
))
SubprocessNode.displayName = 'SubprocessNode'

export const ActionNode = memo((props: NodeProps<CustomNodeData>) => (
  <RectNode {...props} type="action" />
))
ActionNode.displayName = 'ActionNode'

// 条件分支节点（菱形）
export const ConditionNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const config = nodeConfigs.condition

  return (
    <div
      className={cn(
        'relative flex h-24 w-24 rotate-45 items-center justify-center border-2 bg-white shadow-sm transition-all',
        config.borderColor,
        selected && 'ring-2 ring-primary ring-offset-2 shadow-md'
      )}
    >
      {/* 入口 - 顶部 */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!-top-2 !h-3 !w-3 !-rotate-45 !border-2 !border-amber-400 !bg-white" 
      />
      
      {/* 内容 */}
      <div className={cn('-rotate-45 flex flex-col items-center', config.color)}>
        {config.icon}
        <span className="mt-1 text-xs font-medium">{data.label || '条件'}</span>
      </div>
      
      {/* 是/通过 - 左下方 */}
      <Handle 
        type="source" 
        position={Position.Left} 
        className="!-left-2 !h-3 !w-3 !-rotate-45 !border-2 !border-emerald-500 !bg-emerald-100" 
        id="yes"
      />
      
      {/* 否/拒绝 - 右下方 */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!-right-2 !h-3 !w-3 !-rotate-45 !border-2 !border-rose-500 !bg-rose-100" 
        id="no"
      />
      
      {/* 标签提示 */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 -rotate-45 whitespace-nowrap text-[10px] text-muted-foreground">
        <span className="text-emerald-600">是</span> / <span className="text-rose-600">否</span>
      </div>
    </div>
  )
})
ConditionNode.displayName = 'ConditionNode'

// 并行节点
export const ParallelNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const config = nodeConfigs.parallel

  return (
    <div
      className={cn(
        'min-w-[140px] rounded-lg border-2 bg-white shadow-sm transition-all',
        config.borderColor,
        selected && 'ring-2 ring-primary ring-offset-2 shadow-md'
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-purple-400 !bg-white" />
      <div className={cn('flex items-center gap-2 rounded-t-md px-3 py-2', config.bgColor)}>
        <div className={config.color}>{config.icon}</div>
        <span className="text-sm font-medium text-foreground">{data.label || '并行'}</span>
      </div>
      <div className="px-3 py-2 text-xs text-muted-foreground">多路并行执行</div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-purple-400 !bg-white" id="out1" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-purple-400 !bg-white" id="out2" />
    </div>
  )
})
ParallelNode.displayName = 'ParallelNode'

// 节点类型映射
export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  create: CreateNode,
  fill: FillNode,
  submit: SubmitNode,
  approve: ApproveNode,
  review: ReviewNode,
  condition: ConditionNode,
  parallel: ParallelNode,
  countersign: CountersignNode,
  notify: NotifyNode,
  subprocess: SubprocessNode,
  transfer: TransferNode,
  convert: ConvertNode,
  action: ActionNode,
}

export { nodeConfigs }
