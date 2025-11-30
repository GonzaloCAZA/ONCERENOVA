import React, { useState } from 'react';
import { CertificateData } from '../types/certificate.types';
import { certificateAPI } from '../services/api';

// Lista de tipos de discapacidad disponibles
const disabilityTypes = [
  { value: 'cognitiva', label: 'Cognitiva' },
  { value: 'fisica', label: 'Física' },
  { value: 'sensorial', label: 'Sensorial' },
  { value: 'psiquica', label: 'Psíquica' },
  { value: 'multiple', label: 'Múltiple' }
];

// Lista de ayudas a la movilidad que puede seleccionar el usuario
const mobilityAidsOptions = [
  'Silla de ruedas',
  'Bastón',
  'Muletas',
  'Andador',
  'Prótesis',
  'Órtesis',
  'Audífono',
  'Perro guía'
];

export const CreateCertificate: React.FC = () => {
  // Estado de carga mientras se envía a blockchain
  const [loading, setLoading] = useState(false);
  
  // Resultado exitoso: txid y mensaje de confirmación
  const [result, setResult] = useState<{ txid: string; message: string } | null>(null);
  
  // Mensaje de error si algo falla
  const [error, setError] = useState<string | null>(null);
  
  // Mostrar/ocultar sección de contacto de emergencia
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);

  // Estado del formulario principal con datos del certificado
  const [formData, setFormData] = useState<CertificateData>({
    firstName: '',
    lastName: '',
    documentId: '',
    phoneNumber: '',
    disabilityType: 'fisica',
    disabilityPercentage: 33,
    disabilityDescription: '',
    mobilityAids: [],
    specialNeeds: ''
  });

  // Estado del contacto de emergencia (opcional)
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    relationship: ''
  });

  // Manejar cambios en inputs de texto, número y select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      // Convertir a número si es input numérico
      setFormData({
        ...formData,
        [name]: parseInt(value, 10)
      });
    } else {
      // Mantener como string para otros tipos
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Alternar selección de ayudas a la movilidad (checkboxes)
  const handleMobilityAidToggle = (aid: string) => {
    const currentAids = formData.mobilityAids || [];
    const newAids = currentAids.includes(aid)
      ? currentAids.filter(a => a !== aid)  // Deseleccionar si ya está marcado
      : [...currentAids, aid];  // Agregar si no está marcado
    
    setFormData({
      ...formData,
      mobilityAids: newAids
    });
  };

  // Manejar cambios en inputs del contacto de emergencia
  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmergencyContact({
      ...emergencyContact,
      [e.target.name]: e.target.value
    });
  };

  // Enviar formulario: cifrar, guardar en blockchain y mostrar txid
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Combinar datos del formulario con contacto de emergencia si está habilitado
      const certificateData = {
        ...formData,
        emergencyContact: showEmergencyContact && emergencyContact.name ? emergencyContact : undefined
      };

      // Enviar al backend (API llama a blockchain)
      const response = await certificateAPI.create(certificateData);
      setResult({
        txid: response.txid,
        message: response.message,
      });
      
      // Limpiar formulario después de éxito
      setFormData({
        firstName: '',
        lastName: '',
        documentId: '',
        phoneNumber: '',
        disabilityType: 'fisica',
        disabilityPercentage: 33,
        disabilityDescription: '',
        mobilityAids: [],
        specialNeeds: ''
      });
      setEmergencyContact({ name: '', phone: '', relationship: '' });
      setShowEmergencyContact(false);
    } catch (err: any) {
      // Capturar y mostrar error
      setError(err.error || 'Error al crear el certificado');
    } finally {
      setLoading(false);
    }
  };

  // Copiar ID de transacción al portapapeles del usuario
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('ID de transacción copiado al portapapeles');
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Encabezado */}
      <h1 className="text-3xl font-bold mb-2">Certificado de Discapacidad</h1>
      <p className="text-gray-600 mb-6">Almacenamiento seguro en blockchain BSV</p>

      {/* Formulario principal */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        
        {/* SECCIÓN 1: Datos Personales */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Datos Personales</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Campo: Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Campo: Apellidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Campo: DNI/NIE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI/NIE *
              </label>
              <input
                type="text"
                name="documentId"
                value={formData.documentId}
                onChange={handleChange}
                required
                placeholder="12345678A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Campo: Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                placeholder="+34 612 345 678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Información de Discapacidad */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Información de Discapacidad</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Campo: Tipo de Discapacidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Discapacidad *
              </label>
              <select
                name="disabilityType"
                value={formData.disabilityType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {disabilityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo: Porcentaje de Discapacidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje de Discapacidad (%) *
              </label>
              <input
                type="number"
                name="disabilityPercentage"
                value={formData.disabilityPercentage}
                onChange={handleChange}
                min="33"
                max="100"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Campo: Descripción detallada */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción de la Discapacidad *
            </label>
            <textarea
              name="disabilityDescription"
              value={formData.disabilityDescription}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describa el tipo y grado de discapacidad, limitaciones principales..."
            />
          </div>
        </div>

        {/* SECCIÓN 3: Ayudas a la Movilidad */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4">Ayudas a la Movilidad</h2>
          {/* Checkboxes para seleccionar múltiples ayudas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mobilityAidsOptions.map(aid => (
              <label key={aid} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.mobilityAids?.includes(aid) || false}
                  onChange={() => handleMobilityAidToggle(aid)}
                  className="mr-2"
                />
                <span className="text-sm">{aid}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SECCIÓN 4: Necesidades Especiales */}
        <div className="border-b pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Necesidades Especiales
          </label>
          <textarea
            name="specialNeeds"
            value={formData.specialNeeds || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describa cualquier necesidad especial o adaptación requerida..."
          />
        </div>

        {/* SECCIÓN 5: Contacto de Emergencia (Opcional) */}
        <div>
          {/* Checkbox para mostrar/ocultar sección */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="showEmergencyContact"
              checked={showEmergencyContact}
              onChange={(e) => setShowEmergencyContact(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="showEmergencyContact" className="font-medium">
              Añadir contacto de emergencia
            </label>
          </div>
          
          {/* Mostrar campos de contacto de emergencia si está habilitado */}
          {showEmergencyContact && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
              {/* Nombre del contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={emergencyContact.name}
                  onChange={handleEmergencyContactChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Teléfono del contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={emergencyContact.phone}
                  onChange={handleEmergencyContactChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Relación con el usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relación
                </label>
                <input
                  type="text"
                  name="relationship"
                  value={emergencyContact.relationship}
                  onChange={handleEmergencyContactChange}
                  placeholder="Ej: Madre, Cuidador"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md text-white font-medium text-lg ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Guardando en Blockchain...' : 'Crear Certificado'}
        </button>
      </form>

      {/* MENSAJE DE ERROR */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* MENSAJE DE ÉXITO con ID de transacción */}
      {result && (
        <div className="mt-4 p-6 bg-green-50 border border-green-300 rounded-md">
          <h3 className="font-bold text-green-800 text-xl mb-3">
            ✅ Certificado Creado Exitosamente
          </h3>
          <p className="text-gray-700 mb-4">{result.message}</p>
          
          {/* Box con ID de transacción */}
          <div className="bg-white p-4 rounded border border-gray-300">
            <p className="text-sm text-gray-600 mb-2">ID de la Transacción:</p>
            <div className="flex items-center">
              <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                {result.txid}
              </code>
              {/* Botón para copiar txid */}
              <button
                onClick={() => copyToClipboard(result.txid)}
                className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Copiar
              </button>
            </div>
          </div>
          
          {/* Aviso importante */}
          <p className="text-sm text-gray-600 mt-3">
            ⚠️ <strong>IMPORTANTE:</strong> Guarde este ID para recuperar el certificado en el futuro.
          </p>
        </div>
      )}
    </div>
  );
};