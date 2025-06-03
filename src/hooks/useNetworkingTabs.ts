// Вынесем массив tabs за пределы хука для стабильной ссылки
export const NETWORKING_TABS: TabDefinition[] = [
  { id: 'recommended', label: 'Рекомендации' },
  { id: 'profile', label: 'Мой профиль' },
  { id: 'create-project', label: 'Создать проект' },
  { id: 'projects', label: 'Все проекты' },
];

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, createSearchParams } from 'react-router-dom';

export type NetworkingTab = 'recommended' | 'profile' | 'create-project' | 'projects';

interface TabDefinition {
  id: NetworkingTab;
  label: string;
}

interface UseNetworkingTabsReturn {
  tabs: TabDefinition[];
  currentTab: NetworkingTab;
  selectTab: (tabId: NetworkingTab) => void;
}

/**
 * Hook for managing networking tabs with URL synchronization
 * @param initialTab - The default tab to show if none is specified in URL
 * @returns Object with tabs array, current tab, and function to select a tab
 */
export function useNetworkingTabs(initialTab: NetworkingTab = 'recommended'): UseNetworkingTabsReturn {
  const navigate = useNavigate();
  const location = useLocation();

  // State for the current active tab
  const [currentTab, setCurrentTab] = useState<NetworkingTab>(initialTab);

  // Sync with URL query parameter on mount and when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as NetworkingTab | null;
    
    if (tabParam && NETWORKING_TABS.some(t => t.id === tabParam)) {
      setCurrentTab(tabParam);
    } else if (tabParam) {
      // Если параметр существует, но невалидный - сбрасываем на initialTab
      setCurrentTab(initialTab);
      // Обновляем URL
      navigate({
        pathname: location.pathname,
        search: createSearchParams({ tab: initialTab }).toString(),
      }, { replace: true });
    }
  }, [location.search, navigate, initialTab, location.pathname]);

  // Function to programmatically select a tab
  const selectTab = useCallback(
    (tabId: NetworkingTab) => {
      if (tabId === currentTab) return;
      
      setCurrentTab(tabId);
      
      // Update URL query parameter without page reload
      navigate({
        pathname: location.pathname,
        search: createSearchParams({ tab: tabId }).toString(),
      });
    },
    [currentTab, navigate, location.pathname]
  );

  return { tabs: NETWORKING_TABS, currentTab, selectTab };
}

export default useNetworkingTabs; 