import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, AppBar, Toolbar, Typography, Container, Button } from '@mui/material';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ETUSL Asset Management
            </Typography>
            <Button color="inherit">Login</Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to ETUSL Asset Management
          </Typography>
          <Typography variant="body1">
            This is your new Material UI application. Start building your interface here.
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
