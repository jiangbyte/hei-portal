/** Author: Charlie */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
} from 'react'

type PanelActionsContextValue = {
  extra: ReactNode
  setExtra: (node: ReactNode) => void
}

const PanelActionsContext = createContext<PanelActionsContextValue | null>(null)

export function PanelActionsProvider({ children }: { children: ReactNode }) {
  const [extra, setExtra] = useState<ReactNode>(null)
  const value = useMemo(() => ({ extra, setExtra }), [extra])

  return (
    <PanelActionsContext.Provider value={value}>{children}</PanelActionsContext.Provider>
  )
}

export function usePanelActionsContext() {
  const ctx = useContext(PanelActionsContext)
  if (!ctx) {
    throw new Error('usePanelActionsContext must be used within PanelActionsProvider')
  }
  return ctx
}

export function usePanelActions(deps: DependencyList, factory: () => ReactNode) {
  const { setExtra } = usePanelActionsContext()
  const content = useMemo(factory, deps)

  useEffect(() => {
    setExtra(content)
    return () => setExtra(null)
  }, [content, setExtra])
}
