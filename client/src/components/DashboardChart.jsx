import React, { useEffect, useRef, useContext } from 'react';
import { Chart } from 'chart.js/auto';
import { ThemeContext } from '../App';

const DashboardChart = ({ projectCount, studentCount, taskCount, finishedProjectCount, isStudent }) => {
  const { darkMode } = useContext(ThemeContext);
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
        const tooltipBgColor = darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.8)';

        // Define labels and data based on user type
        let labels = [];
        let data = [];
        let backgroundColor = [];
        let borderColor = [];

        // Always show projects, tasks, and finished projects
        labels.push('Number of Projects', 'Number of Tasks', 'Number of Finished Projects');
        data.push(projectCount, taskCount, finishedProjectCount);
        backgroundColor.push(
          darkMode ? 'rgba(100, 149, 237, 0.7)' : 'rgba(54, 162, 235, 0.7)',
          darkMode ? 'rgba(255, 193, 102, 0.7)' : 'rgba(255, 159, 64, 0.7)',
          darkMode ? 'rgba(102, 204, 204, 0.7)' : 'rgba(75, 192, 192, 0.7)'
        );
        borderColor.push(
          darkMode ? 'rgba(100, 149, 237, 1)' : 'rgba(54, 162, 235, 1)',
          darkMode ? 'rgba(255, 193, 102, 1)' : 'rgba(255, 159, 64, 1)',
          darkMode ? 'rgba(102, 204, 204, 1)' : 'rgba(75, 192, 192, 1)'
        );

        // Only show student count if the user is not a student
        if (!isStudent) {
          labels.splice(1, 0, 'Number of Students');
          data.splice(1, 0, studentCount);
          backgroundColor.splice(1, 0, darkMode ? 'rgba(255, 138, 161, 0.7)' : 'rgba(255, 99, 132, 0.7)');
          borderColor.splice(1, 0, darkMode ? 'rgba(255, 138, 161, 1)' : 'rgba(255, 99, 132, 1)');
        }

        // Create and store the chart instance
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Dashboard Overview',
              data: data,
              backgroundColor: backgroundColor,
              borderColor: borderColor,
              borderWidth: 2,
              borderRadius: 6,
              maxBarThickness: 80
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { 
                beginAtZero: true,
                grid: {
                  color: gridColor
                },
                ticks: {
                  color: textColor,
                  font: {
                    weight: 'bold'
                  }
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: textColor,
                  font: {
                    weight: 'bold'
                  }
                }
              }
            },
            plugins: {
              legend: { 
                display: true,
                labels: {
                  color: textColor,
                  font: {
                    weight: 'bold'
                  }
                }
              },
              title: {
                display: true,
                text: isStudent ? 'Student Dashboard Overview' : 'Admin Dashboard Overview',
                font: {
                  size: 18,
                  weight: 'bold'
                },
                padding: {
                  top: 10,
                  bottom: 20
                },
                color: textColor
              },
              tooltip: {
                backgroundColor: tooltipBgColor,
                padding: 12,
                titleFont: {
                  weight: 'bold'
                },
                bodyColor: '#fff',
                titleColor: '#fff'
              }
            },
            animation: {
              duration: 1500,
              easing: 'easeInOutQuad'
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
  }, [projectCount, studentCount, taskCount, finishedProjectCount, isStudent, darkMode]);

  return (
    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ 
      height: '450px',
      background: darkMode 
        ? 'linear-gradient(to bottom right, #1e293b, #0f172a)' 
        : 'linear-gradient(to bottom right, #ffffff, #f7f9fc)'
    }}>
      <canvas id="overviewChart" ref={chartRef}></canvas>
    </div>
  );
};

export default DashboardChart;