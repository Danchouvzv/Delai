import React from 'react';
import { Box, Flex, Heading, Text, Button, useColorModeValue, Icon } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface HeaderSectionProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonIcon?: IconType;
  onButtonClick?: () => void;
  gradient?: 'primary' | 'accent' | 'info';
  align?: 'left' | 'center' | 'right';
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  description,
  buttonText,
  buttonIcon,
  onButtonClick,
  gradient = 'primary',
  align = 'left',
}) => {
  // Define gradients for different styles
  const gradients = {
    primary: 'linear(to-r, orange.400, purple.500)',
    accent: 'linear(to-r, orange.400, amber.500)',
    info: 'linear(to-r, cyan.400, blue.500)',
  };

  const textColor = useColorModeValue('gray.700', 'gray.200');
  const textAlign = align;

  return (
    <Box mb={8}>
      <Flex direction="column" align={align} textAlign={textAlign}>
        <Heading
          fontSize="2xl"
          fontWeight="bold"
          mb={2}
          bgGradient={gradients[gradient]}
          bgClip="text"
          display="inline-block"
          position="relative"
          _after={{
            content: '""',
            position: 'absolute',
            bottom: '-4px',
            left: align === 'center' ? '35%' : align === 'right' ? '65%' : '0',
            width: '30%',
            height: '3px',
            bgGradient: gradients[gradient],
            borderRadius: 'full',
          }}
        >
          {title}
        </Heading>

        {description && (
          <Text color={textColor} fontSize="md" maxW="600px" mt={1}>
            {description}
          </Text>
        )}

        {buttonText && (
          <Button
            variant={gradient === 'primary' ? 'solid' : gradient === 'accent' ? 'outline' : 'ghost'}
            colorScheme={gradient === 'primary' ? 'purple' : gradient === 'accent' ? 'orange' : 'blue'}
            size="md"
            rightIcon={buttonIcon && <Icon as={buttonIcon} />}
            onClick={onButtonClick}
            mt={4}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
            aria-label={buttonText}
          >
            {buttonText}
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default HeaderSection; 