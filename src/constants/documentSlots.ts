import { DriverDocumentSlot } from '../types';

/** Rotulos dos documentos obrigatorios. O estado real vem sempre do servidor (GET /driver/documents). */
export const DOCUMENT_SLOTS: DriverDocumentSlot[] = [
  { id: 'doc-bi-front', label: 'Bilhete de identidade (frente)', description: 'Foto nitida, sem reflexos, dados legiveis.', submissionStatus: 'not_submitted' },
  { id: 'doc-bi-back', label: 'Bilhete de identidade (verso)', description: 'Foto nitida do verso do documento.', submissionStatus: 'not_submitted' },
  { id: 'doc-selfie', label: 'Selfie de verificacao', description: 'Foto do rosto, com boa iluminacao, sem oculos escuros.', submissionStatus: 'not_submitted' },
  { id: 'doc-license', label: 'Carta de conducao', description: 'Documento valido, sem rasuras.', submissionStatus: 'not_submitted' },
  { id: 'doc-vehicle-reg', label: 'Documento do veiculo', description: 'Livrete ou documento equivalente, atualizado.', submissionStatus: 'not_submitted' },
  { id: 'doc-insurance', label: 'Seguro automovel', description: 'Apolice valida, com data de validade visivel.', submissionStatus: 'not_submitted' },
];