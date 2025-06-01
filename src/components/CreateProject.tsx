import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Textarea,
  Select, Checkbox, Heading, Text, VStack, HStack,
  useToast, Flex, Tag, TagLabel, TagCloseButton,
  InputGroup, InputRightElement, IconButton, useColorModeValue,
  FormHelperText, NumberInput, NumberInputField, 
  NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalCloseButton, ModalFooter, useDisclosure
} from '@chakra-ui/react';
import { FaPlus, FaSave, FaMagic, FaLightbulb } from 'react-icons/fa';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generateText } from '../api/gemini';

// Типы для проекта
interface Project {
  title: string;
  description: string;
  tags: string[];
  skillsNeeded: string[];
  mode: 'remote' | 'onsite' | 'hybrid';
  location?: string;
  teamSize: number;
  isOpen: boolean;
  ownerUid: string;
  createdAt: Date;
}

// Компонент для тегов и навыков
const TagsInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}> = ({ tags, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const handleAddTag = () => {
    const trimmedTag = input.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
    setInput('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input) {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleRemoveTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };
  
  return (
    <Box>
      <Flex wrap="wrap" mb={2} gap={2}>
        {tags.map((tag, index) => (
          <Tag
            key={index}
            size="md"
            borderRadius="full"
            variant="solid"
            colorScheme="teal"
          >
            <TagLabel>{tag}</TagLabel>
            <TagCloseButton onClick={() => handleRemoveTag(index)} />
          </Tag>
        ))}
      </Flex>
      
      <InputGroup size="md">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <InputRightElement>
          <IconButton
            size="sm"
            colorScheme="teal"
            aria-label="Add tag"
            icon={<FaPlus />}
            onClick={handleAddTag}
            disabled={!input.trim()}
          />
        </InputRightElement>
      </InputGroup>
    </Box>
  );
};

const MotionBox = motion(Box);

const CreateProject: React.FC = () => {
  const [user] = useAuthState(auth);
  const [project, setProject] = useState<Omit<Project, 'ownerUid' | 'createdAt'>>({
    title: '',
    description: '',
    tags: [],
    skillsNeeded: [],
    mode: 'remote',
    location: '',
    teamSize: 1,
    isOpen: true
  });
  
  const [saving, setSaving] = useState(false);
  const [suggestingSkills, setSuggestingSkills] = useState(false);
  const [previewAISkills, setPreviewAISkills] = useState<string[]>([]);
  
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Функция сохранения проекта
  const handleSaveProject = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a project.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!project.title || !project.description) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title and description for your project.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Создаем новый проект
      const projectData: Project = {
        ...project,
        ownerUid: user.uid,
        createdAt: new Date()
      };
      
      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      
      // Добавляем в очередь для матчмейкинга
      await addDoc(collection(db, 'matchJobs'), {
        docRef: `projects/${projectRef.id}`,
        createdAt: new Date()
      });
      
      toast({
        title: 'Project created',
        description: 'Your project has been created and will be matched with potential team members.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Переходим на страницу созданного проекта
      navigate(`/project/${projectRef.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error creating project',
        description: 'Could not create your project. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // AI-предложение навыков
  const handleSuggestSkills = async () => {
    if (!project.description) {
      toast({
        title: 'Insufficient information',
        description: 'Please add a project description to get skill suggestions.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSuggestingSkills(true);
      
      const prompt = `
        Based on the following project description, suggest 5-8 skills that would be needed for this project. 
        Return only a list of skills as a JSON array of strings, nothing else.
        For example: ["JavaScript", "React", "Node.js", "CSS", "HTML"]
        
        Project description: "${project.description}"
        
        Current skills needed: ${project.skillsNeeded.join(', ')}
      `;
      
      const response = await generateText(prompt);
      
      try {
        // Попытка найти JSON массив в ответе
        const jsonMatch = response.match(/\[.*?\]/s);
        let suggestedSkills;
        
        if (jsonMatch) {
          // Если найден JSON массив, парсим его
          suggestedSkills = JSON.parse(jsonMatch[0]);
        } else {
          // Если JSON массив не найден, разбиваем ответ на строки и ищем навыки
          suggestedSkills = response
            .split(/[\n,]/)
            .map(item => item.trim())
            .filter(item => 
              item && 
              !item.includes('[') && 
              !item.includes(']') && 
              !item.includes('{') && 
              !item.includes('}') &&
              item.length > 1
            );
        }
        
        if (Array.isArray(suggestedSkills)) {
          // Показываем превью
          setPreviewAISkills(suggestedSkills.filter((skill: string) => 
            !project.skillsNeeded.includes(skill)
          ));
          onOpen();
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        toast({
          title: 'Error processing suggestions',
          description: 'Could not process the AI suggestions. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error generating skill suggestions:', error);
      toast({
        title: 'Error suggesting skills',
        description: 'Could not generate skill suggestions. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSuggestingSkills(false);
    }
  };
  
  // Применение предложенных навыков
  const applyAISkills = () => {
    setProject({
      ...project,
      skillsNeeded: [...new Set([...project.skillsNeeded, ...previewAISkills])]
    });
    onClose();
  };
  
  // Обработчики изменения полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProject({ ...project, [name]: value });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProject({ ...project, [name]: checked });
  };
  
  const handleNumberChange = (name: string, value: number) => {
    setProject({ ...project, [name]: value });
  };
  
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="md"
      bg={bgColor}
      w="full"
      maxW="800px"
      mx="auto"
    >
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Create New Project</Heading>
        
        <Text color="gray.500">
          Create a project to find team members and collaborators through our AI-powered matching system.
        </Text>
        
        <FormControl isRequired>
          <FormLabel>Project Title</FormLabel>
          <Input 
            name="title" 
            value={project.title} 
            onChange={handleChange}
            placeholder="e.g. Mobile App for Fitness Tracking"
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Project Description</FormLabel>
          <Textarea 
            name="description" 
            value={project.description} 
            onChange={handleChange}
            placeholder="Describe your project, its goals, and what you're looking for..."
            minH="120px"
          />
          <FormHelperText>
            Include the purpose, features, technologies, and any other relevant details.
          </FormHelperText>
        </FormControl>
        
        <FormControl>
          <FormLabel>Tags</FormLabel>
          <TagsInput
            tags={project.tags}
            onChange={(tags) => setProject({ ...project, tags })}
            placeholder="Add tags (e.g. Mobile, Healthcare, Education)..."
          />
          <FormHelperText>
            Tags help categorize your project and improve matching accuracy.
          </FormHelperText>
        </FormControl>
        
        <HStack>
          <FormControl>
            <FormLabel>Skills Needed</FormLabel>
            <TagsInput
              tags={project.skillsNeeded}
              onChange={(skillsNeeded) => setProject({ ...project, skillsNeeded })}
              placeholder="Add required skills..."
            />
            <FormHelperText>
              List the skills your ideal team members should have.
            </FormHelperText>
          </FormControl>
          
          <Box alignSelf="flex-end" ml={2} mb={2}>
            <Button
              leftIcon={<FaMagic />}
              colorScheme="purple"
              variant="outline"
              size="md"
              onClick={handleSuggestSkills}
              isLoading={suggestingSkills}
              loadingText="Analyzing..."
            >
              Suggest Skills
            </Button>
          </Box>
        </HStack>
        
        <HStack spacing={6} align="flex-start">
          <FormControl>
            <FormLabel>Work Mode</FormLabel>
            <Select 
              name="mode" 
              value={project.mode} 
              onChange={handleChange}
            >
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input 
              name="location" 
              value={project.location} 
              onChange={handleChange}
              placeholder="City, Country (for on-site or hybrid)"
              isDisabled={project.mode === 'remote'}
            />
          </FormControl>
        </HStack>
        
        <FormControl>
          <FormLabel>Team Size</FormLabel>
          <NumberInput
            min={1}
            max={20}
            value={project.teamSize}
            onChange={(_, value) => handleNumberChange('teamSize', value)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            How many people do you need for this project?
          </FormHelperText>
        </FormControl>
        
        <FormControl>
          <Checkbox
            name="isOpen"
            isChecked={project.isOpen}
            onChange={handleCheckboxChange}
            colorScheme="teal"
          >
            Project is open for new members
          </Checkbox>
          <FormHelperText>
            Uncheck this if you want to pause matching or the team is complete.
          </FormHelperText>
        </FormControl>
        
        <Flex justify="space-between" pt={4}>
          <Button
            colorScheme="gray"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          
          <Button
            colorScheme="teal"
            leftIcon={<FaSave />}
            onClick={handleSaveProject}
            isLoading={saving}
            loadingText="Creating..."
          >
            Create Project
          </Button>
        </Flex>
      </VStack>
      
      {/* Модальное окно для превью рекомендованных навыков */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center">
              <FaLightbulb color="gold" style={{ marginRight: '8px' }} />
              AI Suggested Skills
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Based on your project description, we recommend adding these skills:
            </Text>
            
            <Flex wrap="wrap" gap={2} mb={4}>
              {previewAISkills.map((skill, index) => (
                <Tag
                  key={index}
                  size="md"
                  borderRadius="full"
                  variant="solid"
                  colorScheme="purple"
                >
                  {skill}
                </Tag>
              ))}
            </Flex>
            
            {previewAISkills.length === 0 && (
              <Text color="gray.500">
                No new skills to suggest. All recommended skills are already in your list.
              </Text>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Ignore
            </Button>
            <Button 
              colorScheme="teal" 
              onClick={applyAISkills}
              isDisabled={previewAISkills.length === 0}
            >
              Add These Skills
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
};

export default CreateProject; 