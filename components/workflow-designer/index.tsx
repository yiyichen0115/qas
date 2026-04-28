'use client'

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { NodeType, WorkflowNodeData, WorkflowConfig } from '@/lib/types'
import { nodeTypes, nodeConfigs } from './nodes'
import { NodePalette } from './node-palette'
import { NodeProperties } from './node-properties'

function generateId() {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const defaultNodes: Node<WorkflowNodeData>[] = [
  {
    id: 'start_1',
    type: 'start',
    position: { x: 300, y: 50 },
    data: { label: '开始', permissions: [] },
  },
  {
    id: 'end_1',
    type: 'end',
    position: { x: 300, y: 500 },
    data: { label: '结束', permissions: [] },
  },
]

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#94a3b8' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: '#94a3b8',
  },
}

interface WorkflowDesignerProps {
  initialConfig?: WorkflowConfig
  onSave?: (config: WorkflowConfig) => void
  onNodesChange?: (nodes: Node<WorkflowNodeData>[]) => void
  onEdgesChange?: (edges: Edge[]) => void
  workflowId?: string
}

export interface WorkflowDesignerRef {
  updateFromAI: (data: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] }) => void
}

export const WorkflowDesigner = forwardRef<WorkflowDesignerRef, WorkflowDesignerProps>(
  function WorkflowDesigner({ initialConfig, onSave, onNodesChange: onNodesChangeCallback, onEdgesChange: onEdgesChangeCallback, workflowId }, ref) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (initialConfig?.nodes as Node<WorkflowNodeData>[]) || defaultNodes
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (initialConfig?.edges as Edge[]) || []
  )
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    updateFromAI: (data: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] }) => {
      if (data.nodes) {
        setNodes(data.nodes)
      }
      if (data.edges) {
        setEdges(data.edges.map(e => ({ ...e, ...defaultEdgeOptions })))
      }
    }
  }), [setNodes, setEdges])

  // 通知父组件节点/边变化
  useEffect(() => {
    onNodesChangeCallback?.(nodes)
  }, [nodes, onNodesChangeCallback])

  useEffect(() => {
    onEdgesChangeCallback?.(edges)
  }, [edges, onEdgesChangeCallback])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...defaultEdgeOptions,
          },
          eds
        )
      )
    },
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as NodeType
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) return

      // 获取画布容器的边界
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()

      // 计算鼠标在画布中的位置（相对于画布左上角）
      const clientX = event.clientX - reactFlowBounds.left
      const clientY = event.clientY - reactFlowBounds.top

      // 使用 ReactFlow 实例转换坐标
      const position = reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      })

      // 获取节点标签
      const config = nodeConfigs[type]
      const label = config?.label || type

      const newNode: Node<WorkflowNodeData> = {
        id: generateId(),
        type,
        position: {
          x: position.x - 70, // 居中偏移
          y: position.y - 30,
        },
        data: { label, permissions: [] },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [reactFlowInstance, setNodes]
  )

  // 将当前workflowId存储到window对象，供子组件访问
  useEffect(() => {
    if (workflowId) {
      window.currentWorkflowId = workflowId
    } else {
      delete window.currentWorkflowId
    }
  }, [workflowId])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
      setSelectedNode(node)
    },
    []
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const onUpdateNode = useCallback(
    (nodeId: string, data: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, ...data },
            }
          }
          return node
        })
      )

      // 更新选中的节点
      setSelectedNode((prev) => {
        if (prev && prev.id === nodeId) {
          return { ...prev, data: { ...prev.data, ...data } }
        }
        return prev
      })
    },
    [setNodes]
  )

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      const deletedIds = deletedNodes.map((n) => n.id)
      if (selectedNode && deletedIds.includes(selectedNode.id)) {
        setSelectedNode(null)
      }
    },
    [selectedNode]
  )

  return (
    <div className="flex h-full">
      <NodePalette />
      <div className="flex-1 bg-muted/30" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid
          snapGrid={[15, 15]}
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.3}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Controls 
            className="!bg-card !border-border !shadow-sm !rounded-lg"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <MiniMap
            className="!bg-card !border-border !rounded-lg"
            nodeColor={(node) => {
              const config = nodeConfigs[node.type as NodeType]
              if (config) {
                // 从 tailwind 类名提取颜色
                const colorMatch = config.color.match(/text-(\w+)-\d+/)
                if (colorMatch) {
                  const colorMap: Record<string, string> = {
                    emerald: '#10b981',
                    rose: '#f43f5e',
                    teal: '#14b8a6',
                    sky: '#0ea5e9',
                    violet: '#8b5cf6',
                    blue: '#3b82f6',
                    slate: '#64748b',
                    amber: '#f59e0b',
                    purple: '#a855f7',
                    cyan: '#06b6d4',
                    orange: '#f97316',
                    indigo: '#6366f1',
                    pink: '#ec4899',
                    lime: '#84cc16',
                    yellow: '#eab308',
                  }
                  return colorMap[colorMatch[1]] || '#94a3b8'
                }
              }
              return '#94a3b8'
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            pannable
            zoomable
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#cbd5e1" 
          />
        </ReactFlow>
      </div>
      <NodeProperties node={selectedNode} onUpdateNode={onUpdateNode} workflowId={workflowId} />
    </div>
  )
})

export { type WorkflowDesignerProps }
