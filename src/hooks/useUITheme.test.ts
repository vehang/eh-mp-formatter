import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUITheme } from './useUITheme'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// Mock matchMedia
const matchMediaMock = vi.fn()

describe('useUITheme', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('matchMedia', matchMediaMock)
    matchMediaMock.mockReturnValue({ matches: false, addEventListener: vi.fn, removeEventListener: vi.fn })
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorageMock.clear()
  })

  it('should return default theme mode', () => {
    const { result } = renderHook(() => useUITheme())
    expect(['light', 'dark', 'system']).toContain(result.current.mode)
  })

  it('should toggle between light and dark themes', () => {
    const { result } = renderHook(() => useUITheme())

    const initialTheme = result.current.resolvedTheme

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.resolvedTheme).not.toBe(initialTheme)
  })

  it('should set theme mode correctly', () => {
    const { result } = renderHook(() => useUITheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('should persist theme preference to localStorage', () => {
    const { result } = renderHook(() => useUITheme())

    act(() => {
      result.current.setTheme('light')
    })

    expect(localStorageMock.getItem('mp-formatter-ui-theme')).toBe('light')
  })

  it('should detect system theme preference', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn,
      removeEventListener: vi.fn
    })

    const { result } = renderHook(() => useUITheme())

    act(() => {
      result.current.setTheme('system')
    })

    expect(result.current.mode).toBe('system')
  })
})
