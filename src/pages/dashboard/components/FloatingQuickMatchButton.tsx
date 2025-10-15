import Miku from "../../../Miku/src/index";
import { Link } from "../../../Miku/src/Router/Router";

export default function FloatingQuickMatchButton() {
	return (
		<div className="fixed bottom-8 right-8">
			<button
				className="bg-gradient-to-r from-cyan-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-110 shadow-2xl"
				title="Quick Match"
			>
				<Link to="/game">🏓</Link>
			</button>
		</div>
	);
}
