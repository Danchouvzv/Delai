import React from 'react';
import {
  Box,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Flex,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';

/**
 * Skeleton component for project card loading state
 */
const SkeletonProjectCard: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={cardBorder}
      overflow="hidden"
      bg={cardBg}
      boxShadow="sm"
      p={5}
      height="100%"
    >
      <Flex align="center" mb={4}>
        <SkeletonCircle size="8" mr={2} />
        <Skeleton height="14px" width="120px" />
        <Box flex={1} />
        <Skeleton height="24px" width="24px" borderRadius="md" />
      </Flex>
      
      <Skeleton height="24px" width="80%" mb={2} />
      
      <SkeletonText mt={2} noOfLines={3} spacing="4" mb={4} />
      
      <HStack spacing={2} mb={4} flexWrap="wrap">
        <Skeleton height="20px" width="60px" borderRadius="full" />
        <Skeleton height="20px" width="80px" borderRadius="full" />
        <Skeleton height="20px" width="70px" borderRadius="full" />
      </HStack>
      
      <Flex align="center" justify="space-between" mt={2}>
        <HStack>
          <Skeleton height="20px" width="60px" borderRadius="md" />
          <Skeleton height="20px" width="80px" borderRadius="md" />
        </HStack>
        
        <Skeleton height="24px" width="80px" borderRadius="md" />
      </Flex>
    </Box>
  );
};

export default SkeletonProjectCard; 