import React, { useState } from 'react';
import {
  Box, Flex, VStack, Text, Link, Avatar, Divider,
  IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, Icon,
  Collapse
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiLogOut, FiMenu, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { FiDatabase, FiShare2 } from 'react-icons/fi';

// --- NavItem Component ---
const NavItem = ({ icon, isCollapsed, children, to, isActive, ...rest }) => {
  return (
    <Link as={RouterLink} to={to} style={{ textDecoration: 'none' }} _focus={{ boxShadow: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="2px"
        role="group"
        cursor="pointer"
        bg={isActive ? 'rgba(201,168,76,0.1)' : 'transparent'}
        color={isActive ? '#C9A84C' : 'rgba(255,255,255,0.45)'}
        borderLeft={isActive ? '2px solid #C9A84C' : '2px solid transparent'}
        transition="all 0.2s ease"
        _hover={{
          bg: 'rgba(255,255,255,0.03)',
          color: 'white',
          borderLeft: isActive ? '2px solid #C9A84C' : '2px solid rgba(255,255,255,0.2)'
        }}
        {...rest}
      >
        {icon && <Icon mr={isCollapsed ? '0' : '4'} fontSize="16" as={icon} />}
        <Collapse in={!isCollapsed} animateOpacity style={{ width: '100%' }}>
          <Text fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.15em" textTransform="uppercase">
            {children}
          </Text>
        </Collapse>
      </Flex>
    </Link>
  );
};

// --- SidebarContent (Internal) ---
const SidebarContent = ({ isCollapsed, ...rest }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out: ", err);
    }
  };

  return (
    <Box bg="#0C0C0C" borderRight="1px solid rgba(255,255,255,0.05)" pos="fixed" h="full" {...rest}>
      <Flex h="24" alignItems="center" mx="8" justifyContent={isCollapsed ? 'center' : 'space-between'}>
        <Collapse in={!isCollapsed} animateOpacity>
          <Text fontFamily="'Playfair Display', serif" fontSize="2xl" fontWeight="900" color="white" letterSpacing="-0.02em">
            Case<Text as="span" color="#C9A84C">Closed.</Text>
          </Text>
        </Collapse>
      </Flex>
      
      <Flex direction="column" align="center" mt={2} mb={10} px="4">
        <Avatar size={isCollapsed ? 'sm' : 'md'} name={currentUser?.email} mb={4} bg="#C9A84C" color="#0C0C0C" fontWeight="bold" />
        <Collapse in={!isCollapsed} animateOpacity>
          <Text fontFamily="'Syne', sans-serif" fontSize="sm" fontWeight="600" noOfLines={1} color="white">
            {currentUser?.email?.split('@')[0]}
          </Text>
          <Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(255,255,255,0.3)" letterSpacing="0.1em" mt={1}>
            Legal Counsel
          </Text>
        </Collapse>
      </Flex>
      
      <VStack align="stretch" spacing={2}>
        <NavItem icon={FiHome} to="/" isCollapsed={isCollapsed} isActive={location.pathname === '/'}>case</NavItem>
        <NavItem icon={FiUser} to="/profile" isCollapsed={isCollapsed} isActive={location.pathname === '/profile'}>Profile</NavItem>
        <NavItem icon={FiDatabase} to="/vault" isCollapsed={isCollapsed} isActive={location.pathname === '/vault'}>Evidence Vault</NavItem>
<NavItem icon={FiShare2} to="/network" isCollapsed={isCollapsed} isActive={location.pathname === '/network'}>Conflict Map</NavItem>
      </VStack>
      
      <Box pos="absolute" bottom={8} w="full">
        <Divider my={4} borderColor="rgba(255,255,255,0.05)" />
        <Flex
          onClick={handleLogout}
          align="center" p="4" mx="4" borderRadius="2px" role="group" cursor="pointer"
          justifyContent={isCollapsed ? 'center' : 'flex-start'}
          color="rgba(255,255,255,0.45)"
          _hover={{ bg: 'rgba(220,38,38,0.05)', color: '#DC2626' }}
          transition="all 0.2s ease"
        >
          <Icon mr={isCollapsed ? '0' : '4'} fontSize="16" as={FiLogOut} />
          <Collapse in={!isCollapsed} animateOpacity>
            <Text fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.15em" textTransform="uppercase">
              Log Out
            </Text>
          </Collapse>
        </Flex>
      </Box>
    </Box>
  );
};

// --- Main Sidebar Wrapper ---
const Sidebar = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const sidebarWidthPx = isCollapsed ? '80px' : '260px';

  return (
    <Box minH="100vh" bg="#F7F5F0">
      {/* DESKTOP SIDEBAR */}
      <Box display={{ base: 'none', md: 'block' }} transition="width 0.3s cubic-bezier(0.16, 1, 0.3, 1)" w={sidebarWidthPx}>
        <SidebarContent isCollapsed={isCollapsed} w={sidebarWidthPx} />
        
        <IconButton
          aria-label="Toggle Sidebar"
          icon={isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          onClick={() => setIsCollapsed(!isCollapsed)}
          size="sm"
          variant="outline"
          isRound
          pos="fixed"
          left={isCollapsed ? '66px' : '246px'}
          top="36px"
          bg="#0C0C0C"
          borderColor="rgba(255,255,255,0.1)"
          color="white"
          _hover={{ bg: '#C9A84C', color: '#0C0C0C', borderColor: '#C9A84C' }}
          zIndex="sticky"
          transition="left 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s"
        />
      </Box>
      
      {/* MOBILE DRAWER */}
      <Drawer autoFocus={false} isOpen={isOpen} placement="left" onClose={onClose} returnFocusOnClose={false} onOverlayClick={onClose} size="xs">
        <DrawerOverlay bg="rgba(5,5,5,0.8)" backdropFilter="blur(4px)" />
        <DrawerContent bg="#0C0C0C">
          <DrawerCloseButton color="white" zIndex="tooltip" mt={2} />
          <SidebarContent isCollapsed={false} />
        </DrawerContent>
      </Drawer>

      {/* MOBILE HEADER */}
      <Flex
        display={{ base: 'flex', md: 'none' }}
        px={6} height="20" alignItems="center" bg="#0C0C0C" borderBottomWidth="1px" borderBottomColor="rgba(255,255,255,0.05)"
        justifyContent="space-between" pos="sticky" top="0" zIndex="docked"
      >
        <Text fontFamily="'Playfair Display', serif" fontSize="xl" fontWeight="900" color="white" letterSpacing="-0.02em">
          Case<Text as="span" color="#C9A84C">Closed.</Text>
        </Text>
        <IconButton onClick={onOpen} variant="ghost" color="white" _hover={{ bg: 'rgba(255,255,255,0.1)' }} aria-label="open menu" icon={<FiMenu size={20} />} />
      </Flex>

      {/* MAIN CONTENT */}
      <Box ml={{ base: 0, md: sidebarWidthPx }} transition="margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)">
        {children}
      </Box>
    </Box>
  );
};

export default Sidebar;