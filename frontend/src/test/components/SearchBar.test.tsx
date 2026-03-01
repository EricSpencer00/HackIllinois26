import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../../components/SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    onSearch: vi.fn(),
    loading: false,
    visible: true,
  };

  it('renders an input with placeholder text', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Ask anything...')).toBeInTheDocument();
  });

  it('renders the hint text', () => {
    render(<SearchBar {...defaultProps} />);
    expect(screen.getByText('press enter to analyze')).toBeInTheDocument();
  });

  it('calls onSearch with trimmed query on form submit', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Ask anything...');
    await user.type(input, '  Will BTC hit 200k?  ');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('Will BTC hit 200k?');
  });

  it('does not call onSearch when input is empty', async () => {
    const onSearch = vi.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    const form = screen.getByPlaceholderText('Ask anything...').closest('form')!;
    fireEvent.submit(form);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('does not call onSearch when only whitespace', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Ask anything...');
    await user.type(input, '   ');
    await user.keyboard('{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('disables input when loading', () => {
    render(<SearchBar {...defaultProps} loading={true} />);
    expect(screen.getByPlaceholderText('Ask anything...')).toBeDisabled();
  });

  it('does not submit while loading', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} onSearch={onSearch} loading={true} />);

    const input = screen.getByPlaceholderText('Ask anything...');
    // Input is disabled, but let's try submitting the form directly
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('applies hidden class when visible=false', () => {
    const { container } = render(<SearchBar {...defaultProps} visible={false} />);
    const searchContainer = container.querySelector('.search-container');
    expect(searchContainer).toHaveClass('hidden');
  });

  it('does not have hidden class when visible=true', () => {
    const { container } = render(<SearchBar {...defaultProps} visible={true} />);
    const searchContainer = container.querySelector('.search-container');
    expect(searchContainer).not.toHaveClass('hidden');
  });

  it('updates input value as user types', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Ask anything...');
    await user.type(input, 'Hello');
    expect(input).toHaveValue('Hello');
  });
});
