import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';
import Sparkles from './Sparkles';

// SVG icons as React components
const IconArrowRight = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const IconAward = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7"></circle>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
  </svg>
);

const IconUsers = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconZap = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

// Анимационные варианты
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 100,
      duration: 0.8
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

// Компонент для анимированных заголовков
const AnimatedHeading = ({ children, className = "" }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);
  
  return (
    <motion.h2
      ref={ref}
      variants={fadeInUp}
      initial="hidden"
      animate={controls}
      className={`text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent 
                 bg-gradient-to-r from-blue-600 to-purple-600 mb-6 ${className}`}
    >
      {children}
    </motion.h2>
  );
};

// Компонент для анимированных секций
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

const CardItem = ({ icon, title, description, delay = 0 }) => (
  <motion.div
    variants={fadeInUp}
    className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/30 hover:shadow-blue-200/40 dark:hover:shadow-blue-900/40 transition-all duration-500 hover:-translate-y-2 group overflow-hidden"
  >
    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/5 rounded-full group-hover:scale-150 transition-all duration-700 ease-in-out"></div>
    <div className="absolute right-4 bottom-4 w-20 h-20 bg-purple-500/10 dark:bg-purple-500/5 rounded-full group-hover:scale-150 transition-all duration-700 ease-in-out"></div>
    
    <div className="relative">
      <div className="text-blue-600 dark:text-blue-400 mb-4 flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  </motion.div>
);

const StatNumber = ({ number, label, suffix = "+", delay = 0 }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.5 });
  
  useEffect(() => {
    if (isInView) {
      controls.start({
        scale: [0.5, 1.2, 1],
        opacity: [0, 1, 1],
        transition: { delay, duration: 0.6, ease: "easeOut" }
      });
    }
  }, [controls, isInView, delay]);
  
  return (
    <motion.div 
      ref={ref}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={controls}
      className="text-center p-6"
    >
      <h3 className="text-4xl md:text-5xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">{number}{suffix}</h3>
      <p className="text-slate-700 dark:text-slate-300 font-medium">{label}</p>
    </motion.div>
  );
};

