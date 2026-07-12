import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import Bosses from "./pages/Bosses";
import Players from "./pages/Players";
import Parties from "./pages/Parties";
import Admin from "./pages/Admin";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Parties />} />
            <Route path="bosses" element={<Bosses />} />
            <Route path="players" element={<Players />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
