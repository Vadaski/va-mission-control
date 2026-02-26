import { useEffect, useRef } from 'react'

export const useAutoScroll = <T extends HTMLElement>(deps: unknown[]) => {
  const ref = useRef<T | null>(null)
  const pinnedToBottomRef = useRef(true)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const onScroll = () => {
      const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight
      pinnedToBottomRef.current = distanceToBottom <= 32
    }

    onScroll()
    element.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      element.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element || !pinnedToBottomRef.current) {
      return
    }

    const startTop = element.scrollTop
    const targetTop = element.scrollHeight - element.clientHeight
    if (targetTop <= startTop) {
      return
    }

    const startTime = performance.now()
    const durationMs = 280
    let frameId = 0

    const animate = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - (1 - progress) ** 3
      element.scrollTop = startTop + (targetTop - startTop) * eased

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate)
      }
    }

    frameId = window.requestAnimationFrame(animate)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, deps)

  return ref
}
