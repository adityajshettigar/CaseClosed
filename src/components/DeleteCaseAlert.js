import React, { useState } from 'react';
import {
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, Button, useToast, Text, Box
} from '@chakra-ui/react';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

function DeleteCaseAlert({ isOpen, onClose, caseId, caseName }) {
  const cancelRef = React.useRef();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'cases', caseId));
      setIsLoading(false);
      onClose();
      toast({ title: 'Case archived.', status: 'info', duration: 3000, position: 'bottom-right' });
    } catch (err) {
      toast({ title: 'Error archiving case.', status: 'error', duration: 3000 });
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered motionPreset="slideInBottom">
      <AlertDialogOverlay bg="rgba(5,5,5,0.82)" backdropFilter="blur(14px)" />
      <AlertDialogContent bg="white" borderRadius="2px" boxShadow="0 32px 80px rgba(0,0,0,0.24), 0 0 0 1px rgba(0,0,0,0.06)" p={2}>
        
        <AlertDialogHeader pt={6} pb={2} px={6}>
          <Text fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.2em" textTransform="uppercase" color="#DC2626" mb={2}>
            Destructive Action
          </Text>
          <Text fontFamily="'Playfair Display', serif" fontSize="2xl" fontWeight="900" color="#0C0C0C" letterSpacing="-0.02em">
            Archive this matter?
          </Text>
        </AlertDialogHeader>

        <AlertDialogBody px={6} py={4}>
          <Text fontFamily="'Syne', sans-serif" fontSize="sm" color="rgba(12,12,12,0.6)" lineHeight="1.6">
            You are about to permanently archive the case for <Box as="span" fontWeight="700" color="#0C0C0C">{caseName}</Box>. This will remove all associated hearing timelines from your active directory. This action cannot be undone.
          </Text>
        </AlertDialogBody>

        <AlertDialogFooter px={6} pb={6} pt={4}>
          <Button ref={cancelRef} onClick={onClose} isDisabled={isLoading} variant="ghost" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.15em" textTransform="uppercase" color="rgba(12,12,12,0.4)" borderRadius="2px" _hover={{ bg: 'rgba(0,0,0,0.05)', color: '#0C0C0C' }} h="40px" px={5}>
            Cancel
          </Button>
          <Button colorScheme="red" onClick={handleDelete} isLoading={isLoading} ml={3} bg="#DC2626" color="white" fontFamily="'DM Mono', monospace" fontSize="9px" letterSpacing="0.15em" textTransform="uppercase" borderRadius="2px" _hover={{ bg: '#B91C1C', transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(220,38,38,0.3)' }} _active={{ transform: 'translateY(0)' }} h="40px" px={6}>
            Archive Matter
          </Button>
        </AlertDialogFooter>

      </AlertDialogContent>
    </AlertDialog>
  );
}
export default DeleteCaseAlert;