import React from 'react';
import { HStack, Button, useColorModeValue, Icon } from '@chakra-ui/react';
import { NetworkingTab } from '../../hooks/useNetworkingTabs';
import { FaStar, FaUserAlt, FaPlusCircle, FaClipboardList } from 'react-icons/fa';

interface NetworkingTabsProps {
  tabs: { id: NetworkingTab; label: string }[];
  currentTab: NetworkingTab;
  onTabChange: (tab: NetworkingTab) => void;
}

const NetworkingTabs: React.FC<NetworkingTabsProps> = ({ 
  tabs, 
  currentTab, 
  onTabChange 
}) => {
  // Get appropriate icon for each tab
  const getTabIcon = (tabId: NetworkingTab) => {
    switch (tabId) {
      case 'recommended':
        return <Icon as={FaStar} />;
      case 'profile':
        return <Icon as={FaUserAlt} />;
      case 'create-project':
        return <Icon as={FaPlusCircle} />;
      case 'projects':
        return <Icon as={FaClipboardList} />;
      default:
        return null;
    }
  };

  // Colors for the tabs
  const activeColor = useColorModeValue('orange.500', 'orange.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <HStack 
      spacing={4} 
      overflowX="auto" 
      py={2} 
      mb={8}
      css={{
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'),
          borderRadius: '4px',
        }
      }}
    >
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          size="md"
          colorScheme={currentTab === tab.id ? 'orange' : 'gray'}
          variant={currentTab === tab.id ? 'solid' : 'outline'}
          leftIcon={getTabIcon(tab.id)}
          onClick={() => onTabChange(tab.id)}
          flexShrink={0}
          borderRadius="full"
          _hover={{
            transform: 'translateY(-2px)',
            shadow: 'md',
          }}
          transition="all 0.2s"
        >
          {tab.label}
        </Button>
      ))}
    </HStack>
  );
};

export default NetworkingTabs; 