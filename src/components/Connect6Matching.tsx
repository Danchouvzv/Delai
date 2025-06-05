import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Box, Button, Card, CardContent, Typography, Chip, Grid, CircularProgress, 
  Skeleton, Divider, useTheme, Slider, FormControl, InputLabel, Select, MenuItem, 
  FormControlLabel, Switch, TextField, Autocomplete } from '@mui/material';
import { motion } from 'framer-motion';
import { TrendingUp, AccessTime, People, LocationOn, School } from '@mui/icons-material';

// Define types
interface Connect6MatchResult {
  projectId: string;
  score: number;
  reasonTags: string[];
  factorScores: {
    skills: number;
    interests: number;
    experience: number;
    mode: number;
    availability: number;
    teamFit: number;
  };
  matchedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

// Добавим значения по умолчанию для factorScores
const defaultFactorScores = {
  skills: 0,
  interests: 0,
  experience: 0,
  mode: 0,
  availability: 0,
  teamFit: 0
};

interface Connect6MatchResponse {
  matches: Connect6MatchResult[];
  latencyMs: number;
  matchCount: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  skillsNeeded: string[];
  teamSize: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mode: 'remote' | 'onsite' | 'hybrid';
  isOpen: boolean;
  ownerUid: string;
  ownerName: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
  thumbnailUrl?: string;
}

interface Connect6MatchFilters {
  tags?: string[];
  skills?: string[];
  mode?: 'remote' | 'onsite' | 'hybrid' | 'all';
  teamSizeRange?: [number, number];
  onlyOpen?: boolean;
}

const Connect6Matching: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<Connect6MatchResult[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Connect6MatchFilters>({
    tags: [],
    skills: [],
    mode: 'all',
    teamSizeRange: [1, 10],
    onlyOpen: true,
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Load available tags and skills
  useEffect(() => {
    const loadTagsAndSkills = async () => {
      try {
        // In a real app, you'd fetch these from Firestore
        setAvailableTags([
          'Web Development', 'Mobile', 'AI/ML', 'Data Science', 
          'Blockchain', 'DevOps', 'UI/UX', 'Game Development',
          'IoT', 'Cybersecurity', 'Cloud', 'Open Source'
        ]);
        
        setAvailableSkills([
          'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
          'Node.js', 'Python', 'Java', 'C#', 'Go', 'Rust',
          'Firebase', 'AWS', 'Docker', 'Kubernetes', 'TensorFlow',
          'PyTorch', 'SQL', 'MongoDB', 'GraphQL', 'REST API'
        ]);
      } catch (err) {
        console.error('Error loading tags and skills:', err);
      }
    };
    
    loadTagsAndSkills();
  }, []);
  
  // Load matches
  const loadMatches = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const connect6Match = httpsCallable<
        { userId: string; filters: Connect6MatchFilters; limit?: number },
        Connect6MatchResponse
      >(functions, 'connect6Match');
      
      const result = await connect6Match({
        userId: currentUser.uid,
        filters,
        limit: 10,
      });
      
      // Ensure we have a valid response with matches
      if (result.data && Array.isArray(result.data.matches)) {
        // Добавляем проверку и значения по умолчанию для factorScores
        const matchesWithDefaults = result.data.matches.map(match => ({
          ...match,
          factorScores: match.factorScores || defaultFactorScores
        }));
        
        setMatches(matchesWithDefaults);
        setLastUpdateTime(new Date());
        
        // Load project details for each match
        if (matchesWithDefaults.length > 0) {
          await loadProjectDetails(matchesWithDefaults.map(m => m.projectId));
        }
      } else {
        setMatches([]);
        console.error('Invalid response format:', result.data);
        setError('Received invalid response format from server');
      }
      
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError(err.message || 'Failed to load matches');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load project details
  const loadProjectDetails = async (projectIds: string[]) => {
    if (!projectIds.length) return;
    
    try {
      // In a real implementation, you'd batch get these from Firestore
      // This is a mock implementation
      const mockProjects: Record<string, Project> = {};
      
      // Mock data for demonstration
      projectIds.forEach((id, index) => {
        // Make sure all fields are properly initialized
        const projectModes = ['remote', 'onsite', 'hybrid'];
        const projectDifficulties = ['beginner', 'intermediate', 'advanced'];
        
        mockProjects[id] = {
          id,
          title: `Project ${index + 1}`,
          description: 'This is a sample project description that would typically contain details about the project goals, scope, and requirements.',
          tags: availableTags.slice(0, 3 + (index % 5)) || [],
          skillsNeeded: availableSkills.slice(0, 4 + (index % 5)) || [],
          teamSize: 2 + (index % 5),
          difficulty: projectDifficulties[index % 3] as 'beginner' | 'intermediate' | 'advanced',
          mode: projectModes[index % 3] as 'remote' | 'onsite' | 'hybrid',
          isOpen: index % 4 !== 0,
          ownerUid: `user${index}`,
          ownerName: `User ${index + 1}`,
          createdAt: {
            seconds: Math.floor(Date.now() / 1000) - 86400 * (index + 1),
            nanoseconds: 0
          },
          updatedAt: {
            seconds: Math.floor(Date.now() / 1000) - 3600 * (index + 1),
            nanoseconds: 0
          },
          thumbnailUrl: `https://source.unsplash.com/random/300x200?sig=${index}`
        };
      });
      
      setProjects(prevProjects => ({
        ...prevProjects,
        ...mockProjects
      }));
      
    } catch (err) {
      console.error('Error loading project details:', err);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filterName: keyof Connect6MatchFilters, value: any) => {
    // Validate the value based on the filter type
    let validatedValue = value;
    
    // Special handling for specific filter types
    if (filterName === 'mode' && !value) {
      validatedValue = 'all'; // Default to 'all' if mode is null/undefined
    } else if (filterName === 'teamSizeRange' && (!Array.isArray(value) || value.length !== 2)) {
      validatedValue = [1, 10]; // Default team size range
    } else if ((filterName === 'tags' || filterName === 'skills') && !Array.isArray(value)) {
      validatedValue = []; // Default to empty array
    }
    
    setFilters(prev => ({
      ...prev,
      [filterName]: validatedValue
    }));
  };
  
  // Format timestamp to readable date
  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };
  
  // Navigate to project details
  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };
  
  // Get explanation for match
  const handleExplainMatch = async (projectId: string) => {
    if (!currentUser) return;
    
    try {
      const connect6MatchExplain = httpsCallable(functions, 'connect6MatchExplain');
      
      const result = await connect6MatchExplain({
        userId: currentUser.uid,
        projectId
      });
      
      console.log('Match explanation:', result.data);
      // In a real app, you'd show this in a modal or tooltip
      alert(JSON.stringify(result.data, null, 2));
      
    } catch (err) {
      console.error('Error getting match explanation:', err);
    }
  };
  
  // Effect to load matches on mount and filter changes
  useEffect(() => {
    if (currentUser) {
      loadMatches();
    }
  }, [currentUser]); // Only reload when user changes, not on every filter change
  
  // Memoized sorted matches
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => b.score - a.score);
  }, [matches]);
  
  // Render match card
  const renderMatchCard = (match: Connect6MatchResult) => {
    const project = projects[match.projectId];
    // Убедимся, что factorScores существует
    const factorScores = match.factorScores || defaultFactorScores;
    
    if (!project) {
      return (
        <Card key={match.projectId} sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={20} width="60%" />
            <Skeleton variant="rectangular" height={100} />
          </CardContent>
        </Card>
      );
    }
    
    return (
      <motion.div
        key={match.projectId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[2],
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4],
            }
          }}
        >
          <Box sx={{ position: 'relative' }}>
            {project?.thumbnailUrl && (
              <Box 
                sx={{ 
                  height: 140, 
                  backgroundImage: `url(${project.thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))',
                  }
                }} 
              />
            )}
            
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                boxShadow: theme.shadows[3],
                border: '2px solid white'
              }}
            >
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {match.score}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                MATCH
              </Typography>
            </Box>
          </Box>
          
          <CardContent>
            <Typography variant="h5" component="div" gutterBottom>
              {project?.title || 'Untitled Project'}
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item>
                <Chip 
                  size="small" 
                  label={project?.difficulty || 'Unknown'} 
                  color={
                    project?.difficulty === 'beginner' ? 'success' : 
                    project?.difficulty === 'intermediate' ? 'primary' : 
                    'error'
                  }
                />
              </Grid>
              <Grid item>
                <Chip 
                  size="small" 
                  icon={<LocationOn fontSize="small" />} 
                  label={project?.mode || 'Unknown'} 
                />
              </Grid>
              <Grid item>
                <Chip 
                  size="small" 
                  icon={<People fontSize="small" />} 
                  label={`Team: ${project?.teamSize || '?'}`} 
                />
              </Grid>
              {project?.isOpen !== undefined && project.isOpen && (
                <Grid item>
                  <Chip 
                    size="small" 
                    label="Open for Applications" 
                    color="success" 
                  />
                </Grid>
              )}
            </Grid>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {project?.description || 'No description available'}
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              Skills Needed:
            </Typography>
            <Box sx={{ mb: 2 }}>
              {project?.skillsNeeded && project.skillsNeeded.length > 0 ? (
                project.skillsNeeded.map(skill => (
                  <Chip 
                    key={skill} 
                    label={skill} 
                    size="small" 
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))
              ) : (
                'No skills specified'
              )}
            </Box>
            
            <Divider sx={{ my: 1.5 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Match factors: {match.reasonTags?.join(', ') || 'None'}
                </Typography>
              </Box>
              <Box>
                <Button 
                  size="small" 
                  onClick={() => handleExplainMatch(match.projectId)}
                  sx={{ mr: 1 }}
                >
                  Why?
                </Button>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => handleViewProject(match.projectId)}
                >
                  View Project
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Connect-6 Project Matching
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Our Gemini 1.5 Flash-powered matching algorithm finds the best projects for your skills and preferences.
      </Typography>
      
      <Card sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Matching Filters
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={availableTags}
                value={filters.tags}
                onChange={(_, newValue) => handleFilterChange('tags', newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Project Tags" placeholder="Select tags" />
                )}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={availableSkills}
                value={filters.skills}
                onChange={(_, newValue) => handleFilterChange('skills', newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Required Skills" placeholder="Select skills" />
                )}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Work Mode</InputLabel>
                <Select
                  value={filters.mode}
                  label="Work Mode"
                  onChange={(e) => handleFilterChange('mode', e.target.value)}
                >
                  <MenuItem value="all">All Modes</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="onsite">Onsite</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ width: '100%' }}>
                <Typography id="team-size-slider" gutterBottom>
                  Team Size Range
                </Typography>
                <Slider
                  value={filters.teamSizeRange}
                  onChange={(_, newValue) => handleFilterChange('teamSizeRange', newValue)}
                  valueLabelDisplay="auto"
                  min={1}
                  max={20}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 15, label: '15' },
                    { value: 20, label: '20' },
                  ]}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.onlyOpen}
                    onChange={(e) => handleFilterChange('onlyOpen', e.target.checked)}
                  />
                }
                label="Only show projects open for applications"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {lastUpdateTime ? `Last updated: ${lastUpdateTime.toLocaleString()}` : 'Not updated yet'}
            </Typography>
            
            <Button
              variant="contained"
              onClick={loadMatches}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <TrendingUp />}
            >
              {isLoading ? 'Finding Matches...' : 'Find Matches'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      <Typography variant="h5" gutterBottom>
        Your Matches {matches.length > 0 && `(${matches.length})`}
      </Typography>
      
      {isLoading && !matches.length ? (
        Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Skeleton variant="text" height={40} />
              <Skeleton variant="text" height={20} width="60%" />
              <Skeleton variant="rectangular" height={100} />
            </CardContent>
          </Card>
        ))
      ) : matches.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No matches found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or updating your profile with more skills and interests.
          </Typography>
        </Card>
      ) : (
        sortedMatches.map(renderMatchCard)
      )}
    </Box>
  );
};

export default Connect6Matching; 