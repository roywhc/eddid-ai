export const Colors = {
  light: {
    primary: '#F8D000',
    primaryDark: '#D4B000',
    secondary: '#0D1647',
    secondaryLight: '#13216a',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceSecondary: '#F2F2F2',
    card: '#FFFFFF',
    border: '#E3E3E3',
    borderLight: '#F0F0F0',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    success: '#00C853',
    successBg: '#E8F5E9',
    error: '#FF3B30',
    errorBg: '#FFEBEE',
    warning: '#FF9500',
    warningBg: '#FFF3E0',
    info: '#007AFF',
    infoBg: '#E3F2FD',
    chart: {
      up: '#00C853',
      down: '#FF3B30',
      grid: '#E8E8E8',
      text: '#666666',
    },
  },
  dark: {
    primary: '#F8D000',
    primaryDark: '#D4B000',
    secondary: '#1a2673',
    secondaryLight: '#2E3A8C',
    background: '#0A0E1A',
    surface: '#141824',
    surfaceSecondary: '#1A1F2E',
    card: '#141824',
    border: '#2A3244',
    borderLight: '#1E2433',
    text: '#FFFFFF',
    textSecondary: '#A0A8B8',
    textTertiary: '#6B7280',
    success: '#30D158',
    successBg: '#1A3A24',
    error: '#FF453A',
    errorBg: '#3D1F1F',
    warning: '#FF9F0A',
    warningBg: '#3D2F1F',
    info: '#0A84FF',
    infoBg: '#1F2D3D',
    chart: {
      up: '#30D158',
      down: '#FF453A',
      grid: '#1E2433',
      text: '#A0A8B8',
    },
    gradientStart: '#0A0E1A',
    gradientMiddle: '#0D1647',
    gradientEnd: '#0A0E1A',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  heading1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 29,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  heading4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  smallMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  tiny: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};
