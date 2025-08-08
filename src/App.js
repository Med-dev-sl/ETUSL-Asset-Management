import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import LoginScreen from './screens/LoginScreen';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoginScreen />
    </ThemeProvider>
  );
}

export default App;
