import React from 'react';
import { Box } from '@chakra-ui/react';
import { NetworkingTab } from '../../hooks/useNetworkingTabs';
import NetworkingProfile from '../../components/NetworkingProfile';
import CreateProject from '../../components/CreateProject';
import RecommendedProjects from '../../components/RecommendedProjects';
import AllProjectsTab from './AllProjectsTab';

interface TabsContentWrapperProps {
  currentTab: NetworkingTab;
  onApplyToProject?: (projectId: string) => void;
}

/**
 * Component for rendering content based on the selected tab
 */
const TabsContentWrapper: React.FC<TabsContentWrapperProps> = ({ 
  currentTab,
  onApplyToProject 
}) => {
  // Render content based on the current tab
  const renderContent = () => {
    switch (currentTab) {
      case 'recommended':
        return <RecommendedProjects onApply={onApplyToProject} />;
      case 'profile':
        return <NetworkingProfile />;
      case 'create-project':
        return <CreateProject />;
      case 'projects':
        return <AllProjectsTab onApplyToProject={onApplyToProject} />;
      default:
        return null;
    }
  };

  return (
    <Box mb={10}>
      {renderContent()}
    </Box>
  );
};

export default TabsContentWrapper; 