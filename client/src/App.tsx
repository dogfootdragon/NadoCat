import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/queryClient";
// import MyPage from "./pages/MyPage";
import StreetCats from "./pages/streetCat/StreetCat";
import { My } from "./pages/user/My";
import Login from "./pages/user/Login";
import Signup from "./pages/user/Signup";
import Layout from "./components/layout/Layout";
import Community from "./pages/community/Community";
import CommunityDetail from "./pages/community/CommunityDetail";
import StreetCatWrite from "./pages/streetCat/StreetCatWrite";
import StreetCatDetail from "./pages/streetCat/StreetCatDetail";
import Event from "./pages/event/Event";
import EventDetail from "./pages/event/EventDetail";
import Home from "./pages/Home/Home";
import CommunityPostEdit from "./pages/community/CommunityPostEdit";
import ErrorPage from "./pages/error/ErrorPage";
import Missings from "./pages/missing/Missings";
import UserProfile from "./pages/user/UserProfile";
import CommunityPostWrite from "./pages/community/CommunityPostWrite";
import EventPostWrite from "./pages/event/EventPostWrite";
import EventPostEdit from "./pages/event/EventPostEdit";
import MissingDetail from "./pages/missing/MissingDetail";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "", element: <Home /> },
      {
        path: "users",
        children: [
          // { path: "my", element: <MyPage /> },
          { path: "user", element: <UserProfile /> },
          { path: "my", element: <My /> },
          { path: "login", element: <Login /> },
          { path: "signup", element: <Signup /> },
        ],
      },
      {
        path: "boards",
        children: [
          {
            path: "street-cats",
            children: [
              { path: "", element: <StreetCats /> },
              { path: ":id", element: <StreetCatDetail /> },
              { path: "write", element: <StreetCatWrite /> },
            ],
          },
          {
            path: "communities",
            children: [
              { path: "", element: <Community /> },
              { path: ":id", element: <CommunityDetail /> },
              { path: "write", element: <CommunityPostWrite /> },
              { path: "edit/:id", element: <CommunityPostEdit /> },
            ],
          },
          {
            path: "events",
            children: [
              { path: "", element: <Event /> },
              { path: ":id", element: <EventDetail /> },
              { path: "write", element: <EventPostWrite /> },
              { path: "edit/:id", element: <EventPostEdit /> },
            ],
          },
          {
            path: "missings",
            children: [
              { path: "", element: <Missings /> },
              { path: ":id", element: <MissingDetail /> },
            ],
          },
        ],
      },
    ],
  },
]);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
