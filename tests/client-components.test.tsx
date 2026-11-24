// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EcosystemSwitcher } from '../client/src/shared/layouts/EcosystemSwitcher.tsx';
import { sanitizeSvgMarkup } from '../client/src/shared/lib/svgSanitizer.ts';
import { SafeMarkdown } from '../client/src/shared/ui/SafeMarkdown.tsx';

afterEach(() => {
  cleanup();
});

describe('Client UI security & Ecosystem Switcher rendering', () => {
  it('sanitizeSvgMarkup strips scripts, event handlers, and javascript URIs', () => {
    const dirtySvg =
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)"><rect width="10" height="10" onclick="alert(2)"/></a></svg>';
    const cleanSvg = sanitizeSvgMarkup(dirtySvg);
    expect(cleanSvg).not.toContain('<script');
    expect(cleanSvg).not.toContain('onload');
    expect(cleanSvg).not.toContain('onclick');
    expect(cleanSvg).not.toContain('javascript:');
  });
  it('SafeMarkdown blocks XSS vectors while preserving Markdown & Mermaid fallback', async () => {
    const hostileMarkdown = [
      '# Safe Heading',
      '',
      '<script>window.__xss = true;</script>',
      '<img src="x" onerror="alert(1)" />',
      '<iframe src="https://evil.example"></iframe>',
      '',
      '[Evil JS Link](javascript:alert(1))',
      '[Safe Link](https://github.com/zixew/lokatalenta-docs)',
      '',
      '```mermaid',
      'flowchart LR',
      '  A --> B',
      '```',
    ].join('\n');

    const { container } = render(<SafeMarkdown content={hostileMarkdown} />);

    expect(screen.getByText('Safe Heading')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('img')).toBeNull();

    const links = Array.from(container.querySelectorAll('a'));
    for (const a of links) {
      expect(a.getAttribute('href') ?? '').not.toMatch(/^javascript:/i);
    }

    const safeLink = screen.getByRole('link', { name: 'Safe Link' });
    expect(safeLink).toHaveAttribute('href', 'https://github.com/zixew/lokatalenta-docs');
    expect(safeLink).toHaveAttribute('rel', 'noopener noreferrer');

    const fallback = await screen.findByTestId('mermaid-fallback');
    expect(fallback).toHaveTextContent('flowchart LR');
  });

  it('EcosystemSwitcher renders all 5 ecosystem app links with safe URLs and active state', () => {
    render(<EcosystemSwitcher />);

    expect(screen.getByTestId('ecosystem-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('ecosystem-link-lms')).toHaveAttribute(
      'href',
      'http://localhost:4100',
    );
    expect(screen.getByTestId('ecosystem-link-backlog')).toHaveAttribute(
      'href',
      'http://localhost:4102',
    );
    expect(screen.getByTestId('ecosystem-link-sprint-planner')).toHaveAttribute(
      'href',
      'http://localhost:4103',
    );
    expect(screen.getByTestId('ecosystem-link-docs')).toHaveAttribute(
      'data-active',
      'true',
    );
    expect(screen.getByTestId('ecosystem-link-office-3d')).toHaveAttribute(
      'href',
      'http://localhost:4105',
    );
  });
});
