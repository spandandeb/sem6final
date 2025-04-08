import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { eventAPI } from '../services/api';

interface Event {
  _id: string;
  title: string;
  type: 'mentoring_session' | 'workshop' | 'webinar' | 'networking';
  startTime: string;
  endTime: string;
  location: string;
}

const RegisteredEvents: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        setLoading(true);
        
        // Get registered event IDs from localStorage
        const storedRegistrations = localStorage.getItem('registeredEvents');
        if (!storedRegistrations) {
          setRegisteredEvents([]);
          setLoading(false);
          return;
        }
        
        const registeredEventIds = JSON.parse(storedRegistrations) as string[];
        
        try {
          // Try to fetch all events from API
          const response = await eventAPI.getEvents({});
          const allEvents = response.data || [];
          
          // Filter events that the user has registered for
          const userRegisteredEvents = allEvents.filter((event: Event) => 
            registeredEventIds.includes(event._id)
          );
          
          setRegisteredEvents(userRegisteredEvents);
        } catch (apiError) {
          console.error('Error fetching registered events:', apiError);
          
          // If API fails, use the event data from localStorage if available
          // First check if we have stored event details
          const storedEventDetails = localStorage.getItem('eventDetails');
          let eventDetailsMap: Record<string, { 
            title?: string; 
            type?: string; 
            startTime?: string; 
            endTime?: string; 
            location?: string; 
          }> = {};
          
          if (storedEventDetails) {
            try {
              eventDetailsMap = JSON.parse(storedEventDetails);
            } catch (e) {
              console.error('Error parsing stored event details:', e);
            }
          }
          
          // Create mock events with better titles if available
          const mockEvents = registeredEventIds.map(id => {
            // Use stored details if available, otherwise use generic info
            const eventDetail = eventDetailsMap[id] || {};
            return {
              _id: id,
              title: eventDetail.title || `Event ${id.substring(0, 6)}`,
              type: (eventDetail.type || 'workshop') as 'workshop' | 'webinar' | 'networking' | 'mentoring_session',
              startTime: eventDetail.startTime || new Date().toISOString(),
              endTime: eventDetail.endTime || new Date().toISOString(),
              location: eventDetail.location || 'Local event'
            };
          });
          
          setRegisteredEvents(mockEvents);
        }
      } catch (error) {
        console.error('Error in registered events component:', error);
        setRegisteredEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRegisteredEvents();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'mentoring_session': return 'Mentoring Session';
      case 'workshop': return 'Workshop';
      case 'webinar': return 'Webinar';
      case 'networking': return 'Networking';
      default: return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'mentoring_session': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-purple-100 text-purple-800';
      case 'webinar': return 'bg-green-100 text-green-800';
      case 'networking': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const removeRegistration = (eventId: string) => {
    // Get current registrations
    const storedRegistrations = localStorage.getItem('registeredEvents');
    if (!storedRegistrations) return;
    
    const registeredEventIds = JSON.parse(storedRegistrations) as string[];
    
    // Remove the event ID
    const updatedRegistrations = registeredEventIds.filter(id => id !== eventId);
    
    // Save back to localStorage
    localStorage.setItem('registeredEvents', JSON.stringify(updatedRegistrations));
    
    // Update state
    setRegisteredEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Registered Events</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading your registered events...</p>
          </div>
        ) : registeredEvents.length === 0 ? (
          <div className="text-center py-10">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No registered events</h3>
            <p className="text-gray-500">
              You haven't registered for any events yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {registeredEvents.map(event => (
              <div key={event._id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getEventTypeColor(event.type)}`}>
                    {getEventTypeLabel(event.type)}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{formatDateTime(event.startTime)}</p>
                  <p>{event.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisteredEvents;
