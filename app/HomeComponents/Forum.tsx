
import React, { useState } from 'react';
import { Post, User, Comment, Role } from '../types';
import { summarizeForumThread } from '../services/geminiService';
import { MessageSquare, ThumbsUp, MoreHorizontal, Sparkles, Send, Trash2, ArrowLeft, Plus, X, ShieldCheck, Crown } from 'lucide-react';

interface ForumProps {
    currentUser: User;
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: 'Alice Freeman',
    authorRole: 'resident',
    title: 'Suspicious car parked near Gate B',
    content: 'Has anyone seen a red sedan parked near Gate B for the last 3 days? It doesn\'t seem to have a resident sticker. I spoke to security but they are checking.',
    category: 'Alerts',
    likes: 12,
    comments: [
        { id: 'c1', author: 'Security Desk', authorRole: 'admin', content: 'We are aware and have tagged the vehicle. Towing service has been called.', timestamp: '1 hour ago' },
        { id: 'c2', author: 'Bob Smith', authorRole: 'resident', content: 'I saw it too, looked abandoned.', timestamp: '30 mins ago' }
    ],
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    author: 'Mark Wilson',
    authorRole: 'resident',
    title: 'Selling unused Gym Equipment',
    content: 'Hi neighbors, I am selling a treadmill and some dumbbells. Moving out next week so need them gone ASAP. DM for prices.',
    category: 'Marketplace',
    likes: 4,
    comments: [],
    timestamp: '5 hours ago'
  },
  {
    id: '3',
    author: 'Estate Admin',
    authorRole: 'admin',
    title: 'Water tank cleaning schedule',
    content: 'Please be advised that water tank cleaning will happen on Tuesday from 10 AM to 4 PM. Water supply might be interrupted during these hours.',
    category: 'General',
    likes: 45,
    comments: [],
    timestamp: '1 day ago'
  }
];

