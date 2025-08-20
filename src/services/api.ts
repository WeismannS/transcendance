import { EventType, SocialState, stateManager, UserProfileState } from "../store/StateManager.ts";
import { User, Achievement, FriendEvent, isNotificationType, Conversation } from "../types/user.ts";
import { redirect } from "Miku/Router";
import { useNotifications } from "../pages/use-notification.ts";
import { Notification } from "../types/user.ts";
import { userInfo } from "os";
export const API_URL = "http://localhost:3000";

export async function initializeUserData(): Promise<{ user: User | null, achievements: Achievement[] }> {
  try {
    const [userResponse, achievementsResponse] = await Promise.all([
      fetch(API_URL + '/api/user/me'),
      fetch(API_URL + '/api/achievements')
    ]);

    if (!userResponse.ok || !achievementsResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const user: User = await userResponse.json();
    const achievements: Achievement[] = await achievementsResponse.json();

    // Initialize state manager with user data
    stateManager.initializeFromUser(user, achievements);

    return { user, achievements };
  } catch (error) {
    console.error('Failed to initialize user data:', error);
    return { user: null, achievements: [] };
  }
}

export async function logOut() {
  try {
    const response = await fetch(API_URL + '/api/auth/logout', {
      method: 'POST',
      credentials: "include"
    });
    if (!response.ok) {
      throw new Error('Failed to log out');
    }
    const {setIsLoggedIn , setUserDataLoaded}  = stateManager.getState("auth") as any 
    const {wsChat, wsNotifications} = stateManager.getState("webSocket") as any;
    if (wsChat) {
      wsChat.close();
    }
    if (wsNotifications) {
      wsNotifications.close();
    }
    setIsLoggedIn(false)
    setUserDataLoaded(false)

    setTimeout(()=>redirect("/sign_in"), 1000);
    return true;
  }   catch (error) {
    console.error('Failed to log out:', error);
    return false;
  }
}
// Friend Request Actions
export async function sendFriendRequest(userId: string, username: string) {
  try {
    // Optimistic update
    const tempRequest = {
      user: { id: userId, displayName: username, avatar: '', status: 'online' as const, lastActive: new Date() },
      createdAt: new Date()
    };
    
    stateManager.emit('FRIEND_REQUEST_SENT', tempRequest);

    const response = await fetch(API_URL + '/api/user-management/friendships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({ receiverId: userId  })
    });

    if (!response.ok) {
      // Rollback on failure
      stateManager.updateState('social', (prev: any) => ({
        ...prev,
        friendRequests: {
          ...prev.friendRequests,
          sent: prev.friendRequests.sent.filter((req: any) => req.user.id !== userId)
        }
      }));
      throw new Error('Failed to send friend request');
    }

    return true;
  } catch (error) {
    console.error('Failed to send friend request:', error);
    return false;
  }
}

export async function acceptFriendRequest(requestId: string, user : any) {
  try {
    console.info(requestId)
    const response = await fetch(API_URL + `/api/user-management/friendships/${requestId}`, {
      method: 'PATCH',
      credentials : "include",
      headers : {
      'Content-Type': 'application/json'
      },
      body : JSON.stringify({action : "accepted"})
    });

    if (response.ok) {
      stateManager.emit('FRIEND_REQUEST_ACCEPTED', { requestId, user   });
      return true;
    } else {
      throw new Error('Failed to accept friend request');
    }
  } catch (error) {
    console.error('Failed to accept friend request:', error);
    return false;
  }
}


