import { useEffect, useState } from "react"

export const useTypewriter = (
  text: string,
  msPerChar: number,
  delayMs = 0
) => {
  const [displayed, setDisplayed] = useState("")
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    let raf = 0
    let delayTimeoutId: ReturnType<typeof setTimeout> | undefined
    let intervalId: ReturnType<typeof setInterval> | undefined
    let cancelled = false

    raf = requestAnimationFrame(() => {
      if (cancelled) {
        return
      }
      if (!text) {
        setDisplayed("")
        setComplete(false)
        return
      }

      setDisplayed("")
      setComplete(false)

      delayTimeoutId = window.setTimeout(() => {
        if (cancelled) {
          return
        }
        let i = 0
        intervalId = window.setInterval(() => {
          if (cancelled) {
            return
          }
          i += 1
          setDisplayed(text.slice(0, i))
          if (i >= text.length) {
            if (intervalId !== undefined) {
              window.clearInterval(intervalId)
              intervalId = undefined
            }
            setComplete(true)
          }
        }, msPerChar)
      }, delayMs)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (delayTimeoutId !== undefined) {
        window.clearTimeout(delayTimeoutId)
      }
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
      }
    }
  }, [text, msPerChar, delayMs])

  return { displayed, complete }
}
