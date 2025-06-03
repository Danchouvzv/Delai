import React from 'react';
import {
  Flex,
  Button,
  Text,
  IconButton,
  HStack,
  useColorModeValue,
  Box,
} from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

/**
 * Component for page navigation
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  siblingCount = 1,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Если страниц меньше 2, не показываем пагинацию
  if (totalPages <= 1) return null;
  
  // Создаем массив страниц для отображения
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    // Всегда показываем первую страницу
    pages.push(1);
    
    // Вычисляем диапазон страниц вокруг текущей
    const leftSibling = Math.max(2, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);
    
    // Добавляем многоточие слева, если нужно
    if (leftSibling > 2) {
      pages.push('...');
    }
    
    // Добавляем страницы в диапазоне
    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    // Добавляем многоточие справа, если нужно
    if (rightSibling < totalPages - 1) {
      pages.push('...');
    }
    
    // Всегда показываем последнюю страницу, если страниц больше 1
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  const buttonBg = useColorModeValue('white', 'gray.800');
  const activeBg = useColorModeValue('orange.500', 'orange.300');
  const activeText = useColorModeValue('white', 'gray.900');
  
  return (
    <Flex justify="center" mt={8} mb={4} w="100%">
      <HStack spacing={2}>
        <IconButton
          aria-label="Предыдущая страница"
          icon={<FaChevronLeft />}
          onClick={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage === 1}
          size="sm"
          variant="outline"
          colorScheme="gray"
        />
        
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === '...') {
            return (
              <Text key={`ellipsis-${index}`} px={2}>
                ...
              </Text>
            );
          }
          
          const page = pageNumber as number;
          const isCurrentPage = page === currentPage;
          
          return (
            <Button
              key={page}
              onClick={() => onPageChange(page)}
              bg={isCurrentPage ? activeBg : buttonBg}
              color={isCurrentPage ? activeText : undefined}
              size="sm"
              minW="32px"
              aria-current={isCurrentPage ? 'page' : undefined}
              aria-label={`Страница ${page}`}
              _hover={{
                bg: isCurrentPage ? activeBg : useColorModeValue('gray.100', 'gray.700'),
              }}
            >
              {page}
            </Button>
          );
        })}
        
        <IconButton
          aria-label="Следующая страница"
          icon={<FaChevronRight />}
          onClick={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          size="sm"
          variant="outline"
          colorScheme="gray"
        />
      </HStack>
    </Flex>
  );
};

export default Pagination; 