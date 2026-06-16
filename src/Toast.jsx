import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const timers = useRef({})

  const show = useCallback((msg, type = 'default', duration = 4000) => {
    const id = Date.now() + Math.random()
    setItems(prev => [...prev, { id, msg, type }])
    timers.current[id] = setTimeout(() => {
      setItems(prev => prev.filter(x => x.id !== id))
      delete timers.current[id]
    }, duration)
  }, [])

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:300, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
        {items.map(item => (
          <div key={item.id} className={`toast toast-${item.type}`} style={{ pointerEvents:'auto' }}>
            {item.type === 'success' && <span style={{ color:'var(--green)', marginRight:6 }}>✓</span>}
            {item.type === 'error'   && <span style={{ color:'var(--red)',   marginRight:6 }}>✕</span>}
            {item.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() { return useContext(ToastCtx) }
export function Toast() { return null }