export const Forum: React.FC<ForumProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [summary, setSummary] = useState<{ [key: string]: string }>({});
  const [loadingSummary, setLoadingSummary] = useState<{ [key: string]: boolean }>({});
  
  // Navigation State
  const [view, setView] = useState<'list' | 'thread' | 'create'>('list');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Form States
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'General' | 'Complaints' | 'Marketplace' | 'Alerts'>('General');
  const [newComment, setNewComment] = useState('');

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
  const categories = ['All', 'General', 'Complaints', 'Marketplace', 'Alerts'];

  const selectedPost = posts.find(p => p.id === selectedPostId);

  // --- Helpers ---

  const renderRoleBadge = (role?: Role) => {
    if (role === 'superadmin') {
        return (
            <span className="flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 border border-purple-200">
                <Crown size={10} /> SUPERADMIN
            </span>
        );
    }
    if (role === 'admin') {
        return (
            <span className="flex items-center gap-1 bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 border border-sky-200">
                <ShieldCheck size={10} /> ADMIN
            </span>
        );
    }
    return null;
  };

  // --- Actions ---

  const handleLike = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setPosts(posts.map(post => 
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleDelete = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this post?")) {
        setPosts(posts.filter(p => p.id !== postId));
        if (selectedPostId === postId) setView('list');
    }
  };

  const handleSummarize = async (e: React.MouseEvent, postId: string, content: string, comments: Comment[]) => {
    e.stopPropagation();
    setLoadingSummary(prev => ({ ...prev, [postId]: true }));
    
    const commentsText = comments.map(c => `[${c.author}: ${c.content}]`).join(' ');
    const fullThread = content + " " + commentsText; 
    
    const result = await summarizeForumThread(fullThread);
    setSummary(prev => ({ ...prev, [postId]: result }));
    setLoadingSummary(prev => ({ ...prev, [postId]: false }));
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: Post = {
        id: Date.now().toString(),
        author: currentUser.name,
        authorRole: currentUser.role,
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        likes: 0,
        comments: [],
        timestamp: 'Just now'
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostCategory('General');
    setView('list');
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPostId) return;

    const comment: Comment = {
        id: Date.now().toString(),
        author: currentUser.name,
        authorRole: currentUser.role,
        content: newComment,
        timestamp: 'Just now'
    };

    setPosts(posts.map(post => 
        post.id === selectedPostId 
            ? { ...post, comments: [...post.comments, comment] }
            : post
    ));
    setNewComment('');
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Alerts': return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'Marketplace': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'Complaints': return 'bg-orange-50 text-orange-600 border border-orange-100';
      default: return 'bg-sky-50 text-sky-600 border border-sky-100';
    }
  };

  // --- Views ---

  if (view === 'create') {
      return (
        <div className="space-y-6 pb-24 md:pb-8 h-full flex flex-col">
            <header className="flex items-center gap-3 mb-2">
                <button onClick={() => setView('list')} className="p-2.5 -ml-2 rounded-full hover:bg-slate-200 transition-colors">
                    <ArrowLeft size={24} className="text-slate-700" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">New Post</h1>
            </header>

            <div className="flex-1 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                    <input 
                        type="text" 
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-lg font-bold placeholder:font-normal placeholder:text-slate-400 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <div className="flex flex-wrap gap-2">
                        {(['General', 'Complaints', 'Marketplace', 'Alerts'] as const).map(cat => (
                             <button
                                key={cat}
                                onClick={() => setNewPostCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                  newPostCategory === cat
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {cat}
                              </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
                    <textarea 
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share details..."
                        className="w-full h-48 px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 resize-none font-medium text-slate-700 placeholder:text-slate-400 transition-all"
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button onClick={() => setView('list')} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">Cancel</button>
                    <button 
                        onClick={handleCreatePost}
                        disabled={!newPostTitle || !newPostContent}
                        className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        Post as {currentUser.role === 'resident' ? 'Resident' : currentUser.role.toUpperCase()}
                    </button>
                </div>
            </div>
        </div>
      )
  }

  if (view === 'thread' && selectedPost) {
    return (
        <div className="space-y-4 pb-24 md:pb-8 h-full flex flex-col">
             <header className="flex items-center gap-3 sticky top-0 bg-[#f8fafc]/95 backdrop-blur-sm z-10 py-4 -mt-4">
                <button onClick={() => setView('list')} className="p-2.5 rounded-full bg-white text-slate-700 shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-slate-800 truncate">Thread</h1>
            </header>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-md ${selectedPost.authorRole === 'admin' || selectedPost.authorRole === 'superadmin' ? 'bg-gradient-to-br from-indigo-600 to-blue-600 shadow-indigo-200' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                        {selectedPost.author.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center">
                                <h3 className="font-bold text-slate-900">{selectedPost.author}</h3>
                                {renderRoleBadge(selectedPost.authorRole)}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">{selectedPost.timestamp}</div>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(selectedPost.category)}`}>
                        {selectedPost.category}
                    </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{selectedPost.title}</h2>
                <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap text-[15px]">{selectedPost.content}</p>

                {/* Summary Section in Thread */}
                {summary[selectedPost.id] && (
                    <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl text-sm text-indigo-900 border border-indigo-100/50">
                        <div className="flex items-center gap-2 font-bold mb-2 text-indigo-700">
                            <Sparkles size={16} /> AI Thread Summary
                        </div>
                        {summary[selectedPost.id]}
                    </div>
                )}
                {!summary[selectedPost.id] && (
                     <button 
                        onClick={(e) => handleSummarize(e, selectedPost.id, selectedPost.content, selectedPost.comments)}
                        disabled={loadingSummary[selectedPost.id]}
                        className="mb-6 text-xs font-bold text-indigo-600 flex items-center gap-2 hover:text-indigo-800 transition-colors bg-indigo-50 w-fit px-4 py-2 rounded-full border border-indigo-100"
                    >
                        <Sparkles size={14} />
                        {loadingSummary[selectedPost.id] ? 'Summarizing...' : 'Summarize Thread'}
                    </button>
                )}

                <div className="flex items-center gap-6 border-t border-slate-50 pt-4">
                    <button onClick={(e) => handleLike(e, selectedPost.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${selectedPost.likes > 0 ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-500"}`}>
                        <ThumbsUp size={20} className={selectedPost.likes > 0 ? "fill-current" : ""} />
                        <span className="font-bold text-sm">{selectedPost.likes}</span>
                    </button>
                    <div className="flex items-center gap-2 text-slate-400">
                        <MessageSquare size={20} />
                        <span className="font-medium text-sm">{selectedPost.comments.length} Comments</span>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4 flex-1 pb-4">
                {selectedPost.comments.length === 0 && (
                    <div className="text-center text-slate-400 py-12">
                        <div className="mb-2 text-4xl">💭</div>
                        <div className="font-medium">No comments yet</div>
                        <div className="text-sm">Be the first to start the conversation!</div>
                    </div>
                )}
                {selectedPost.comments.map(comment => (
                    <div key={comment.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 flex gap-4 shadow-sm">
                         <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${comment.authorRole === 'admin' || comment.authorRole === 'superadmin' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                            {comment.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">{comment.author}</span>
                                    {renderRoleBadge(comment.authorRole)}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Comment Input */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-4 border-t border-white/50 -mx-4 md:mx-0 md:rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] mt-auto z-10">
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-slate-100/80 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button 
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
  }

  // --- List View ---

  const filteredPosts = activeCategory === 'All' 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-8 pb-24 md:pb-8 h-full relative">
      <header className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Community</h1>
            <p className="text-slate-500 font-medium mt-1">Connect with your neighbors</p>
        </div>
      </header>

      <div className="flex overflow-x-auto space-x-3 pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
              activeCategory === cat
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {filteredPosts.map(post => (
          <div 
            key={post.id} 
            onClick={() => { setSelectedPostId(post.id); setView('thread'); }}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1 relative group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-lg ${post.authorRole === 'admin' || post.authorRole === 'superadmin' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                  {post.author.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{post.author}</h3>
                    {renderRoleBadge(post.authorRole)}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{post.timestamp}</div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                 <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(post.category)}`}>
                    {post.category}
                 </span>
                 {isAdmin && (
                    <button 
                        onClick={(e) => handleDelete(e, post.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 rounded-full hover:bg-rose-50"
                    >
                        <Trash2 size={16} />
                    </button>
                 )}
              </div>
            </div>

            <h4 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{post.title}</h4>
            <p className="text-slate-500 text-[15px] leading-relaxed mb-4 line-clamp-3">
              {post.content}
            </p>

            {/* AI Summary Section */}
            {summary[post.id] && (
              <div className="mb-5 bg-indigo-50/50 p-4 rounded-2xl text-sm text-indigo-900 border border-indigo-100">
                <div className="flex items-center gap-2 font-bold mb-1.5 text-indigo-700">
                  <Sparkles size={14} /> AI Summary
                </div>
                {summary[post.id]}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex space-x-6">
                <button 
                    onClick={(e) => handleLike(e, post.id)}
                    className={`flex items-center space-x-2 transition-colors ${post.likes > 0 ? "text-indigo-600" : "text-slate-400 hover:text-indigo-500"}`}
                >
                  <ThumbsUp size={20} className={post.likes > 0 ? "fill-current" : ""} />
                  <span className="text-sm font-bold">{post.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-indigo-500 transition-colors">
                  <MessageSquare size={20} />
                  <span className="text-sm font-bold">{post.comments.length}</span>
                </button>
              </div>
              <button className="text-slate-300 hover:text-slate-600 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setView('create')}
        className="fixed bottom-24 md:bottom-10 right-6 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-black transition-transform hover:scale-110 active:scale-95 z-40 group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
};
