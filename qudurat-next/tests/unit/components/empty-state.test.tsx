import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/shared/empty-state';

describe('<EmptyState />', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={FileText}
        title="No items"
        description="Create your first item to get started"
      />,
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first item to get started'),
    ).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        icon={FileText}
        title="No items"
        description="Add one"
        action={<button>Add item</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
  });

  it('does not render action when not provided', () => {
    const { container } = render(
      <EmptyState icon={FileText} title="No items" description="Add one" />,
    );
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
