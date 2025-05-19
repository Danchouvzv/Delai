// Type declaration for html2pdf.js library
declare module 'html2pdf.js' {
  interface Options {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
      [key: string]: any;
    };
    [key: string]: any;
  }

  interface HTML2PDFResult {
    save: () => Promise<void>;
    from: (element: HTMLElement) => HTML2PDFResult;
    set: (options: Options) => HTML2PDFResult;
    outputPdf: () => any;
    output: (type: string, options?: any) => any;
  }

  const html2pdf: any;
  export = html2pdf;
}

// Add avatarFile property to UserData interface
interface UserData {
  avatarFile?: File;
} 