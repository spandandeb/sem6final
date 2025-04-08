import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Feedback {
  id: string;
  eventId: string;
  eventName: string;
  rating: number;
  eventExperience: number;
  speakerInteraction: number;
  sessionRelevance: number;
  suggestions: string;
  createdAt: string;
  userId?: string; // Add userId field for tracking unique users
}

const Analytics: React.FC = () => {
  const [feedbackData, setFeedbackData] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'details'>('overview');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:5000/api/feedback');
        // Filter out any feedback entries with invalid or missing ratings
        const validFeedback = response.data.filter((feedback: Feedback) => (
          feedback.rating > 0 && 
          feedback.eventExperience > 0 && 
          feedback.speakerInteraction > 0 && 
          feedback.sessionRelevance > 0
        ));
        setFeedbackData(validFeedback);
        setError(null);
      } catch (err) {
        console.error('Error fetching feedback data:', err);
        setError('Failed to load feedback data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbackData();
  }, []);

  const calculateAverages = () => {
    if (feedbackData.length === 0) {
      return {
        rating: 0,
        eventExperience: 0,
        speakerInteraction: 0,
        sessionRelevance: 0
      };
    }

    const validFeedbacks = feedbackData.filter(feedback => 
      !isNaN(feedback.rating) && 
      !isNaN(feedback.eventExperience) && 
      !isNaN(feedback.speakerInteraction) && 
      !isNaN(feedback.sessionRelevance)
    );

    if (validFeedbacks.length === 0) {
      return {
        rating: 0,
        eventExperience: 0,
        speakerInteraction: 0,
        sessionRelevance: 0
      };
    }

    const sum = validFeedbacks.reduce(
      (acc, feedback) => ({
        rating: acc.rating + (feedback.rating || 0),
        eventExperience: acc.eventExperience + (feedback.eventExperience || 0),
        speakerInteraction: acc.speakerInteraction + (feedback.speakerInteraction || 0),
        sessionRelevance: acc.sessionRelevance + (feedback.sessionRelevance || 0),
      }),
      { rating: 0, eventExperience: 0, speakerInteraction: 0, sessionRelevance: 0 }
    );

    const count = validFeedbacks.length;
    return {
      rating: Number((sum.rating / count).toFixed(1)) || 0,
      eventExperience: Number((sum.eventExperience / count).toFixed(1)) || 0,
      speakerInteraction: Number((sum.speakerInteraction / count).toFixed(1)) || 0,
      sessionRelevance: Number((sum.sessionRelevance / count).toFixed(1)) || 0,
    };
  };

  const getAveragesByEvent = () => {
    const eventMap = new Map();
    
    // Get event details from localStorage to ensure proper names
    const storedEventDetails = localStorage.getItem('eventDetails');
    let eventDetailsMap: Record<string, { title?: string; type?: string }> = {};
    
    if (storedEventDetails) {
      try {
        eventDetailsMap = JSON.parse(storedEventDetails);
      } catch (e) {
        console.error('Error parsing stored event details:', e);
      }
    }

    feedbackData.forEach(feedback => {
      if (!eventMap.has(feedback.eventId)) {
        // Use event name from localStorage if available
        const storedEvent = eventDetailsMap[feedback.eventId];
        const eventName = storedEvent?.title || feedback.eventName || 'Unknown Event';
        
        eventMap.set(feedback.eventId, {
          eventId: feedback.eventId,
          eventName: eventName,
          ratings: [],
          eventExperiences: [],
          speakerInteractions: [],
          sessionRelevances: [],
          count: 0,
          userIds: new Set(), // Track unique users who provided feedback
          suggestions: [] // Store suggestions for word cloud
        });
      }

      const eventData = eventMap.get(feedback.eventId);
      if (!isNaN(feedback.rating)) eventData.ratings.push(feedback.rating);
      if (!isNaN(feedback.eventExperience)) eventData.eventExperiences.push(feedback.eventExperience);
      if (!isNaN(feedback.speakerInteraction)) eventData.speakerInteractions.push(feedback.speakerInteraction);
      if (!isNaN(feedback.sessionRelevance)) eventData.sessionRelevances.push(feedback.sessionRelevance);
      
      // Track unique users (using a Set to avoid duplicates)
      if (feedback.userId) eventData.userIds.add(feedback.userId);
      
      // Store suggestions for word cloud analysis
      if (feedback.suggestions) eventData.suggestions.push(feedback.suggestions);
      
      eventData.count++;
    });

    return Array.from(eventMap.values()).map(event => {
      const calculateAverage = (arr: number[]) => {
        if (arr.length === 0) return 0;
        const sum = arr.reduce((a, b) => a + b, 0);
        return Number((sum / arr.length).toFixed(1));
      };

      // Calculate rating distributions for more detailed analysis
      const getRatingDistribution = (arr: number[]) => {
        const distribution = [0, 0, 0, 0, 0]; // 5 possible ratings (1-5)
        arr.forEach(rating => {
          if (rating >= 1 && rating <= 5) {
            distribution[Math.floor(rating) - 1]++;
          }
        });
        return distribution;
      };

      return {
        eventId: event.eventId,
        eventName: event.eventName,
        avgRating: calculateAverage(event.ratings),
        avgEventExperience: calculateAverage(event.eventExperiences),
        avgSpeakerInteraction: calculateAverage(event.speakerInteractions),
        avgSessionRelevance: calculateAverage(event.sessionRelevances),
        count: event.count,
        uniqueUsers: event.userIds.size,
        ratingDistribution: getRatingDistribution(event.ratings),
        suggestions: event.suggestions,
        // Calculate sentiment score based on ratings (simple approach)
        sentimentScore: calculateAverage(event.ratings) / 5 * 100
      };
    });
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // For ratings 1-5

    feedbackData.forEach(feedback => {
      const rating = Math.round(feedback.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating - 1]++;
      }
    });

    return [
      { name: '1 Star', value: distribution[0] },
      { name: '2 Stars', value: distribution[1] },
      { name: '3 Stars', value: distribution[2] },
      { name: '4 Stars', value: distribution[3] },
      { name: '5 Stars', value: distribution[4] },
    ];
  };

  const averages = calculateAverages();
  const eventAverages = getAveragesByEvent();

  const overviewData = [
    { name: 'Overall Rating', value: averages.rating },
    { name: 'Event Experience', value: averages.eventExperience },
    { name: 'Speaker Interaction', value: averages.speakerInteraction },
    { name: 'Session Relevance', value: averages.sessionRelevance },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {overviewData.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">{item.name}</h3>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-indigo-600">{item.value}</p>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-5 h-5 ${
                      i < Math.round(item.value) ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.869 1.4-8.168L.132 9.21l8.2-1.192z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getRatingDistribution()}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }: { name: string; percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getRatingDistribution().map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Metrics Comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderEventsTab = () => {
    // Calculate the total number of unique users across all events
    const totalUniqueUsers = eventAverages.reduce((total, event) => total + (event.uniqueUsers || 0), 0);
    
    // Sort events by average rating for better visualization
    const sortedEvents = [...eventAverages].sort((a, b) => b.avgRating - a.avgRating);
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Feedback Card */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Feedback</h3>
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{feedbackData.length}</p>
                <p className="text-sm text-gray-500">Total responses</p>
              </div>
            </div>
          </div>
          
          {/* Unique Users Card */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unique Users</h3>
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalUniqueUsers}</p>
                <p className="text-sm text-gray-500">Unique participants</p>
              </div>
            </div>
          </div>
          
          {/* Average Rating Card */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Overall Satisfaction</h3>
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {calculateAverages().rating} / 5
                </p>
                <p className="text-sm text-gray-500">Average rating</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Event Comparison Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Event Comparison</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedEvents.slice(0, 10)} // Show top 10 events for better readability
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="eventName" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip 
                  formatter={(value) => [`${value}`, '']}
                  labelFormatter={(label) => `Event: ${label}`}
                />
                <Legend />
                <Bar dataKey="avgRating" name="Overall Rating" fill="#8884d8" />
                <Bar dataKey="avgEventExperience" name="Event Experience" fill="#82ca9d" />
                <Bar dataKey="avgSpeakerInteraction" name="Speaker Interaction" fill="#ffc658" />
                <Bar dataKey="avgSessionRelevance" name="Session Relevance" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Participation by Event */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Participation by Event</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedEvents.slice(0, 10)}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="eventName" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uniqueUsers" name="Unique Users" fill="#8884d8" />
                <Bar dataKey="count" name="Total Responses" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Event Sentiment Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedEvents.slice(0, 6).map((event, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">{event.eventName}</h4>
                <div className="flex items-center mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${event.sentimentScore >= 80 ? 'bg-green-500' : event.sentimentScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${event.sentimentScore}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">{event.sentimentScore.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Responses: {event.count}</span>
                  <span>Avg Rating: {event.avgRating}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Events Table */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Events Feedback Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exp. Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speaker Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relevance Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEvents.map((event, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.eventName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.uniqueUsers || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.avgRating}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.avgEventExperience}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.avgSpeakerInteraction}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.avgSessionRelevance}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.sentimentScore >= 80 ? 'bg-green-100 text-green-800' : event.sentimentScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {event.sentimentScore >= 80 ? 'Positive' : event.sentimentScore >= 60 ? 'Neutral' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsTab = () => (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Feedback</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feedbackData.map((feedback, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{feedback.eventName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-4 h-4 ${
                          i < feedback.rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.869 1.4-8.168L.132 9.21l8.2-1.192z" />
                      </svg>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {feedback.suggestions || <span className="text-gray-400 italic">No suggestions provided</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-lg text-center">
          <p className="font-medium mb-2">Error Loading Data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (feedbackData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Feedback Data Available</h2>
          <p className="text-gray-500">Start collecting feedback from events and mentorship sessions to see analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Feedback Analytics</h1>
        <p className="mt-2 text-gray-600">View and analyze feedback from events and mentorship sessions.</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'events', 'details'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'overview' | 'events' | 'details')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'events' && renderEventsTab()}
      {activeTab === 'details' && renderDetailsTab()}
    </div>
  );
};

export default Analytics;
