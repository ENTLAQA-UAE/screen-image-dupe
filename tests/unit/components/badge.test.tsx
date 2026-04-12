import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '@/components/ui/badge';

describe('<Badge />', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-primary/10');
    expect(badge.className).toContain('text-primary');
  });

  it('applies success variant', () => {
    render(
      <Badge variant="success" data-testid="badge">
        Done
      </Badge>,
    );
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('green');
  });

  it('applies destructive variant', () => {
    render(
      <Badge variant="destructive" data-testid="badge">
        Failed
      </Badge>,
    );
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('destructive');
  });

  it('merges custom className', () => {
    render(
      <Badge className="custom-class" data-testid="badge">
        Custom
      </Badge>,
    );
    expect(screen.getByTestId('badge').className).toContain('custom-class');
  });
});
