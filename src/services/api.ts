import { stateManager } from "../store/StateManager.ts";
import { User, Achievement } from "../../types/user.ts";

// Initialize user data from /me endpoint
export async function initializeUserData(): Promise<{ user: User | null, achievements: Achievement[] }> {
  try {
    const [userResponse, achievementsResponse] = await Promise.all([
      fetch('/api/user/me'),
      fetch('/api/achievements')
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

// Friend Request Actions
export async function sendFriendRequest(userId: number, username: string) {
  try {
    // Optimistic update
    const tempRequest = {
      user: { id: userId, displayName: username, avatar: '', status: 'online' as const, lastActive: new Date() },
      createdAt: new Date()
    };
    
    stateManager.emit('FRIEND_REQUEST_SENT', tempRequest);

    const response = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
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

export async function acceptFriendRequest(requestId: number, friend: any) {
  try {
    const response = await fetch(`/api/friends/accept/${requestId}`, {
      method: 'POST'
    });

    if (response.ok) {
      stateManager.emit('FRIEND_REQUEST_ACCEPTED', { requestId, friend });
      return true;
    } else {
      throw new Error('Failed to accept friend request');
    }
  } catch (error) {
    console.error('Failed to accept friend request:', error);
    return false;
  }
}

export async function declineFriendRequest(requestId: number, userId: number) {
  try {
    const response = await fetch(`/api/friends/decline/${requestId}`, {
      method: 'POST'
    });

    if (response.ok) {
      stateManager.emit('FRIEND_REQUEST_DECLINED', { requestId, userId });
      return true;
    } else {
      throw new Error('Failed to decline friend request');
    }
  } catch (error) {
    console.error('Failed to decline friend request:', error);
    return false;
  }
}

// Game Actions
export async function finishGame(gameResult: any) {
  try {
    const response = await fetch('/api/game/finish', {
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

        const response = await fetch('http://localhost:3000/api/user-management/profiles', {
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
export function initializeWebSocket() {
  const ws = new WebSocket('ws://localhost:3002/user-updates');
  
  ws.onmessage = (event) => {
    try {
      const { type, data } = JSON.parse(event.data);
      
      switch (type) {
        case 'FRIEND_REQUEST_RECEIVED':
          stateManager.emit('FRIEND_REQUEST_RECEIVED', data);
          break;
          
        case 'FRIEND_REQUEST_ACCEPTED':
          stateManager.emit('FRIEND_REQUEST_ACCEPTED', data);
          break;
          
        case 'MESSAGE_RECEIVED':
          stateManager.emit('MESSAGE_RECEIVED', data);
          break;
          
        case 'ACHIEVEMENT_UNLOCKED':
          stateManager.emit('ACHIEVEMENT_UNLOCKED', data);
          break;
          
        case 'USER_STATUS_CHANGED':
          stateManager.emit('USER_STATUS_CHANGED', data);
          break;
          
        default:
          console.log('Unknown websocket message type:', type);
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
      initializeWebSocket();
    }, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}