const About = () => {
  const teamMembers = [
    {
      name: 'Талгатов Даниял',
      role: 'Основатель & Разработчик',
      image: '/assets/team/daniyal.jpg',
      bio: 'Ученик НИШ ХБН Алматы. Создал платформу JumysAL чтобы решить проблему поиска стажировок для школьников-программистов.',
      social: {
        linkedin: '#',
        twitter: '#',
        github: '#',
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-24 px-4 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-40">
        <Sparkles />
      </div>
      
      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <AnimatedSection className="text-center mb-24">
          <motion.div variants={fadeInUp}>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                О JumysAL
              </span>
            </h1>
            <div className="w-32 h-2 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-8"></div>
          </motion.div>
          
          <motion.p 
            variants={fadeInUp}
            className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mb-12"
          >
            Платформа, созданная школьником для школьников, чтобы помочь сделать первые шаги в IT-карьере
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-4"
          >
                <a 
                  href="/jobs" 
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105"
            >
              Исследовать возможности
              <IconArrowRight className="ml-2" />
            </a>
            <a 
              href="/signup" 
              className="inline-flex items-center px-8 py-4 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl font-medium shadow-lg hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:scale-105"
            >
              Присоединиться
            </a>
          </motion.div>
        </AnimatedSection>
        
        {/* Our Mission */}
        <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <motion.div variants={fadeInUp} className="order-2 md:order-1">
            <AnimatedHeading>Наша миссия</AnimatedHeading>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-slate-700 dark:text-slate-300 mb-6"
            >
              В JumysAL мы стремимся создать мост между талантливыми школьниками и IT-компаниями. Наша платформа служит катализатором для учеников, помогая получить ценный опыт работы, пока компании находят свежие и мотивированные таланты.
            </motion.p>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-slate-700 dark:text-slate-300 mb-6"
            >
              Мы верим, что каждый школьник заслуживает возможности применить свои знания на практике, развивая ключевые навыки, которые помогут в будущей карьере. Соединяя учеников с бизнесом, мы создаем экосистему, выгодную для всех сторон.
            </motion.p>
          </motion.div>
          
          <motion.div 
            variants={fadeInUp} 
            className="order-1 md:order-2 relative"
          >
            <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <img 
                src="/assets/jumysal-mission.jpg" 
                alt="JumysAL Миссия" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1740&auto=format&fit=crop";
                }}
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600/10 dark:bg-blue-600/5 rounded-full"></div>
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-purple-600/10 dark:bg-purple-600/5 rounded-full"></div>
          </motion.div>
        </AnimatedSection>
        
        {/* История */}
        <AnimatedSection className="mb-32">
          <div className="text-center mb-16">
            <AnimatedHeading>Наша история</AnimatedHeading>
          </div>
          
          <motion.div 
            variants={fadeInUp}
            className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-3xl shadow-xl p-8 md:p-12 border border-blue-100 dark:border-blue-900/30"
          >
            <div className="absolute -top-10 right-10 transform rotate-12 w-32 h-32 bg-blue-400/10 rounded-xl"></div>
            <div className="absolute bottom-10 -left-10 transform -rotate-12 w-24 h-24 bg-purple-400/10 rounded-xl"></div>
            
            <div className="relative space-y-6 text-lg text-slate-700 dark:text-slate-300">
              <p>
                Идея JumysAL родилась в 2025 году из личного опыта. Будучи учеником НИШ ХБН в Алматы, я столкнулся с трудностями поиска стажировки в IT-компаниях. Несмотря на серьезные знания программирования, многие компании отказывались брать школьников даже на неоплачиваемую практику.
              </p>
              <p>
                Проведя небольшое исследование, я обнаружил, что более 70% школьников-программистов сталкиваются с той же проблемой. В то же время, многие компании заинтересованы в поиске молодых талантов, но не знают, где их найти, и не готовы рисковать.
              </p>
              <p>
                Так появилась идея создать платформу, которая свяжет талантливых школьников с прогрессивными компаниями. Начав как небольшой проект для решения локальной проблемы, JumysAL быстро привлек внимание и поддержку сообщества.
              </p>
              <p>
                Что отличает JumysAL — это глубокое понимание проблем школьников и стремление создать поддерживающую среду для развития карьеры. Мы не просто доска объявлений — мы сообщество, которое ценит рост, обучение и сотрудничество.
              </p>
            </div>
          </motion.div>
        </AnimatedSection>
        
        {/* Статистика */}
        <AnimatedSection className="mb-32">
          <div className="text-center mb-16">
            <AnimatedHeading>Наше влияние</AnimatedHeading>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto"
            >
              За короткое время мы помогли множеству школьников начать свой путь в IT
            </motion.p>
          </div>
          
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 shadow-lg">
            <StatNumber number="250" label="Школьников на платформе" delay={0.1} />
            <StatNumber number="50" label="Компаний-партнеров" delay={0.2} />
            <StatNumber number="120" label="Успешных стажировок" delay={0.3} />
            <StatNumber number="85" suffix="%" label="Школьников нашли работу" delay={0.4} />
          </motion.div>
        </AnimatedSection>
        
        {/* Наши ценности */}
        <AnimatedSection className="mb-32">
          <div className="text-center mb-16">
            <AnimatedHeading>Наши ценности</AnimatedHeading>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CardItem 
              icon={<IconUsers size={32} />}
              title="Сообщество"
              description="Мы верим в силу сообщества и взаимопомощи. Наша платформа создана для укрепления связей и создания поддерживающей среды для школьников и компаний."
            />
            <CardItem 
              icon={<IconAward size={32} />}
              title="Качество"
              description="Мы поддерживаем высокие стандарты для возможностей на нашей платформе, гарантируя, что школьники получают доступ к значимому опыту, который способствует их профессиональному росту."
            />
            <CardItem 
              icon={<IconZap size={32} />}
              title="Инновации"
              description="Мы используем технологии и инновации для создания эффективной платформы. Наш ИИ-помощник — лишь один пример того, как мы применяем технологии для улучшения пользовательского опыта."
            />
          </div>
        </AnimatedSection>
        
        {/* Команда */}
        <AnimatedSection className="mb-32">
          <div className="text-center mb-16">
            <AnimatedHeading>Наша команда</AnimatedHeading>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto"
            >
              Познакомьтесь с увлеченными людьми, стоящими за JumysAL. 
            </motion.p>
          </div>
          
          <div className="flex justify-center">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="max-w-md bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                <div className="h-72 overflow-hidden relative">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D8ABC&color=fff&size=256`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-6 text-white">
                    <h3 className="text-2xl font-bold">{member.name}</h3>
                    <p className="text-blue-300">{member.role}</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-700 dark:text-slate-300 mb-6">{member.bio}</p>
                  <div className="flex space-x-4">
                    <a href={member.social.github} className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                    <a href={member.social.linkedin} className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
        
        {/* CTA */}
        <AnimatedSection>
          <motion.div 
            variants={fadeInUp}
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl px-8 py-16 text-center text-white overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-white/10 bg-[size:30px_30px]"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Присоединяйтесь к нашей миссии</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10 relative z-10">
              Независимо от того, школьник вы, ищущий возможности, или компания, ищущая свежие таланты, 
              JumysAL здесь, чтобы помочь вам добиться успеха. Присоединяйтесь к нашему растущему сообществу сегодня!
            </p>
            <div className="flex flex-wrap justify-center gap-6 relative z-10">
              <a 
                href="/signup" 
                className="px-8 py-4 bg-white text-blue-600 font-medium rounded-xl shadow-lg shadow-blue-700/30 hover:shadow-blue-700/50 transition-all duration-300 hover:scale-105"
              >
                Зарегистрироваться
            </a>
            <a 
              href="/contact" 
                className="px-8 py-4 bg-transparent text-white font-medium rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
                Связаться с нами
            </a>
          </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default About; 