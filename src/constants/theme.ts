/**
 * AngoTour Driver - Sistema de Design
 * Tema escuro por padrao (userInterfaceStyle: dark no app.json), alinhado
 * com os mockups: fundo quase preto, verde-esmeralda de destaque, cartoes
 * em tom ligeiramente mais claro que o fundo.
 */

export const colors = {
  primary: '#0FA968',
  primaryDark: '#087A4C',
  primaryLight: '#DFF4EB',

  background: '#0B1210',
  surface: '#141F1B',
  surfaceAlt: '#1C2A25',
  surfaceRaised: '#22322C',

  textPrimary: '#F5F7F5',
  textSecondary: '#9DAAA4',
  textMuted: '#6B7871',
  textInverse: '#0B1210',

  border: '#243530',
  borderStrong: '#324740',

  danger: '#E63946',
  dangerLight: '#3D1B1F',
  amber: '#F0A828',
  amberLight: '#3D3018',
  teal: '#0C9E96',

  overlay: 'rgba(0,0,0,0.6)',
  transparent: 'transparent',
} as const;

export const fontFamily = {
  displayRegular: 'Sora_400Regular',
  displayMedium: 'Sora_500Medium',
  displaySemiBold: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
  textRegular: 'Inter_400Regular',
  textMedium: 'Inter_500Medium',
  textSemiBold: 'Inter_600SemiBold',
  textBold: 'Inter_700Bold',
} as const;

export const typography = {
  h1: { fontFamily: fontFamily.displayBold, fontSize: 30, lineHeight: 36 },
  h2: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: fontFamily.displaySemiBold, fontSize: 19, lineHeight: 25 },
  subtitle: { fontFamily: fontFamily.textSemiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.textRegular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.textMedium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamily.textRegular, fontSize: 13, lineHeight: 18 },
  captionMedium: { fontFamily: fontFamily.textMedium, fontSize: 13, lineHeight: 18 },
  tiny: { fontFamily: fontFamily.textMedium, fontSize: 11, lineHeight: 14 },
} as const;

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 16, lg: 20, xl: 28, pill: 999 } as const;

export const shadow = {
  soft: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 3 },
} as const;

const theme = { colors, fontFamily, typography, spacing, radius, shadow };
export default theme;
