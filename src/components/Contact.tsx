import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 100,
      duration: 0.6
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

// Animated section component
const AnimatedSection = ({ children, className = "" }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.2 });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);
  
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animation for input fields when focused
const FloatingInput = ({ id, label, type = "text", value, onChange, placeholder = "", required = true, textarea = false }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <motion.div 
      className="mb-6 relative"
      variants={fadeInUp}
    >
      <label 
        htmlFor={id} 
        className={`absolute left-4 transition-all duration-300 pointer-events-none ${
          isFocused || value 
            ? 'text-xs text-blue-500 dark:text-blue-400 -top-2 bg-white dark:bg-slate-900 px-2' 
            : 'text-gray-500 dark:text-gray-400 top-3'
        }`}
      >
        {label}
      </label>
      
      {textarea ? (
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          required={required}
          rows={5}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 focus:ring-0 focus:border-blue-500 dark:focus:border-blue-400 text-gray-800 dark:text-white transition-colors duration-200"
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 focus:ring-0 focus:border-blue-500 dark:focus:border-blue-400 text-gray-800 dark:text-white transition-colors duration-200"
          placeholder={placeholder}
        />
      )}
    </motion.div>
  );
};

// Main Contact component
const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Simulate a delay for demonstration purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset form and show success message
      setFormData({ name: '', email: '', message: '' });
      setSubmitted(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setError('Не удалось отправить ваше сообщение. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map pin SVG icon
  const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );

  // Mail SVG icon
  const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  );

  // Clock SVG icon
  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-24 px-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/20 bg-[size:30px_30px] z-0 opacity-30"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-400/10 dark:bg-blue-400/5 blur-3xl z-0"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-400/5 blur-3xl z-0"></div>
      
      <div className="container max-w-6xl mx-auto relative z-10">
        <AnimatedSection className="text-center mb-16">
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-extrabold mb-6"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Связаться с нами
            </span>
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto"
          >
            Есть вопросы о JumysAL или нужна помощь в поиске подходящей стажировки? 
            Мы здесь, чтобы помочь! Свяжитесь с нами через форму или напрямую.
          </motion.p>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left side - Contact info */}
          <AnimatedSection className="lg:col-span-5 lg:sticky lg:top-24 h-max">
            <motion.div 
              variants={fadeInUp}
              className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/30"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                Контактная информация
              </h2>
              
              <div className="space-y-8">
                <motion.div 
                  variants={fadeInUp}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <MailIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Email</h3>
                    <a
                      href="mailto:jumysAL@gmail.com"
                      className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      jumysAL@gmail.com
                    </a>
                  </div>
                </motion.div>
                
                <motion.div 
                  variants={fadeInUp}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <MapPinIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Локация</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Алматы, Казахстан
                    </p>
                  </div>
                </motion.div>
                
                <motion.div 
                  variants={fadeInUp}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <ClockIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Рабочие часы</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Понедельник - Пятница: 9:00 - 18:00
                    </p>
                  </div>
                </motion.div>
              </div>
              
              <div className="mt-12">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                  Мы в соцсетях
                </h3>
                <div className="flex gap-4">
                  <motion.a 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="#" 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </motion.a>
                  
                  <motion.a 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="#" 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all text-slate-600 dark:text-slate-300 hover:text-[#4267B2] dark:hover:text-[#4267B2]"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                    </svg>
                  </motion.a>
                  
                  <motion.a 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="#" 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all text-slate-600 dark:text-slate-300 hover:text-[#0077b5] dark:hover:text-[#0077b5]"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                    </svg>
                  </motion.a>
                  
                  <motion.a 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    href="#" 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all text-slate-600 dark:text-slate-300 hover:text-[#E1306C] dark:hover:text-[#E1306C]"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
          
          {/* Right side - Contact form */}
          <AnimatedSection className="lg:col-span-7">
            <motion.div 
              variants={fadeInUp}
              className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/30"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                Отправьте нам сообщение
              </h2>
              
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 dark:from-green-500/20 dark:to-blue-500/20 backdrop-blur-md border border-green-500/20 dark:border-green-500/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Сообщение отправлено!</h3>
                      <p className="text-slate-600 dark:text-slate-300">Спасибо за ваше сообщение! Мы ответим вам в ближайшее время.</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400">
                      <div className="flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      {error}
                      </div>
                    </div>
                  )}
                  
                  <FloatingInput 
                      id="name"
                    label="Ваше имя" 
                      value={formData.name}
                      onChange={handleChange}
                    placeholder="Иван Иванов"
                  />
                  
                  <FloatingInput 
                    id="email" 
                    label="Email" 
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    placeholder="ivan@example.com"
                  />
                  
                  <FloatingInput 
                      id="message"
                    label="Ваше сообщение" 
                    textarea={true} 
                      value={formData.message}
                      onChange={handleChange}
                    placeholder="Напишите свой вопрос или пожелание..."
                    />
                  
                  <motion.div variants={fadeInUp}>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl flex items-center justify-center relative overflow-hidden group"
                      whileHover={{ 
                        boxShadow: "0 10px 20px -10px rgba(79, 70, 229, 0.4)"
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 transform group-hover:scale-[1.05] opacity-0 group-hover:opacity-100"></span>
                      
                      <span className="relative flex items-center">
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                            Отправка...
                        </>
                      ) : (
                        <>
                            Отправить сообщение
                            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </>
                      )}
                      </span>
                    </motion.button>
                  </motion.div>
                </form>
              )}
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/20"
            >
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Часто задаваемые вопросы
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Перед тем как связаться с нами, возможно, вы найдете ответы на ваши вопросы в разделе FAQ.
              </p>
              <a 
                href="/faq" 
                className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Перейти в FAQ
                <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default Contact; 