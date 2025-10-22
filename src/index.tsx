import Miku, { useEffect, workLoop } from "Miku";
import { Router, redirect } from "Miku/Router";
import DashboardPage from "./pages/dashboard/index.tsx";
import GamePage from "./pages/game/index.tsx";
import HomePage from "./pages/home/index.tsx";
import { NotificationContainer } from "./pages/notification.tsx";
import UserHomePage from "./pages/profile/index.tsx";
import SignInPage from "./pages/sign_in/index.tsx";
import { getAllConversations } from "./services/api/chat";
import { API_URL } from "./services/api/config";
import { stateManager } from "./store/StateManager.ts";

const aa = document.body.querySelector("#app");
const ProtectedRoutes = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
	if (!isLoggedIn) return null;
	return (
		<>
			<Router path="/dashboard" Component={DashboardPage} />
			<Router path="/app_home" Component={UserHomePage} />
			<Router
				path="/profile/:userid"
				Component={UserHomePage}
				isLoggedIn={isLoggedIn}
			/>
			<Router path="/game/:gameId" Component={GamePage} />
		</>
	);
};
const Routing = () => {
	const [isLoggedIn, setIsLoggedIn] = Miku.useState(false);
	const [userDataLoaded, setUserDataLoaded] = Miku.useState(false);

	useEffect(() => {
		const res = fetch(API_URL + "/api/auth/verify", {
			credentials: "include",
		});
		res.then((response) => {
			if (response.status === 200) {
				setIsLoggedIn(true);
				if (
					window.location.pathname === "/sign_in" ||
					window.location.pathname === "/"
				) {
					redirect("/dashboard");
				}
			} else {
				setIsLoggedIn(false);
				if (
					window.location.pathname !== "/" &&
					window.location.pathname !== "/sign_in"
				) {
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
					const [userResponse, achievementsResponse, onlineCountResponse] =
						await Promise.all([
							fetch(API_URL + "/api/user-management/me", {
								credentials: "include",
							}),
							fetch(API_URL + "/api/user-management/allachievements", {
								credentials: "include",
							}),
							fetch("http://localhost:3005/api/notifications/users/online", {
								credentials: "include",
							}),
						]);

					if (
						userResponse.status === 200 &&
						achievementsResponse.status === 200 &&
						onlineCountResponse.status === 200
					) {
						const userData = await userResponse.json();
						const achievementsData = await achievementsResponse.json();
						const onlineCountData = await onlineCountResponse.json();

						await stateManager.initializeFromUser(
							userData,
							achievementsData.achievements || [],
							onlineCountData.totalOnline + 1,
						);

						// Load conversations
						await getAllConversations();

						stateManager.setState("auth", { setIsLoggedIn, setUserDataLoaded });
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
					<Router
						path="/sign_in"
						setIsLoggedIn={setIsLoggedIn}
						Component={SignInPage}
					/>
				</>
			) : (
				<ProtectedRoutes isLoggedIn={isLoggedIn} />
			)}
			<NotificationContainer></NotificationContainer>
		</div>
	);
};

if (aa) Miku.render(<Routing />, aa);

requestIdleCallback(workLoop);
