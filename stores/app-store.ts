'use client'

import { create } from 'zustand'
import type { FormConfig, WorkflowConfig, PageConfig, Role, User, Application } from '@/lib/types'
import {
  formStorage,
  workflowStorage,
  pageStorage,
  roleStorage,
  userStorage,
  appStorage,
} from '@/lib/storage'

interface AppState {
  // 表单
  forms: FormConfig[]
  currentForm: FormConfig | null
  loadForms: () => void
  setCurrentForm: (form: FormConfig | null) => void
  saveForm: (form: FormConfig) => void
  deleteForm: (id: string) => void

  // 流程
  workflows: WorkflowConfig[]
  currentWorkflow: WorkflowConfig | null
  loadWorkflows: () => void
  setCurrentWorkflow: (workflow: WorkflowConfig | null) => void
  saveWorkflow: (workflow: WorkflowConfig) => void
  deleteWorkflow: (id: string) => void

  // 页面
  pages: PageConfig[]
  currentPage: PageConfig | null
  loadPages: () => void
  setCurrentPage: (page: PageConfig | null) => void
  savePage: (page: PageConfig) => void
  deletePage: (id: string) => void

  // 角色
  roles: Role[]
  loadRoles: () => void
  saveRole: (role: Role) => void
  deleteRole: (id: string) => void

  // 用户
  users: User[]
  currentUser: User | null
  loadUsers: () => void
  saveUser: (user: User) => void
  deleteUser: (id: string) => void
  setCurrentUser: (user: User | null) => void
  login: (username: string) => boolean
  logout: () => void

  // 应用
  applications: Application[]
  loadApplications: () => void
  saveApplication: (app: Application) => void
  deleteApplication: (id: string) => void

  // AI 侧边栏
  aiSidebarOpen: boolean
  setAiSidebarOpen: (open: boolean) => void
  openAiSidebar: () => void
  closeAiSidebar: () => void

  // 初始化
  initialized: boolean
  initialize: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // 表单状态
  forms: [],
  currentForm: null,
  loadForms: () => {
    const forms = formStorage.getAll()
    set({ forms })
  },
  setCurrentForm: (form) => set({ currentForm: form }),
  saveForm: (form) => {
    formStorage.save(form)
    get().loadForms()
  },
  deleteForm: (id) => {
    formStorage.delete(id)
    get().loadForms()
  },

  // 流程状态
  workflows: [],
  currentWorkflow: null,
  loadWorkflows: () => {
    const workflows = workflowStorage.getAll()
    set({ workflows })
  },
  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
  saveWorkflow: (workflow) => {
    workflowStorage.save(workflow)
    get().loadWorkflows()
  },
  deleteWorkflow: (id) => {
    workflowStorage.delete(id)
    get().loadWorkflows()
  },

  // 页面状态
  pages: [],
  currentPage: null,
  loadPages: () => {
    const pages = pageStorage.getAll()
    set({ pages })
  },
  setCurrentPage: (page) => set({ currentPage: page }),
  savePage: (page) => {
    pageStorage.save(page)
    get().loadPages()
  },
  deletePage: (id) => {
    pageStorage.delete(id)
    get().loadPages()
  },

  // 角色状态
  roles: [],
  loadRoles: () => {
    const roles = roleStorage.getAll()
    set({ roles })
  },
  saveRole: (role) => {
    roleStorage.save(role)
    get().loadRoles()
  },
  deleteRole: (id) => {
    roleStorage.delete(id)
    get().loadRoles()
  },

  // 用户状态
  users: [],
  currentUser: null,
  loadUsers: () => {
    const users = userStorage.getAll()
    const currentUser = userStorage.getCurrentUser()
    set({ users, currentUser })
  },
  saveUser: (user) => {
    userStorage.save(user)
    get().loadUsers()
  },
  deleteUser: (id) => {
    userStorage.delete(id)
    get().loadUsers()
  },
  setCurrentUser: (user) => {
    userStorage.setCurrentUser(user)
    set({ currentUser: user })
  },
  login: (username) => {
    const users = get().users
    const user = users.find((u) => u.username === username && u.status === 'active')
    if (user) {
      userStorage.setCurrentUser(user)
      set({ currentUser: user })
      return true
    }
    return false
  },
  logout: () => {
    userStorage.setCurrentUser(null)
    set({ currentUser: null })
  },

  // 应用状态
  applications: [],
  loadApplications: () => {
    const applications = appStorage.getAll()
    set({ applications })
  },
  saveApplication: (app) => {
    appStorage.save(app)
    get().loadApplications()
  },
  deleteApplication: (id) => {
    appStorage.delete(id)
    get().loadApplications()
  },

  // AI 侧边栏
  aiSidebarOpen: false,
  setAiSidebarOpen: (open) => set({ aiSidebarOpen: open }),
  openAiSidebar: () => set({ aiSidebarOpen: true }),
  closeAiSidebar: () => set({ aiSidebarOpen: false }),

  // 初始化
  initialized: false,
  initialize: () => {
    if (get().initialized) return
    get().loadForms()
    get().loadWorkflows()
    get().loadPages()
    get().loadRoles()
    get().loadUsers()
    get().loadApplications()
    set({ initialized: true })
  },
}))
