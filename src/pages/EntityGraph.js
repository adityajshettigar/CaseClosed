import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Box, Container, Heading, Text, Spinner, Center, InputGroup, InputLeftElement, Input, VStack, HStack } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import ForceGraph2D from 'react-force-graph-2d';

// Centralized Node Types for Legend & Graph
const NODE_TYPES = [
  { id: 'Self', color: '#D4AF37', label: 'Your Firm' },
  { id: 'Client', color: '#4CAF50', label: 'Client' },
  { id: 'Opponent', color: '#F44336', label: 'Opposing Party' },
  { id: 'Opposing Counsel', color: '#FF9800', label: 'Opposing Counsel' },
  { id: 'Judge', color: '#2196F3', label: 'Judge / Arbitrator' },
];

function EntityGraph() {
  const { currentUser } = useAuth();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Interactive States
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Fetch & Build Graph Data
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'cases'), where('lawyerId', '==', currentUser.uid));
    
    const unsub = onSnapshot(q, (snap) => {
      const nodesMap = new Map();
      const links = [];

      const addNode = (id, group, color) => {
        if (!id) return;
        const cleanId = id.trim();
        if (!nodesMap.has(cleanId)) {
          nodesMap.set(cleanId, { id: cleanId, group, color, val: 1, neighbors: new Set(), links: [] });
        } else {
          nodesMap.get(cleanId).val += 0.5; // Grow node if it appears multiple times
        }
      };

      const myLawyerId = currentUser.email.split('@')[0];
      addNode(myLawyerId, 'Self', NODE_TYPES.find(n => n.id === 'Self').color);

      snap.docs.forEach(doc => {
        const data = doc.data();
        
        if (data.clientName) addNode(data.clientName, 'Client', NODE_TYPES.find(n => n.id === 'Client').color);
        if (data.opponentName) addNode(data.opponentName, 'Opponent', NODE_TYPES.find(n => n.id === 'Opponent').color);
        if (data.opponentLawyer) addNode(data.opponentLawyer, 'Opposing Counsel', NODE_TYPES.find(n => n.id === 'Opposing Counsel').color);
        if (data.judgeName) addNode(data.judgeName, 'Judge', NODE_TYPES.find(n => n.id === 'Judge').color);

        const createLink = (source, target) => {
          if (!source || !target) return;
          const s = source.trim(); const t = target.trim();
          const link = { source: s, target: t };
          links.push(link);
          // Store neighbor relationships for hover highlighting
          if(nodesMap.has(s) && nodesMap.has(t)){
            nodesMap.get(s).neighbors.add(t);
            nodesMap.get(t).neighbors.add(s);
            nodesMap.get(s).links.push(link);
            nodesMap.get(t).links.push(link);
          }
        };

        createLink(myLawyerId, data.clientName);
        createLink(data.clientName, data.opponentName);
        createLink(data.opponentName, data.opponentLawyer);
        createLink(myLawyerId, data.judgeName);
      });

      setGraphData({ nodes: Array.from(nodesMap.values()), links });
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  // Handle Search Filtering
  useEffect(() => {
    if (!searchQuery) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }
    const queryLower = searchQuery.toLowerCase();
    const matchedNodes = graphData.nodes.filter(n => n.id.toLowerCase().includes(queryLower));
    
    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    matchedNodes.forEach(node => {
      newHighlightNodes.add(node.id);
      node.neighbors.forEach(neighbor => newHighlightNodes.add(neighbor));
      node.links.forEach(link => newHighlightLinks.add(link));
    });

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, [searchQuery, graphData]);

  const handleNodeHover = node => {
    setHoverNode(node || null);
    if (searchQuery) return; // Don't override search highlights with hover

    const newHighlightNodes = new Set();
    const newHighlightLinks = new Set();

    if (node) {
      newHighlightNodes.add(node.id);
      node.neighbors.forEach(neighbor => newHighlightNodes.add(neighbor));
      node.links.forEach(link => newHighlightLinks.add(link));
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  };

  const paintNode = useCallback((node, ctx, globalScale) => {
    const label = node.id;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px "DM Mono", monospace`;
    
    // Dim logic
    const isHighlighted = highlightNodes.has(node.id);
    const isDimmed = (hoverNode || searchQuery) && !isHighlighted;
    
    ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.1)' : node.color;
    ctx.beginPath(); 
    ctx.arc(node.x, node.y, node.val * 4, 0, 2 * Math.PI, false); 
    ctx.fill();
    
    // Add glow to hovered/searched node
    if (node === hoverNode || (searchQuery && node.id.toLowerCase().includes(searchQuery.toLowerCase()))) {
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }

    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDimmed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
    ctx.fillText(label, node.x, node.y + (node.val * 4) + (8 / globalScale));
  }, [hoverNode, highlightNodes, searchQuery]);

  if (loading) return <Center h="100vh" bg="#0C0C0C"><Spinner size="xl" color="#C9A84C" /></Center>;

  return (
    <Box bg="#0C0C0C" minH="100vh" pt={16} overflow="hidden" position="relative">
      
      {/* Header */}
      <Container maxW="container.xl" px={{ base: 6, md: 10 }} position="relative" zIndex={10}>
        <Box mb={6}>
          <Text fontFamily="'DM Mono', monospace" fontSize="10px" letterSpacing="0.2em" textTransform="uppercase" color="#C9A84C" mb={2}>Intelligence Graph</Text>
          <Heading fontFamily="'Playfair Display', serif" fontSize={{ base: '3xl', md: '5xl' }} fontWeight="900" color="white" letterSpacing="-0.02em">Conflict Check & Entity Map.</Heading>
          <Text fontFamily="'Syne', sans-serif" fontSize="md" color="rgba(255,255,255,0.5)" mt={2}>Visualizing intersections between clients, opposing counsel, and judges.</Text>
        </Box>
      </Container>

      <Box ref={containerRef} w="full" h="calc(100vh - 160px)" borderTop="1px solid rgba(255,255,255,0.05)" mt={4} position="relative">
        
        {/* Floating Search Bar */}
        <Box position="absolute" top={6} left={10} zIndex={10} w="300px">
          <InputGroup>
            <InputLeftElement pointerEvents="none"><SearchIcon color="rgba(255,255,255,0.4)" boxSize={3}/></InputLeftElement>
            <Input 
              placeholder="Search entities to find conflicts..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              bg="rgba(12,12,12,0.6)" backdropFilter="blur(10px)"
              color="white" borderRadius="2px" borderColor="rgba(255,255,255,0.1)"
              fontFamily="'Syne', sans-serif" fontSize="12px"
              _focus={{ borderColor: '#C9A84C', boxShadow: 'none' }}
            />
          </InputGroup>
        </Box>

        {/* Floating Legend HUD */}
        <Box position="absolute" bottom={10} left={10} zIndex={10} bg="rgba(12,12,12,0.7)" backdropFilter="blur(10px)" border="1px solid rgba(255,255,255,0.05)" borderRadius="2px" p={5}>
          <Text fontFamily="'DM Mono', monospace" fontSize="9px" color="rgba(255,255,255,0.4)" letterSpacing="0.15em" textTransform="uppercase" mb={4}>
            Entity Classification
          </Text>
          <VStack align="start" spacing={3}>
            {NODE_TYPES.map(type => (
              <HStack key={type.id} spacing={3}>
                <Box w="8px" h="8px" borderRadius="full" bg={type.color} boxShadow={`0 0 8px ${type.color}80`} />
                <Text fontFamily="'Syne', sans-serif" fontSize="11px" color="rgba(255,255,255,0.8)" fontWeight="500">
                  {type.label}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* The 2D Graph */}
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="id"
          nodeRelSize={6}
          linkColor={link => highlightLinks.has(link) ? '#C9A84C' : 'rgba(255,255,255,0.05)'}
          linkWidth={link => highlightLinks.has(link) ? 2 : 1}
          linkDirectionalParticles={link => highlightLinks.has(link) ? 4 : 0}
          linkDirectionalParticleWidth={2}
          onNodeHover={handleNodeHover}
          nodeCanvasObject={paintNode}
          backgroundColor="#0C0C0C"
        />
      </Box>
    </Box>
  );
}

export default EntityGraph;