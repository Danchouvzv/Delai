import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Box, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Box
      role="alert"
      p={8}
      textAlign="center"
      maxW="600px"
      mx="auto"
      my={12}
      borderRadius="xl"
      boxShadow="lg"
      bg="white"
      _dark={{ bg: 'gray.800' }}
    >
      <VStack spacing={4}>
        <Icon as={FaExclamationTriangle} color="red.500" boxSize={12} />
        <Heading size="lg" mb={2}>
          Что-то пошло не так 😕
        </Heading>
        <Text mb={4} color="gray.600" _dark={{ color: 'gray.300' }}>
          {error.message || 'Произошла непредвиденная ошибка'}
        </Text>
        <Button
          onClick={resetErrorBoundary}
          colorScheme="red"
          size="lg"
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
          transition="all 0.2s"
        >
          Попробовать снова
        </Button>
      </VStack>
    </Box>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app here
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary; 