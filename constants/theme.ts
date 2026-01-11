/**
 * BorneoStockApp Design System
 * Chunky UI, Friendly, High Contrast Theme
 * Color Scheme: Kuning Borneo (#f7bd1a) + Hitam (#000000)
 */

export const Colors = {
  primary: '#f7bd1a',        // Kuning Borneo
  secondary: '#000000',      // Hitam
  
  background: {
    main: '#fafafa',         // Off-white
    card: '#ffffff',         // Putih murni
    dark: '#141414',         // Hitam/Abu gelap
  },
  
  text: {
    primary: '#141414',      // Hitam natural
    secondary: '#9e9e9e',    // Abu-abu medium
    onPrimary: '#000000',    // Hitam di atas kuning
    link: '#f7bd1a',         // Kuning
  },
  
  status: {
    success: '#2ecc71',      // Hijau
    error: '#e74c3c',        // Merah
    warning: '#f7bd1a',      // Kuning
  },
  
  badge: {
    category: {
      bg: '#fff8e1',         // Kuning pudar
      text: '#d4a017',       // Kuning gelap/emas
    },
    stockOut: {
      bg: '#ffebee',         // Merah pudar
      text: '#c62828',       // Merah tua
    },
    location: {
      bg: '#f5f5f5',         // Abu terang
      text: '#9e9e9e',       // Abu medium
    },
  },
  
  input: {
    background: '#f9f9f9',
    border: '#eeeeee',
    borderActive: '#f7bd1a',
  },
  
  iconBox: {
    yellow: '#fffbf0',       // Kuning sangat muda
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  
  cardPadding: 20,
  cardGap: 16,
  pagePadding: 24,
  pageTop: 60,
};

export const BorderRadius = {
  card: 24,
  button: 16,
  input: 16,
  badge: 8,
  circle: 9999,
};

export const FontSize = {
  h1: 24,
  h2: 18,
  h3: 16,
  body: 14,
  caption: 12,
  stockLarge: 36,
};

export const Shadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  button: {
    shadowColor: '#d4a017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
