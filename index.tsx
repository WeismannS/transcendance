import Miku, { useEffect, workLoop } from "Miku";
import HomePage from "./pages/app_home/index.js";
import DashboardPage from "./pages/dashboard/index.js";
import UserHomePage from "./pages/profile/index.js";
import { redirect, Router } from "Miku/Router";
import SignInPage from "./pages/sign_in/index.js";
import TournamentsPage from "./pages/tournaments/index.js";
import LeaderboardPage from "./pages/leaderboard/index.js";
import GamePage from "./pages/game/index.js";
import { Achievement, User } from "./types/user.js";

const aa = document.body.querySelector("#app");
const ProtectedRoutes=   ({isLoggedIn, user, achievements} : {isLoggedIn: boolean, user: User | null, achievements: Achievement[]}) =>
{  
    return (
        <>
            <Router path="/dashboard" Component={DashboardPage} user={user} achievements={achievements} />
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
    const [user, setUser] = Miku.useState<User | null>(null);
    const [achievements, setAchievements] = Miku.useState<any[]>([]);
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
    useEffect(() => {
        const res = fetch("http://localhost:3000/api/user-management/me", {
            credentials: "include",
        });
        res.then(response => {
            if (response.status === 200) {
                response.json().then(data => {
                    setUser(data);
                    console.log("User data:", data);
                });
            } else {
                setUser(null);
            }
        });
    }, [isLoggedIn]);
    useEffect(() => {
        const res = fetch("http://localhost:3000/api/user-management/allachievements", {
            credentials: "include",
        });
        res.then(response => {
            if (response.status === 200) {
                response.json().then(data => {
                    setAchievements(data.achievements);
                    console.log("User achievements:", data);
                });
            } else {
                setAchievements([]);
            }
        });
    }, [isLoggedIn]);
    return (
        <div>
            {!isLoggedIn ? (
                <>
                    <Router path="/" Component={HomePage} />
                    <Router path="/sign_in" setIsLoggedIn={setIsLoggedIn} Component={SignInPage} />
                </>
            ) : (
                <ProtectedRoutes isLoggedIn={isLoggedIn} user={user} achievements={achievements} />
            )}
        </div>
    )
    }

if (aa) Miku.render(<Routing />, aa);


requestIdleCallback(workLoop)