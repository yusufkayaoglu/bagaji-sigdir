import "./style.css";
import { createGame } from "./game/GameController.js";
const game = createGame(document.querySelector("#app"));
if (import.meta.hot) import.meta.hot.dispose(() => game.destroy());
