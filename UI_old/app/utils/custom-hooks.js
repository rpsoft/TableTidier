import React from 'react'

// many thanks to: https://github.com/webNeat/react-tidy
export function useIsMounted() {
  const ref = React.useRef(true)
  React.useEffect(() => {
    return () => {
      ref.current = false
    }
  }, [])
  return React.useCallback(() => ref.current, [])
}

