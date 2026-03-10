import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', async () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    )

    expect(result.current).toBe('first')

    // Change value
    rerender({ value: 'second', delay: 300 })

    // Value should not change immediately
    expect(result.current).toBe('first')

    // Advance time by 299ms - still not updated
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('first')

    // Advance time by 1ms - now it should update
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('second')

    vi.useRealTimers()
  })

  it('should handle rapid value changes correctly', async () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    // Rapid value changes
    rerender({ value: 'first', delay: 300 })
    rerender({ value: 'second', delay: 300 })
    rerender({ value: 'third', delay: 300 })

    // Value should still be initial before debounce completes
    expect(result.current).toBe('initial')

    // After debounce completes, should have the latest value
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('third')

    vi.useRealTimers()
  })

  it('should cancel pending updates on unmount', async () => {
    vi.useFakeTimers()

    const { rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    rerender({ value: 'changed', delay: 300 })

    // Unmount before timer completes
    unmount()

    // Advance time - should not throw
    act(() => {
      vi.advanceTimersByTime(300)
    })

    vi.useRealTimers()
  })

  it('should use custom delay', async () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    rerender({ value: 'updated', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('updated')

    vi.useRealTimers()
  })
})
