import { extendTheme } from '@chakra-ui/react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/merriweather/700.css';
import '@fontsource/merriweather/900.css';

const theme = extendTheme({
  fonts: {
    heading: "'Merriweather', serif",
    body: "'Inter', sans-serif",
  },
  colors: {
    brand: {
      900: '#0A0A0A', // True Linear-style deep black
      800: '#171717',
      700: '#262626',
      500: '#D4AF37', // Retaining the classic legal gold
      50: '#FAFAFA',
    },
  },
  styles: {
    global: {
      'html, body': {
        backgroundColor: '#F4F4F5', // Crisp, cool off-white
        color: '#171717',
      },
    },
  },
  components: {
    Box: {
      variants: {
        card: {
          bg: 'white',
          borderWidth: '1px',
          borderColor: 'gray.200',
          borderRadius: 'xl', // Softer, modern corners
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)', // Micro-shadow
          p: 6,
          transition: 'all 0.2s cubic-bezier(.08,.52,.52,1)',
          _hover: {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            borderColor: 'gray.300',
          }
        },
      },
    },
    Stat: {
      variants: {
        card: {
          bg: 'white',
          borderWidth: '1px',
          borderColor: 'gray.200',
          borderRadius: 'xl',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          p: 6,
        },
      },
    },
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg', // Modern pill-ish shape
      },
    },
  },
});

export default theme;