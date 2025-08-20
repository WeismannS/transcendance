import Miku, { useEffect, workLoop } from "Miku";
import HomePage from "./pages/app_home/index.tsx";
import DashboardPage from "./pages/dashboard/index.tsx";
import UserHomePage from "./pages/profile/index.tsx";
import { redirect, Router } from "Miku/Router";
import SignInPage from "./pages/sign_in/index.tsx";
import TournamentsPage from "./pages/tournaments/index.tsx";
import LeaderboardPage from "./pages/leaderboard/index.tsx";
import GamePage from "./pages/game/index.tsx";
import { API_URL, initializeUserData, initializeNotificationWs, getAllConversations, initializeChatWebSocket } from "./services/api.ts";
import { stateManager } from "./store/StateManager.ts";
import { NotificationContainer } from "./pages/notification.tsx";

const aa = document.body.querySelector("#app");
const ProtectedRoutes=   ({isLoggedIn} : {isLoggedIn: boolean}) =>
{  
    return (
        <>
            <Router path="/dashboard" Component={DashboardPage} />
            <Router path="/app_home" Component={UserHomePage} />
            <Router path="/profile/:userid" Component={UserHomePage} />
            <Router path="/tournaments" Component={TournamentsPage} />
            <Router path="/leaderboard" Component={LeaderboardPage} />
            <Router path="/game" Component={GamePage} />
        </>
    )
}
const Routing = () => {
    const [isLoggedIn, setIsLoggedIn] = Miku.useState(false);
    const [userDataLoaded, setUserDataLoaded] = Miku.useState(false);

    useEffect(() => {
        const res = fetch(API_URL + "/api/auth/verify", {
            credentials: "include",
        });
        res.then(response => {
            if (response.status === 200) {
                setIsLoggedIn(true);
                if (window.location.pathname === "/sign_in" || window.location.pathname === "/") {
                    redirect("/dashboard");
                }
            } else {
                setIsLoggedIn(false);
                if (window.location.pathname !== "/" && window.location.pathname !== "/sign_in") {
                    redirect("/sign_in");
                }
            }
        });
    }, [isLoggedIn]);

    // Initialize user data and WebSocket when logged in
    useEffect(() => {
        if (isLoggedIn && !userDataLoaded) {
            // Initialize user data from API
            const loadUserData = async () => {
                try {
                    // Use your existing endpoints
                    const [userResponse, achievementsResponse] = await Promise.all([
                        fetch(API_URL + "/api/user-management/me", { credentials: "include" }),
                        fetch(API_URL + "/api/user-management/allachievements", { credentials: "include" })
                    ]);

                    if (userResponse.status === 200 && achievementsResponse.status === 200) {
                        const userData = await userResponse.json();
                        const achievementsData = await achievementsResponse.json();
                        
                        console.log("User data:", userData);
                        console.log("Achievements data:", achievementsData);

                        // Initialize state manager
                        await stateManager.initializeFromUser(userData, achievementsData.achievements || []);
                        console.log("State initialized with user data", stateManager.getState('userProfile'));

                        
                        // Load conversations
                        await getAllConversations();
                        
                        stateManager.setState("auth", {setIsLoggedIn, setUserDataLoaded})
                        setUserDataLoaded(true);
                    }
                } catch (error) {
                    console.error("Failed to load user data:", error);
                }
            };

            loadUserData();
        }
    }, [isLoggedIn, userDataLoaded]);
    return (
        <div>
            {!isLoggedIn ? (
                <>
                    <Router path="/" Component={HomePage} />
                    <Router path="/sign_in" setIsLoggedIn={setIsLoggedIn} Component={SignInPage} />
                </>
            ) : (
                <ProtectedRoutes isLoggedIn={isLoggedIn} />
            )}
            <NotificationContainer></NotificationContainer>
        </div>
    )
    }

if (aa) Miku.render(<Routing />, aa);


requestIdleCallback(workLoop)