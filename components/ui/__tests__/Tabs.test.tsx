import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '../Tabs';
import type { TabId } from '@/store/useStudioStore';

// Mock Tab icon
const MockIcon = () => <svg data-testid="mock-icon" />;

const makeTabs = (_: TabId = 'image') => [
  { id: 'image' as TabId, label: 'Image', icon: <MockIcon /> },
  { id: 'video' as TabId, label: 'Video', icon: <MockIcon /> },
  { id: 'cinema' as TabId, label: 'Cinema', icon: <MockIcon /> },
  { id: 'lipsync' as TabId, label: 'LipSync', icon: <MockIcon /> },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="image" onTabChange={onChange} />);
    expect(screen.getByRole('tab', { name: /image/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /video/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /cinema/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /lipsync/i })).toBeTruthy();
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="image" onTabChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /video/i }));
    expect(onChange).toHaveBeenCalledWith('video');
  });

  it('sets aria-selected on the active tab', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="cinema" onTabChange={onChange} />);
    const cinemaTab = screen.getByRole('tab', { name: /cinema/i });
    expect(cinemaTab.getAttribute('aria-selected')).toBe('true');
    const imageTab = screen.getByRole('tab', { name: /image/i });
    expect(imageTab.getAttribute('aria-selected')).toBe('false');
  });

  it('renders with ARIA tablist role', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="image" onTabChange={onChange} />);
    expect(screen.getByRole('tablist')).toBeTruthy();
  });

  it('does not call onTabChange when clicking a disabled tab', () => {
    const onChange = vi.fn();
    const tabs = [
      { id: 'image' as TabId, label: 'Image', icon: <MockIcon />, disabled: true },
      { id: 'video' as TabId, label: 'Video', icon: <MockIcon /> },
    ];
    render(<Tabs tabs={tabs} activeTab="image" onTabChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /image/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('navigates with arrow keys', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="image" onTabChange={onChange} />);
    const imageTab = screen.getByRole('tab', { name: /image/i });
    fireEvent.keyDown(imageTab, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('video');
  });

  it('wraps arrow-key navigation from last to first', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="lipsync" onTabChange={onChange} />);
    const lipsyncTab = screen.getByRole('tab', { name: /lipsync/i });
    fireEvent.keyDown(lipsyncTab, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('image');
  });

  it('wraps arrow-key navigation from first to last', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="image" onTabChange={onChange} />);
    const imageTab = screen.getByRole('tab', { name: /image/i });
    fireEvent.keyDown(imageTab, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('lipsync');
  });

  it('Home key goes to first tab', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="cinema" onTabChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: /cinema/i }), { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith('image');
  });

  it('End key goes to last tab', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={makeTabs()} activeTab="image" onTabChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: /image/i }), { key: 'End' });
    expect(onChange).toHaveBeenCalledWith('lipsync');
  });
});
