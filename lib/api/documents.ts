export interface DocumentMetadata {
  id_document: number;
  nom: string;
  type_document: string;
  storage_url: string;
  uploaded_at: string;
}

export const documentsApi = {
  getDocument: async (id: number): Promise<DocumentMetadata> => {
    const response = await fetch(`/api/proxy/documents?path=documents/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch document ${id}`);
    return response.json();
  },

  getDownloadUrl: async (id: number): Promise<{ download_url: string }> => {
    const response = await fetch(`/api/proxy/documents?path=documents/${id}/download-url`);
    if (!response.ok) throw new Error(`Failed to fetch download URL for document ${id}`);
    return response.json();
  },
};
