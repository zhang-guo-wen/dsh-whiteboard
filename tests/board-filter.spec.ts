import { describe, expect, it } from 'vitest'
import { matchesBoard } from '../src/board-filter.ts'

const board = (title: string) => ({ title })

describe('whiteboard title filter', () => {
  it('keeps every board while the query is empty or blank', () => {
    expect(matchesBoard(board('系统架构'), '')).toBe(true)
    expect(matchesBoard(board('系统架构'), '   ')).toBe(true)
  })

  it('matches a substring of the title', () => {
    expect(matchesBoard(board('2026-09-29_09-46-00-000'), '09-46')).toBe(true)
    expect(matchesBoard(board('系统架构'), '架构')).toBe(true)
    expect(matchesBoard(board('系统架构'), '流程')).toBe(false)
  })

  it('ignores case and surrounding whitespace', () => {
    expect(matchesBoard(board('IoT Gateway'), 'iot')).toBe(true)
    expect(matchesBoard(board('IoT Gateway'), 'GATEWAY')).toBe(true)
    expect(matchesBoard(board('IoT Gateway'), '  gateway  ')).toBe(true)
  })
})
