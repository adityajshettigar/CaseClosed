import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Container, FormControl, FormLabel, Input,
  Heading, Text, VStack, Alert, Flex
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiUserPlus, FiAlertCircle } from 'react-icons/fi';

const inpStyle = {
  bg: '#FAF9F7', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '2px',
  fontFamily: "'Syne', sans-serif", fontSize: 'sm', color: '#0C0C0C', h: '46px',
  _focus: { borderColor: '#C9A84C', bg: 'white', boxShadow: '0 0 0 3px rgba(201,168,76,0.12)' },
  _hover: { borderColor: 'rgba(0,0,0,0.22)' },
  transition: 'all 0.2s ease',
};

const labelStyle = {
  fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.16em",
  textTransform: "uppercase", color: "rgba(12,12,12,0.5)", fontWeight: "600", mb: 2
};

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Registration failed. ' + err.message);
    }
    setLoading(false);
  };

  return (
    <Box minH="100vh" bg="#F7F5F0" position="relative" overflow="hidden" display="flex" alignItems="center">
      <Box
        position="absolute" inset={0} pointerEvents="none" opacity={0.6}
        backgroundImage="linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)"
        backgroundSize="40px 40px"
      />

      <Container centerContent maxW="lg" position="relative" zIndex={1}>
        <Box as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} w="full">
          
          <VStack spacing={8} w="100%" bg="white" p={10} borderRadius="2px" boxShadow="0 32px 80px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)">
            <Box textAlign="center" w="full">
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.2em" textTransform="uppercase" color="#C9A84C" mb={3}>
                New Counsel Registration
              </Text>
              <Heading fontFamily="'Playfair Display', serif" fontSize="3xl" fontWeight="900" color="#0C0C0C" letterSpacing="-0.02em" lineHeight="1">
                Establish Access
              </Heading>
            </Box>

            {error && (
              <Flex w="full" bg="rgba(220,38,38,0.05)" border="1px solid rgba(220,38,38,0.2)" p={3} borderRadius="2px" align="center" gap={3}>
                <FiAlertCircle color="#DC2626" />
                <Text fontFamily="'Syne', sans-serif" fontSize="xs" color="#DC2626" fontWeight="600">{error}</Text>
              </Flex>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel {...labelStyle}>Email Address</FormLabel>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="counsel@firm.com" {...inpStyle} />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel {...labelStyle}>Password (Min 6. Chars)</FormLabel>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" {...inpStyle} />
                </FormControl>

                <Button
                  type="submit" w="full" isLoading={loading} loadingText="Registering..."
                  bg="#C9A84C" color="#0C0C0C" h="48px" mt={2}
                  fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.15em" textTransform="uppercase" fontWeight="700" borderRadius="2px"
                  leftIcon={<FiUserPlus size={14} />}
                  _hover={{ bg: '#B8973B', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(201,168,76,0.4)' }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                >
                  Create Account
                </Button>
              </VStack>
            </form>

            <Flex w="full" justify="center" borderTop="1px solid rgba(0,0,0,0.05)" pt={6}>
              <Text fontFamily="'Syne', sans-serif" fontSize="xs" color="rgba(12,12,12,0.5)" fontWeight="500">
                Already registered? <RouterLink to="/login" style={{ color: '#0C0C0C', fontWeight: '700', textDecoration: 'underline' }}>Return to Login</RouterLink>
              </Text>
            </Flex>
          </VStack>

        </Box>
      </Container>
    </Box>
  );
}

export default Signup;