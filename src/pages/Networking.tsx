import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, Tabs, TabList, Tab, TabPanels, TabPanel,
  Button, VStack, HStack, Flex, useColorModeValue, Image, Icon, SimpleGrid,
  Card, CardBody, Divider, Badge, Avatar, Link as ChakraLink, useToast,
  Tag, TagLabel, TagLeftIcon, Grid, Circle, Tooltip, IconButton, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Textarea, useDisclosure
} from '@chakra-ui/react';
import { 
  FaUserAlt, FaBriefcase, FaStar, FaRobot, FaUsers, FaLightbulb, 
  FaRegLightbulb, FaArrowRight, FaGlobe, FaRocket, FaCode, FaHandshake 
} from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NetworkingProfile from '../components/NetworkingProfile';
import CreateProject from '../components/CreateProject';
import RecommendedProjects from '../components/RecommendedProjects';
import HeaderSection from '../components/HeaderSection';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

// Import our new components
import PageWrapper from '../components/layout/PageWrapper';
import ErrorBoundary from '../components/layout/ErrorBoundary';
import NetworkingTabs from '../components/networking/NetworkingTabs';
import TabsContentWrapper from '../components/networking/TabsContentWrapper';

// Import our new hook
import { useNetworkingTabs } from '../hooks/useNetworkingTabs';
import { applicationService } from '../services/applicationService';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionCard = motion(Card);

const Networking: React.FC = () => {
  const { tabs, currentTab, selectTab } = useNetworkingTabs('recommended');
  const [user] = useAuthState(auth);
  const toast = useToast();
  const navigate = useNavigate();
  
  // Состояния для профиля и модального окна заявки
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [applicationText, setApplicationText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Проверка наличия профиля при загрузке
  useEffect(() => {
    const checkProfileExists = async () => {
      if (!user) {
        setIsCheckingProfile(false);
        return;
      }
      
      try {
        const profileRef = doc(db, 'networkingProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        setHasProfile(profileSnap.exists());
      } catch (error) {
        console.error('Error checking profile:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось проверить наличие профиля',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsCheckingProfile(false);
      }
    };
    
    checkProfileExists();
  }, [user, toast]);
  
  // Создание профиля
  const handleCreateProfile = async (profileData: any) => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, 'networkingProfiles', user.uid), {
        ...profileData,
        userId: user.uid,
        createdAt: new Date(),
      });
      
      setHasProfile(true);
      toast({
        title: 'Профиль создан',
        description: 'Ваш профиль успешно создан',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать профиль',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Обработчик отклика на проект
  const handleApplyToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setApplicationText('');
    onOpen();
  };
  
  // Отправка заявки
  const handleSubmitApplication = async () => {
    if (!user || !selectedProjectId || !applicationText.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните текст заявки',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await applicationService.createApplication(
        user.uid,
        selectedProjectId,
        applicationText.trim()
      );
      
      toast({
        title: 'Заявка отправлена',
        description: 'Ваша заявка успешно отправлена',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить заявку',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Если пользователь не авторизован
  if (!user && !isCheckingProfile) {
    return (
      <PageWrapper>
        <HeaderSection
          title="Нетворкинг"
          description="Пожалуйста, войдите в систему, чтобы получить доступ к нетворкингу"
          buttonText="Войти"
          onButtonClick={() => window.location.href = '/login'}
          gradient="primary"
          align="center"
        />
      </PageWrapper>
    );
  }
  
  // Если проверяем наличие профиля
  if (isCheckingProfile) {
    return (
      <PageWrapper>
        <HeaderSection
          title="Загрузка..."
          description="Пожалуйста, подождите"
          gradient="primary"
          align="center"
        />
      </PageWrapper>
    );
  }
  
  // Если у пользователя нет профиля
  if (!hasProfile) {
    return (
      <PageWrapper>
        <HeaderSection
          title="Создание профиля"
          description="Для доступа к нетворкингу необходимо создать профиль"
          gradient="primary"
          align="center"
        />
        
        <Box mt={8}>
          {/* Здесь должна быть форма создания профиля */}
          <Button 
            colorScheme="orange" 
            onClick={() => handleCreateProfile({
              name: user?.displayName || 'Пользователь',
              skills: ['JavaScript', 'React'],
              experience: 'middle',
              interests: ['Frontend', 'UI/UX'],
            })}
          >
            Создать базовый профиль
          </Button>
        </Box>
      </PageWrapper>
    );
  }
  
  // Основной контент
  return (
    <PageWrapper>
      <ErrorBoundary>
        <HeaderSection
          title="Нетворкинг"
          description="Находите проекты и команды для совместной работы"
          gradient="primary"
        />
        
        <NetworkingTabs
          tabs={tabs}
          currentTab={currentTab}
          onTabChange={selectTab}
        />
        
        <TabsContentWrapper
          currentTab={currentTab}
          onApplyToProject={handleApplyToProject}
        />
        
        {/* Модальное окно для отправки заявки */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Отклик на проект</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  Опишите, почему вы хотите присоединиться к этому проекту и какие навыки можете предложить:
                </Text>
                <Textarea
                  value={applicationText}
                  onChange={(e) => setApplicationText(e.target.value)}
                  placeholder="Ваше сообщение..."
                  rows={5}
                  isDisabled={isSubmitting}
                />
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
                Отмена
              </Button>
              <Button 
                colorScheme="orange" 
                onClick={handleSubmitApplication}
                isLoading={isSubmitting}
                loadingText="Отправка..."
              >
                Отправить заявку
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </ErrorBoundary>
    </PageWrapper>
  );
};

export default Networking; 