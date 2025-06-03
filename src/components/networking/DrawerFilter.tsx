import React, { useState, useEffect } from 'react';
import {
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  Button, VStack, Checkbox, Select, Text, Divider, FormControl, FormLabel,
  CheckboxGroup, Stack, useColorModeValue
} from '@chakra-ui/react';
import { UseAllProjectsParams } from '../../hooks/useAllProjects';

// Доступные теги (в реальном приложении можно загружать из Firestore)
const AVAILABLE_TAGS = ['React', 'Node.js', 'TypeScript', 'Python', 'Java', 'UI/UX', 'DevOps', 'Data Science'];

interface DrawerFilterProps {
  isOpen: boolean;
  onClose: () => void;
  appliedFilters: UseAllProjectsParams['filters'];
  appliedSortBy: UseAllProjectsParams['sortBy'];
  appliedSortDirection: UseAllProjectsParams['sortDirection'];
  onApplyFilters: (
    filters: UseAllProjectsParams['filters'],
    sortBy: UseAllProjectsParams['sortBy'],
    sortDirection: UseAllProjectsParams['sortDirection']
  ) => void;
}

/**
 * Drawer component for filtering and sorting projects
 */
const DrawerFilter: React.FC<DrawerFilterProps> = ({
  isOpen,
  onClose,
  appliedFilters = {},
  appliedSortBy = 'createdAt',
  appliedSortDirection = 'desc',
  onApplyFilters
}) => {
  // Локальные состояния
  const [selectedTags, setSelectedTags] = useState<string[]>(appliedFilters.tags || []);
  const [selectedMode, setSelectedMode] = useState<'all' | 'remote' | 'onsite' | 'hybrid'>(
    appliedFilters.mode || 'all'
  );
  const [selectedTeamSize, setSelectedTeamSize] = useState<'all' | '1-2' | '3-5' | '6+'>(
    appliedFilters.teamSize || 'all'
  );
  const [sortBy, setSortBy] = useState<'createdAt' | 'popularityScore'>(
    appliedSortBy
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    appliedSortDirection
  );
  
  // Сбрасываем локальные стейты при открытии drawer
  useEffect(() => {
    if (isOpen) {
      setSelectedTags(appliedFilters.tags || []);
      setSelectedMode(appliedFilters.mode || 'all');
      setSelectedTeamSize(appliedFilters.teamSize || 'all');
      setSortBy(appliedSortBy);
      setSortDirection(appliedSortDirection);
    }
  }, [isOpen, appliedFilters, appliedSortBy, appliedSortDirection]);
  
  const handleApply = () => {
    onApplyFilters(
      { 
        tags: selectedTags, 
        mode: selectedMode, 
        teamSize: selectedTeamSize 
      },
      sortBy,
      sortDirection
    );
    onClose();
  };
  
  const handleReset = () => {
    setSelectedTags([]);
    setSelectedMode('all');
    setSelectedTeamSize('all');
    setSortBy('createdAt');
    setSortDirection('desc');
  };
  
  const handleTagChange = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Цвета для светлой/темной темы
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Drawer 
      isOpen={isOpen} 
      placement="right" 
      onClose={onClose} 
      size="md"
      aria-labelledby="filter-drawer-title"
    >
      <DrawerOverlay />
      <DrawerContent bg={bgColor}>
        <DrawerHeader 
          id="filter-drawer-title" 
          borderBottomWidth="1px" 
          borderColor={borderColor}
        >
          Фильтры и сортировка
        </DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={6}>
            <FormControl as="fieldset">
              <FormLabel as="legend" fontWeight="bold">Теги</FormLabel>
              <Stack spacing={2}>
                {AVAILABLE_TAGS.map(tag => (
                  <Checkbox
                    key={tag}
                    isChecked={selectedTags.includes(tag)}
                    onChange={() => handleTagChange(tag)}
                    aria-label={`Фильтр по тегу ${tag}`}
                    colorScheme="orange"
                  >
                    {tag}
                  </Checkbox>
                ))}
              </Stack>
            </FormControl>
            
            <Divider />
            
            <FormControl>
              <FormLabel fontWeight="bold">Режим работы</FormLabel>
              <Select
                value={selectedMode}
                onChange={e => setSelectedMode(e.target.value as any)}
                aria-label="Фильтр по режиму работы"
              >
                <option value="all">Все</option>
                <option value="remote">Удалённо</option>
                <option value="onsite">На месте</option>
                <option value="hybrid">Гибридно</option>
              </Select>
            </FormControl>
            
            <Divider />
            
            <FormControl>
              <FormLabel fontWeight="bold">Размер команды</FormLabel>
              <Select
                value={selectedTeamSize}
                onChange={e => setSelectedTeamSize(e.target.value as any)}
                aria-label="Фильтр по размеру команды"
              >
                <option value="all">Все</option>
                <option value="1-2">1–2 человека</option>
                <option value="3-5">3–5 человек</option>
                <option value="6+">6+ человек</option>
              </Select>
            </FormControl>
            
            <Divider />
            
            <FormControl>
              <FormLabel fontWeight="bold">Сортировать по</FormLabel>
              <Select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as any)}
                aria-label="Сортировка проектов"
              >
                <option value="createdAt">Дате создания</option>
                <option value="popularityScore">Популярности</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="bold">Направление</FormLabel>
              <Select 
                value={sortDirection} 
                onChange={e => setSortDirection(e.target.value as any)}
                aria-label="Направление сортировки"
              >
                <option value="desc">По убыванию</option>
                <option value="asc">По возрастанию</option>
              </Select>
            </FormControl>
          </VStack>
        </DrawerBody>
        
        <DrawerFooter borderTopWidth="1px" borderColor={borderColor}>
          <Button 
            variant="outline" 
            mr={3} 
            onClick={handleReset}
            aria-label="Сбросить все фильтры"
          >
            Сбросить
          </Button>
          <Button 
            colorScheme="orange" 
            onClick={handleApply}
            aria-label="Применить выбранные фильтры"
          >
            Применить
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default DrawerFilter; 