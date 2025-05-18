import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData } from '../types';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const animationStarted = useRef(false);

  useEffect(() => {
    if (!animationStarted.current) {
      animationStarted.current = true;
      document.body.classList.add('home-animation-active');
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const UnauthorizedContent = () => (
    <div className="relative min-h-screen bg-gray-50 dark:bg-dark overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-pulse"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-[10%] w-64 h-64 bg-primary/10 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-20"></div>
      <div className="absolute bottom-20 left-[5%] w-96 h-96 bg-accent/10 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-20"></div>
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero Section */}
        <div className="text-center animate-fadeInUp">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Student Jobs <span className="relative inline-block">
              Platform
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            JumysAL connects students with top employers in Kazakhstan, helping you find part-time jobs, internships, and entry-level positions that match your skills and schedule.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <Link
              to="/signup"
              className="relative rounded-xl group bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 h-full w-full scale-0 rounded-xl bg-white/20 transition-all duration-300 group-hover:scale-100"></div>
            </Link>
            <Link
              to="/jobs"
              className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary flex items-center transition-all duration-300 group"
            >
              Browse Jobs
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Stats section */}
        <div className="mt-16 flex justify-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {[
              { value: '500+', label: 'Job Listings' },
              { value: '200+', label: 'Employers' },
              { value: '2,000+', label: 'Students' },
              { value: '85%', label: 'Success Rate' },
            ].map((stat, index) => (
              <div key={index} className="text-center animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-32 relative">
          <div className="absolute -left-4 -top-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
            Key <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Features</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Job Matching',
                description: 'Find positions that match your skills, interests, and schedule.',
                icon: (
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                link: '/jobs'
              },
              {
                title: 'AI Resume Generator',
                description: 'Create a professional resume tailored to your target positions in seconds.',
                icon: (
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                link: '/resume-generator'
              },
              {
                title: 'AI Career Mentor',
                description: 'Get personalized career advice and interview preparation from our AI assistant.',
                icon: (
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                ),
                link: '/ai-mentor'
              }
            ].map((feature, index) => (
              <Link to={feature.link} key={index} className="group bg-white dark:bg-dark-lighter p-8 rounded-xl shadow-card hover:shadow-card-hover hover:translate-y-[-5px] transition-all duration-300 animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-lighter shadow-inner flex items-center justify-center">
                  {feature.icon}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">{feature.description}</p>
                <div className="w-1/3 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-6 transform group-hover:scale-x-110 transition-transform duration-300 origin-center"></div>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mt-32 relative">
          <div className="absolute -left-4 -top-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
            How It <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Works</span>
          </h2>
          
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 to-accent/40 hidden md:block"></div>
            
            <div className="space-y-12 relative">
              {[
                {
                  step: '01',
                  title: 'Create Your Profile',
                  description: 'Sign up and build your student profile with your education, skills, and experiences.',
                  icon: (
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )
                },
                {
                  step: '02',
                  title: 'Discover Opportunities',
                  description: 'Browse through job listings filtered to match your skills and preferences.',
                  icon: (
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  step: '03',
                  title: 'Apply with Confidence',
                  description: 'Use our AI Resume Generator to create a tailored resume and apply directly through the platform.',
                  icon: (
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                },
                {
                  step: '04',
                  title: 'Connect with Employers',
                  description: 'Chat directly with interested employers and schedule interviews through the platform.',
                  icon: (
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  )
                }
              ].map((step, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''} animate-fadeInUp`} style={{ animationDelay: `${index * 150}ms` }}>
                  <div className={`w-full md:w-1/2 px-4 ${index % 2 === 1 ? 'md:text-right' : ''}`}>
                    <div className="mb-2 text-sm font-semibold text-primary">{step.step}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                  </div>
                  
                  <div className="hidden md:flex md:w-20 justify-center relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg z-10">
                      {step.icon}
                    </div>
                  </div>
                  
                  <div className="hidden md:block w-full md:w-1/2 px-4"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials section */}
        <section className="mt-32 relative">
          <div className="absolute -left-4 -top-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
            Student <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Success Stories</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Aizhan K.",
                role: "Computer Science Student",
                company: "AlmaU",
                image: "https://randomuser.me/api/portraits/women/44.jpg",
                quote: "The AI Resume Generator helped me create a professional resume that highlighted my relevant skills. I landed an internship at a tech company within two weeks!"
              },
              {
                name: "Kanat B.",
                role: "Business Administration Student",
                company: "KBTU",
                image: "https://randomuser.me/api/portraits/men/32.jpg",
                quote: "JumysAL made it easy to find part-time work that fits around my class schedule. The direct messaging with employers saved me so much time."
              },
              {
                name: "Madina T.",
                role: "Graphic Design Student",
                company: "Kazakh Leading Academy of Architecture",
                image: "https://randomuser.me/api/portraits/women/68.jpg",
                quote: "The AI Career Mentor gave me personalized advice for my portfolio and interview preparation. I now have a great part-time job in my field."
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-dark-lighter rounded-xl shadow-card p-6 animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center mb-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h3>
                    <p className="text-sm text-primary">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <div className="relative">
                  <svg className="w-8 h-8 text-primary/20 absolute -top-4 -left-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-300 italic">{testimonial.quote}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-32 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] dark:opacity-[0.1] pointer-events-none"></div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Ready to start your career journey?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Join thousands of students who have found valuable work experience through JumysAL.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-3 bg-primary text-white font-medium rounded-lg shadow hover:bg-primary-dark transition-colors duration-300"
              >
                Sign Up Now
              </Link>
              <Link
                to="/jobs"
                className="px-8 py-3 bg-white dark:bg-dark text-primary font-medium rounded-lg shadow border border-primary hover:bg-primary/5 transition-colors duration-300"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gray-50 dark:from-dark to-transparent pointer-events-none"></div>
        <footer className="bg-white dark:bg-dark-lighter mt-32 pt-16 pb-12 border-t border-gray-100 dark:border-dark-border relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="animate-fadeInUp" style={{ animationDelay: '0ms' }}>
                <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">For Students</h4>
                <ul className="space-y-3">
                  <li><Link to="/jobs" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">Browse Jobs</Link></li>
                  <li><Link to="/resume-generator" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">Resume Generator</Link></li>
                  <li><Link to="/ai-mentor" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">AI Career Mentor</Link></li>
                </ul>
              </div>
              <div className="animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">For Employers</h4>
                <ul className="space-y-3">
                  <li><Link to="/post-job" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">Post a Job</Link></li>
                  <li><Link to="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Company</h4>
                <ul className="space-y-3">
                  <li><Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">About Us</Link></li>
                  <li><Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Legal</h4>
                <ul className="space-y-3">
                  <li><Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-dark-border text-center">
              <div className="mb-4">
                <Link to="/" className="flex items-center justify-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold shadow-md mx-auto">
                    J
                  </div>
                </Link>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                © 2024 <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent font-medium">JumysAL</span>. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );

  const AuthorizedContent = () => (
    <div className="relative min-h-screen bg-gray-50 dark:bg-dark overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-pulse"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-40 right-[10%] w-64 h-64 bg-primary/5 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-10"></div>
      <div className="absolute bottom-40 left-[5%] w-64 h-64 bg-accent/5 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-10"></div>
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fadeInUp">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{userData?.displayName || 'User'}</span>!
          </h1>
          {userData?.role === 'business' && (
            <Link
              to="/create-post"
              className="inline-flex items-center px-4 py-2 rounded-xl group bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Post</span>
              <div className="absolute inset-0 h-full w-full scale-0 rounded-xl bg-white/20 transition-all duration-300 group-hover:scale-100"></div>
            </Link>
          )}
        </div>

        {/* Featured tools section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tools for Success</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              to="/resume-generator"
              className="group flex flex-col bg-white dark:bg-dark-lighter p-6 rounded-xl shadow-card hover:shadow-card-hover hover:translate-y-[-5px] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Resume Generator</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create a professional, tailored resume in seconds with our AI-powered resume generator.
              </p>
              <div className="flex items-center text-primary mt-auto group-hover:font-medium">
                Create Resume
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>

                  <Link
              to="/ai-mentor"
              className="group flex flex-col bg-white dark:bg-dark-lighter p-6 rounded-xl shadow-card hover:shadow-card-hover hover:translate-y-[-5px] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Career Mentor</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Get personalized career advice, interview tips, and job search strategies from our AI assistant.
              </p>
              <div className="flex items-center text-primary mt-auto group-hover:font-medium">
                Talk to Mentor
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
                  </Link>

                  <Link
              to="/jobs"
              className="group flex flex-col bg-white dark:bg-dark-lighter p-6 rounded-xl shadow-card hover:shadow-card-hover hover:translate-y-[-5px] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Job Listings</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Browse the latest student job opportunities, internships, and part-time positions.
              </p>
              <div className="flex items-center text-primary mt-auto group-hover:font-medium">
                View Jobs
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
                  </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <Link
            to="/applications"
            className="group block bg-white dark:bg-dark-lighter p-6 rounded-xl shadow-card hover:shadow-card-hover hover:translate-y-[-5px] transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Applications</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Track the status of your job applications and manage your responses. Stay updated on your job search progress.
            </p>
            <div className="flex items-center text-primary group-hover:font-medium">
              View applications
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
                  </Link>

                  <Link
            to="/saved-jobs"
            className="group block bg-white dark:bg-dark-lighter p-6 rounded-xl shadow-card hover:shadow-card-hover hover:translate-y-[-5px] transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saved Jobs</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              View and manage your saved job listings. Keep track of positions you're interested in for later application.
            </p>
            <div className="flex items-center text-primary group-hover:font-medium">
              View saved jobs
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
                  </Link>
        </div>

        <div className="mt-16">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg mr-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Update Profile',
                icon: '👤',
                description: 'Keep your profile information up to date',
                link: '/profile',
                color: 'from-blue-500/10 to-blue-600/10'
              },
              {
                title: 'Contact Support',
                icon: '📧',
                description: 'Need help? Reach out to our support team',
                link: '/contact',
                color: 'from-green-500/10 to-green-600/10'
              },
              {
                title: 'About JumysAL',
                icon: 'ℹ️',
                description: 'Learn more about our mission and team',
                link: '/about',
                color: 'from-purple-500/10 to-purple-600/10'
              }
            ].map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="group bg-white dark:bg-dark-lighter p-6 rounded-xl shadow-card hover:shadow-card-hover hover:translate-y-[-5px] transition-all duration-300 relative overflow-hidden animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      </div>
    );

  return user ? (
    <AuthorizedContent />
  ) : (
    <UnauthorizedContent />
  );
};

export default Home;
