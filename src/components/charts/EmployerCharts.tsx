import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

interface ChartProps {
  data: any;
  options?: any;
}

// Line chart for application trend
export const ApplicationTrendChart: React.FC<ChartProps> = ({ data, options }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear',
        from: 0.8,
        to: 0.2,
        loop: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(160, 174, 192, 0.1)',
        },
        ticks: {
          color: '#718096',
        }
      },
      x: {
        grid: {
          color: 'rgba(160, 174, 192, 0.1)',
        },
        ticks: {
          color: '#718096',
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#4A5568',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(79, 70, 229, 0.9)',
        titleColor: '#FFF',
        bodyColor: '#FFF',
        cornerRadius: 8,
        padding: 12,
      }
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full h-64"
    >
      <Line data={data} options={options || defaultOptions} />
    </motion.div>
  );
};

// Bar chart for applications by job
export const ApplicationsByJobChart: React.FC<ChartProps> = ({ data, options }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(160, 174, 192, 0.1)',
        },
        ticks: {
          color: '#718096',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#718096',
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(124, 58, 237, 0.9)',
        titleColor: '#FFF',
        bodyColor: '#FFF',
        cornerRadius: 8,
        padding: 12,
      }
    },
    animation: {
      duration: 1000,
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="w-full h-64"
    >
      <Bar data={data} options={options || defaultOptions} />
    </motion.div>
  );
};

// Doughnut chart for candidate sources
export const CandidateSourcesChart: React.FC<ChartProps> = ({ data, options }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#4A5568',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(66, 153, 225, 0.9)',
        titleColor: '#FFF',
        bodyColor: '#FFF',
        cornerRadius: 8,
        padding: 12,
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full h-64 relative"
    >
      <Doughnut data={data} options={options || defaultOptions} />
      {data.total && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{data.total}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Всего</span>
        </div>
      )}
    </motion.div>
  );
};

// Conversion funnel chart
export const ConversionFunnelChart: React.FC<{
  data: {
    views: number;
    applications: number;
    interviews: number;
    offers: number;
  }
}> = ({ data }) => {
  const { views, applications, interviews, offers } = data;
  const maxValue = Math.max(views, applications, interviews, offers);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full h-64 py-4"
    >
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center gap-4">
          <div style={{ width: `${(views / maxValue) * 100}%`, maxWidth: '100%' }} className="h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-r-lg"></div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800 dark:text-white">{views} просмотров</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">100%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div style={{ width: `${(applications / maxValue) * 100}%`, maxWidth: '100%' }} className="h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-r-lg"></div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800 dark:text-white">{applications} заявок</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round((applications / views) * 100)}%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div style={{ width: `${(interviews / maxValue) * 100}%`, maxWidth: '100%' }} className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-r-lg"></div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800 dark:text-white">{interviews} интервью</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round((interviews / views) * 100)}%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div style={{ width: `${(offers / maxValue) * 100}%`, maxWidth: '100%' }} className="h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-r-lg"></div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800 dark:text-white">{offers} предложений</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round((offers / views) * 100)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 