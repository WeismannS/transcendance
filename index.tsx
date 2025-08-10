import Miku, { useEffect, workLoop } from "Miku";
import HomePage from "./pages/app_home/index.ts";
import DashboardPage from "./pages/dashboard/index.ts";
import UserHomePage from "./pages/profile/index.ts";
import { redirect, Router } from "Miku/Router";
import SignInPage from "./pages/sign_in/index.ts";
import TournamentsPage from "./pages/tournaments/index.ts";
import LeaderboardPage from "./pages/leaderboard/index.ts";
import GamePage from "./pages/game/index.ts";
import { initializeUserData, initializeWebSocket } from "./src/services/api.ts";
import { stateManager } from "./src/store/StateManager.ts";

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
        const res = fetch("http://localhost:3001/verify", {
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
                        fetch("http://localhost:3000/api/user-management/me", { credentials: "include" }),
                        fetch("http://localhost:3000/api/user-management/allachievements", { credentials: "include" })
                    ]);

                    if (userResponse.status === 200 && achievementsResponse.status === 200) {
                        const userData = await userResponse.json();
                        const achievementsData = await achievementsResponse.json();
                        
                        console.log("User data:", userData);
                        console.log("Achievements data:", achievementsData);

                        // Initialize state manager
                        stateManager.initializeFromUser(userData, achievementsData.achievements || []);
                        console.log("State initialized with user data", stateManager.getState('userProfile'));
                        // Initialize WebSocket for real-time updates
                        initializeWebSocket();
                        
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
        </div>
    )
    }

if (aa) Miku.render(<Routing />, aa);


requestIdleCallback(workLoop)