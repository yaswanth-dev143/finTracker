import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Months from "./pages/Months";
import YearsPage from "./pages/YearsPage";
import YearDetail from "./pages/YearDetail";
import GroupDetail from "./pages/GroupDetail";
import CategoryDetail from "./pages/CategoryDetail";
import Settings from "./pages/Settings";
import MonthDetail from "./pages/MonthDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/years" element={<YearsPage />} />
        <Route path="/years/:yearId" element={<YearDetail />} />
        <Route path="/months" element={<Months />} />
        <Route path="/months/:monthId" element={<MonthDetail />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
        <Route path="/categories/:categoryId" element={<CategoryDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
