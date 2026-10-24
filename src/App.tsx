import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EntryGate } from "./pages/EntryGate";
import { SquadBoard } from "./pages/SquadBoard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryGate />} />
        <Route path="/:entryId" element={<SquadBoard />} />
        <Route path="/:entryId/transfers" element={<SquadBoard />} />
        <Route path="/:entryId/plan" element={<SquadBoard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
