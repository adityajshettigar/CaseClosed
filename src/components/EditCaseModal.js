import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalBody,
  Button, FormControl, FormLabel, Input, VStack, Textarea,
  Select, SimpleGrid, Flex, Box, Text, Heading, useToast
} from '@chakra-ui/react';
import { FiX, FiCheck } from 'react-icons/fi';
import { db } from '../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

// Shared input style
const inp = {
  bg: '#FAF9F7', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '2px',
  fontFamily: "'Syne', sans-serif", fontSize: 'sm', fontWeight: '500', color: '#0C0C0C', h: '42px',
  _focus: { borderColor: '#C9A84C', bg: 'white', boxShadow: '0 0 0 3px rgba(201,168,76,0.12)', outline: 'none' },
  _hover: { borderColor: 'rgba(0,0,0,0.22)' },
  _placeholder: { color: 'rgba(12,12,12,0.22)', fontWeight: '400' },
  transition: 'all 0.2s ease',
};

// Field wrapper
const Field = ({ label, isRequired, children }) => (
  <FormControl isRequired={isRequired}>
    <FormLabel fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.16em" textTransform="uppercase" color="rgba(12,12,12,0.42)" fontWeight="500" mb={1.5}>
      {label}
    </FormLabel>
    {children}
  </FormControl>
);

const formatTimestampToDate = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return '';
  return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
};

function EditCaseModal({ isOpen, onClose, caseData }) {
  const [clientName, setClientName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [nextHearing, setNextHearing] = useState('');
  const [tags, setTags] = useState('');
  const [caseDetails, setCaseDetails] = useState('');
  const [status, setStatus] = useState('Active');
  const [caseName, setCaseName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [opponentJudge, setOpponentJudge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (caseData) {
      setClientName(caseData.clientName || '');
      setCaseNumber(caseData.caseNumber || '');
      setNextHearing(formatTimestampToDate(caseData.nextHearing));
      setTags((caseData.tags || []).join(', '));
      setCaseDetails(caseData.caseDetails || '');
      setStatus(caseData.status || 'Active');
      setCaseName(caseData.caseName || '');
      setOpponentName(caseData.opponentName || '');
      setOpponentJudge(caseData.opponentJudge || '');
    }
  }, [caseData]);

  const handleSubmit = async () => {
    if (!caseData) return;
    setIsLoading(true);

    const updatedData = {
      clientName, caseNumber, caseDetails,
      nextHearing: nextHearing ? Timestamp.fromDate(new Date(nextHearing)) : null,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      status, caseName, opponentName, opponentJudge,
    };

    try {
      const caseRef = doc(db, 'cases', caseData.id);
      await updateDoc(caseRef, updatedData);
      toast({ title: 'Matter updated.', status: 'success', duration: 3000, position: 'bottom-right' });
      onClose();
    } catch (err) {
      toast({ title: 'Update failed.', description: err.message, status: 'error', duration: 3000 });
    }
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl" scrollBehavior="inside" motionPreset="slideInBottom">
      <ModalOverlay bg="rgba(5,5,5,0.82)" backdropFilter="blur(14px)" />
      <ModalContent bg="white" borderRadius="2px" boxShadow="0 32px 80px rgba(0,0,0,0.24), 0 0 0 1px rgba(0,0,0,0.06)" overflow="hidden" maxW="600px" mx={4} my={6}>
        
        {/* Dark Header */}
        <Box bg="#0C0C0C" px={8} pt={8} pb={6} position="relative" overflow="hidden">
          <Box position="absolute" inset={0} pointerEvents="none" backgroundImage="linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px)" backgroundSize="40px 40px" />
          <Flex justify="space-between" align="flex-start" position="relative" zIndex={1}>
            <Box>
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.2em" textTransform="uppercase" color="rgba(201,168,76,0.55)" mb={2}>
                Modify Docket Entry
              </Text>
              <Heading fontFamily="'Playfair Display', serif" fontSize="2xl" fontWeight="900" color="white" letterSpacing="-0.02em" lineHeight="1.1" noOfLines={1}>
                {caseData?.caseName || 'Edit Case'}
              </Heading>
            </Box>
            <Box as="button" onClick={onClose} p={2} color="rgba(255,255,255,0.3)" borderRadius="2px" _hover={{ color: 'white' }}>
              <FiX size={18} />
            </Box>
          </Flex>
        </Box>

        <ModalBody p={0} overflowY="auto">
          <Box px={8} py={7}>
            <VStack spacing={6} align="stretch">
              <Field label="Name of Case" isRequired>
                <Input value={caseName} onChange={(e) => setCaseName(e.target.value)} {...inp} />
              </Field>
              <Field label="Client Name" isRequired>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} {...inp} />
              </Field>
              
              <SimpleGrid columns={2} spacing={4} w="full">
                <Field label="Case Number" isRequired>
                  <Input value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} {...inp} />
                </Field>
                <Field label="Case Status" isRequired>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)} {...inp}>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                  </Select>
                </Field>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} w="full">
                <Field label="Next Hearing Date">
                  <Input type="date" value={nextHearing} onChange={(e) => setNextHearing(e.target.value)} {...inp} />
                </Field>
                <Field label="Opponent Judge">
                  <Input value={opponentJudge} onChange={(e) => setOpponentJudge(e.target.value)} {...inp} />
                </Field>
              </SimpleGrid>

              <Field label="Opponent Name">
                <Input value={opponentName} onChange={(e) => setOpponentName(e.target.value)} {...inp} />
              </Field>
              <Field label="Tags (comma separated)">
                <Input value={tags} onChange={(e) => setTags(e.target.value)} {...inp} />
              </Field>
              <Field label="Case Details">
                <Textarea value={caseDetails} onChange={(e) => setCaseDetails(e.target.value)} rows={4} resize="none" {...inp} h="auto" py={3} />
              </Field>
            </VStack>
          </Box>
        </ModalBody>

        <Box px={8} py={5} bg="rgba(0,0,0,0.018)" borderTop="1px solid rgba(0,0,0,0.06)">
          <Flex justify="space-between" align="center">
            <Button onClick={onClose} variant="ghost" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.14em" textTransform="uppercase" color="rgba(12,12,12,0.38)" borderRadius="2px" px={5} h="40px" _hover={{ bg: 'rgba(0,0,0,0.05)', color: '#0C0C0C' }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading} loadingText="Saving..." bg="#C9A84C" color="#0C0C0C" px={7} h="40px" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.15em" textTransform="uppercase" fontWeight="800" borderRadius="2px" leftIcon={<FiCheck size={12} />} _hover={{ bg: '#B8973B', transform: 'translateY(-1px)', boxShadow: '0 8px 28px rgba(201,168,76,0.48)' }} _active={{ transform: 'translateY(0)' }} transition="all 0.22s cubic-bezier(0.16, 1, 0.3, 1)">
              Save Changes
            </Button>
          </Flex>
        </Box>

      </ModalContent>
    </Modal>
  );
}
export default EditCaseModal;