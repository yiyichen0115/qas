'use client'

import type { NodeType } from '@/lib/types'
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

interface NodeConfig {
  type: NodeType
  label: string
  icon: React.ReactNode
  description: string
  category: 'flow' | 'process' | 'advanced'
}

const nodeConfigs: NodeConfig[] = [
  // 流程控制节点
  {
    type: 'start',
    label: '开始',
    icon: <Play className="h-4 w-4" />,
    description: '流程开始节点',
    category: 'flow',
  },
  {
    type: 'end',
    label: '结束',
    icon: <StopCircle className="h-4 w-4" />,
    description: '流程结束节点',
    category: 'flow',
  },
  {
    type: 'condition',
    label: '条件分支',
    icon: <GitBranch className="h-4 w-4" />,
    description: '根据条件分支流转',
    category: 'flow',
  },
  {
    type: 'parallel',
    label: '并行',
    icon: <GitMerge className="h-4 w-4" />,
    description: '多路同时执行',
    category: 'flow',
  },
  // 业务处理节点
  {
    type: 'create',
    label: '创建单据',
    icon: <FilePlus className="h-4 w-4" />,
    description: '指定谁可以创建单据',
    category: 'process',
  },
  {
    type: 'fill',
    label: '填写信息',
    icon: <FileEdit className="h-4 w-4" />,
    description: '指定谁填写/补充信息',
    category: 'process',
  },
  {
    type: 'submit',
    label: '提交',
    icon: <Send className="h-4 w-4" />,
    description: '提交单据进入下一环节',
    category: 'process',
  },
  {
    type: 'approve',
    label: '审批',
    icon: <UserCheck className="h-4 w-4" />,
    description: '配置审批人进行审批',
    category: 'process',
  },
  {
    type: 'review',
    label: '审核',
    icon: <Eye className="h-4 w-4" />,
    description: '查看审核但不改变状态',
    category: 'process',
  },
  {
    type: 'countersign',
    label: '会签',
    icon: <Users className="h-4 w-4" />,
    description: '多人同时审批',
    category: 'process',
  },
  // 高级节点
  {
    type: 'transfer',
    label: '转单',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    description: '将单据转给其他人',
    category: 'advanced',
  },
  {
    type: 'convert',
    label: '转换单据',
    icon: <RefreshCw className="h-4 w-4" />,
    description: '转成其他类型单据',
    category: 'advanced',
  },
  {
    type: 'notify',
    label: '通知',
    icon: <Bell className="h-4 w-4" />,
    description: '发送通知消息',
    category: 'advanced',
  },
  {
    type: 'subprocess',
    label: '子流程',
    icon: <Workflow className="h-4 w-4" />,
    description: '调用其他流程',
    category: 'advanced',
  },
  {
    type: 'action',
    label: '自定义动作',
    icon: <Zap className="h-4 w-4" />,
    description: '执行自定义操作',
    category: 'advanced',
  },
]

interface DraggableNodeProps {
  config: NodeConfig
}

function DraggableNode({ config }: DraggableNodeProps) {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, config.type)}
      className={cn(
        'flex cursor-grab items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition-all hover:border-primary/50 hover:shadow-sm active:cursor-grabbing'
      )}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{config.label}</p>
        <p className="text-xs text-muted-foreground truncate">{config.description}</p>
      </div>
    </div>
  )
}

export function NodePalette() {
  const flowNodes = nodeConfigs.filter((n) => n.category === 'flow')
  const processNodes = nodeConfigs.filter((n) => n.category === 'process')
  const advancedNodes = nodeConfigs.filter((n) => n.category === 'advanced')

  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-sm font-medium text-foreground">流程节点</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">拖拽添加到画布</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              流程控制
            </h4>
            <div className="space-y-1.5">
              {flowNodes.map((config) => (
                <DraggableNode key={config.type} config={config} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              业务处理
            </h4>
            <div className="space-y-1.5">
              {processNodes.map((config) => (
                <DraggableNode key={config.type} config={config} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              高级节点
            </h4>
            <div className="space-y-1.5">
              {advancedNodes.map((config) => (
                <DraggableNode key={config.type} config={config} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { nodeConfigs }
