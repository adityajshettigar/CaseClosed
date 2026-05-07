import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  Box, Button, Container, Heading, Text, HStack, Tag,
  InputGroup, InputLeftElement, Input, useDisclosure, SimpleGrid,
  Spinner, Flex, Link as ChakraLink, Icon, Center
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react'; // FIX: Imported from emotion
import { SearchIcon, AddIcon } from '@chakra-ui/icons';
import {
  FiEdit2, FiTrash2, FiBriefcase, FiCheckCircle,
  FiCalendar, FiClock, FiFileText, FiArrowRight
} from 'react-icons/fi';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

import AddCaseModal from '../components/AddCaseModal';
import DeleteCaseAlert from '../components/DeleteCaseAlert';
import EditCaseModal from '../components/EditCaseModal';

// ─── Animation Keyframes ──────────────────────────────────────────
const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

// ─── Motion Variants ───────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(4px)' },
  show: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 280, damping: 28 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 240, damping: 26 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

// ─── Ticker Component ─────────────────────────────────────────────
const MarqueeTicker = ({ items }) => {
  const duplicated = [...items, ...items];
  return (
    <Box
      overflow="hidden"
      borderTop="1px solid rgba(201,168,76,0.15)"
      borderBottom="1px solid rgba(201,168,76,0.15)"
      bg="rgba(201,168,76,0.04)"
      py={2}
    >
      <Box
        as={motion.div}
        display="flex"
        gap={12}
        animate={{ x: [0, '-50%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        whiteSpace="nowrap"
      >
        {duplicated.map((item, i) => (
          <Flex key={i} align="center" gap={3} shrink={0}>
            <Box w="4px" h="4px" borderRadius="full" bg="#C9A84C" />
            <Text
              fontFamily="'DM Mono', monospace"
              fontSize="10px"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="rgba(12,12,12,0.5)"
            >
              {item}
            </Text>
          </Flex>
        ))}
      </Box>
    </Box>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────
// FIX: Renamed icon prop to IconComponent to satisfy PascalCase rules
const StatCard = ({ label, value, sub, icon: IconComponent, accent, index }) => {
  const colors = {
    gold: { bg: '#C9A84C', light: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)' },
    dark: { bg: '#0C0C0C', light: 'rgba(12,12,12,0.05)', border: 'rgba(12,12,12,0.1)' },
    green: { bg: '#2D6A4F', light: 'rgba(45,106,79,0.07)', border: 'rgba(45,106,79,0.15)' },
    amber: { bg: '#92400E', light: 'rgba(146,64,14,0.07)', border: 'rgba(146,64,14,0.15)' },
  };
  const c = colors[accent] || colors.dark;

  return (
    <Box
      as={motion.div}
      variants={itemVariants}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      bg="white"
      borderWidth="1px"
      borderColor={c.border}
      borderRadius="2px"
      p={7}
      position="relative"
      overflow="hidden"
      cursor="default"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
      _hover={{ boxShadow: `0 20px 48px rgba(0,0,0,0.1), 0 0 0 1px ${c.border}` }}
      transition="box-shadow 0.3s"
    >
      <Box
        position="absolute" top={0} left={0} right={0} h="2px"
        bg={c.bg}
        as={motion.div}
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: index * 0.1 + 0.4 }}
      />

      <Box
        position="absolute" bottom="-8px" right="-8px"
        opacity={0.04} fontSize="100px" color={c.bg}
      >
        <IconComponent />
      </Box>

      <Flex justify="space-between" align="flex-start" mb={5}>
        <Text
          fontFamily="'DM Mono', monospace"
          fontSize="9px"
          letterSpacing="0.16em"
          textTransform="uppercase"
          color="rgba(12,12,12,0.4)"
          fontWeight="500"
        >
          {label}
        </Text>
        <Flex
          w="32px" h="32px" borderRadius="2px" bg={c.light}
          align="center" justify="center"
        >
          <IconComponent size={14} color={c.bg} />
        </Flex>
      </Flex>

      <Text
        fontFamily="'Playfair Display', serif"
        fontSize="3.5rem"
        fontWeight="900"
        lineHeight="1"
        color="#0C0C0C"
        letterSpacing="-0.03em"
        mb={2}
      >
        {value}
      </Text>

      {sub && (
        <Text
          fontFamily="'DM Mono', monospace"
          fontSize="10px"
          color="rgba(12,12,12,0.38)"
          letterSpacing="0.05em"
          noOfLines={1}
          mt={2}
        >
          {sub}
        </Text>
      )}
    </Box>
  );
};

// ─── Case Card ────────────────────────────────────────────────────
const CaseCard = ({ c, onEdit, onDelete, navigate }) => {
  const statusConfig = {
    Active: { color: '#2D6A4F', bg: 'rgba(45,106,79,0.08)', dot: '#4CAF50', label: 'Active' },
    Closed: { color: '#555', bg: 'rgba(0,0,0,0.05)', dot: '#999', label: 'Closed' },
    Pending: { color: '#92400E', bg: 'rgba(146,64,14,0.08)', dot: '#F59E0B', label: 'Pending' },
  };
  const st = statusConfig[c.status] || statusConfig.Active;

  return (
    <Box
      as={motion.div}
      variants={cardVariants}
      layout
      whileHover="hover"
      initial="rest"
      animate="rest"
      bg="white"
      borderWidth="1px"
      borderColor="rgba(0,0,0,0.07)"
      borderRadius="2px"
      overflow="hidden"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
      position="relative"
      display="flex"
      flexDirection="column"
      cursor="pointer"
      role="group"
    >
      <Box
        as={motion.div}
        position="absolute" inset={0}
        bg="linear-gradient(135deg, rgba(201,168,76,0.03) 0%, transparent 60%)"
        opacity={0}
        variants={{ hover: { opacity: 1 }, rest: { opacity: 0 } }}
        transition={{ duration: 0.3 }}
        pointerEvents="none"
        zIndex={0}
      />

      <Box
        as={motion.div}
        position="absolute" left={0} top={0} bottom={0} w="3px"
        bg="#C9A84C"
        variants={{ hover: { scaleY: 1, transformOrigin: 'bottom' }, rest: { scaleY: 0, transformOrigin: 'bottom' } }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />

      <Box p={6} flex="1" position="relative" zIndex={1}>
        <Flex justify="space-between" align="center" mb={5}>
          <Flex align="center" gap={2}>
            <Box
              w="6px" h="6px" borderRadius="full" bg={st.dot}
              as={motion.div}
              animate={{ opacity: c.status === 'Active' ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 2, repeat: c.status === 'Active' ? Infinity : 0 }}
            />
            <Text
              fontFamily="'DM Mono', monospace"
              fontSize="9px"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color={st.color}
              fontWeight="600"
              bg={st.bg}
              px={2} py={0.5}
              borderRadius="2px"
            >
              {st.label}
            </Text>
          </Flex>
          <Text
            fontFamily="'DM Mono', monospace"
            fontSize="10px"
            color="rgba(12,12,12,0.3)"
            letterSpacing="0.08em"
          >
            #{c.caseNumber}
          </Text>
        </Flex>

        <Heading
          size="md"
          fontFamily="'Playfair Display', serif"
          fontWeight="700"
          color="#0C0C0C"
          mb={1}
          noOfLines={2}
          letterSpacing="-0.01em"
          lineHeight="1.25"
          onClick={() => navigate(`/case/${c.id}`)}
          _hover={{ color: '#C9A84C' }}
          transition="color 0.2s"
          cursor="pointer"
        >
          {c.caseName || 'Unnamed Matter'}
        </Heading>

        <Text
          fontFamily="'Syne', sans-serif"
          fontSize="12px"
          color="rgba(12,12,12,0.45)"
          fontWeight="500"
          mb={5}
        >
          Client:{' '}
          <ChakraLink
            as={RouterLink}
            to={`/client/${c.clientId}`}
            color="#0C0C0C"
            fontWeight="700"
            _hover={{ color: '#C9A84C' }}
            transition="color 0.2s"
          >
            {c.clientName}
          </ChakraLink>
        </Text>

        {c.nextHearing && (
          <Flex
            align="center" gap={3}
            bg="rgba(201,168,76,0.06)"
            border="1px solid rgba(201,168,76,0.15)"
            borderRadius="2px"
            p={3} mb={4}
          >
            <Icon as={FiCalendar} color="#C9A84C" boxSize={3.5} />
            <Box>
              <Text fontFamily="'DM Mono', monospace" fontSize="8px" letterSpacing="0.14em" textTransform="uppercase" color="rgba(12,12,12,0.4)">
                Next Hearing
              </Text>
              <Text fontFamily="'Syne', sans-serif" fontSize="11px" fontWeight="700" color="#0C0C0C">
                {new Date(c.nextHearing.seconds * 1000).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'long', day: 'numeric'
                })}
              </Text>
            </Box>
          </Flex>
        )}

        {(c.tags || []).length > 0 && (
          <HStack wrap="wrap" spacing={1} mt="auto">
            {(c.tags || []).slice(0, 3).map((tag, idx) => (
              <Tag
                key={idx}
                bg="rgba(0,0,0,0.05)"
                color="rgba(12,12,12,0.5)"
                size="sm"
                borderRadius="2px"
                fontFamily="'DM Mono', monospace"
                fontSize="9px"
                letterSpacing="0.06em"
                px={2}
              >
                {tag}
              </Tag>
            ))}
            {(c.tags || []).length > 3 && (
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.3)">
                +{c.tags.length - 3}
              </Text>
            )}
          </HStack>
        )}
      </Box>

      <Box
        borderTop="1px solid rgba(0,0,0,0.05)"
        px={6} py={3}
        bg="rgba(0,0,0,0.01)"
        position="relative"
        zIndex={1}
      >
        <Flex justify="space-between" align="center">
          <Button
            size="xs"
            variant="ghost"
            leftIcon={<FiEdit2 size={11} />}
            onClick={(e) => { e.stopPropagation(); onEdit(c); }}
            color="rgba(12,12,12,0.45)"
            fontFamily="'DM Mono', monospace"
            fontSize="9px"
            letterSpacing="0.1em"
            textTransform="uppercase"
            _hover={{ bg: 'rgba(0,0,0,0.05)', color: '#0C0C0C' }}
            borderRadius="2px"
            px={3}
          >
            Edit
          </Button>

          <Flex gap={2}>
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<FiArrowRight size={11} />}
              onClick={(e) => { e.stopPropagation(); navigate(`/case/${c.id}`); }}
              color="rgba(12,12,12,0.45)"
              fontFamily="'DM Mono', monospace"
              fontSize="9px"
              letterSpacing="0.1em"
              textTransform="uppercase"
              _hover={{ bg: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
              borderRadius="2px"
              px={3}
            >
              Open
            </Button>
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<FiTrash2 size={11} />}
              onClick={(e) => { e.stopPropagation(); onDelete(c); }}
              color="transparent"
              _groupHover={{ color: 'rgba(12,12,12,0.3)' }}
              fontFamily="'DM Mono', monospace"
              fontSize="9px"
              letterSpacing="0.1em"
              textTransform="uppercase"
              _hover={{ bg: 'rgba(220,38,38,0.06)', color: '#DC2626' }}
              borderRadius="2px"
              px={3}
              transition="all 0.2s"
            >
              Archive
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────
function Dashboard() {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [proverb, setProverb] = useState('');
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getGreeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const q = query(collection(db, 'cases'), where('lawyerId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    fetch('https://api.quotable.io/random?tags=justice|law|wisdom')
      .then(r => r.json())
      .then(d => setProverb(`${d.content} — ${d.author}`))
      .catch(() => setProverb('He who is his own lawyer has a fool for a client.'));
  }, []);

  const { activeCases, completedCases, nextHearing, recentlyHeard } = useMemo(() => {
    const active = cases.filter(c => c.status === 'Active');
    const completed = cases.filter(c => c.status === 'Closed');
    const upcoming = active
      .filter(c => c.nextHearing && c.nextHearing.seconds * 1000 > Date.now())
      .sort((a, b) => a.nextHearing.seconds - b.nextHearing.seconds);
    const next = upcoming[0] || null;
    const pastH = cases.flatMap(c => c.hearingUpdates || [])
      .filter(h => h.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = pastH[0] || null;
    return {
      activeCases: active.length,
      completedCases: completed.length,
      nextHearing: next ? {
        name: next.caseName || next.clientName,
        date: new Date(next.nextHearing.seconds * 1000).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric'
        })
      } : null,
      recentlyHeard: recent ? {
        date: new Date(recent.date).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric'
        })
      } : null,
    };
  }, [cases]);

  const filteredCases = cases.filter(c =>
    (c.caseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.caseNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tickerItems = [
    'Case Closed — Legal Intelligence Platform',
    'Manage. Track. Win.',
    `${activeCases} Active Matters`,
    `${completedCases} Cases Resolved`,
    nextHearing ? `Next Hearing: ${nextHearing.date}` : 'No Upcoming Hearings',
    'Confidential & Encrypted',
    time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  ];

  // FIX: These handlers were accidentally missing/causing the undefined error
  const openDeleteAlert = (caseData) => { setSelectedCase(caseData); onDeleteOpen(); };
  const openEditModal = (caseData) => { setSelectedCase(caseData); onEditOpen(); };

  return (
    <Box bg="#F7F5F0" minH="100vh">
      <Box position="sticky" top={0} zIndex={100}>
        <MarqueeTicker items={tickerItems} />
      </Box>

      <Box ref={heroRef} position="relative" overflow="hidden" bg="#0C0C0C" pb={20} pt={16}>
        <Box
          position="absolute" inset={0}
          backgroundImage={`
            linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)
          `}
          backgroundSize="60px 60px"
          opacity={0.6}
        />
        <Box
          position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)"
          w="600px" h="300px"
          bg="radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%)"
          pointerEvents="none"
        />

        <Box as={motion.div} style={{ y: heroY, opacity: heroOpacity }}>
          <Container maxW="container.xl" px={{ base: 6, md: 14 }}>
            <Box as={motion.div} variants={pageVariants} initial="hidden" animate="show">
              
              <Box as={motion.div} variants={itemVariants} mb={6}>
                <Flex align="center" gap={3}>
                  <Box
                    fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.2em" textTransform="uppercase"
                    color="rgba(201,168,76,0.7)" bg="rgba(201,168,76,0.08)" border="1px solid rgba(201,168,76,0.15)"
                    px={3} py={1.5} borderRadius="2px"
                  >
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </Box>
                  
                </Flex>
              </Box>

              <Box as={motion.div} variants={itemVariants} mb={4}>
                <Heading
                  fontFamily="'Playfair Display', serif" fontSize={{ base: '4xl', md: '7xl' }} fontWeight="900"
                  color="white" letterSpacing="-0.03em" lineHeight="0.95" mb={2}
                >
                  {getGreeting()},
                </Heading>
                <Heading
                  fontFamily="'Playfair Display', serif" fontSize={{ base: '4xl', md: '7xl' }} fontWeight="900"
                  letterSpacing="-0.03em" lineHeight="0.95"
                  bgGradient="linear(135deg, #C9A84C 0%, #F0D99A 40%, #C9A84C 100%)"
                  bgClip="text" backgroundSize="200% auto"
                  animation={`${shimmer} 4s linear infinite`}
                >
                  {currentUser?.email?.split('@')[0]}.
                </Heading>
              </Box>

              <Box as={motion.div} variants={itemVariants}>
                <Text
                  fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize={{ base: 'md', md: 'lg' }}
                  color="rgba(255,255,255,0.35)" maxW="600px" lineHeight="1.6" fontWeight="400" mt={6}
                >
                  "{proverb || 'Loading daily wisdom...'}"
                </Text>
              </Box>

            </Box>
          </Container>
        </Box>

        <Box
          position="absolute" bottom={0} left={0} right={0} h="80px"
          bg="linear-gradient(to bottom, transparent, #F7F5F0)"
        />
      </Box>

      <Container maxW="container.xl" px={{ base: 6, md: 14 }} mt={-8}>
        <Box as={motion.div} variants={pageVariants} initial="hidden" animate="show">
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={16}>
            <StatCard index={0} label="Active Cases" value={activeCases} sub="Currently open matters" icon={FiBriefcase} accent="dark" />
            <StatCard index={1} label="Completed" value={completedCases} sub="Successfully resolved" icon={FiCheckCircle} accent="green" />
            <StatCard index={2} label="Next Hearing" value={nextHearing ? nextHearing.date : '—'} sub={nextHearing ? nextHearing.name : 'No upcoming hearings'} icon={FiCalendar} accent="gold" />
            <StatCard index={3} label="Last Action" value={recentlyHeard ? recentlyHeard.date : '—'} sub="Most recent timeline update" icon={FiClock} accent="amber" />
          </SimpleGrid>

          <Box as={motion.div} variants={itemVariants} mb={8}>
            <Flex mb={8} align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4} justify="space-between">
              <Box>
                <Flex align="center" gap={4} mb={1}>
                  <Heading fontFamily="'Playfair Display', serif" fontSize={{ base: '2xl', md: '4xl' }} fontWeight="900" color="#0C0C0C" letterSpacing="-0.02em">
                    Directory
                  </Heading>
                  <Box
                    fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.12em" textTransform="uppercase"
                    color="rgba(12,12,12,0.4)" bg="rgba(0,0,0,0.05)" border="1px solid rgba(0,0,0,0.08)"
                    px={2.5} py={1} borderRadius="2px"
                  >
                    {filteredCases.length} matters
                  </Box>
                </Flex>
                <Text fontFamily="'DM Mono', monospace" fontSize="10px" color="rgba(12,12,12,0.3)" letterSpacing="0.08em">
                  All legal cases · Organized · Searchable
                </Text>
              </Box>

              <HStack spacing={3} w={{ base: 'full', md: 'auto' }}>
                <InputGroup w={{ base: 'full', md: '280px' }}>
                  <InputLeftElement pointerEvents="none" h="full">
                    <SearchIcon color="rgba(12,12,12,0.3)" boxSize={3} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search case or client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    bg="white" borderRadius="2px" borderColor="rgba(0,0,0,0.1)" fontFamily="'Syne', sans-serif" fontSize="12px" h="40px"
                    _focus={{ borderColor: '#C9A84C', boxShadow: '0 0 0 2px rgba(201,168,76,0.15)' }}
                    _placeholder={{ color: 'rgba(12,12,12,0.25)' }}
                  />
                </InputGroup>

                <Button
                  onClick={onAddOpen}
                  bg="#0C0C0C" color="white" px={6} h="40px" leftIcon={<AddIcon boxSize={2.5} />}
                  fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.15em" textTransform="uppercase"
                  borderRadius="2px" flexShrink={0}
                  _hover={{ bg: '#C9A84C', color: '#0C0C0C', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(201,168,76,0.4)' }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                >
                  New Case
                </Button>
              </HStack>
            </Flex>

            {loading ? (
              <Center h="320px" flexDirection="column" gap={4}>
                <Box as={motion.div} animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                  <Spinner size="lg" color="#C9A84C" thickness="2px" emptyColor="rgba(0,0,0,0.06)" />
                </Box>
                <Text fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.14em" color="rgba(12,12,12,0.3)" textTransform="uppercase">
                  Loading matters...
                </Text>
              </Center>
            ) : filteredCases.length === 0 ? (
              <Center
                h="320px" flexDirection="column" bg="white" borderRadius="2px" border="1px dashed rgba(0,0,0,0.12)"
                as={motion.div} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} gap={4}
              >
                <Box as={motion.div} animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <Icon as={FiFileText} boxSize={10} color="rgba(12,12,12,0.12)" />
                </Box>
                <Box textAlign="center">
                  <Text fontFamily="'Playfair Display', serif" fontSize="xl" color="rgba(12,12,12,0.5)" fontWeight="700" mb={1}>No matters found</Text>
                  <Text fontFamily="'DM Mono', monospace" fontSize="10px" color="rgba(12,12,12,0.3)" letterSpacing="0.08em">
                    {searchTerm ? 'Try a different search term' : 'Create your first case to begin'}
                  </Text>
                </Box>
                {searchTerm ? (
                  <Button
                    size="sm" variant="ghost" onClick={() => setSearchTerm('')}
                    fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.12em" textTransform="uppercase"
                    color="#C9A84C" _hover={{ bg: 'rgba(201,168,76,0.08)' }} borderRadius="2px"
                  >
                    Clear search
                  </Button>
                ) : (
                  <Button
                    size="sm" onClick={onAddOpen} bg="#0C0C0C" color="white"
                    fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.12em" textTransform="uppercase"
                    borderRadius="2px" _hover={{ bg: '#C9A84C', color: '#0C0C0C' }} leftIcon={<AddIcon boxSize={2} />}
                  >
                    New Case
                  </Button>
                )}
              </Center>
            ) : (
              <Box as={motion.div} variants={pageVariants} initial="hidden" animate="show">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                  <AnimatePresence mode="popLayout">
                    {filteredCases.map(c => (
                      <CaseCard key={c.id} c={c} onEdit={openEditModal} onDelete={openDeleteAlert} navigate={navigate} />
                    ))}
                  </AnimatePresence>
                </SimpleGrid>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      <Box mt={24} py={8} borderTop="1px solid rgba(0,0,0,0.06)">
        <Container maxW="container.xl" px={{ base: 6, md: 14 }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.12em" color="rgba(12,12,12,0.25)" textTransform="uppercase">
              Case Closed © {new Date().getFullYear()}
            </Text>
            <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.12em" color="rgba(12,12,12,0.25)" textTransform="uppercase">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </Flex>
        </Container>
      </Box>

      <AddCaseModal isOpen={isAddOpen} onClose={onAddClose} />
      {selectedCase && <EditCaseModal isOpen={isEditOpen} onClose={onEditClose} caseData={selectedCase} />}
      {selectedCase && <DeleteCaseAlert isOpen={isDeleteOpen} onClose={onDeleteClose} caseId={selectedCase.id} caseName={selectedCase.caseName || selectedCase.clientName} />}
    </Box>
  );
}

export default Dashboard;