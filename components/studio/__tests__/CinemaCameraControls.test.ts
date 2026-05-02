import { describe, it, expect } from 'vitest';
import {
  translateCinemaSettings,
  getCinemaViewportLabel,
} from '../cinema-utils';

describe('translateCinemaSettings', () => {
  it('returns a string that contains lens-type descriptor', () => {
    const result = translateCinemaSettings('Anamorphic', 50, 2.8, 'Mirrorless Full Frame');
    expect(result).toContain('anamorphic');
  });

  it('returns a string with focal length in mm', () => {
    const result = translateCinemaSettings('Telephoto', 135, 2.8, '70mm Film');
    expect(result).toContain('135mm');
  });

  it('returns a string with aperture value', () => {
    const result = translateCinemaSettings('Cinema Prime', 50, 1.4, 'Large Format Digital');
    expect(result).toContain('f/1.4');
  });

  it('returns a string with camera body descriptor', () => {
    const result = translateCinemaSettings('Wide Angle', 24, 5.6, '16mm Film');
    expect(result).toContain('16mm film');
  });

  it('generates distinct suffixes for different lens types', () => {
    const anamorphic = translateCinemaSettings('Anamorphic', 50, 2.8, 'Mirrorless Full Frame');
    const fisheye = translateCinemaSettings('Fisheye', 50, 2.8, 'Mirrorless Full Frame');
    expect(anamorphic).not.toBe(fisheye);
  });

  it('generates distinct suffixes for different focal lengths', () => {
    const wide = translateCinemaSettings('Wide Angle', 20, 2.8, 'Mirrorless Full Frame');
    const tele = translateCinemaSettings('Wide Angle', 200, 2.8, 'Mirrorless Full Frame');
    expect(wide).not.toBe(tele);
  });

  it('generates distinct suffixes for different apertures', () => {
    const shallow = translateCinemaSettings('Cinema Prime', 50, 1.4, 'Mirrorless Full Frame');
    const deep = translateCinemaSettings('Cinema Prime', 50, 16, 'Mirrorless Full Frame');
    expect(shallow).not.toBe(deep);
  });

  it('generates distinct suffixes for different camera bodies', () => {
    const film = translateCinemaSettings('Cinema Prime', 50, 2.8, '70mm Film');
    const digital = translateCinemaSettings('Cinema Prime', 50, 2.8, 'Large Format Digital');
    expect(film).not.toBe(digital);
  });

  it('returns non-empty string for all supported lens types', () => {
    const lensTypes = ['Anamorphic', 'Macro', 'Cinema Prime', 'Wide Angle', 'Telephoto', 'Fisheye'] as const;
    for (const lens of lensTypes) {
      const result = translateCinemaSettings(lens, 50, 2.8, 'Mirrorless Full Frame');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('returns non-empty string for all supported camera bodies', () => {
    const bodies = ['70mm Film', '16mm Film', 'Large Format Digital', 'Mirrorless Full Frame'] as const;
    for (const body of bodies) {
      const result = translateCinemaSettings('Cinema Prime', 50, 2.8, body);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

describe('getCinemaViewportLabel', () => {
  it('returns a string with lens type', () => {
    const label = getCinemaViewportLabel('Anamorphic', 50, 2.8, 'Mirrorless Full Frame');
    expect(label).toContain('Anamorphic');
  });

  it('returns a string with focal length in mm', () => {
    const label = getCinemaViewportLabel('Telephoto', 85, 2.8, '70mm Film');
    expect(label).toContain('85mm');
  });

  it('returns a string with aperture', () => {
    const label = getCinemaViewportLabel('Cinema Prime', 50, 1.4, 'Large Format Digital');
    expect(label).toContain('f/1.4');
  });

  it('returns a string with camera body', () => {
    const label = getCinemaViewportLabel('Wide Angle', 24, 5.6, '16mm Film');
    expect(label).toContain('16mm Film');
  });

  it('contains lens, focal, aperture, and body separated by delimiter', () => {
    const label = getCinemaViewportLabel('Macro', 100, 2.8, 'Mirrorless Full Frame');
    expect(label).toContain('Macro');
    expect(label).toContain('100mm');
    expect(label).toContain('f/2.8');
    expect(label).toContain('Mirrorless Full Frame');
  });
});