export async function isOnline(userId: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:3005/api/notifications/user/${userId}/online`, {
      method: 'GET',
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error('Failed to check online status');
    }

    const data = await response.json();
    return data.online;
  } catch (error) {
    console.error('Failed to check online status:', error);
    return false;
  }
}

export async function declineFriendRequest(requestId: string, friend: any) {
  try {
    const response = await fetch(API_URL + `/api/user-management/friendships/${requestId}`, {
      method: 'PATCH',
      credentials : "include",
      headers : {
      'Content-Type': 'application/json'
      },
      body : JSON.stringify({action : "declined"})
    });

    if (response.ok) {
      stateManager.emit('FRIEND_REQUEST_DECLINED', { requestId, friend });
      return true;
    } else {
      throw new Error('Failed to accept friend request');
    }
  } catch (error) {
    console.error('Failed to accept friend request:', error);
    return false;
  }
}
// Game Actions

export async function finishGame(gameResult: any) {
  try {
    const response = await fetch(API_URL + '/api/game/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameResult)
    });

    if (response.ok) {
      stateManager.emit('GAME_FINISHED', gameResult);
      return true;
    } else {
      throw new Error('Failed to finish game');
    }
  } catch (error) {
    console.error('Failed to finish game:', error);
    return false;
  }
}

// Profile Actions
export async function updateProfile(profileData: any) {
    try {
        let formData : FormData | string;
        console.log(profileData)
        if (profileData.avatar)
        // Append all profile data to FormData
        {
            formData = new FormData();
            Object.keys(profileData).forEach(key => {
            if (profileData[key] !== null && profileData[key] !== undefined) {
                (formData as FormData).append(key, profileData[key]);
            }
        });
        }
        else 
            formData = JSON.stringify(profileData)
        const headers : HeadersInit = {};
        if (!profileData.avatar)
            headers['Content-Type'] = 'application/json';

        const response = await fetch(API_URL + '/api/user-management/profiles', {
            method: 'PATCH',
            headers: headers,
            body: formData,
            credentials: "include"
        });
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        else 
        {
            const profile = await response.json();
            stateManager.emit("PROFILE_UPDATED", {...profileData,avatar : profile.avatarUrl })
        }
        return true;
    } catch (error) {
        console.error('Failed to update profile:', error);
        return false;
    }
}

// WebSocket connection for real-time updates

export function initializeChatWebSocket() {
  const ws = new WebSocket('ws://localhost:3004/ws/chat/live?' + document.cookie);
  
  ws.onmessage = (event) => {
    const friends = (stateManager.getState("social") as SocialState)?.friends || [];
    const currentUser = stateManager.getState("userProfile") as UserProfileState | null;
    const data = JSON.parse(event.data);
    if (data.type === 'new_message') {
      stateManager.emit('MESSAGE_RECEIVED', data);
    } else if (data.type === 'CONVERSATION_ADDED') {
      const conversation: Conversation = {
        id: data.id,
        members: data.members.map(({userId : m} : {userId: string})=> {
          if (currentUser && m === currentUser.id) {
          return {
            id: currentUser.id,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar,
            status: "online" as const, // Current user is always online
            rank: 0 // You might want to get this from game stats
          };
        }
        // Otherwise, look for them in friends list
        const friend = friends.find(f => f.id === m);
        return {
          id: m,
          displayName: friend?.displayName || `User ${m}`,
          avatar: friend?.avatar || '',
          status: friend?.status || "offline",
          rank: friend?.rank ?? 0
        };
        }),
        messages: data.messages,
        unreadCount: data.unreadCount || 0,
        lastMessage: data.lastMessage || null
      };
      stateManager.emit('CONVERSATION_ADDED', conversation);
    } else {
      console.log('Unknown websocket message type:', data.type);
    }
  };
  
  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Implement reconnection logic here
    setTimeout(() => {
      console.log('Reconnecting WebSocket...');
      initializeChatWebSocket();
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}
export function initializeNotificationWs() {
  const { addNotification } = useNotifications();
  const ws = new WebSocket('ws://localhost:3005/ws/notifications/live?' + document.cookie);
 
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "connection_status") {
        return;
      }

      if (isNotificationType(data, 'FRIEND_REQUEST_RECEIVED')) {
        addNotification({
          title: data.title,
          avatar: data.user.avatar,
          type: "info",
          message: data.content
        });
        console.error(data);
        stateManager.emit("FRIEND_REQUEST_RECEIVED", {
          user: data.user, 
          id: data.requestId
        });
      } else if (isNotificationType(data, 'FRIEND_REQUEST_ACCEPTED')) {
        addNotification({
          title: data.title,
          avatar: data.user.avatar,
          type: "info",
          message: data.content
        });
        stateManager.emit("FRIEND_REQUEST_ACCEPTED", { user: data.user });
      } else if (isNotificationType(data, 'FRIEND_REQUEST_DECLINED')) {
        addNotification({
          title: data.title,
          avatar: data.user.avatar,
          type: "info",
          message: data.content
        });
        stateManager.emit("FRIEND_REQUEST_DECLINED", { user: data.user });
      } else if (isNotificationType(data, 'STATUS_UPDATE')) {

        stateManager.emit("STATUS_UPDATE", {
          user: data.user
        });
      
      } else if (isNotificationType(data, 'FRIEND_REMOVED')) {
        console.log("Friend removed:", data);
          stateManager.emit("FRIEND_REMOVED", {
          user : data.user
        });
      }
       else if (isNotificationType(data, 'ACHIEVEMENT_UNLOCKED')) {
      } else {
        console.log('Unknown websocket message type:', data.type);
      }
      
    } catch (error) {
      console.error('Failed to parse websocket message:', error);
    }
  };

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Implement reconnection logic here
    setTimeout(() => {
      initializeNotificationWs();
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}


export async function searchProfiles(username: string) {
  try {
  const response = await fetch(API_URL + `/api/user-management/profile?username=${username}`, {
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error('Failed to search profiles');
    }
    const data = await response.json();
    const users = data.users;
    return users;
  } catch (error) {
    console.error('Failed to search profiles:', error);
    return [];
  }
}


export async function getOrCreateConversation(userId: string) {
  try {
    const response = await fetch(API_URL + `/api/chat/conversations/${userId}`, {
      method: 'GET',
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error('Failed to get or create conversation');
    }

    let conversation = await response.json();
    conversation = conversation.conversation
    // Get friends and current user from stateManager
    const friends = (stateManager.getState("social") as SocialState)?.friends || [];
    const currentUser = stateManager.getState("userProfile") as UserProfileState | null;
    console.log(conversation)
    conversation.members = conversation.members.map((m: any) => {
        // Check if this member is the current user (m should be a user ID)
        if (currentUser && m === currentUser.id) {
          return {
            id: currentUser.id,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar,
            status: "online" as const, // Current user is always online
            rank: 0 // You might want to get this from game stats
          };
        }
        // Otherwise, look for them in friends list
        const friend = friends.find(f => f.id === m);
        return {
          id: m,
          displayName: friend?.displayName || `User ${m}`,
          avatar: friend?.avatar || '',
          status: friend?.status || "offline",
          rank: friend?.rank ?? 0
        };
      })
    
    stateManager.emit('CONVERSATION_ADDED', conversation);
    return conversation;
  } catch (error) {
    console.error('Failed to get or create conversation:', error);
    return null;
  }
}

export async function getAllConversations() {
  try {
    const response = await fetch(API_URL + '/api/chat/conversations', {
      method: 'GET',
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error('Failed to get conversations');
    }

    const data = await response.json();
    console.info(data)
    // Get friends and current user from stateManager
    const friends = (stateManager.getState("social") as SocialState)?.friends || [];
    const currentUser = stateManager.getState("userProfile") as UserProfileState | null;

    const conversations: Conversation[] = data.conversations.map((conversation: any) => ({
      id: conversation.id,
      members: conversation.members.map((m: any) => {
        console.log("Member:", m);
        // Check if this member is the current user (m should be a user ID)
        if (currentUser && m === currentUser.id) {
          return {
            id: currentUser.id,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar,
            status: "online" as const, // Current user is always online
            rank: 0 // You might want to get this from game stats
          };
        }
        
        // Otherwise, look for them in friends list
        const friend = friends.find(f => f.id === m);
        return {
          id: m,
          displayName: friend?.displayName || `User ${m}`,
          avatar: friend?.avatar || '',
          status: friend?.status || "offline",
          rank: friend?.rank ?? 0
        };
      }),
      messages: conversation.messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      createdAt: new Date(msg.createdAt)
      })),
      unreadCount: conversation.unreadCount || 0,
      lastMessage: conversation.messages.length > 0 ? {
      id: conversation.messages[conversation.messages.length - 1].id,
      content: conversation.messages[conversation.messages.length - 1].content,
      senderId: conversation.messages[conversation.messages.length - 1].senderId,
      receiverId: conversation.messages[conversation.messages.length - 1].receiverId,
      createdAt: new Date(conversation.messages[conversation.messages.length - 1].createdAt)
      } : null
    }));
    console.log("Conversations loaded:", conversations);
    stateManager.emit('CONVERSATIONS_LOADED', conversations);
    return conversations;
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return [];
  }
}

export async function sendMessage(receiverId: string, content: string) {
  try {
    const response = await fetch(API_URL + '/api/chat/messages/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({ 
        receiverId, 
        content 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const message = await response.json();
    // The WebSocket should handle the real-time update, but we can emit an event for immediate feedback
    // stateManager.emit('MESSAGE_SENT', {
    //   receiverId,
    //   message: {
    //     id: message.id,
    //     content: message.content,
    //     senderId: message.senderId,
    //     receiverId: message.receiverId,
    //     createdAt: new Date(message.createdAt)
    //   }
    // });
    
    return message;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

export async function markConversationAsRead(conversationId: string) {
  try {
    const response = await fetch(API_URL + `/api/chat/conversations/${conversationId}/read`, {
      method: 'PATCH',
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error('Failed to mark conversation as read');
    }

    stateManager.emit('CONVERSATION_READ', { conversationId });
    return true;
  } catch (error) {
    console.error('Failed to mark conversation as read:', error);
    return false;
  }
}

export  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };


  export async function removeFriend(userId : string) {
    try {
      const response = await fetch(API_URL + `/api/user-management/friendships/${userId}`, {
        method: 'DELETE',
        credentials: "include"
      });
  
      if (!response.ok) {
        throw new Error('Failed to remove friend');
      }
  
      stateManager.emit('FRIEND_REMOVED', { user : { id: userId } });
      return true;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      return false;
    }
  }