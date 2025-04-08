import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Filter, User, MapPin, Clock, ArrowRight, CheckCircle, MessageSquare } from 'lucide-react';
import { eventAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FeedbackForm from '../components/FeedbackForm';

interface Event {
  _id: string;
  title: string;
  description: string;
  type: 'mentoring_session' | 'workshop' | 'webinar' | 'networking';
  startTime: string;
  endTime: string;
  location: string;
  meetingLink?: string;
  capacity: number;
  organizer: {
    _id: string;
    name: string;
    email: string;
  };
  attendees: {
    user: {
      _id: string;
      name: string;
      email: string;
    };
    status: 'registered' | 'attended' | 'cancelled';
    registeredAt: string;
  }[];
  attendeeCount: number;
  availableSpots: number;
  isFull: boolean;
  tags: string[];
  imageUrl?: string;
}

interface EventFormData {
  title: string;
  description: string;
  type: 'mentoring_session' | 'workshop' | 'webinar' | 'networking';
  startTime: string;
  endTime: string;
  location: string;
  meetingLink: string;
  capacity: number;
  tags: string;
  imageUrl: string;
}

const EventsPage: React.FC = () => {
  console.log("EventsPage component rendering");
  
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('upcoming');
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'mentoring_session',
    startTime: '',
    endTime: '',
    location: '',
    meetingLink: '',
    capacity: 10,
    tags: '',
    imageUrl: ''
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState<boolean>(false);
  const [registrationStatus, setRegistrationStatus] = useState<{
    loading: boolean;
    success: string | null;
    error: string | null;
  }>({
    loading: false,
    success: null,
    error: null
  });

  // State for locally stored registered events
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [currentEventIdForFeedback, setCurrentEventIdForFeedback] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load registered events from localStorage
    const storedRegistrations = localStorage.getItem('registeredEvents');
    if (storedRegistrations) {
      setRegisteredEvents(JSON.parse(storedRegistrations));
    }
  }, []);

  const fetchEvents = async () => {
    try {
      console.log("Attempting to fetch events");
      setLoading(true);
      setError(null);
      
      // Use our centralized API service
      const params: any = {};
      
      if (filter === 'upcoming') {
        params.upcoming = true;
      } else if (filter === 'past') {
        params.past = true;
      } else if (filter.startsWith('type:')) {
        params.type = filter.split(':')[1];
      }
      
      try {
        // Test the API connection, if it fails we'll still show the UI
        const response = await eventAPI.getEvents(params);
        console.log('API response received:', response);
        setEvents(response.data || []);
      } catch (apiError) {
        console.error('API connection failed:', apiError);
        // Set empty data but don't show error to user
        setEvents([]);
      }
    } catch (err) {
      console.error('Error in fetchEvents function:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      console.log('Create Event - Auth token exists:', !!token);
      
      if (!token) {
        console.error('Authentication required - No token found');
        setError('You must be logged in to create an event. Please log in and try again.');
        return;
      }
      
      // Validate form data
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }
      
      if (!formData.description.trim()) {
        setError('Description is required');
        return;
      }
      
      if (!formData.startTime) {
        setError('Start time is required');
        return;
      }
      
      if (!formData.endTime) {
        setError('End time is required');
        return;
      }
      
      if (!formData.location.trim()) {
        setError('Location is required');
        return;
      }
      
      if (formData.location.toLowerCase() === 'online' && !formData.meetingLink.trim()) {
        setError('Meeting link is required for online events');
        return;
      }
      
      if (!formData.capacity || formData.capacity <= 0) {
        setError('Capacity must be a positive number');
        return;
      }
      
      // Convert tags string to array
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const eventData = {
        ...formData,
        tags: tagsArray
      };
      
      console.log('Submitting event data:', eventData);
      
      try {
        const response = await eventAPI.createEvent(eventData);
        console.log('Event created successfully:', response.data);
        
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          type: 'mentoring_session',
          startTime: '',
          endTime: '',
          location: '',
          meetingLink: '',
          capacity: 10,
          tags: '',
          imageUrl: ''
        });
        
        // Refresh events list
        fetchEvents();
      } catch (apiError: any) {
        console.error('API error creating event:', apiError);
        setError(apiError.response?.data?.message || 'Failed to create event. Please try again.');
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Failed to create event. Please try again.');
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      setRegistrationStatus({
        loading: true,
        success: null,
        error: null
      });
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setRegistrationStatus({
          loading: false,
          success: null,
          error: 'You must be logged in to register for events'
        });
        return;
      }
      
      // Instead of calling the API, store in localStorage
      const updatedRegistrations = [...registeredEvents, eventId];
      localStorage.setItem('registeredEvents', JSON.stringify(updatedRegistrations));
      setRegisteredEvents(updatedRegistrations);
      
      // Store event details in localStorage for reference
      const currentEvent = events.find(e => e._id === eventId);
      if (currentEvent) {
        // Get existing event details or initialize empty object
        const storedEventDetails = localStorage.getItem('eventDetails');
        let eventDetailsMap: Record<string, any> = {};
        
        if (storedEventDetails) {
          try {
            eventDetailsMap = JSON.parse(storedEventDetails);
          } catch (e) {
            console.error('Error parsing stored event details:', e);
          }
        }
        
        // Add or update this event's details
        eventDetailsMap[eventId] = {
          title: currentEvent.title,
          type: currentEvent.type,
          startTime: currentEvent.startTime,
          endTime: currentEvent.endTime,
          location: currentEvent.location
        };
        
        // Save back to localStorage
        localStorage.setItem('eventDetails', JSON.stringify(eventDetailsMap));
      }
      
      setRegistrationStatus({
        loading: false,
        success: 'Successfully registered for the event!',
        error: null
      });
      
      // Set a message to display on the event card
      setRegistrationMessage('Successfully registered!');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setRegistrationMessage(null);
      }, 3000);
      
      // Refresh events list
      fetchEvents();
    } catch (err: any) {
      console.error('Error registering for event:', err);
      setRegistrationStatus({
        loading: false,
        success: null,
        error: 'Failed to register. Please try again.'
      });
    }
  };

  const cancelRegistration = async (eventId: string) => {
    try {
      setRegistrationStatus({
        loading: true,
        success: null,
        error: null
      });
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setRegistrationStatus({
          loading: false,
          success: null,
          error: 'You must be logged in to cancel registration'
        });
        return;
      }
      
      await eventAPI.cancelRegistration(eventId);
      
      setRegistrationStatus({
        loading: false,
        success: 'Registration cancelled successfully',
        error: null
      });
      
      // Refresh events list and selected event details
      fetchEvents();
      if (selectedEvent) {
        const updatedEvent = await eventAPI.getEventById(eventId);
        setSelectedEvent(updatedEvent.data);
      }
    } catch (err: any) {
      console.error('Error cancelling registration:', err);
      setRegistrationStatus({
        loading: false,
        success: null,
        error: err.response?.data?.message || 'Failed to cancel registration. Please try again.'
      });
    }
  };

  const viewEventDetails = async (eventId: string) => {
    try {
      setLoading(true);
      const response = await eventAPI.getEventById(eventId);
      setSelectedEvent(response.data);
      setShowEventDetails(true);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to load event details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'mentoring_session': return 'Mentoring Session';
      case 'workshop': return 'Workshop';
      case 'webinar': return 'Webinar';
      case 'networking': return 'Networking Event';
      default: return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'mentoring_session': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'webinar': return 'bg-green-100 text-green-800';
      case 'networking': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user is registered for an event
  const isUserRegistered = (event: Event) => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    // Check if event ID is in the registeredEvents array in localStorage
    return registeredEvents.includes(event._id);
  };

  // Open feedback form for an event
  const openFeedbackForm = (eventId: string) => {
    setCurrentEventIdForFeedback(eventId);
    setShowFeedbackModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Calendar</h1>
          <p className="text-gray-600 mt-2">
            Browse and register for upcoming events, workshops, and mentoring sessions
          </p>
        </div>
        {isAuthenticated && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-8 mb-8 text-center">
        <CalendarIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Event Management Page</h2>
        <p className="text-gray-600">
          This page is now loading. If you see this message, the page is rendering correctly.
          The full functionality will be available once the API is connected.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-md ${filter === 'upcoming' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-md ${filter === 'past' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Past Events
          </button>
          <button 
            onClick={() => setFilter('type:mentoring_session')}
            className={`px-4 py-2 rounded-md ${filter === 'type:mentoring_session' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Mentoring Sessions
          </button>
          <button 
            onClick={() => setFilter('type:workshop')}
            className={`px-4 py-2 rounded-md ${filter === 'type:workshop' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Workshops
          </button>
          <button 
            onClick={() => setFilter('type:webinar')}
            className={`px-4 py-2 rounded-md ${filter === 'type:webinar' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Webinars
          </button>
          <button 
            onClick={() => setFilter('type:networking')}
            className={`px-4 py-2 rounded-md ${filter === 'type:networking' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Networking
          </button>
        </div>
      </div>

      {/* Events list */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading events...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No events found</h2>
          <p className="text-gray-500">
            {filter === 'upcoming' 
              ? 'There are no upcoming events scheduled at the moment.'
              : filter === 'past'
                ? 'There are no past events in the system.'
                : 'No events found with the current filters.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {event.imageUrl ? (
                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${event.imageUrl})` }} />
              ) : (
                <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <CalendarIcon className="h-16 w-16 text-white opacity-75" />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getEventTypeColor(event.type)}`}>
                    {getEventTypeLabel(event.type)}
                  </span>
                  {event.isFull && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Full
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    <div>
                      <div>{new Date(event.startTime).toLocaleDateString()}</div>
                      <div>{new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-2" />
                    <span>{event.attendeeCount} / {event.capacity} registered</span>
                  </div>
                </div>
                
                <button
                  onClick={() => viewEventDetails(event._id)}
                  className="w-full bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center mt-2 mb-2"
                >
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
                
                {isAuthenticated && (
                  <div className="flex space-x-2 mt-2">
                    {isUserRegistered(event) ? (
                      <button
                        className="flex-1 bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center justify-center cursor-default"
                        disabled
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Registered
                      </button>
                    ) : (
                      <button
                        onClick={() => registerForEvent(event._id)}
                        disabled={event.isFull}
                        className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center transition ${event.isFull ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      >
                        {event.isFull ? 'Full' : 'Register'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => openFeedbackForm(event._id)}
                      className="flex-1 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition flex items-center justify-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Feedback
                    </button>
                  </div>
                )}
                
                {registrationMessage && event._id === selectedEvent?._id && (
                  <div className="mt-2 bg-green-100 text-green-800 p-2 rounded-lg text-center text-sm">
                    {registrationMessage}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Form Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Event Feedback</h2>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <FeedbackForm 
              eventId={currentEventIdForFeedback || ''}
              onClose={() => setShowFeedbackModal(false)}
            />
          </div>
        </div>
      )}

      {/* Event Creation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="mentoring_session">Mentoring Session</option>
                    <option value="workshop">Workshop</option>
                    <option value="webinar">Webinar</option>
                    <option value="networking">Networking Event</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Physical location or 'Online'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                {formData.location.toLowerCase() === 'online' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                    <input
                      type="url"
                      name="meetingLink"
                      value={formData.meetingLink}
                      onChange={handleFormChange}
                      placeholder="https://zoom.us/j/1234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleFormChange}
                    placeholder="career, resume, interview, tech"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleFormChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
              <button 
                onClick={() => setShowEventDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {selectedEvent.imageUrl && (
                <div className="h-56 bg-cover bg-center rounded-lg" style={{ backgroundImage: `url(${selectedEvent.imageUrl})` }} />
              )}
              
              <div className="flex flex-wrap gap-2">
                <span className={`text-sm font-medium px-3 py-1 rounded ${getEventTypeColor(selectedEvent.type)}`}>
                  {getEventTypeLabel(selectedEvent.type)}
                </span>
                {selectedEvent.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Event Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-3 text-indigo-600" />
                      <div>
                        <div><strong>Date:</strong> {new Date(selectedEvent.startTime).toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {new Date(selectedEvent.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedEvent.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-3 text-indigo-600" />
                      <div>
                        <div><strong>Location:</strong> {selectedEvent.location}</div>
                        {selectedEvent.meetingLink && (
                          <div>
                            <strong>Meeting Link:</strong>{' '}
                            <a 
                              href={selectedEvent.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedEvent.meetingLink}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <User className="h-5 w-5 mr-3 text-indigo-600" />
                      <div>
                        <div><strong>Organizer:</strong> {selectedEvent.organizer.name}</div>
                        <div><strong>Capacity:</strong> {selectedEvent.attendeeCount} / {selectedEvent.capacity} registered</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Registration</h3>
                  {isAuthenticated ? (
                    <>
                      {isUserRegistered(selectedEvent) ? (
                        <div>
                          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4">
                            You are registered for this event.
                          </div>
                          <button
                            onClick={() => cancelRegistration(selectedEvent._id)}
                            className="w-full bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                            disabled={registrationStatus.loading}
                          >
                            {registrationStatus.loading ? 'Processing...' : 'Cancel Registration'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => registerForEvent(selectedEvent._id)}
                          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={selectedEvent.isFull || registrationStatus.loading}
                        >
                          {registrationStatus.loading ? 'Processing...' : selectedEvent.isFull ? 'Event is Full' : 'Register Now'}
                        </button>
                      )}
                      
                      {registrationStatus.success && (
                        <div className="mt-4 bg-green-100 text-green-800 p-4 rounded-lg">
                          {registrationStatus.success}
                        </div>
                      )}
                      
                      {registrationStatus.error && (
                        <div className="mt-4 bg-red-100 text-red-800 p-4 rounded-lg">
                          {registrationStatus.error}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
                      Please sign in to register for this event.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
