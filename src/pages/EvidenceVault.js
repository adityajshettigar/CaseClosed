import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  Box, Container, Heading, Text, VStack, InputGroup, InputLeftElement, Input, 
  Flex, Icon, Progress, SimpleGrid, Tag, useToast, Center, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Button
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiUploadCloud, FiFileText, FiCpu, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

function EvidenceVault() {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const toast = useToast();

  // Modal State for reading full text
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'evidence'), where('lawyerId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [currentUser]);

  const runSimulatedOCR = async (file) => {
    setUploading(true);
    setOcrStatus('Securing connection...'); setOcrProgress(20);
    await new Promise(r => setTimeout(r, 800));
    setOcrStatus('Running Vision AI OCR...'); setOcrProgress(50);
    await new Promise(r => setTimeout(r, 1200));
    setOcrStatus('Extracting named entities...'); setOcrProgress(80);
    await new Promise(r => setTimeout(r, 800));
    setOcrStatus('Indexing database...'); setOcrProgress(100);
    
    // Simulating a much longer text extraction to test the modal
    const mockText = `EXTRACTED TEXT [CONFIDENTIAL]: This document pertains to the matter of ${file.name.replace('.pdf', '')}. \n\nAll relevant disclosures must be submitted immediately. Pursuant to Section 4(a) of the discovery agreement, opposing counsel has requested an extension for financial records. The presiding judge has noted that failure to comply by the end of the quarter will result in sanctions.\n\nKey Entities Identified:\n- Plaintiff: John Doe\n- Defendant: Jane Smith\n- Firm: Case Closed LLC\n\nAutomated risk assessment flagged potential statute of limitations expiring within 90 days. Please review associated trust ledgers to ensure sufficient retainer balances for upcoming deposition costs.`;

    await addDoc(collection(db, 'evidence'), {
      fileName: file.name, 
      fileUrl: '#', 
      extractedText: mockText,
      lawyerId: currentUser.uid, 
      createdAt: Timestamp.now()
    });

    setUploading(false);
    toast({ title: 'Indexed.', status: 'success', position: 'bottom-right' });
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    try {
      await runSimulatedOCR(file);
    } catch (err) {
      toast({ title: 'Error processing.', status: 'error' }); setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg']} });
  const filteredDocs = documents.filter(d => d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || d.extractedText.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenDoc = (doc) => {
    setSelectedDoc(doc);
    onOpen();
  };

  return (
    <Box bg="#F7F5F0" minH="100vh" pt={16} pb={20}>
      <Container maxW="container.xl" px={{ base: 6, md: 10 }}>
        
        {/* Header Area */}
        <Flex justify="space-between" align="end" mb={10} wrap="wrap" gap={6}>
          <Box>
            <Text fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.2em" textTransform="uppercase" color="#C9A84C" mb={2}>Intelligence & Discovery</Text>
            <Heading fontFamily="'Playfair Display', serif" fontSize={{ base: '3xl', md: '5xl' }} fontWeight="900" color="#0C0C0C" letterSpacing="-0.02em">Evidence Vault.</Heading>
          </Box>
          <InputGroup w={{ base: 'full', md: '400px' }}>
            <InputLeftElement pointerEvents="none"><SearchIcon color="rgba(12,12,12,0.3)" /></InputLeftElement>
            <Input placeholder="Deep search OCR text & files..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} bg="white" borderRadius="2px" borderColor="rgba(0,0,0,0.1)" fontFamily="'Syne', sans-serif" _focus={{ borderColor: '#C9A84C', boxShadow: '0 0 0 2px rgba(201,168,76,0.15)' }} />
          </InputGroup>
        </Flex>

        {/* Dropzone */}
        <Box {...getRootProps()} bg={isDragActive ? 'rgba(201,168,76,0.05)' : 'white'} border="1px dashed" borderColor={isDragActive ? '#C9A84C' : 'rgba(0,0,0,0.15)'} borderRadius="2px" p={10} mb={12} cursor="pointer" transition="all 0.2s" _hover={{ bg: 'rgba(201,168,76,0.02)', borderColor: '#C9A84C' }}>
          <input {...getInputProps()} />
          <Center flexDirection="column" gap={4}>
            <Icon as={uploading ? FiCpu : FiUploadCloud} boxSize={10} color={uploading ? '#C9A84C' : "rgba(12,12,12,0.3)"} />
            {!uploading ? (
              <><Text fontFamily="'Playfair Display', serif" fontSize="xl" fontWeight="700" color="#0C0C0C">Drop documents for AI processing</Text><Text fontFamily="'DM Mono', monospace" fontSize="10px" color="rgba(12,12,12,0.4)" textTransform="uppercase" letterSpacing="0.1em">PDF, JPG, PNG up to 50MB</Text></>
            ) : (
              <VStack w="full" maxW="400px" spacing={4}>
                <Text fontFamily="'DM Mono', monospace" fontSize="10px" color="#C9A84C" textTransform="uppercase" letterSpacing="0.1em">{ocrStatus}</Text>
                <Progress value={ocrProgress} w="full" size="xs" colorScheme="yellow" bg="rgba(0,0,0,0.05)" />
              </VStack>
            )}
          </Center>
        </Box>

        {/* Document Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <AnimatePresence>
            {filteredDocs.map(doc => (
              <Box 
                as={motion.div} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={doc.id} 
                bg="white" borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px" p={6} 
                boxShadow="0 2px 8px rgba(0,0,0,0.02)" cursor="pointer" transition="all 0.2s"
                _hover={{ boxShadow: '0 8px 24px rgba(0,0,0,0.06)', borderColor: '#C9A84C', transform: 'translateY(-2px)' }}
                onClick={() => handleOpenDoc(doc)}
              >
                <Flex justify="space-between" align="start" mb={4}>
                  <Icon as={FiFileText} color="#C9A84C" boxSize={5} />
                  <Tag size="sm" variant="subtle" colorScheme="green" borderRadius="2px"><Icon as={FiCheckCircle} mr={1}/> OCR Indexed</Tag>
                </Flex>
                <Heading fontFamily="'Syne', sans-serif" fontSize="md" color="#0C0C0C" mb={3} noOfLines={1}>{doc.fileName}</Heading>
                <Box bg="#F7F5F0" p={4} borderRadius="2px" borderLeft="2px solid #C9A84C">
                  <Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(12,12,12,0.4)" textTransform="uppercase" letterSpacing="0.1em" mb={2}>Extracted Text</Text>
                  {/* Truncated view for the grid card */}
                  <Text fontFamily="'Syne', sans-serif" fontSize="xs" color="rgba(12,12,12,0.6)" noOfLines={4} lineHeight="1.6">"{doc.extractedText}"</Text>
                </Box>
                <Button size="xs" variant="outline" mt={4} w="full" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.1em" textTransform="uppercase" borderColor="rgba(0,0,0,0.1)" _hover={{ bg: 'rgba(201,168,76,0.05)', borderColor: '#C9A84C', color: '#C9A84C' }}>
                  Open Document
                </Button>
              </Box>
            ))}
          </AnimatePresence>
        </SimpleGrid>

        {/* ── Document Reading Modal ── */}
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside" isCentered motionPreset="slideInBottom">
          <ModalOverlay bg="rgba(5,5,5,0.82)" backdropFilter="blur(14px)" />
          <ModalContent bg="#F7F5F0" borderRadius="2px" boxShadow="0 32px 80px rgba(0,0,0,0.24), 0 0 0 1px rgba(0,0,0,0.06)" mx={4}>
            
            <ModalHeader borderBottom="1px solid rgba(0,0,0,0.06)" pb={5} pt={8} px={8} bg="white">
              <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.2em" textTransform="uppercase" color="#C9A84C" mb={2}>
                Document Analysis
              </Text>
              <Heading fontFamily="'Playfair Display', serif" fontSize="2xl" fontWeight="900" color="#0C0C0C" letterSpacing="-0.02em">
                {selectedDoc?.fileName}
              </Heading>
            </ModalHeader>
            <ModalCloseButton mt={5} mr={4} />
            
            <ModalBody p={8}>
              <Box bg="white" p={8} borderRadius="2px" border="1px solid rgba(0,0,0,0.06)" boxShadow="0 2px 8px rgba(0,0,0,0.02)">
                <Flex align="center" gap={2} mb={6} pb={4} borderBottom="1px dashed rgba(0,0,0,0.1)">
                  <Icon as={FiCheckCircle} color="green.500" />
                  <Text fontFamily="'DM Mono', monospace" fontSize="10px" color="rgba(12,12,12,0.4)" textTransform="uppercase" letterSpacing="0.1em">
                    Vision AI Extraction Complete
                  </Text>
                </Flex>
                
                {/* Full text view with preserved line breaks */}
                <Text fontFamily="'Syne', sans-serif" fontSize="sm" color="rgba(12,12,12,0.8)" lineHeight="1.8" whiteSpace="pre-wrap">
                  {selectedDoc?.extractedText}
                </Text>
              </Box>
            </ModalBody>

          </ModalContent>
        </Modal>

      </Container>
    </Box>
  );
}

export default EvidenceVault;