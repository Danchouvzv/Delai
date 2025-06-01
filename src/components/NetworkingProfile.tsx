import React, { useEffect, useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Textarea,
  Select, Checkbox, Heading, Text, VStack, HStack,
  useToast, Flex, Tag, TagLabel, TagCloseButton, TagInput,
  InputGroup, InputRightElement, IconButton, Badge, useColorModeValue,
  Divider, FormHelperText, Switch, Icon
} from '@chakra-ui/react';
import { FaPlus, FaSave, FaRobot, FaMagic, FaGlobeAmericas, FaLightbulb } from 'react-icons/fa';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { generateText } from '../api/gemini';

// Типы для профиля
interface NetworkingProfile {
  uid: string;
  role: 'seeker' | 'mentor' | 'founder';
  headline?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  lookingFor: Array<'project' | 'people' | 'mentor'>;
  location?: string;
  openToRemote: boolean;
  experienceMonths?: number;
  age?: number;
  languages?: string[];
  education?: string;
  lastUpdated?: any;
}

const defaultProfile: NetworkingProfile = {
  uid: '',
  role: 'seeker',
  headline: '',
  bio: '',
  skills: [],
  interests: [],
  lookingFor: ['project'],
  location: '',
  openToRemote: true,
  experienceMonths: 0,
  languages: [],
  education: ''
};

// Предопределенные навыки для подсказок
const suggestedSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java',
  'UI/UX Design', 'Product Management', 'Data Science', 'Machine Learning',
  'Mobile Development', 'DevOps', 'Cloud Computing', 'Firebase', 'AWS',
  'Marketing', 'Business Development', 'Sales', 'Content Creation',
  'Project Management', 'Leadership', 'Communication', 'Problem Solving'
];

