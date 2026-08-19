// Design tokens — pulled directly from the Figma Style Guide.
// Keep in sync with /design.md. Do not hardcode raw hex/px values
// in screen files — import from here so a future palette change
// is a one-file edit.

export const colors = {
  primary: '#2563EB',
  accent: '#22C55E',
  background: '#F5F5F5',
  cardWhite: '#FFFFFF',
  border: '#E5E5E5',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  warning: '#F59E0B', // amber — degraded connection state
  danger: '#EF4444', // red — leave button, low attendance
  success: '#22C55E', // reuse accent — saved/present states
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  card: 8,
};

export const typography = {
  fontFamily: 'Inter',
  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemiBold: '600' as const,
  size: {
    small: 12,
    body: 14,
    header: 16,
    title: 20,
  },
};
