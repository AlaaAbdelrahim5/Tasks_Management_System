import React, { useEffect, useRef, useContext } from 'react';
import { Chart } from 'chart.js/auto';
import { ThemeContext } from '../App';

const DashboardChart = ({ 
  projectCount, 
  studentCount, 
  taskCount, 
  finishedProjectCount, 
  isStudent,
  darkMode: propDarkMode, // Allow direct prop passing for darkMode
  chartType = 'bar',      // Add chart type option
  data = null             // Add custom data option for Task visualization
}) => {
  // Use either provided darkMode prop or context
  const themeContext = useContext(ThemeContext);
  const darkMode = propDarkMode !== undefined ? propDarkMode : themeContext.darkMode;
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const initChart = () => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');

        // Destroy previous chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Define colors based on theme
        const textColor = darkMode ? '#e2e8f0' : '#333';
        const gridColor = darkMode ? 'rgba(100, 100, 100, 0.2)' : 'rgba(200, 200, 200, 0.2)';
        const tooltipBgColor = darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(0, 0, 0, 0.92)';        // Define labels and data
        let labels = [];
        let chartData = [];
        let backgroundColor = [];
        let borderColor = [];

        // Check if custom data is provided (for Tasks visualization)
        if (data) {
          // Use provided custom data
          labels = data.labels;
          chartData = data.values;
          backgroundColor = data.colors;
          borderColor = data.colors.map(color => color.replace('0.85', '1'));
        } else {
          // Use dashboard data
          // Always show projects, tasks, and finished projects
          labels.push('Number of Projects', 'Number of Tasks', 'Number of Finished Projects');
          chartData.push(projectCount, taskCount, finishedProjectCount);
          backgroundColor.push(
            darkMode ? 'rgba(100, 149, 237, 0.85)' : 'rgba(54, 162, 235, 0.85)',
            darkMode ? 'rgba(255, 193, 102, 0.85)' : 'rgba(255, 159, 64, 0.85)',
            darkMode ? 'rgba(102, 204, 204, 0.85)' : 'rgba(75, 192, 192, 0.85)'
          );
          borderColor.push(
            darkMode ? 'rgba(100, 149, 237, 1)' : 'rgba(54, 162, 235, 1)',
            darkMode ? 'rgba(255, 193, 102, 1)' : 'rgba(255, 159, 64, 1)',
            darkMode ? 'rgba(102, 204, 204, 1)' : 'rgba(75, 192, 192, 1)'
          );          // Only show student count if the user is not a student
          if (!isStudent) {
            labels.splice(1, 0, 'Number of Students');
            chartData.splice(1, 0, studentCount);
            backgroundColor.splice(1, 0, darkMode ? 'rgba(255, 138, 161, 0.85)' : 'rgba(255, 99, 132, 0.85)');
            borderColor.splice(1, 0, darkMode ? 'rgba(255, 138, 161, 1)' : 'rgba(255, 99, 132, 1)');
          }
        }
        
        // Create and store the chart instance
        chartInstance.current = new Chart(ctx, {
          type: chartType, // Use provided chart type or default to bar
          data: {
            labels: labels,
            datasets: [{
              label: data ? 'Task Status Distribution' : 'Dashboard Overview',
              data: chartData,
              backgroundColor: backgroundColor,
              borderColor: borderColor,
              borderWidth: 3,
              borderRadius: 12,
              maxBarThickness: 60,
              hoverBackgroundColor: backgroundColor.map(c => c.replace('0.85', '1')),
              hoverBorderColor: borderColor,
              barPercentage: 0.7,
              categoryPercentage: 0.6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 30,
                left: 20,
                right: 20,
                bottom: 10
              }
            },
            scales: {
              y: { 
                beginAtZero: true,
                grid: {
                  color: gridColor,
                  borderDash: [6, 4],
                  drawBorder: false,
                },
                ticks: {
                  color: textColor,
                  font: {
                    weight: 'bold',
                    size: 14,
                  },
                  padding: 8,
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: textColor,
                  font: {
                    weight: 'bold',
                    size: 14,
                  },
                  padding: 8,
                }
              }
            },
            plugins: {
              legend: { 
                display: true,
                labels: {
                  color: textColor,
                  font: {
                    weight: 'bold',
                    size: 15,
                  },
                  boxWidth: 18,
                  boxHeight: 18,
                  padding: 18,
                  usePointStyle: true,
                }
              },              title: {
                display: true,
                text: data 
                  ? 'Task Status Distribution' 
                  : (isStudent ? 'Student Dashboard Overview' : 'Admin Dashboard Overview'),
                font: {
                  size: 22,
                  weight: 'bold',
                  family: 'Segoe UI, Arial, sans-serif'
                },
                padding: {
                  top: 10,
                  bottom: 30
                },
                color: textColor
              },
              tooltip: {
                backgroundColor: tooltipBgColor,
                padding: 14,
                borderColor: darkMode ? '#64748b' : '#e2e8f0',
                borderWidth: 2,
                titleFont: {
                  weight: 'bold',
                  size: 16,
                  family: 'Segoe UI, Arial, sans-serif'
                },
                bodyFont: {
                  size: 15,
                  family: 'Segoe UI, Arial, sans-serif'
                },
                bodyColor: '#fff',
                titleColor: '#fff',
                cornerRadius: 8,
                caretSize: 8,
                displayColors: false,
              }
            },
            animation: {
              duration: 1200,
              easing: 'easeOutQuart'
            }
          }
        });
      }
    };

    initChart();

    // Handle window resize for responsive chart
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [projectCount, studentCount, taskCount, finishedProjectCount, isStudent, darkMode, chartType, data]);
  return (
    <div
      className={`p-4 rounded-2xl shadow-2xl transition-colors duration-300 border ${
        darkMode
          ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-blue-500'
          : 'bg-gradient-to-br from-white via-slate-100 to-slate-200 border-blue-400'
      }`}
      style={{
        height: data ? '360px' : '480px', // Smaller height for task chart
        minWidth: data ? '300px' : '340px', // More compact for task chart
        boxShadow: darkMode
          ? '0 8px 32px 0 rgba(30,41,59,0.45)'
          : '0 8px 32px 0 rgba(100,116,139,0.12)',
        transition: 'background 0.3s, box-shadow 0.3s',
        position: 'relative',
      }}
    >
      <canvas id="overviewChart" ref={chartRef} />
    </div>
  );
};

export default DashboardChart;