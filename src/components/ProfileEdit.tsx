import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserData } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface ProfileEditProps {
  userData: UserData | null;
  onSave: (formData: Partial<UserData>) => Promise<void>;
  onCancel: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ userData, onSave, onCancel }) => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<UserData>>(userData || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('personal');

  // Update form data when userData changes
  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: string, index: number, value: any) => {
    setFormData(prev => {
      const array = [...(prev[field as keyof UserData] as any[] || [])];
      array[index] = { ...array[index], ...value };
      return {
        ...prev,
        [field]: array
      };
    });
  };

  const handleAddArrayItem = (field: string, item: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof UserData] as any[] || []), item]
    }));
  };

  const handleRemoveArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof UserData] as any[] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const sections = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'academic', label: 'Academic Information' },
    { id: 'skills', label: 'Skills & Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'preferences', label: 'Career Preferences' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sticky top-24">
              <nav className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'hover:bg-gray-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Edit Profile
                </h1>
                <div className="flex gap-4">
                  <button
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg">
                  {error}
                </div>
              )}

              <motion.form
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {/* Personal Information Section */}
                {activeSection === 'personal' && (
                  <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Personal Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName || ''}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName || ''}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phoneNumber || ''}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          placeholder="City, Country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Birth Date
                        </label>
                        <input
                          type="date"
                          value={formData.birthDate || ''}
                          onChange={(e) => handleInputChange('birthDate', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Social Links
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            LinkedIn
                          </label>
                          <input
                            type="url"
                            value={formData.socialLinks?.linkedin || ''}
                            onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            GitHub
                          </label>
                          <input
                            type="url"
                            value={formData.socialLinks?.github || ''}
                            onChange={(e) => handleInputChange('socialLinks.github', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            placeholder="https://github.com/username"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Portfolio
                          </label>
                          <input
                            type="url"
                            value={formData.socialLinks?.portfolio || ''}
                            onChange={(e) => handleInputChange('socialLinks.portfolio', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            placeholder="https://yourportfolio.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Twitter
                          </label>
                          <input
                            type="url"
                            value={formData.socialLinks?.twitter || ''}
                            onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            placeholder="https://twitter.com/username"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Privacy Settings
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Profile Visibility
                          </label>
                          <select
                            value={formData.privacySettings?.profileVisibility || 'private'}
                            onChange={(e) => handleInputChange('privacySettings.profileVisibility', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="recruiters">Recruiters Only</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.privacySettings?.showEmail || false}
                              onChange={(e) => handleInputChange('privacySettings.showEmail', e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Show email to other users
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.privacySettings?.showPhone || false}
                              onChange={(e) => handleInputChange('privacySettings.showPhone', e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Show phone number to other users
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.privacySettings?.showSalary || false}
                              onChange={(e) => handleInputChange('privacySettings.showSalary', e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Show salary expectations
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Academic Information Section */}
                {activeSection === 'academic' && (
                  <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Academic Information
                    </h2>

                    {/* Student Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Student ID
                        </label>
                        <input
                          type="text"
                          value={formData.studentId || ''}
                          onChange={(e) => handleInputChange('studentId', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Academic Year
                        </label>
                        <select
                          value={formData.academicYear || ''}
                          onChange={(e) => handleInputChange('academicYear', parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                          <option value="5">5th Year</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Major
                        </label>
                        <input
                          type="text"
                          value={formData.major || ''}
                          onChange={(e) => handleInputChange('major', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Minor (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.minor || ''}
                          onChange={(e) => handleInputChange('minor', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          GPA
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4.0"
                          value={formData.gpa || ''}
                          onChange={(e) => handleInputChange('gpa', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Expected Graduation
                        </label>
                        <input
                          type="month"
                          value={formData.expectedGraduation || ''}
                          onChange={(e) => handleInputChange('expectedGraduation', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Education History */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Education History
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('education', {
                            degree: '',
                            field: '',
                            institution: '',
                            location: '',
                            startDate: '',
                            endDate: '',
                            gpa: null,
                            highlights: [],
                            relevantCourses: []
                          })}
                          className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Add Education
                        </button>
                      </div>

                      {(formData.education || []).map((edu, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Education #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem('education', index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Degree
                              </label>
                              <input
                                type="text"
                                value={edu.degree || ''}
                                onChange={(e) => handleArrayInputChange('education', index, { degree: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Field of Study
                              </label>
                              <input
                                type="text"
                                value={edu.field || ''}
                                onChange={(e) => handleArrayInputChange('education', index, { field: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Institution
                              </label>
                              <input
                                type="text"
                                value={edu.institution || ''}
                                onChange={(e) => handleArrayInputChange('education', index, { institution: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location
                              </label>
                              <input
                                type="text"
                                value={edu.location || ''}
                                onChange={(e) => handleArrayInputChange('education', index, { location: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                              </label>
                              <input
                                type="month"
                                value={edu.startDate || ''}
                                onChange={(e) => handleArrayInputChange('education', index, { startDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date (or Expected)
                              </label>
                              <input
                                type="month"
                                value={edu.endDate || ''}
                                onChange={(e) => handleArrayInputChange('education', index, { endDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                GPA (Optional)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="4.0"
                                value={edu.gpa || ''}
                                onChange={(e) => handleArrayInputChange('education', index, { gpa: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Relevant Courses
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {edu.relevantCourses?.map((course, courseIndex) => (
                                <div
                                  key={courseIndex}
                                  className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                                >
                                  <span>{course}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCourses = edu.relevantCourses?.filter((_, i) => i !== courseIndex);
                                      handleArrayInputChange('education', index, { relevantCourses: newCourses });
                                    }}
                                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add course"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const newCourse = input.value.trim();
                                    if (newCourse) {
                                      const newCourses = [...(edu.relevantCourses || []), newCourse];
                                      handleArrayInputChange('education', index, { relevantCourses: newCourses });
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Highlights & Achievements
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {edu.highlights?.map((highlight, highlightIndex) => (
                                <div
                                  key={highlightIndex}
                                  className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                                >
                                  <span>{highlight}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newHighlights = edu.highlights?.filter((_, i) => i !== highlightIndex);
                                      handleArrayInputChange('education', index, { highlights: newHighlights });
                                    }}
                                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add highlight"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const newHighlight = input.value.trim();
                                    if (newHighlight) {
                                      const newHighlights = [...(edu.highlights || []), newHighlight];
                                      handleArrayInputChange('education', index, { highlights: newHighlights });
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Skills & Projects Section */}
                {activeSection === 'skills' && (
                  <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Skills & Projects
                    </h2>

                    {/* Skills */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Skills
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('skills', {
                            name: '',
                            level: 'beginner',
                            category: 'technical'
                          })}
                          className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Add Skill
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(formData.skills || []).map((skill, index) => (
                          <motion.div
                            key={index}
                            variants={itemVariants}
                            className="p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl space-y-3"
                          >
                            <div className="flex justify-between items-center">
                              <input
                                type="text"
                                value={skill.name || ''}
                                onChange={(e) => handleArrayInputChange('skills', index, { name: e.target.value })}
                                className="flex-1 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                placeholder="Skill name"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveArrayItem('skills', index)}
                                className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Level
                                </label>
                                <select
                                  value={skill.level || 'beginner'}
                                  onChange={(e) => handleArrayInputChange('skills', index, { level: e.target.value })}
                                  className="w-full px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                >
                                  <option value="beginner">Beginner</option>
                                  <option value="intermediate">Intermediate</option>
                                  <option value="advanced">Advanced</option>
                                </select>
                              </div>

                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Category
                                </label>
                                <select
                                  value={skill.category || 'technical'}
                                  onChange={(e) => handleArrayInputChange('skills', index, { category: e.target.value })}
                                  className="w-full px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                >
                                  <option value="technical">Technical</option>
                                  <option value="soft">Soft Skills</option>
                                  <option value="language">Language</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Projects
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('projects', {
                            name: '',
                            description: '',
                            technologies: [],
                            role: '',
                            startDate: '',
                            endDate: '',
                            url: '',
                            repository: '',
                            highlights: []
                          })}
                          className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Add Project
                        </button>
                      </div>

                      {(formData.projects || []).map((project, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Project #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem('projects', index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Project Name
                              </label>
                              <input
                                type="text"
                                value={project.name || ''}
                                onChange={(e) => handleArrayInputChange('projects', index, { name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Role
                              </label>
                              <input
                                type="text"
                                value={project.role || ''}
                                onChange={(e) => handleArrayInputChange('projects', index, { role: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                              </label>
                              <textarea
                                value={project.description || ''}
                                onChange={(e) => handleArrayInputChange('projects', index, { description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                              </label>
                              <input
                                type="month"
                                value={project.startDate || ''}
                                onChange={(e) => handleArrayInputChange('projects', index, { startDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                              </label>
                              <input
                                type="month"
                                value={project.endDate || ''}
                                onChange={(e) => handleArrayInputChange('projects', index, { endDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Project URL
                              </label>
                              <input
                                type="url"
                                value={project.url || ''}
                                onChange={(e) => handleArrayInputChange('projects', index, { url: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                placeholder="https://..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Repository URL
                              </label>
                              <input
                                type="url"
                                value={project.repository || ''}
                                onChange={(e) => handleArrayInputChange('projects', index, { repository: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                placeholder="https://github.com/..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Technologies Used
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {project.technologies?.map((tech, techIndex) => (
                                <div
                                  key={techIndex}
                                  className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                                >
                                  <span>{tech}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTech = project.technologies?.filter((_, i) => i !== techIndex);
                                      handleArrayInputChange('projects', index, { technologies: newTech });
                                    }}
                                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add technology"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const newTech = input.value.trim();
                                    if (newTech) {
                                      const newTechs = [...(project.technologies || []), newTech];
                                      handleArrayInputChange('projects', index, { technologies: newTechs });
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Key Highlights
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {project.highlights?.map((highlight, highlightIndex) => (
                                <div
                                  key={highlightIndex}
                                  className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                                >
                                  <span>{highlight}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newHighlights = project.highlights?.filter((_, i) => i !== highlightIndex);
                                      handleArrayInputChange('projects', index, { highlights: newHighlights });
                                    }}
                                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add highlight"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const newHighlight = input.value.trim();
                                    if (newHighlight) {
                                      const newHighlights = [...(project.highlights || []), newHighlight];
                                      handleArrayInputChange('projects', index, { highlights: newHighlights });
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Experience Section */}
                {activeSection === 'experience' && (
                  <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Experience
                    </h2>

                    {/* Work Experience */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Work Experience
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('experience', {
                            title: '',
                            company: '',
                            location: '',
                            type: 'internship',
                            startDate: '',
                            endDate: '',
                            current: false,
                            description: '',
                            achievements: [],
                            technologies: []
                          })}
                          className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Add Experience
                        </button>
                      </div>

                      {(formData.experience || []).map((exp, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Experience #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem('experience', index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Job Title
                              </label>
                              <input
                                type="text"
                                value={exp.title || ''}
                                onChange={(e) => handleArrayInputChange('experience', index, { title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Company
                              </label>
                              <input
                                type="text"
                                value={exp.company || ''}
                                onChange={(e) => handleArrayInputChange('experience', index, { company: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location
                              </label>
                              <input
                                type="text"
                                value={exp.location || ''}
                                onChange={(e) => handleArrayInputChange('experience', index, { location: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Type
                              </label>
                              <select
                                value={exp.type || 'internship'}
                                onChange={(e) => handleArrayInputChange('experience', index, { type: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              >
                                <option value="internship">Internship</option>
                                <option value="part-time">Part-time</option>
                                <option value="full-time">Full-time</option>
                                <option value="volunteer">Volunteer</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                              </label>
                              <input
                                type="month"
                                value={exp.startDate || ''}
                                onChange={(e) => handleArrayInputChange('experience', index, { startDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                              </label>
                              <div className="space-y-2">
                                <input
                                  type="month"
                                  value={exp.endDate || ''}
                                  onChange={(e) => handleArrayInputChange('experience', index, { endDate: e.target.value })}
                                  disabled={exp.current}
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50"
                                />
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exp.current || false}
                                    onChange={(e) => handleArrayInputChange('experience', index, { current: e.target.checked })}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    I currently work here
                                  </span>
                                </label>
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                              </label>
                              <textarea
                                value={exp.description || ''}
                                onChange={(e) => handleArrayInputChange('experience', index, { description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Technologies Used
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {exp.technologies?.map((tech, techIndex) => (
                                <div
                                  key={techIndex}
                                  className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                                >
                                  <span>{tech}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTech = exp.technologies?.filter((_, i) => i !== techIndex);
                                      handleArrayInputChange('experience', index, { technologies: newTech });
                                    }}
                                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add technology"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const newTech = input.value.trim();
                                    if (newTech) {
                                      const newTechs = [...(exp.technologies || []), newTech];
                                      handleArrayInputChange('experience', index, { technologies: newTechs });
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Key Achievements
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {exp.achievements?.map((achievement, achievementIndex) => (
                                <div
                                  key={achievementIndex}
                                  className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                                >
                                  <span>{achievement}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAchievements = exp.achievements?.filter((_, i) => i !== achievementIndex);
                                      handleArrayInputChange('experience', index, { achievements: newAchievements });
                                    }}
                                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add achievement"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const newAchievement = input.value.trim();
                                    if (newAchievement) {
                                      const newAchievements = [...(exp.achievements || []), newAchievement];
                                      handleArrayInputChange('experience', index, { achievements: newAchievements });
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Volunteer Work */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Volunteer Work
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('volunteerWork', {
                            organization: '',
                            role: '',
                            startDate: '',
                            endDate: '',
                            description: '',
                            achievements: []
                          })}
                          className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Add Volunteer Work
                        </button>
                      </div>

                      {(formData.volunteerWork || []).map((volunteer, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Volunteer Work #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem('volunteerWork', index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Organization
                              </label>
                              <input
                                type="text"
                                value={volunteer.organization || ''}
                                onChange={(e) => handleArrayInputChange('volunteerWork', index, { organization: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Role
                              </label>
                              <input
                                type="text"
                                value={volunteer.role || ''}
                                onChange={(e) => handleArrayInputChange('volunteerWork', index, { role: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                              </label>
                              <input
                                type="month"
                                value={volunteer.startDate || ''}
                                onChange={(e) => handleArrayInputChange('volunteerWork', index, { startDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                              </label>
                              <input
                                type="month"
                                value={volunteer.endDate || ''}
                                onChange={(e) => handleArrayInputChange('volunteerWork', index, { endDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                              </label>
                              <textarea
                                value={volunteer.description || ''}
                                onChange={(e) => handleArrayInputChange('volunteerWork', index, { description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Key Achievements
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {volunteer.achievements?.map((achievement, achievementIndex) => (
                                <div
                                  key={achievementIndex}
                                  className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                                >
                                  <span>{achievement}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAchievements = volunteer.achievements?.filter((_, i) => i !== achievementIndex);
                                      handleArrayInputChange('volunteerWork', index, { achievements: newAchievements });
                                    }}
                                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add achievement"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const newAchievement = input.value.trim();
                                    if (newAchievement) {
                                      const newAchievements = [...(volunteer.achievements || []), newAchievement];
                                      handleArrayInputChange('volunteerWork', index, { achievements: newAchievements });
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Achievements Section */}
                {activeSection === 'achievements' && (
                  <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Achievements & Certifications
                    </h2>

                    {/* Certifications */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Certifications
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('certifications', {
                            name: '',
                            issuer: '',
                            date: '',
                            expiryDate: '',
                            credentialId: '',
                            url: ''
                          })}
                          className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Add Certification
                        </button>
                      </div>

                      {(formData.certifications || []).map((cert, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Certification #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem('certifications', index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Certification Name
                              </label>
                              <input
                                type="text"
                                value={cert.name || ''}
                                onChange={(e) => handleArrayInputChange('certifications', index, { name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Issuing Organization
                              </label>
                              <input
                                type="text"
                                value={cert.issuer || ''}
                                onChange={(e) => handleArrayInputChange('certifications', index, { issuer: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Issue Date
                              </label>
                              <input
                                type="month"
                                value={cert.date || ''}
                                onChange={(e) => handleArrayInputChange('certifications', index, { date: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Expiry Date (Optional)
                              </label>
                              <input
                                type="month"
                                value={cert.expiryDate || ''}
                                onChange={(e) => handleArrayInputChange('certifications', index, { expiryDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Credential ID
                              </label>
                              <input
                                type="text"
                                value={cert.credentialId || ''}
                                onChange={(e) => handleArrayInputChange('certifications', index, { credentialId: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Credential URL
                              </label>
                              <input
                                type="url"
                                value={cert.url || ''}
                                onChange={(e) => handleArrayInputChange('certifications', index, { url: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Achievements */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Achievements
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('achievements', {
                            title: '',
                            date: '',
                            description: '',
                            issuer: ''
                          })}
                          className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Add Achievement
                        </button>
                      </div>

                      {(formData.achievements || []).map((achievement, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Achievement #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem('achievements', index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Achievement Title
                              </label>
                              <input
                                type="text"
                                value={achievement.title || ''}
                                onChange={(e) => handleArrayInputChange('achievements', index, { title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Date
                              </label>
                              <input
                                type="month"
                                value={achievement.date || ''}
                                onChange={(e) => handleArrayInputChange('achievements', index, { date: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Issuer/Organization
                              </label>
                              <input
                                type="text"
                                value={achievement.issuer || ''}
                                onChange={(e) => handleArrayInputChange('achievements', index, { issuer: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                              </label>
                              <textarea
                                value={achievement.description || ''}
                                onChange={(e) => handleArrayInputChange('achievements', index, { description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Languages */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Languages
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem('languages', {
                            name: '',
                            proficiency: 'beginner',
                            certifications: []
                          })}
                          className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          Add Language
                        </button>
                      </div>

                      {(formData.languages || []).map((language, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              Language #{index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem('languages', index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Language
                              </label>
                              <input
                                type="text"
                                value={language.name || ''}
                                onChange={(e) => handleArrayInputChange('languages', index, { name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Proficiency Level
                              </label>
                              <select
                                value={language.proficiency || 'beginner'}
                                onChange={(e) => handleArrayInputChange('languages', index, { proficiency: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="native">Native</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Language Certifications
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {language.certifications?.map((cert, certIndex) => (
                                <div
                                  key={certIndex}
                                  className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                                >
                                  <span>{cert}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCerts = language.certifications?.filter((_, i) => i !== certIndex);
                                      handleArrayInputChange('languages', index, { certifications: newCerts });
                                    }}
                                    className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <input
                                type="text"
                                placeholder="Add certification"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    const newCert = input.value.trim();
                                    if (newCert) {
                                      const newCerts = [...(language.certifications || []), newCert];
                                      handleArrayInputChange('languages', index, { certifications: newCerts });
                                      input.value = '';
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Career Preferences Section */}
                {activeSection === 'preferences' && (
                  <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Career Preferences
                    </h2>

                    {/* Career Goals */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Career Goals
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Short-term Goals
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(formData.careerGoals?.shortTerm || []).map((goal, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                            >
                              <span>{goal}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newGoals = formData.careerGoals?.shortTerm?.filter((_, i) => i !== index);
                                  handleInputChange('careerGoals', {
                                    ...formData.careerGoals,
                                    shortTerm: newGoals
                                  });
                                }}
                                className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <input
                            type="text"
                            placeholder="Add short-term goal"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                const newGoal = input.value.trim();
                                if (newGoal) {
                                  const newGoals = [...(formData.careerGoals?.shortTerm || []), newGoal];
                                  handleInputChange('careerGoals', {
                                    ...formData.careerGoals,
                                    shortTerm: newGoals
                                  });
                                  input.value = '';
                                }
                              }
                            }}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Long-term Goals
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(formData.careerGoals?.longTerm || []).map((goal, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                            >
                              <span>{goal}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newGoals = formData.careerGoals?.longTerm?.filter((_, i) => i !== index);
                                  handleInputChange('careerGoals', {
                                    ...formData.careerGoals,
                                    longTerm: newGoals
                                  });
                                }}
                                className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <input
                            type="text"
                            placeholder="Add long-term goal"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                const newGoal = input.value.trim();
                                if (newGoal) {
                                  const newGoals = [...(formData.careerGoals?.longTerm || []), newGoal];
                                  handleInputChange('careerGoals', {
                                    ...formData.careerGoals,
                                    longTerm: newGoals
                                  });
                                  input.value = '';
                                }
                              }
                            }}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Preferred Industries
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(formData.careerGoals?.preferredIndustries || []).map((industry, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                            >
                              <span>{industry}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newIndustries = formData.careerGoals?.preferredIndustries?.filter((_, i) => i !== index);
                                  handleInputChange('careerGoals', {
                                    ...formData.careerGoals,
                                    preferredIndustries: newIndustries
                                  });
                                }}
                                className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <input
                            type="text"
                            placeholder="Add industry"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                const newIndustry = input.value.trim();
                                if (newIndustry) {
                                  const newIndustries = [...(formData.careerGoals?.preferredIndustries || []), newIndustry];
                                  handleInputChange('careerGoals', {
                                    ...formData.careerGoals,
                                    preferredIndustries: newIndustries
                                  });
                                  input.value = '';
                                }
                              }
                            }}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Preferred Locations
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(formData.careerGoals?.preferredLocations || []).map((location, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                            >
                              <span>{location}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newLocations = formData.careerGoals?.preferredLocations?.filter((_, i) => i !== index);
                                  handleInputChange('careerGoals', {
                                    ...formData.careerGoals,
                                    preferredLocations: newLocations
                                  });
                                }}
                                className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <input
                            type="text"
                            placeholder="Add location"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                const newLocation = input.value.trim();
                                if (newLocation) {
                                  const newLocations = [...(formData.careerGoals?.preferredLocations || []), newLocation];
                                  handleInputChange('careerGoals', {
                                    ...formData.careerGoals,
                                    preferredLocations: newLocations
                                  });
                                  input.value = '';
                                }
                              }
                            }}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Work Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Work Preferences
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Employment Types
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['internship', 'part-time', 'full-time'].map((type) => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={(formData.workPreferences?.employmentTypes || []).includes(type as any)}
                                onChange={(e) => {
                                  const types = formData.workPreferences?.employmentTypes || [];
                                  const newTypes = e.target.checked
                                    ? [...types, type]
                                    : types.filter(t => t !== type);
                                  handleInputChange('workPreferences', {
                                    ...formData.workPreferences,
                                    employmentTypes: newTypes
                                  });
                                }}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                                {type.replace('-', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Remote Work Preference
                        </label>
                        <select
                          value={formData.workPreferences?.remotePreference || ''}
                          onChange={(e) => handleInputChange('workPreferences', {
                            ...formData.workPreferences,
                            remotePreference: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select preference</option>
                          <option value="onsite">On-site</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="remote">Remote</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Available From
                        </label>
                        <input
                          type="date"
                          value={formData.workPreferences?.availableFrom || ''}
                          onChange={(e) => handleInputChange('workPreferences', {
                            ...formData.workPreferences,
                            availableFrom: e.target.value
                          })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Minimum Salary
                          </label>
                          <input
                            type="number"
                            value={formData.workPreferences?.salaryExpectation?.minimum || ''}
                            onChange={(e) => handleInputChange('workPreferences', {
                              ...formData.workPreferences,
                              salaryExpectation: {
                                ...formData.workPreferences?.salaryExpectation,
                                minimum: parseInt(e.target.value)
                              }
                            })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Preferred Salary
                          </label>
                          <input
                            type="number"
                            value={formData.workPreferences?.salaryExpectation?.preferred || ''}
                            onChange={(e) => handleInputChange('workPreferences', {
                              ...formData.workPreferences,
                              salaryExpectation: {
                                ...formData.workPreferences?.salaryExpectation,
                                preferred: parseInt(e.target.value)
                              }
                            })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Currency
                          </label>
                          <select
                            value={formData.workPreferences?.salaryExpectation?.currency || ''}
                            onChange={(e) => handleInputChange('workPreferences', {
                              ...formData.workPreferences,
                              salaryExpectation: {
                                ...formData.workPreferences?.salaryExpectation,
                                currency: e.target.value
                              }
                            })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select currency</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="KZT">KZT</option>
                            <option value="RUB">RUB</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit; 