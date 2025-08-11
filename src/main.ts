import { initKaboom } from "./core/loop";
import { defineGameScene } from "./scenes/game";
import { defineMenuScene } from "./scenes/menu";

const { k } = initKaboom();
defineGameScene(k);
defineMenuScene(k);
k.go("menu");


