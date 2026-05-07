import React from 'react';
import { Box, Flex, Text, VStack, Link, IconButton } from '@chakra-ui/react';
import { FiFileText, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';

function CaseTimeline({ updates, onDeleteUpdate }) {
  if (!updates || updates.length === 0) {
    return (
      <Box p={8} border="1px dashed rgba(0,0,0,0.1)" borderRadius="2px" bg="rgba(0,0,0,0.01)" textAlign="center">
        <Text fontFamily="'DM Mono', monospace" fontSize="10px" color="rgba(12,12,12,0.4)" letterSpacing="0.1em" textTransform="uppercase">No hearing updates recorded.</Text>
      </Box>
    );
  }
  const sortedUpdates = [...updates].sort((a, b) => new Date(b.date) - new Date(a.date));
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVars = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300 } } };

  return (
    <VStack as={motion.div} variants={containerVars} initial="hidden" animate="show" spacing={0} align="stretch" pos="relative" pt={2}>
      <Box pos="absolute" left="15px" top="10px" bottom="20px" width="1px" bg="rgba(201,168,76,0.4)" zIndex={1} />
      {sortedUpdates.map((update) => (
        <Flex as={motion.div} variants={itemVars} key={update.id} pos="relative" zIndex={2} mb={8}>
          <Flex w="32px" h="32px" bg="#F7F5F0" border="1px solid #C9A84C" borderRadius="full" align="center" justify="center" mr={5} flexShrink={0} mt={1}>
            <Box w="6px" h="6px" bg="#C9A84C" borderRadius="full" />
          </Flex>
          <Box flex="1" bg="white" p={5} borderWidth="1px" borderColor="rgba(0,0,0,0.06)" borderRadius="2px" boxShadow="0 2px 8px rgba(0,0,0,0.02)" _hover={{ boxShadow: '0 8px 24px rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.1)' }} transition="all 0.2s" role="group">
            <Flex justify="space-between" align="flex-start" mb={2}>
              <Box>
                <Text fontFamily="'DM Mono', monospace" fontSize="9px" color="#C9A84C" letterSpacing="0.14em" textTransform="uppercase" mb={1}>Hearing Record</Text>
                <Text fontFamily="'Playfair Display', serif" fontWeight="700" fontSize="lg" color="#0C0C0C">{new Date(update.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </Box>
              <IconButton icon={<FiTrash2 />} size="xs" variant="ghost" color="rgba(12,12,12,0.2)" _groupHover={{ color: '#DC2626', bg: 'rgba(220,38,38,0.06)' }} onClick={() => onDeleteUpdate(update)} aria-label="Delete update" />
            </Flex>
            <Text fontFamily="'Syne', sans-serif" fontSize="sm" color="rgba(12,12,12,0.7)" lineHeight="1.6" mt={3}>{update.summary}</Text>
            {update.fileURL && (
              <Link href={update.fileURL} isExternal display="inline-flex" alignItems="center" mt={4} p={2} bg="rgba(0,0,0,0.03)" borderRadius="2px" _hover={{ bg: 'rgba(201,168,76,0.1)', textDecoration: 'none' }} transition="all 0.2s">
                <FiFileText color="#C9A84C" style={{ marginRight: '8px' }} />
                <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.08em" color="#0C0C0C" fontWeight="600">{update.fileName || 'View Attached Document'}</Text>
              </Link>
            )}
          </Box>
        </Flex>
      ))}
    </VStack>
  );
}
export default CaseTimeline;