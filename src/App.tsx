import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EntryGate } from "./pages/EntryGate";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryGate />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
