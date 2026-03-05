
import React, { useState } from 'react';
import { CommunityEvent, User } from '../types';
import { generateEventIdeas } from '../services/geminiService';
import { Calendar, MapPin, Users, Sparkles, Plus, Trash2, X, Image as ImageIcon, Clock } from 'lucide-react';

interface EventsProps {
  currentUser: User;
}

const MOCK_EVENTS: CommunityEvent[] = [
  {
    id: '1',
    title: 'Sunday BBQ By The Pool',
    description: 'Join us for a relaxing Sunday afternoon with grilled burgers and drinks. Kids welcome!',
    date: '2023-11-12T14:00:00',
    location: 'Clubhouse Pool Area',
    attendees: 34,
    image: 'https://picsum.photos/400/200?random=1'
  },
  {
    id: '2',
    title: 'Morning Yoga Session',
    description: 'Start your day with zen. Bring your own mat.',
    date: '2023-11-15T07:00:00',
    location: 'Community Park',
    attendees: 12,
    image: 'https://picsum.photos/400/200?random=2'
  }
];

export const Events: React.FC<EventsProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<CommunityEvent[]>(MOCK_EVENTS);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const isAdmin = true;

  const handleGenerateIdeas = async () => {
    setLoadingSuggestions(true);
    const ideas = await generateEventIdeas("Autumn");
    setAiSuggestions(ideas);
    setLoadingSuggestions(false);
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleCreateEvent = () => {
    if (!newTitle || !newDate || !newTime || !newLocation) return;

    const newEvent: CommunityEvent = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      date: `${newDate}T${newTime}`,
      location: newLocation,
      attendees: 0,
      image: `https://picsum.photos/400/200?random=${Date.now()}` // Random image for demo
    };

    setEvents([...events, newEvent]);
    setShowCreateModal(false);
    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewDate('');
    setNewTime('');
    setNewLocation('');
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Events</h1>
          <p className="text-slate-500 font-medium mt-1">Discover what&apos;s happening nearby</p>
        </div>
        <div className="flex gap-3">
           {isAdmin && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-all"
            >
              <Plus size={18} /> New Event
            </button>
           )}
          <button 
            onClick={handleGenerateIdeas}
            disabled={loadingSuggestions}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-indigo-600 hover:scale-105 transition-transform border border-white shadow-sm"
            title="Generate AI Event Ideas"
          >
            <Sparkles size={22} className={loadingSuggestions ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* AI Suggestions Panel */}
      {aiSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 animate-fade-in relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-300 fill-yellow-300" /> 
              AI Suggested Events for this Season
            </h3>
            <div className="flex flex-wrap gap-3">
              {aiSuggestions.map((idea, idx) => (
                <span key={idx} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold border border-white/20 hover:bg-white/20 transition-colors cursor-default">
                  {idea}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-purple-500/40 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* Events List */}
      <div className="grid gap-8 md:grid-cols-2">
        {events.map((event) => (
          <div key={event.id} className="group bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 relative flex flex-col h-full">
             {isAdmin && (
              <button 
                onClick={() => handleDeleteEvent(event.id)}
                className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm p-2.5 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Event"
              >
                <Trash2 size={18} />
              </button>
            )}
            
            <div className="h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-4 left-4 z-20 text-white">
                     <span className="bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                        Community
                     </span>
                </div>
                
                <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl text-center shadow-lg">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                    <div className="text-xl font-bold text-slate-900 leading-none mt-0.5">{new Date(event.date).getDate()}</div>
                </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{event.title}</h3>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">{event.description}</p>
              
              <div className="space-y-3 mt-auto">
                <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <Clock size={18} className="mr-3 text-indigo-500" />
                   {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <MapPin size={18} className="mr-3 text-indigo-500" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <Users size={18} className="mr-3 text-indigo-500" />
                  {event.attendees} neighbors going
                </div>
              </div>

              <button className="w-full mt-6 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors">
                RSVP Now
              </button>
            </div>
          </div>
        ))}

        {/* Create New Event Card */}
        {isAdmin && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="h-full min-h-[400px] border-3 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all group"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center mb-5 transition-colors">
              <Plus size={36} />
            </div>
            <span className="font-bold text-lg">Post New Event</span>
          </button>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-scale-up">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Create New Event</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="e.g., Summer Pool Party"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none h-32 resize-none transition-all font-medium"
                  placeholder="Event details..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full pl-11 pr-5 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="e.g., Community Hall"
                    />
                </div>
              </div>

               <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700 text-sm font-medium">
                  <ImageIcon size={20} />
                  <span>A random cover image will be assigned.</span>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCreateEvent}
                  disabled={!newTitle || !newDate || !newTime || !newLocation}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95"
                >
                  Publish Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
