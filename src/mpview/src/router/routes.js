import MainLayout from "layouts/MainLayout.vue";
import IndexPage from "pages/Index.vue";
import PlayPage from "pages/Play.vue";
import ControlWinLayout from "layouts/ControlWinLayout";
import SubtitleControl from "pages/SubtitleControl";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "",
        component: IndexPage
      },
      {
        path: "/play",
        name: "play",
        component: PlayPage
      }
    ]
  },
  {
    path: '/ControlWindow',
    component: ControlWinLayout,
    children: [
      {
        path:'subtitle',
        name:'subtitle',
        component: SubtitleControl
      }
    ]
  }
];

// Always leave this as last one
if (process.env.MODE !== "ssr") {
  routes.push({
    path: "*",
    component: () => import("pages/Error404.vue")
  });
}

export default routes;
