import React, { useState } from 'react';
import { CertificateData } from '../types/certificate.types';
import { certificateAPI } from '../services/api';

const availableFields = [
  { value: 'firstName', label: 'Nombre' },
  { value: 'lastName', label: 'Apellidos' },
  { value: 'documentId', label: 'DNI/NIE' },
  { value: 'phoneNumber', label: 'Teléfono' },
  { value: 'disabilityType', label: 'Tipo de Discapacidad' },
  { value: 'disabilityPercentage', label: 'Porcentaje' },
  { value: 'disabilityDescription', label: 'Descripción' },
  { value: 'mobilityAids', label: 'Ayudas a la Movilidad' },
  { value: 'specialNeeds', label: 'Necesidades Especiales' },
  { value: 'emergencyContact', label: 'Contacto de Emergencia' },
];

const disabilityTypeLabels: Record<string, string> = {
  'cognitiva': 'Cognitiva',
  'fisica': 'Física',
  'sensorial': 'Sensorial',
  'psiquica': 'Psíquica',
  'multiple': 'Múltiple'
};

export const RetrieveCertificate: React.FC = () => {
  const [txid, setTxid] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Partial<CertificateData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFieldToggle = (field: string) => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedFields([field]);
    } else {
      setSelectedFields(prev => 
        prev.includes(field) 
          ? prev.filter(f => f !== field)
          : [...prev, field]
      );
    }
  };

  const handleSelectAllToggle = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedFields([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await certificateAPI.retrieve({
        txid,
        fields: selectAll ? undefined : selectedFields,
      });
      
      setResult(response.data);
    } catch (err: any) {
      setError(err.error || 'Error al recuperar el certificado');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (key: string, value: any): string => {
    if (key === 'disabilityType' && typeof value === 'string') {
      return disabilityTypeLabels[value] || value;
    }
    if (key === 'disabilityPercentage') {
      return `${value}%`;
    }
    if (key === 'mobilityAids' && Array.isArray(value)) {
      return value.join(', ') || 'Ninguna';
    }
    if (key === 'emergencyContact' && typeof value === 'object') {
      return `${value.name} - ${value.phone} (${value.relationship})`;
    }
    if (key === 'metadata' && typeof value === 'object') {
      return `Emitido: ${new Date(value.issuedAt).toLocaleString('es-ES')}`;
    }
    return String(value || 'No especificado');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Recuperar Certificado</h1>
      <p className="text-gray-600 mb-6">Ingrese el ID de transacción para ver los datos</p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID de Transacción *
          </label>
          <input
            type="text"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
            required
            placeholder="Ingrese el ID de 64 caracteres"
            pattern="[a-fA-F0-9]{64}"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            El ID de transacción se proporciona al crear el certificado
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Seleccione los campos a recuperar
          </label>
          
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAllToggle}
                className="mr-3"
              />
              <span className="font-medium">Todos los campos</span>
            </label>
            
            <div className={`grid grid-cols-2 gap-2 ${selectAll ? 'opacity-50' : ''}`}>
              {availableFields.map(field => (
                <label 
                  key={field.value}
                  className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectAll || selectedFields.includes(field.value)}
                    onChange={() => handleFieldToggle(field.value)}
                    disabled={selectAll}
                    className="mr-3"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (!selectAll && selectedFields.length === 0)}
          className={`w-full py-3 px-4 rounded-md text-white font-medium text-lg ${
            loading || (!selectAll && selectedFields.length === 0)
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Recuperando del Blockchain...' : 'Recuperar Certificado'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-6 bg-green-50 border border-green-300 rounded-md">
          <h3 className="font-bold text-green-800 text-xl mb-4">
            📄 Certificado Recuperado
          </h3>
          
          <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
            {Object.entries(result).map(([key, value]) => {
              const field = availableFields.find(f => f.value === key);
              if (!field && key !== 'metadata') return null;
              
              return (
                <div key={key} className="flex flex-col sm:flex-row border-b pb-3 last:border-0">
                  <span className="font-semibold text-gray-700 sm:w-48 mb-1 sm:mb-0">
                    {field?.label || 'Metadatos'}:
                  </span>
                  <span className="text-gray-900 flex-1">
                    {formatValue(key, value)}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Este certificado fue recuperado de la blockchain BSV y 
              los datos han sido descifrados de forma segura.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
