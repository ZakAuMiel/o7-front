import { createRouter, createWebHashHistory } from "vue-router";
import Login from "../pages/Login.vue";
import SelectServer from "../pages/SelectServer.vue";
import Upload from "../pages/Upload.vue";
import ListFriendPage from "../pages/ListFriendPage.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/select-server", component: SelectServer },
  { path: "/upload", component: Upload },
  { path: "/list-friends", component : ListFriendPage }

];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
