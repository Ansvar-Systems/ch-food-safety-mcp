import { describe, test, expect } from 'vitest';
import { handleAbout } from '../../src/tools/about.js';

describe('about tool', () => {
  test('returns server metadata', () => {
    const result = handleAbout();
    expect(result.name).toBe('Switzerland Food Safety MCP');
    expect(result.description).toContain('LMG');
    expect(result.jurisdiction).toEqual(['CH']);
    expect(result.tools_count).toBe(10);
    expect(result.links).toHaveProperty('homepage');
    expect(result.links).toHaveProperty('repository');
    expect(result._meta).toHaveProperty('disclaimer');
    expect(result._meta.disclaimer).toContain('BLV');
  });
});
