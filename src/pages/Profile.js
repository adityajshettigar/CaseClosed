import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  Box, Container, Heading, Text, VStack, Flex,
  SimpleGrid, Avatar, Center, Spinner, Icon
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiInbox } from 'react-icons/fi';

const pageVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

function Profile() {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const q = query(collection(db, 'cases'), where('lawyerId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const completedCases = cases.filter(c => c.status === 'Closed');
  const activeCases = cases.filter(c => c.status === 'Active');

  if (loading) {
    return <Center h="100vh" bg="#F7F5F0"><Spinner size="xl" color="#C9A84C" thickness="3px" /></Center>;
  }

  return (
    <Box bg="#F7F5F0" minH="100vh">
      {/* ── Dark Hero Profile ───────────────────────────────────── */}
      <Box position="relative" overflow="hidden" bg="#0C0C0C" pt={16} pb={24}>
        <Box position="absolute" inset={0} backgroundImage="linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)" backgroundSize="60px 60px" opacity={0.6} />
        <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" w="600px" h="300px" bg="radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%)" pointerEvents="none" />

        <Container maxW="container.lg" position="relative" zIndex={1}>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={8}>
            <Avatar size="2xl" name={currentUser.email} bg="#C9A84C" color="#0C0C0C" border="4px solid #0C0C0C" boxShadow="0 0 0 1px rgba(255,255,255,0.2)" />
            <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3}>
              <Text fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.2em" textTransform="uppercase" color="#C9A84C">
                Counsel Dossier
              </Text>
              <Heading fontFamily="'Playfair Display', serif" fontSize="4xl" fontWeight="900" color="white" letterSpacing="-0.02em">
                {currentUser.email}
              </Heading>
              
              <Flex gap={6} mt={2}>
                <Box>
                  <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" textTransform="uppercase" color="rgba(255,255,255,0.4)">Active</Text>
                  <Text fontFamily="'Syne', sans-serif" fontSize="2xl" fontWeight="700" color="white">{activeCases.length}</Text>
                </Box>
                <Box>
                  <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" textTransform="uppercase" color="rgba(255,255,255,0.4)">Resolved</Text>
                  <Text fontFamily="'Syne', sans-serif" fontSize="2xl" fontWeight="700" color="#C9A84C">{completedCases.length}</Text>
                </Box>
              </Flex>
            </VStack>
          </Flex>
        </Container>
      </Box>

      {/* ── Case History Grid ───────────────────────────────────── */}
      <Container maxW="container.lg" py={12} mt={-10} position="relative" zIndex={2}>
        <Box as={motion.div} variants={pageVariants} initial="hidden" animate="show">
          
          <Flex align="center" gap={3} mb={8}>
            <Icon as={FiCheckCircle} color="#C9A84C" boxSize={5} />
            <Heading fontFamily="'Playfair Display', serif" fontSize="2xl" fontWeight="900" color="#0C0C0C" letterSpacing="-0.02em">
              Resolved Cases
            </Heading>
          </Flex>
          
          {completedCases.length === 0 ? (
            <Center h="250px" flexDirection="column" bg="white" borderRadius="2px" border="1px dashed rgba(0,0,0,0.12)" gap={3}>
              <Icon as={FiInbox} boxSize={8} color="rgba(12,12,12,0.15)" />
              <Text fontFamily="'DM Mono', monospace" fontSize="10px" color="rgba(12,12,12,0.4)" letterSpacing="0.08em" textTransform="uppercase">
                No archived dossiers
              </Text>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={6}>
              <AnimatePresence>
                {completedCases.map(c => (
                  <Box
                    as={motion.div} variants={itemVariants} layout key={c.id}
                    bg="white" borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px"
                    cursor="pointer" position="relative" overflow="hidden"
                    boxShadow="0 2px 8px rgba(0,0,0,0.02)"
                    transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                    _hover={{ boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px #C9A84C', transform: 'translateY(-4px)' }}
                    onClick={() => navigate(`/case/${c.id}`)}
                    aspectRatio={1}
                    display="flex" flexDirection="column" justifyContent="center" alignItems="center" textAlign="center" p={6}
                  >
                    <Box position="absolute" top={0} left={0} right={0} h="3px" bg="rgba(0,0,0,0.04)" />
                    
                    <Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.3)" letterSpacing="0.1em" mb={3}>
                      #{c.caseNumber}
                    </Text>
                    <Heading fontFamily="'Playfair Display', serif" fontSize="lg" fontWeight="700" color="#0C0C0C" letterSpacing="-0.01em" noOfLines={3} mb={2}>
                      {c.caseName || c.clientName}
                    </Heading>
                    
                    <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" textTransform="uppercase" color="#C9A84C" mt="auto">
                      Closed
                    </Text>
                  </Box>
                ))}
              </AnimatePresence>
            </SimpleGrid>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default Profile;