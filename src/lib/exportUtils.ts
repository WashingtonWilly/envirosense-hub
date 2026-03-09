/**
 * Guarda un objeto como archivo JSON descargable
 * @param data - Objeto a exportar
 * @param fileName - Nombre del archivo (sin extensión)
 */
export function saveAsJSON(data: unknown, fileName: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}
