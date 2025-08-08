import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003366', // Deep blue
      light: '#004d99',
      dark: '#001f3f',
    },
    secondary: {
      main: '#FFD700', // Yellow (Gold)
      light: '#FFE44D',
      dark: '#CCB000',
    },
  },
  typography: {
    fontFamily: [
      'Candara',
      'Century Gothic',
      'Trebuchet MS',
      'sans-serif'
    ].join(','),
    h1: {
      fontFamily: 'Century Gothic',
    },
    h2: {
      fontFamily: 'Century Gothic',
    },
    h3: {
      fontFamily: 'Century Gothic',
    },
    h4: {
      fontFamily: 'Century Gothic',
    },
    h5: {
      fontFamily: 'Century Gothic',
    },
    h6: {
      fontFamily: 'Century Gothic',
    },
    body1: {
      fontFamily: 'Candara',
    },
    body2: {
      fontFamily: 'Candara',
    },
    button: {
      fontFamily: 'Trebuchet MS',
      textTransform: 'none', // This prevents automatic uppercase transformation
    },
  },
});

export default theme;
