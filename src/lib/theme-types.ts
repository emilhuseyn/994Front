/**
 * Mirrors the backend ThemeDto. Kept in a dedicated file so both the public
 * ThemeProvider and the admin editor can share the type.
 */
export interface Theme {
  colors: {
    primary: string;
    primaryHover: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    soft: string;
    success: string;
    danger: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    fontSizeBase: number;
    fontSizeHeading: number;
    fontWeightBold: number;
  };
  layout: {
    containerWidth: number;
    radius: number;
    spacingBase: number;
  };
  storefront: {
    showAnnouncementBar: boolean;
    announcementBg: string;
    announcementText: string;
    headerBg: string;
    footerBg: string;
  };
  admin: {
    sidebarBg: string;
    sidebarText: string;
    sidebarActiveBg: string;
    sidebarActiveText: string;
    topbarBg: string;
  };
}

export const DEFAULT_THEME: Theme = {
  colors: {
    primary: '#000000',
    primaryHover: '#262626',
    accent: '#2563eb',
    background: '#ffffff',
    foreground: '#0a0a0a',
    muted: '#6b7280',
    border: '#e5e7eb',
    soft: '#f7f7f7',
    success: '#16a34a',
    danger: '#dc2626',
    warning: '#f59e0b',
  },
  typography: {
    fontFamily: 'Inter',
    fontSizeBase: 14,
    fontSizeHeading: 28,
    fontWeightBold: 600,
  },
  layout: {
    containerWidth: 1280,
    radius: 4,
    spacingBase: 16,
  },
  storefront: {
    showAnnouncementBar: true,
    announcementBg: '#000000',
    announcementText: '#ffffff',
    headerBg: '#ffffff',
    footerBg: '#ffffff',
  },
  admin: {
    sidebarBg: '#ffffff',
    sidebarText: '#374151',
    sidebarActiveBg: '#000000',
    sidebarActiveText: '#ffffff',
    topbarBg: '#ffffff',
  },
};

/**
 * Flatten the theme to CSS custom properties applied at :root. Components can
 * read these via Tailwind arbitrary values like `bg-[var(--theme-color-primary)]`
 * or via the helper classes in globals.css.
 */
export function themeToCssVars(theme: Theme): Record<string, string> {
  return {
    '--theme-color-primary': theme.colors.primary,
    '--theme-color-primary-hover': theme.colors.primaryHover,
    '--theme-color-accent': theme.colors.accent,
    '--theme-color-bg': theme.colors.background,
    '--theme-color-fg': theme.colors.foreground,
    '--theme-color-muted': theme.colors.muted,
    '--theme-color-border': theme.colors.border,
    '--theme-color-soft': theme.colors.soft,
    '--theme-color-success': theme.colors.success,
    '--theme-color-danger': theme.colors.danger,
    '--theme-color-warning': theme.colors.warning,
    '--theme-font-family': `'${theme.typography.fontFamily}', system-ui, sans-serif`,
    '--theme-font-size-base': `${theme.typography.fontSizeBase}px`,
    '--theme-font-size-heading': `${theme.typography.fontSizeHeading}px`,
    '--theme-font-weight-bold': String(theme.typography.fontWeightBold),
    '--theme-container-width': `${theme.layout.containerWidth}px`,
    '--theme-radius': `${theme.layout.radius}px`,
    '--theme-spacing': `${theme.layout.spacingBase}px`,
    '--theme-announcement-bg': theme.storefront.announcementBg,
    '--theme-announcement-fg': theme.storefront.announcementText,
    '--theme-header-bg': theme.storefront.headerBg,
    '--theme-footer-bg': theme.storefront.footerBg,
    '--theme-admin-sidebar-bg': theme.admin.sidebarBg,
    '--theme-admin-sidebar-fg': theme.admin.sidebarText,
    '--theme-admin-sidebar-active-bg': theme.admin.sidebarActiveBg,
    '--theme-admin-sidebar-active-fg': theme.admin.sidebarActiveText,
    '--theme-admin-topbar-bg': theme.admin.topbarBg,
  };
}

export const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Poppins',
  'Lato',
  'Nunito',
  'Raleway',
  'Source Sans 3',
  'Manrope',
  'DM Sans',
  'Rubik',
] as const;
