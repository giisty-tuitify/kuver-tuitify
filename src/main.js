import { createApp } from 'vue'
import './assets/css/app.css'
import App from './App.vue'
import router from "./router";

const app = createApp(App).use(router);
window.vm = app;
app.mount("#app");
