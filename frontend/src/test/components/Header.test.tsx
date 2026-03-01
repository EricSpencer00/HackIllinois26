import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../../components/Header';

describe('Header', () => {
  it('renders the logo text', () => {
    render(<Header />);
    expect(screen.getByText('brightbet.tech')).toBeInTheDocument();
  });

  it('renders as a header element', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('logo links to root /', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'brightbet.tech' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('logo has the correct CSS class', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'brightbet.tech' });
    expect(link).toHaveClass('logo');
  });
});
