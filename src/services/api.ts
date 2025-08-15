import { stateManager } from "../store/StateManager.ts";
import { User, Achievement } from "../../types/user.ts";
import { redirect } from "Miku/Router";

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
export async function sendFriendRequest(userId: number, username: string) {
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

export async function acceptFriendRequest(requestId: number, friend: any) {
  try {
    const response = await fetch(API_URL + `/api/user-management/friendships/${requestId}`, {
      method: 'PATCH',
      credentials : "include",
      headers : {
      'Content-Type': 'application/json'
      },
      body : JSON.stringify({action : "accepted"})
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



export async function declineFriendRequest(requestId: number, friend: any) {
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
export function initializeWebSocket() {
  // const ws = new WebSocket('ws://localhost:3002/user-updates');
  
  // ws.onmessage = (event) => {
  //   try {
  //     const { type, data } = JSON.parse(event.data);
      
  //     switch (type) {
  //       case 'FRIEND_REQUEST_RECEIVED':
  //         stateManager.emit('FRIEND_REQUEST_RECEIVED', data);
  //         break;
          
  //       case 'FRIEND_REQUEST_ACCEPTED':
  //         stateManager.emit('FRIEND_REQUEST_ACCEPTED', data);
  //         break;
          
  //       case 'MESSAGE_RECEIVED':
  //         stateManager.emit('MESSAGE_RECEIVED', data);
  //         break;
          
  //       case 'ACHIEVEMENT_UNLOCKED':
  //         stateManager.emit('ACHIEVEMENT_UNLOCKED', data);
  //         break;
          
  //       case 'USER_STATUS_CHANGED':
  //         stateManager.emit('USER_STATUS_CHANGED', data);
  //         break;
          
  //       default:
  //         console.log('Unknown websocket message type:', type);
  //     }
  //   } catch (error) {
  //     console.error('Failed to parse websocket message:', error);
  //   }
  // };

  // ws.onopen = () => {
  //   console.log('WebSocket connected');
  // };

  // ws.onclose = () => {
  //   console.log('WebSocket disconnected');
  //   // Implement reconnection logic here
  //   setTimeout(() => {
  //     initializeWebSocket();
  //   }, 5000);
  // };

  // ws.onerror = (error) => {
  //   console.error('WebSocket error:', error);
  // };

  // return ws;
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