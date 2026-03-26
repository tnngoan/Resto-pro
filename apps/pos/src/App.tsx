/**
 * App.tsx — Root application with React Router.
 *
 * Routes:
 *   /           → TableSelect (pick a table)
 *   /pos        → POSMain (menu + order ticket)
 *   /history    → OrderHistory (today's orders)
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { POSLayout } from '@/components/layout/POSLayout';
import { TableSelect } from '@/pages/TableSelect';
import { POSMain } from '@/pages/POSMain';
import { OrderHistory } from '@/pages/OrderHistory';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<POSLayout />}>
          <Route path="/" element={<TableSelect />} />
          <Route path="/pos" element={<POSMain />} />
          <Route path="/history" element={<OrderHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
