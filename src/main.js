import { createApp } from 'vue'
import './assets/css/app.css'
import globalComponents from "./global-components";
import App from './App.vue'
import router from "./router";

const app = createApp(App).use(router);
globalComponents(app);

window.vm = app;
app.mount("#app");