// Компонент для интересов/навыков
const TagsInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}> = ({ tags, onChange, placeholder, suggestions = [] }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };
  
  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
    setInput('');
    setShowSuggestions(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input) {
      e.preventDefault();
      handleAddTag(input);
    }
  };
  
  const handleRemoveTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };
  
  const filteredSuggestions = suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(input.toLowerCase()) && 
      !tags.includes(suggestion)
    )
    .slice(0, 5);
  
  return (
    <Box position="relative">
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
          onFocus={() => setShowSuggestions(input.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        <InputRightElement>
          <IconButton
            size="sm"
            colorScheme="teal"
            aria-label="Add tag"
            icon={<FaPlus />}
            onClick={() => handleAddTag(input)}
            disabled={!input.trim()}
          />
        </InputRightElement>
      </InputGroup>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Box
          position="absolute"
          mt={1}
          w="full"
          zIndex={10}
          bg="white"
          boxShadow="md"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          _dark={{
            bg: "gray.700",
            borderColor: "gray.600"
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <Box
              key={index}
              p={2}
              cursor="pointer"
              _hover={{ bg: "gray.100", _dark: { bg: "gray.600" } }}
              onClick={() => handleAddTag(suggestion)}
            >
              {suggestion}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const MotionBox = motion(Box);

const NetworkingProfile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<NetworkingProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggestingSkills, setSuggestingSkills] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  
  // Загрузка профиля при инициализации
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const profileRef = doc(db, 'networkingProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile({ 
            ...defaultProfile, 
            ...profileSnap.data() as NetworkingProfile 
          });
        } else {
          // Если профиля нет, создаем новый с данными из основного профиля пользователя
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            
            setProfile({
              ...defaultProfile,
              uid: user.uid,
              headline: userData.headline || userData.displayName || '',
              skills: userData.skills || [],
              interests: userData.interests || [],
              location: userData.location || '',
            });
          } else {
            setProfile({
              ...defaultProfile,
              uid: user.uid,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching networking profile:', error);
        toast({
          title: 'Error loading profile',
          description: 'Could not load your networking profile. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, toast]);
  
  // Функция сохранения профиля
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const profileData = {
        ...profile,
        uid: user.uid,
        lastUpdated: new Date()
      };
      
      const profileRef = doc(db, 'networkingProfiles', user.uid);
      await setDoc(profileRef, profileData);
      
      // Добавляем в очередь для матчмейкинга
      await addDoc(collection(db, 'matchJobs'), {
        docRef: `networkingProfiles/${user.uid}`,
        createdAt: new Date()
      });
      
      toast({
        title: 'Profile saved',
        description: 'Your networking profile has been updated. We\'ll start matching you with projects.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving networking profile:', error);
      toast({
        title: 'Error saving profile',
        description: 'Could not save your networking profile. Please try again.',
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
    if (!profile.bio) {
      toast({
        title: 'Insufficient information',
        description: 'Please add a bio first to get skill suggestions.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSuggestingSkills(true);
      
      const prompt = `
        Based on the following bio, suggest 5-8 skills that this person might have. 
        Return only a list of skills as a JSON array of strings, nothing else. 
        Be specific and professional.
        
        Bio: "${profile.bio}"
        
        Current skills: ${profile.skills.join(', ')}
      `;
      
      const response = await generateText(prompt);
      
      try {
        const suggestedSkills = JSON.parse(response);
        
        if (Array.isArray(suggestedSkills)) {
          // Убираем дубликаты
          const newSkills = [...new Set([
            ...profile.skills, 
            ...suggestedSkills.filter((skill: string) => 
              !profile.skills.includes(skill)
            )
          ])];
          
          setProfile({
            ...profile,
            skills: newSkills
          });
          
          toast({
            title: 'Skills suggested',
            description: `Added ${newSkills.length - profile.skills.length} new skills based on your bio.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
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
  
  // Обработчики изменения полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProfile({ ...profile, [name]: checked });
  };
  
  const handleLookingForChange = (value: 'project' | 'people' | 'mentor', checked: boolean) => {
    let lookingFor = [...profile.lookingFor];
    
    if (checked && !lookingFor.includes(value)) {
      lookingFor.push(value);
    } else if (!checked && lookingFor.includes(value)) {
      lookingFor = lookingFor.filter(item => item !== value);
    }
    
    setProfile({ ...profile, lookingFor });
  };
  
  if (loading) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={bgColor}>
        <Heading size="md" mb={4}>Loading profile...</Heading>
      </Box>
    );
  }
  
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
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="lg">Networking Profile</Heading>
          <Badge colorScheme="blue" p={2} borderRadius="md">
            <Flex align="center">
              <Icon as={FaRobot} mr={2} />
              AI Matching Enabled
            </Flex>
          </Badge>
        </Flex>
        
        <Text color="gray.500">
          Complete your networking profile to get matched with projects and team members by our AI.
        </Text>
        
        <Divider />
        
        <FormControl>
          <FormLabel>I am a:</FormLabel>
          <Select 
            name="role" 
            value={profile.role} 
            onChange={handleChange}
          >
            <option value="seeker">Job/Project Seeker</option>
            <option value="mentor">Mentor/Advisor</option>
            <option value="founder">Founder/Project Owner</option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Headline</FormLabel>
          <Input 
            name="headline" 
            value={profile.headline || ''} 
            onChange={handleChange}
            placeholder="e.g. Frontend Developer | UI/UX Designer | React Specialist"
          />
          <FormHelperText>A short professional tagline that describes you</FormHelperText>
        </FormControl>
        
        <FormControl>
          <FormLabel>About Me</FormLabel>
          <Textarea 
            name="bio" 
            value={profile.bio || ''} 
            onChange={handleChange}
            placeholder="Tell us about your experience, goals, and what you're looking for..."
            minH="120px"
          />
        </FormControl>
        
        <HStack>
          <FormControl>
            <FormLabel>Skills</FormLabel>
            <TagsInput
              tags={profile.skills}
              onChange={(skills) => setProfile({ ...profile, skills })}
              placeholder="Add your skills..."
              suggestions={suggestedSkills}
            />
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
              Suggest
            </Button>
          </Box>
        </HStack>
        
        <FormControl>
          <FormLabel>Interests</FormLabel>
          <TagsInput
            tags={profile.interests}
            onChange={(interests) => setProfile({ ...profile, interests })}
            placeholder="Add your interests..."
          />
          <FormHelperText>Topics, fields, or industries you're interested in</FormHelperText>
        </FormControl>
        
        <Box
          p={4}
          bg={highlightBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Flex align="center" mb={3}>
            <Icon as={FaLightbulb} mr={2} color="yellow.500" />
            <Heading size="sm">I'm looking for:</Heading>
          </Flex>
          
          <HStack spacing={4} wrap="wrap">
            <Checkbox
              isChecked={profile.lookingFor.includes('project')}
              onChange={(e) => handleLookingForChange('project', e.target.checked)}
              colorScheme="teal"
            >
              Projects to join
            </Checkbox>
            
            <Checkbox
              isChecked={profile.lookingFor.includes('people')}
              onChange={(e) => handleLookingForChange('people', e.target.checked)}
              colorScheme="teal"
            >
              Team members
            </Checkbox>
            
            <Checkbox
              isChecked={profile.lookingFor.includes('mentor')}
              onChange={(e) => handleLookingForChange('mentor', e.target.checked)}
              colorScheme="teal"
            >
              Mentorship
            </Checkbox>
          </HStack>
        </Box>
        
        <HStack spacing={6} align="flex-start">
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input 
              name="location" 
              value={profile.location || ''} 
              onChange={handleChange}
              placeholder="City, Country"
            />
          </FormControl>
          
          <FormControl width="auto">
            <FormLabel>Open to Remote</FormLabel>
            <Switch
              name="openToRemote"
              isChecked={profile.openToRemote}
              onChange={handleCheckboxChange}
              size="lg"
              colorScheme="teal"
            />
          </FormControl>
        </HStack>
        
        <HStack spacing={6}>
          <FormControl>
            <FormLabel>Experience (months)</FormLabel>
            <Input 
              name="experienceMonths" 
              type="number" 
              value={profile.experienceMonths || 0} 
              onChange={handleChange}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Languages</FormLabel>
            <TagsInput
              tags={profile.languages || []}
              onChange={(languages) => setProfile({ ...profile, languages })}
              placeholder="Add languages..."
            />
          </FormControl>
        </HStack>
        
        <FormControl>
          <FormLabel>Education</FormLabel>
          <Input 
            name="education" 
            value={profile.education || ''} 
            onChange={handleChange}
            placeholder="e.g. Bachelor's in Computer Science, University of XYZ"
          />
        </FormControl>
        
        <Flex justify="space-between" pt={4}>
          <Button
            colorScheme="gray"
            variant="outline"
            onClick={() => setProfile(defaultProfile)}
          >
            Reset
          </Button>
          
          <Button
            colorScheme="teal"
            leftIcon={<FaSave />}
            onClick={handleSaveProfile}
            isLoading={saving}
            loadingText="Saving..."
          >
            Save Profile
          </Button>
        </Flex>
      </VStack>
    </MotionBox>
  );
};

export default NetworkingProfile; 