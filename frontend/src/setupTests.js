import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de IntersectionObserver para Framer Motion en JSDOM
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock de canvas-confetti en tests
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))
