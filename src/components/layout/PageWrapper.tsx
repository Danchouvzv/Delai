import React from 'react';
import { Box, Container, useColorModeValue } from '@chakra-ui/react';

interface PageWrapperProps {
  children: React.ReactNode;
  bgGradient?: string;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children,
  bgGradient,
}) => {
  const defaultBgGradient = useColorModeValue(
    'linear(to-br, orange.50, purple.50, cyan.50)',
    'linear(to-br, gray.800, gray.900)'
  );

  return (
    <Box 
      bgGradient={bgGradient || defaultBgGradient} 
      minH="100vh" 
      py={{ base: 6, md: 10 }} 
      px={{ base: 4, md: 6, lg: 8 }}
    >
      <Container maxW="1200px">
        {children}
      </Container>
    </Box>
  );
};

export default PageWrapper; 