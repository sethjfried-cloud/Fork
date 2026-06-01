"use client"

import { useState, useRef, useEffect } from "react"

type SwipeCallbacks = {
  onAccept: () => void
  onReject: () => void
}

export function useSwipe({ onAccept, onReject }: SwipeCallbacks) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null)
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const startX = useRef(0)

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("fork_swiped")) {
      setShowSwipeHint(false)
    }
  }, [])

  function dismissHint() {
    if (showSwipeHint) {
      setShowSwipeHint(false)
      localStorage.setItem("fork_swiped", "true")
    }
  }

  function onSwipeStart(clientX: number) { startX.current = clientX; setDragging(true) }
  function onSwipeMove(clientX: number) { if (dragging) setDragX(clientX - startX.current) }
  function onSwipeEnd() {
    setDragging(false)
    if (dragX > 80) handleAccept()
    else if (dragX < -80) handleReject()
    setDragX(0)
  }

  function handleAccept() {
    dismissHint()
    setSwipeDir("right")
    setTimeout(() => { setSwipeDir(null); onAccept() }, 300)
  }

  function handleReject() {
    dismissHint()
    setSwipeDir("left")
    setTimeout(() => { setSwipeDir(null); onReject() }, 300)
  }

  return {
    dragX, dragging, swipeDir, showSwipeHint,
    onSwipeStart, onSwipeMove, onSwipeEnd,
    handleAccept, handleReject,
  }
}
