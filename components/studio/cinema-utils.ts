/**
 * Pure functions for cinema camera settings → prompt suffix translation.
 * Exported from CinemaCameraControls for testability.
 */

export type LensType = 'Anamorphic' | 'Macro' | 'Cinema Prime' | 'Wide Angle' | 'Telephoto' | 'Fisheye';
export type CameraBody = '70mm Film' | '16mm Film' | 'Large Format Digital' | 'Mirrorless Full Frame';

function lensPromptSuffix(lens: LensType): string {
  switch (lens) {
    case 'Anamorphic': return ', anamorphic lens, oval bokeh, cinematic horizontal flare';
    case 'Macro': return ', macro photography, extreme close-up detail, shallow depth of field';
    case 'Cinema Prime': return ', cinema prime lens rendering, organic skin tones, cinematic falloff';
    case 'Wide Angle': return ', wide angle perspective, environmental context, slight distortion';
    case 'Telephoto': return ', telephoto compression, flattened perspective, background separation';
    case 'Fisheye': return ', fisheye distortion, ultra-wide field of view, dramatic curved horizon';
    default: return '';
  }
}

function focalLengthSuffix(mm: number): string {
  if (mm <= 20) return `, ${mm}mm ultra-wide angle, vast landscape`;
  if (mm <= 35) return `, ${mm}mm wide angle, environmental portrait`;
  if (mm <= 70) return `, ${mm}mm standard lens, natural perspective`;
  if (mm <= 135) return `, ${mm}mm short telephoto, flattering portrait compression`;
  return `, ${mm}mm telephoto, strong background compression, isolated subject`;
}

function apertureSuffix(f: number): string {
  if (f <= 1.4) return `, f/${f} extreme shallow depth of field, dreamy background blur`;
  if (f <= 2.8) return `, f/${f} shallow depth of field, beautiful bokeh, subject isolation`;
  if (f <= 5.6) return `, f/${f} medium depth of field, balanced sharpness front to back`;
  if (f <= 11) return `, f/${f} deep depth of field, everything in focus, clinical sharpness`;
  return `, f/${f} maximum depth of field, landscape sharpness, diffraction softening`;
}

function cameraBodySuffix(body: CameraBody): string {
  switch (body) {
    case '70mm Film': return ', 70mm film grain, warm tone, organic halation, cinemaScope feel';
    case '16mm Film': return ', 16mm film grain, gritty texture, high contrast, documentary look';
    case 'Large Format Digital': return ', large format digital, extreme resolution, clean dynamic range, studio quality';
    case 'Mirrorless Full Frame': return ', full frame mirrorless, clean digital render, shallow baseline depth';
    default: return '';
  }
}

export function translateCinemaSettings(
  lensType: LensType,
  focalLength: number,
  aperture: number,
  cameraBody: CameraBody
): string {
  return (
    lensPromptSuffix(lensType) +
    focalLengthSuffix(focalLength) +
    apertureSuffix(aperture) +
    cameraBodySuffix(cameraBody)
  );
}

export function getCinemaViewportLabel(
  lensType: LensType,
  focalLength: number,
  aperture: number,
  cameraBody: CameraBody
): string {
  return `${lensType} · ${focalLength}mm · f/${aperture} · ${cameraBody}`;
}
