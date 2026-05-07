import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  Box, Button, Container, Heading, Text, VStack, HStack, Tag, Spinner,
  Flex, SimpleGrid, FormControl, FormLabel, Textarea, Input, useToast,
  Center, Tabs, TabList, Tab, TabPanels, TabPanel, Select, Table, Thead, Tbody, Tr, Th, Td
} from '@chakra-ui/react';
import { FiCpu, FiDollarSign, FiAlertTriangle, FiPrinter } from 'react-icons/fi';
import CaseTimeline from '../components/CaseTimeline';
import { motion } from 'framer-motion';

const inp = {
  bg: '#FAF9F7', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '2px', fontFamily: "'Syne', sans-serif", fontSize: 'sm',
  color: '#0C0C0C', h: '42px', _focus: { borderColor: '#C9A84C', bg: 'white', boxShadow: '0 0 0 3px rgba(201,168,76,0.12)' }
};

function CaseDetails() {
  const { currentUser } = useAuth();
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Timeline & Hours State
  const [updateText, setUpdateText] = useState('');
  const [updateDate, setUpdateDate] = useState('');
  const [billableHours, setBillableHours] = useState('');
  
  // IOLTA Trust Ledger State
  const [ledgerDesc, setLedgerDesc] = useState('');
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerType, setLedgerType] = useState('Deposit');
  const HOURLY_RATE = 350; // Firm standard rate

  // AI Brief State
  const [aiBrief, setAiBrief] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Fetch Case Data
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'cases', caseId), (doc) => {
      if (doc.exists()) { setCaseData({ id: doc.id, ...doc.data() }); } 
      else { navigate('/'); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [caseId, navigate]);

  // FEATURE 1: SOL (Statute of Limitations) Engine
  const solData = useMemo(() => {
    if (!caseData?.incidentDate) return null;
    const incident = new Date(caseData.incidentDate.seconds * 1000);
    const deadline = new Date(incident);
    deadline.setFullYear(deadline.getFullYear() + 2); // 2-Year limit standard
    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    return { date: deadline.toLocaleDateString(), daysLeft };
  }, [caseData]);

  // FEATURE 2: Trust Ledger (IOLTA) Calculations
  const { totalDeposits, totalExpenses, totalBilled, currentBalance } = useMemo(() => {
    if (!caseData) return { totalDeposits: 0, totalExpenses: 0, totalBilled: 0, currentBalance: 0 };
    const ledger = caseData.trustLedger || [];
    const deps = ledger.filter(t => t.type === 'Deposit').reduce((acc, curr) => acc + curr.amount, 0);
    const exps = ledger.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const billed = (caseData.hearingUpdates || []).reduce((acc, curr) => acc + (curr.hours || 0), 0) * HOURLY_RATE;
    return { totalDeposits: deps, totalExpenses: exps, totalBilled: billed, currentBalance: deps - exps - billed };
  }, [caseData]);

  // Add Hearing & Billable Hours
  const handleAddUpdate = async (e) => {
    e.preventDefault();
    if (!updateText || !updateDate) return;
    const newUpdate = { id: `update_${Date.now()}`, date: updateDate, summary: updateText, hours: parseFloat(billableHours) || 0 };
    try {
      await updateDoc(doc(db, 'cases', caseId), { hearingUpdates: arrayUnion(newUpdate) });
      toast({ title: 'Docket updated.', status: 'success' });
      setUpdateText(''); setUpdateDate(''); setBillableHours('');
    } catch (err) { toast({ title: 'Error.', status: 'error' }); }
  };

  // Add IOLTA Transaction
  const handleAddLedger = async (e) => {
    e.preventDefault();
    if (!ledgerDesc || !ledgerAmount) return;
    const newTx = { id: `tx_${Date.now()}`, date: new Date().toISOString(), desc: ledgerDesc, amount: parseFloat(ledgerAmount), type: ledgerType };
    try {
      await updateDoc(doc(db, 'cases', caseId), { trustLedger: arrayUnion(newTx) });
      toast({ title: 'Ledger updated.', status: 'success' });
      setLedgerDesc(''); setLedgerAmount('');
    } catch (err) { toast({ title: 'Error.', status: 'error' }); }
  };

  // Generate AI Executive Brief
  const handleGenerateAiBrief = async () => {
    setGeneratingAi(true); setAiBrief('');
    const fakeSummary = `AI EXECUTIVE BRIEF: Matter ${caseData.caseNumber} involving ${caseData.clientName}. The presiding judge is ${caseData.judgeName || 'unassigned'} with opposing counsel ${caseData.opponentLawyer || 'unassigned'}. Based on recent timeline logs, the case is actively proceeding through discovery phases.`;
    for (let i = 0; i <= fakeSummary.length; i++) {
      await new Promise(r => setTimeout(r, 20));
      setAiBrief(fakeSummary.slice(0, i));
    }
    setGeneratingAi(false);
  };

  // FEATURE 3: Automated Document Assembly (Template Engine)
  const generateDocument = (type) => {
    const docHtml = `
      <html><head><style>
        body { font-family: "Times New Roman", serif; padding: 60px; line-height: 2; max-width: 800px; margin: 0 auto; font-size: 14pt; }
        .center { text-align: center; font-weight: bold; }
      </style></head><body>
        <div class="center">IN THE DISTRICT COURT<br/>IN AND FOR THE STATE</div>
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
          <div style="width: 45%; border-right: 2px solid black; padding-right: 20px;">
            <strong>${caseData.clientName}</strong>, Plaintiff,<br/><br/>v.<br/><br/><strong>${caseData.opponentName || '__________________'}</strong>, Defendant.
          </div>
          <div style="width: 45%; padding-left: 20px;"><strong>Case No.: ${caseData.caseNumber}</strong><br/><strong>Judge: ${caseData.judgeName || '__________________'}</strong></div>
        </div>
        <h2 class="center" style="margin-top: 50px; text-decoration: underline;">${type.toUpperCase()}</h2>
        <p style="text-indent: 40px; margin-top: 30px;">
          COMES NOW the undersigned counsel, and hereby enters an appearance as counsel of record for <strong>${caseData.clientName}</strong> in the above-styled matter. All further pleadings, notices, and correspondence should be directed to the undersigned.
        </p>
        <div style="margin-top: 80px; float: right; width: 300px;">
          ________________________________<br/>
          <strong>${currentUser.email.split('@')[0]}</strong><br/>Lead Counsel for ${caseData.clientName}<br/>Case Closed Law Firm LLC
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `;
    const win = window.open('', '_blank');
    win.document.write(docHtml); win.document.close();
  };

  if (loading) return <Center h="100vh" bg="#F7F5F0"><Spinner size="xl" color="#C9A84C" /></Center>;
  if (!caseData) return null;

  return (
    <Box bg="#F7F5F0" minH="100vh">
      {/* ── Dark Hero Header ── */}
      <Box position="relative" overflow="hidden" bg="#0C0C0C" pt={16} pb={28}>
        <Box position="absolute" inset={0} backgroundImage="linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)" backgroundSize="60px 60px" opacity={0.6} />
        <Container maxW="container.xl" position="relative" zIndex={1} px={{ base: 6, md: 10 }}>
          <Box as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
              <Box>
                <Text fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.2em" textTransform="uppercase" color="#C9A84C" mb={3}>Docket No. {caseData.caseNumber}</Text>
                <Heading fontFamily="'Playfair Display', serif" fontSize={{ base: '4xl', md: '5xl' }} fontWeight="900" color="white" letterSpacing="-0.02em" lineHeight="1.1" mb={4}>{caseData.caseName || caseData.clientName}</Heading>
                <HStack spacing={4}>
                  <Tag size="md" variant="subtle" colorScheme={caseData.status === 'Active' ? 'green' : 'gray'} borderRadius="2px" fontWeight="700">
                    {caseData.status}
                  </Tag>
                  <Text fontFamily="'Syne', sans-serif" fontSize="sm" color="rgba(255,255,255,0.6)">Rep: {caseData.clientName}</Text>
                </HStack>
              </Box>
              
              {/* SOL WARNING ENGINE */}
              {solData && (
                <Box bg={solData.daysLeft < 90 ? 'rgba(220,38,38,0.1)' : 'rgba(201,168,76,0.1)'} border="1px solid" borderColor={solData.daysLeft < 90 ? '#DC2626' : '#C9A84C'} p={4} borderRadius="2px" textAlign="right">
                  <Flex align="center" gap={2} justify="flex-end" mb={1}>
                    <FiAlertTriangle color={solData.daysLeft < 90 ? '#DC2626' : '#C9A84C'} />
                    <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" textTransform="uppercase" color="white">Statute of Limitations</Text>
                  </Flex>
                  <Text fontFamily="'Syne', sans-serif" fontSize="2xl" fontWeight="700" color={solData.daysLeft < 90 ? '#DC2626' : '#C9A84C'}>{solData.daysLeft} Days Left</Text>
                  <Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(255,255,255,0.4)">Expires: {solData.date}</Text>
                </Box>
              )}
            </Flex>
          </Box>
        </Container>
      </Box>

      <Container maxW="container.xl" px={{ base: 6, md: 10 }} mt={-14} position="relative" zIndex={2}>
        {/* TABS NAVIGATION */}
        <Tabs colorScheme="yellow" variant="unstyled">
          <TabList bg="white" p={2} borderRadius="2px" boxShadow="0 2px 10px rgba(0,0,0,0.02)" mb={8} display="inline-flex" flexWrap="wrap">
            <Tab _selected={{ bg: '#0C0C0C', color: 'white' }} fontFamily="'DM Mono', monospace" fontSize="10px" textTransform="uppercase" letterSpacing="0.1em" borderRadius="2px">Docket & Timeline</Tab>
            <Tab _selected={{ bg: '#0C0C0C', color: 'white' }} fontFamily="'DM Mono', monospace" fontSize="10px" textTransform="uppercase" letterSpacing="0.1em" borderRadius="2px">IOLTA Trust Ledger</Tab>
            <Tab _selected={{ bg: '#0C0C0C', color: 'white' }} fontFamily="'DM Mono', monospace" fontSize="10px" textTransform="uppercase" letterSpacing="0.1em" borderRadius="2px">Document Assembly</Tab>
          </TabList>

          <TabPanels>
            {/* TAB 1: DOCKET */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={10}>
                <Box gridColumn={{ lg: 'span 4' }}>
                  <VStack spacing={6} align="stretch">
                    <Box bg="white" p={6} borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px">
                      <Heading fontFamily="'Playfair Display', serif" size="md" color="#0C0C0C" mb={5}>Case Metadata</Heading>
                      <VStack spacing={4} align="start" divider={<Box w="full" h="1px" bg="rgba(0,0,0,0.04)" />}>
                        <Box w="full"><Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.4)" textTransform="uppercase" letterSpacing="0.1em">Presiding Judge</Text><Text fontFamily="'Syne', sans-serif" fontSize="sm" fontWeight="600">{caseData.judgeName || '—'}</Text></Box>
                        <Box w="full"><Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.4)" textTransform="uppercase" letterSpacing="0.1em">Opposing Counsel</Text><Text fontFamily="'Syne', sans-serif" fontSize="sm" fontWeight="600">{caseData.opponentLawyer || '—'}</Text></Box>
                        <Box w="full"><Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.4)" textTransform="uppercase" letterSpacing="0.1em">Total Billable Hours</Text><Text fontFamily="'Syne', sans-serif" fontSize="xl" color="#C9A84C" fontWeight="700">{(totalBilled / HOURLY_RATE).toFixed(1)} hrs</Text></Box>
                      </VStack>
                      <Button mt={6} w="full" onClick={handleGenerateAiBrief} isLoading={generatingAi} loadingText="Analyzing Docs..." bg="rgba(201,168,76,0.1)" color="#C9A84C" _hover={{ bg: 'rgba(201,168,76,0.2)' }} leftIcon={<FiCpu />} fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" textTransform="uppercase">Generate AI Brief</Button>
                      {aiBrief && (
                        <Box mt={4} p={3} bg="#0C0C0C" borderRadius="2px">
                          <Text fontFamily="'DM Mono', monospace" fontSize="10px" color="#C9A84C" mb={1}>// CLASSIFIED AI OUTPUT</Text>
                          <Text fontFamily="'Syne', sans-serif" fontSize="xs" color="rgba(255,255,255,0.8)" lineHeight="1.6">{aiBrief}</Text>
                        </Box>
                      )}
                    </Box>
                    {caseData.status !== 'Closed' && (
                      <Box bg="white" p={6} borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px" as="form" onSubmit={handleAddUpdate}>
                        <Heading fontFamily="'Playfair Display', serif" size="md" color="#0C0C0C" mb={5}>Log Hearing & Time</Heading>
                        <VStack spacing={4}>
                          <FormControl isRequired><FormLabel fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.5)" textTransform="uppercase" letterSpacing="0.1em">Date</FormLabel><Input type="date" value={updateDate} onChange={(e) => setUpdateDate(e.target.value)} {...inp} /></FormControl>
                          <FormControl isRequired><FormLabel fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.5)" textTransform="uppercase" letterSpacing="0.1em">Billable Hours Logged</FormLabel><Input type="number" step="0.1" value={billableHours} onChange={(e) => setBillableHours(e.target.value)} {...inp} placeholder="e.g. 1.5" /></FormControl>
                          <FormControl isRequired><FormLabel fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.5)" textTransform="uppercase" letterSpacing="0.1em">Action Summary</FormLabel><Textarea value={updateText} onChange={(e) => setUpdateText(e.target.value)} rows={3} {...inp} h="auto" py={2} /></FormControl>
                          <Button type="submit" w="full" bg="#0C0C0C" color="white" mt={2} h="40px" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.15em" textTransform="uppercase" borderRadius="2px" _hover={{ bg: '#C9A84C', color: '#0C0C0C' }}>Append to Record</Button>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </Box>
                <Box gridColumn={{ lg: 'span 8' }}>
                  <Box bg="white" p={8} borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px" minH="500px">
                    <Heading fontFamily="'Playfair Display', serif" size="lg" color="#0C0C0C" mb={8}>Official Record</Heading>
                    <CaseTimeline updates={caseData.hearingUpdates} onDeleteUpdate={(u) => updateDoc(doc(db, 'cases', caseId), { hearingUpdates: arrayRemove(u) })} />
                  </Box>
                </Box>
              </SimpleGrid>
            </TabPanel>

            {/* TAB 2: IOLTA LEDGER */}
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} mb={8}>
                <Box bg="#0C0C0C" p={6} borderRadius="2px" color="white">
                  <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" color="rgba(255,255,255,0.5)" textTransform="uppercase">Trust Balance</Text>
                  <Text fontFamily="'Syne', sans-serif" fontSize="4xl" fontWeight="700" color={currentBalance < 0 ? '#DC2626' : '#C9A84C'}>₹{currentBalance.toFixed(2)}</Text>
                </Box>
                <Box bg="white" p={6} borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px">
                  <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" color="rgba(0,0,0,0.4)" textTransform="uppercase">Total Retainer</Text>
                  <Text fontFamily="'Syne', sans-serif" fontSize="3xl" fontWeight="700" color="#2D6A4F">+₹{totalDeposits.toFixed(2)}</Text>
                </Box>
                <Box bg="white" p={6} borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px">
                  <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" color="rgba(0,0,0,0.4)" textTransform="uppercase">Billed + Expenses</Text>
                  <Text fontFamily="'Syne', sans-serif" fontSize="3xl" fontWeight="700" color="#DC2626">-₹{(totalBilled + totalExpenses).toFixed(2)}</Text>
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={10}>
                <Box gridColumn={{ lg: 'span 4' }}>
                  <Box bg="white" p={6} borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px" as="form" onSubmit={handleAddLedger}>
                    <Heading fontFamily="'Playfair Display', serif" size="md" color="#0C0C0C" mb={5}>New Transaction</Heading>
                    <VStack spacing={4}>
                      <FormControl isRequired><FormLabel fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.5)" textTransform="uppercase" letterSpacing="0.1em">Type</FormLabel><Select value={ledgerType} onChange={(e) => setLedgerType(e.target.value)} {...inp}><option value="Deposit">Retainer Deposit</option><option value="Expense">Hard Cost / Expense</option></Select></FormControl>
                      <FormControl isRequired><FormLabel fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.5)" textTransform="uppercase" letterSpacing="0.1em">Amount (₹)</FormLabel><Input type="number" step="0.01" value={ledgerAmount} onChange={(e) => setLedgerAmount(e.target.value)} {...inp} /></FormControl>
                      <FormControl isRequired><FormLabel fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.5)" textTransform="uppercase" letterSpacing="0.1em">Description</FormLabel><Input value={ledgerDesc} onChange={(e) => setLedgerDesc(e.target.value)} {...inp} placeholder="e.g. Filing Fee" /></FormControl>
                      <Button type="submit" w="full" bg="#0C0C0C" color="white" mt={2} h="40px" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.15em" textTransform="uppercase" borderRadius="2px" leftIcon={<FiDollarSign />} _hover={{ bg: '#C9A84C', color: '#0C0C0C' }}>Record Transaction</Button>
                    </VStack>
                  </Box>
                </Box>
                <Box gridColumn={{ lg: 'span 8' }} bg="white" borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px" overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg="rgba(0,0,0,0.02)">
                      <Tr>
                        <Th fontFamily="'DM Mono', monospace" fontSize="10px">Date</Th><Th fontFamily="'DM Mono', monospace" fontSize="10px">Description</Th><Th fontFamily="'DM Mono', monospace" fontSize="10px">Type</Th><Th fontFamily="'DM Mono', monospace" fontSize="10px" isNumeric>Amount</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(caseData.trustLedger || []).map((t, i) => (
                        <Tr key={i}>
                          <Td fontFamily="'Syne', sans-serif" fontSize="13px">{new Date(t.date).toLocaleDateString()}</Td>
                          <Td fontFamily="'Syne', sans-serif" fontSize="13px">{t.desc}</Td>
                          <Td><Tag size="sm" colorScheme={t.type === 'Deposit' ? 'green' : 'red'}>{t.type}</Tag></Td>
                          <Td isNumeric fontFamily="'DM Mono', monospace" fontSize="13px">₹{t.amount.toFixed(2)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </SimpleGrid>
            </TabPanel>

            {/* TAB 3: DOCUMENT ASSEMBLY */}
            <TabPanel p={0}>
              <Box bg="white" p={10} borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px" textAlign="center">
                <Heading fontFamily="'Playfair Display', serif" size="lg" color="#0C0C0C" mb={4}>Template Engine</Heading>
                <Text fontFamily="'Syne', sans-serif" color="gray.500" mb={8} maxW="500px" mx="auto">Automatically generate perfectly formatted legal pleadings injected with current case metadata.</Text>
                <HStack justify="center" spacing={4} flexWrap="wrap">
                  <Button onClick={() => generateDocument('Notice of Appearance')} bg="#0C0C0C" color="white" h="50px" px={8} fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.1em" textTransform="uppercase" borderRadius="2px" leftIcon={<FiPrinter />} _hover={{ bg: '#C9A84C', color: '#0C0C0C' }} mb={{ base: 2, md: 0 }}>
                    Generate Notice of Appearance
                  </Button>
                  <Button onClick={() => generateDocument('Subpoena Duces Tecum')} bg="white" color="#0C0C0C" border="1px solid rgba(0,0,0,0.1)" h="50px" px={8} fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.1em" textTransform="uppercase" borderRadius="2px" leftIcon={<FiPrinter />} _hover={{ bg: 'rgba(0,0,0,0.05)' }}>
                    Generate Subpoena
                  </Button>
                </HStack>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
}
export default CaseDetails;