import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import HomePage from "@/pages/home";
import TransferPage from "@/pages/transfer";
import { SocketProvider } from "@/context/SocketProvider";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "transfer",
        element: (
          <SocketProvider>
            <TransferPage />
          </SocketProvider>
        ),
      },
    ],
  },
]);
