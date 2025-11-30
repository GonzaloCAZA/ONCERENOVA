import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { CreateCertificate } from './pages/CreateCertificate';
import { RetrieveCertificate } from './pages/RetrieveCertificate';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Sistema de Certificados de Discapacidad BSV
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  to="/create"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Create Certificate
                </Link>
                <Link
                  to="/retrieve"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Retrieve Certificate
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-10">
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/create" element={<CreateCertificate />} />
            <Route path="/retrieve" element={<RetrieveCertificate />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <p className="text-center text-sm text-gray-600">
              BSV Hackathon - Certificate Storage System
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
