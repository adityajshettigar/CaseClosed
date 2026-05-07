import React, { useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalBody, Button, FormControl, FormLabel, Input, VStack, Textarea, Select, SimpleGrid, Flex, Box, Text, Heading, HStack, useToast } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const inp = { bg: '#FAF9F7', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '2px', fontFamily: "'Syne', sans-serif", fontSize: 'sm', fontWeight: '500', color: '#0C0C0C', h: '42px', _focus: { borderColor: '#C9A84C', bg: 'white', boxShadow: '0 0 0 3px rgba(201,168,76,0.12)', outline: 'none' }, _hover: { borderColor: 'rgba(0,0,0,0.22)' }, _placeholder: { color: 'rgba(12,12,12,0.22)', fontWeight: '400' }, transition: 'all 0.2s ease' };
const Field = ({ label, isRequired, children }) => (<FormControl isRequired={isRequired}><FormLabel fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.16em" textTransform="uppercase" color="rgba(12,12,12,0.42)" fontWeight="500" mb={1.5}>{label}</FormLabel>{children}</FormControl>);
const STEPS = [{ label: 'Case Info', subtitle: 'Names, number & status' }, { label: 'Parties', subtitle: 'Judge, opponent & counsel' }, { label: 'Details', subtitle: 'Hearing, tags & summary' }];

function AddCaseModal({ isOpen, onClose }) {
  const { currentUser } = useAuth(); const toast = useToast();
  const [step, setStep] = useState(0); const [isLoading, setIsLoading] = useState(false);
  const [caseName, setCaseName] = useState(''); const [clientName, setClientName] = useState('');
  const [caseNumber, setCaseNumber] = useState(''); const [status, setStatus] = useState('Active');
  const [judgeName, setJudgeName] = useState(''); const [opponentName, setOpponentName] = useState('');
  const [opponentJudge, setOpponentJudge] = useState(''); const [opponentLawyer, setOpponentLawyer] = useState('');
  const [nextHearing, setNextHearing] = useState(''); const [tags, setTags] = useState('');
  const [caseDetails, setCaseDetails] = useState(''); const [incidentDate, setIncidentDate] = useState(''); // NEW SOL FIELD

  const resetForm = () => {
    setCaseName(''); setClientName(''); setCaseNumber(''); setStatus('Active'); setJudgeName(''); setOpponentName(''); setOpponentJudge(''); setOpponentLawyer(''); setNextHearing(''); setTags(''); setCaseDetails(''); setIncidentDate(''); setStep(0);
  };
  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!currentUser) return; setIsLoading(true);
    try {
      await addDoc(collection(db, 'cases'), {
        caseName, clientName, caseNumber, status, judgeName, opponentName, opponentJudge, opponentLawyer,
        nextHearing: nextHearing ? Timestamp.fromDate(new Date(nextHearing)) : null,
        incidentDate: incidentDate ? Timestamp.fromDate(new Date(incidentDate)) : null, // SAVING SOL DATE
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        caseDetails, lawyerId: currentUser.uid, createdAt: Timestamp.now(),
        hearingUpdates: [], trustLedger: [], // INIT LEDGER
      });
      toast({ title: 'Case filed.', description: `"${caseName}" has been added.`, status: 'success', duration: 4000, position: 'bottom-right' });
      handleClose();
    } catch (err) { toast({ title: 'Error', description: err.message, status: 'error' }); } 
    finally { setIsLoading(false); }
  };

  const canProceed = step === 0 ? (caseName && clientName && caseNumber) : true;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="xl" scrollBehavior="inside" motionPreset="slideInBottom">
      <ModalOverlay bg="rgba(5,5,5,0.82)" backdropFilter="blur(14px)" />
      <ModalContent bg="white" borderRadius="2px" boxShadow="0 32px 80px rgba(0,0,0,0.24)" overflow="hidden" maxW="560px" mx={4} my={6}>
        <Box bg="#0C0C0C" px={8} pt={8} pb={6} position="relative" overflow="hidden">
          <Box position="absolute" inset={0} pointerEvents="none" backgroundImage="linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px)" backgroundSize="40px 40px" />
          <Flex justify="space-between" align="flex-start" position="relative" zIndex={1}>
            <Box>
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.2em" textTransform="uppercase" color="rgba(201,168,76,0.55)" mb={2}>New Matter — Step {step + 1} of {STEPS.length}</Text>
              <Heading fontFamily="'Playfair Display', serif" fontSize="2xl" fontWeight="900" color="white" letterSpacing="-0.02em" lineHeight="1.1">{STEPS[step].label}</Heading>
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(255,255,255,0.22)" letterSpacing="0.1em" mt={1}>{STEPS[step].subtitle}</Text>
            </Box>
            <Box as="button" onClick={handleClose} p={2} color="rgba(255,255,255,0.3)" borderRadius="2px" _hover={{ color: 'white' }}><FiX size={18} /></Box>
          </Flex>
          <Flex gap={2} mt={6} position="relative" zIndex={1}>
            {STEPS.map((s, i) => <Box key={s.label} h="2px" flex={1} borderRadius="1px" bg={i <= step ? '#C9A84C' : 'rgba(255,255,255,0.08)'} opacity={i < step ? 0.5 : 1} transition="all 0.3s ease" />)}
          </Flex>
        </Box>
        <ModalBody p={0} overflowY="auto">
          <Box px={8} py={7}>
            <AnimatePresence mode="wait">
              <Box as={motion.div} key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}>
                {step === 0 && (
                  <VStack spacing={5} align="stretch">
                    <Field label="Name of Case" isRequired><Input {...inp} value={caseName} onChange={e => setCaseName(e.target.value)} /></Field>
                    <Field label="Client Name" isRequired><Input {...inp} value={clientName} onChange={e => setClientName(e.target.value)} /></Field>
                    <SimpleGrid columns={2} spacing={4}>
                      <Field label="Case Number" isRequired><Input {...inp} value={caseNumber} onChange={e => setCaseNumber(e.target.value)} /></Field>
                      <Field label="Case Status"><Select {...inp} value={status} onChange={e => setStatus(e.target.value)}><option value="Active">Active</option><option value="Pending">Pending</option><option value="On Hold">On Hold</option><option value="Closed">Closed</option></Select></Field>
                    </SimpleGrid>
                  </VStack>
                )}
                {step === 1 && (
                  <VStack spacing={5} align="stretch">
                    <Field label="Judge Details"><Input {...inp} value={judgeName} onChange={e => setJudgeName(e.target.value)} /></Field>
                    <Field label="Opponent Name"><Input {...inp} value={opponentName} onChange={e => setOpponentName(e.target.value)} /></Field>
                    <SimpleGrid columns={2} spacing={4}>
                      <Field label="Opponent Judge"><Input {...inp} value={opponentJudge} onChange={e => setOpponentJudge(e.target.value)} /></Field>
                      <Field label="Opponent Lawyer"><Input {...inp} value={opponentLawyer} onChange={e => setOpponentLawyer(e.target.value)} /></Field>
                    </SimpleGrid>
                  </VStack>
                )}
                {step === 2 && (
                  <VStack spacing={5} align="stretch">
                    <SimpleGrid columns={2} spacing={4}>
                      <Field label="Next Hearing Date"><Input {...inp} type="date" value={nextHearing} onChange={e => setNextHearing(e.target.value)} /></Field>
                      <Field label="Date of Incident (SOL)"><Input {...inp} type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} /></Field>
                    </SimpleGrid>
                    <Field label="Tags (comma separated)"><Input {...inp} value={tags} onChange={e => setTags(e.target.value)} /></Field>
                    <Field label="Case Details"><Textarea {...inp} h="auto" rows={4} resize="none" py={2} value={caseDetails} onChange={e => setCaseDetails(e.target.value)} /></Field>
                  </VStack>
                )}
              </Box>
            </AnimatePresence>
          </Box>
        </ModalBody>
        <Box px={8} py={5} bg="rgba(0,0,0,0.018)" borderTop="1px solid rgba(0,0,0,0.06)">
          <Flex justify="space-between" align="center">
            <Button onClick={step === 0 ? handleClose : () => setStep(s => s - 1)} variant="ghost" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.14em" textTransform="uppercase" color="rgba(12,12,12,0.38)" px={5} h="40px">{step === 0 ? 'Cancel' : 'Back'}</Button>
            <HStack spacing={4}>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} isDisabled={!canProceed} bg="#0C0C0C" color="white" px={7} h="40px" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.15em" textTransform="uppercase" borderRadius="2px" rightIcon={<FiChevronRight size={12} />} _hover={{ bg: '#C9A84C', color: '#0C0C0C' }}>Continue</Button>
              ) : (
                <Button onClick={handleSubmit} isLoading={isLoading} bg="#C9A84C" color="#0C0C0C" px={7} h="40px" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.15em" textTransform="uppercase" fontWeight="800" borderRadius="2px" leftIcon={<FiPlus size={12} />} _hover={{ bg: '#B8973B' }}>File Case</Button>
              )}
            </HStack>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
}
export default AddCaseModal;