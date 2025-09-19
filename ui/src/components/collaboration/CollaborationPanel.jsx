'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  UserPlus,
  Settings,
  Send,
  Paperclip,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';

export default function CollaborationPanel({ project, currentUser, onUpdate, className = "" }) {
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/collaboration/comments?projectId=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComments(data.comments);
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      // Fallback to mock data
      setComments([
        {
          id: '1',
          content: 'This study looks promising for our inclusion criteria.',
          author: { name: 'Dr. Smith', email: 'smith@example.com' },
          documentId: 'doc1',
          documentTitle: 'Efficacy of Treatment A',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'general',
          resolved: false
        }
      ]);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/collaboration/tasks?projectId=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAssignments(data.tasks);
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadNotifications = async () => {
    setNotifications([
      {
        id: '1',
        type: 'assignment',
        title: 'New document assigned',
        message: 'You have been assigned to screen "Efficacy of Treatment B"',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: '/projects/proj1/documents/doc3'
      }
    ]);
  };

  // Load real data from API
  useEffect(() => {
    loadComments();
    loadTasks();
    loadNotifications();
  }, [project.id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('[data-notification-dropdown]')) {
        setShowNotifications(false);
      }
      if (showSettings && !event.target.closest('[data-settings-dropdown]')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showSettings]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch('/api/collaboration/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          documentId: selectedDocument?.id,
          content: newComment,
          type: 'general'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComments(prev => [data.comment, ...prev]);
          setNewComment('');
        }
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      // Fallback to local state
      const comment = {
        id: Date.now().toString(),
        content: newComment,
        author: currentUser,
        documentId: selectedDocument?.id,
        documentTitle: selectedDocument?.title || 'General Comment',
        timestamp: new Date().toISOString(),
        type: 'general',
        resolved: false
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'away': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'away': return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'offline': return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCommentTypeIcon = (type) => {
    switch (type) {
      case 'disagreement': return <AlertCircle size={16} className="text-red-500" />;
      case 'extraction': return <Edit3 size={16} className="text-blue-500" />;
      case 'screening': return <Eye size={16} className="text-green-500" />;
      default: return <MessageCircle size={16} className="text-gray-500" />;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return <UserPlus size={16} className="text-blue-500" />;
      case 'comment': return <MessageCircle size={16} className="text-green-500" />;
      case 'disagreement': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      const response = await fetch(`/api/collaboration/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolved: true })
      });

      if (response.ok) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? { ...comment, resolved: true } : comment
        ));
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await fetch(`/api/collaboration/comments/${commentId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setComments(prev => prev.filter(comment => comment.id !== commentId));
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/collaboration/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notification => 
          notification.id === notificationId ? { ...notification, read: true } : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const response = await fetch(`/api/collaboration/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          projectId: project.id,
          notificationIds: unreadNotifications.map(n => n.id)
        })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    setShowNotifications(false);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const handleNotificationBellClick = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Notification Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-end gap-2">
          <div className="relative" data-notification-dropdown>
            <button 
              onClick={handleNotificationBellClick}
              className="p-2 text-gray-600 hover:text-gray-900 relative"
            >
              <Bell size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </div>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <Bell size={24} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative" data-settings-dropdown>
            <button 
              onClick={handleSettingsClick}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Settings size={20} />
            </button>
            
            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                    Notification Preferences
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                    Collaboration Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                    Privacy Settings
                  </button>
                  <hr className="my-1" />
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                    Help & Support
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'comments', label: 'Comments', icon: MessageCircle },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'users', label: 'Team', icon: Users },
          { id: 'assignments', label: 'Tasks', icon: CheckCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Add Comment */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className={`p-4 rounded-lg border ${
                  comment.resolved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getCommentTypeIcon(comment.type)}
                        <span className="font-medium text-gray-900">{comment.author.name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                        {comment.documentTitle && (
                          <span className="text-sm text-blue-600">on {comment.documentTitle}</span>
                        )}
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolveComment(comment.id)}
                        className={`p-1 rounded ${
                          comment.resolved 
                            ? 'text-green-600 hover:bg-green-100' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className={`p-4 rounded-lg border ${
                notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Team Members</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                <UserPlus size={16} className="inline mr-1" />
                Invite
              </button>
            </div>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(user.status)}
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Tasks & Assignments</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                <UserPlus size={16} className="inline mr-1" />
                Assign Task
              </button>
            </div>
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-sm text-gray-500">{assignment.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Assigned to: {assignment.assignedTo}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getTaskStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}