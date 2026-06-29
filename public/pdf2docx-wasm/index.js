// src/index.ts
var Pdf2Docx = class {
  constructor(assetPath) {
    this.assetPath = assetPath;
  }
  async convert(pdf, pages) {
    const pyodide = await this.load();
    const { FS } = pyodide;
    const buf = await pdf.arrayBuffer();
    FS.writeFile("/input.pdf", new Uint8Array(buf));
    const convert = pyodide.globals.get("convert");
    convert(pages);
    const outputBuf = FS.readFile("/output.docx");
    return new Blob([outputBuf], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  }
  async load() {
    if (this.pyodidePromise) return this.pyodidePromise;
    return this.pyodidePromise = Promise.resolve().then(async () => {
      const { loadPyodide } = await import(this.getAssetPath("pyodide.js"));
      const pyodide = await loadPyodide();
      const pkgs = [
        "pymupdf-1.26.1-cp313-none-pyodide_2025_0_wasm32.whl",
        "python_docx-1.2.0-py3-none-any.whl",
        "pdf2docx-0.5.8-py3-none-any.whl",
        "lxml-5.4.0-cp313-cp313-pyodide_2025_0_wasm32.whl",
        "typing_extensions-4.12.2-py3-none-any.whl",
        "numpy-2.2.5-cp313-cp313-pyodide_2025_0_wasm32.whl",
        "opencv_python-4.11.0.86-cp313-cp313-pyodide_2025_0_wasm32.whl",
        "fonttools-4.56.0-py3-none-any.whl"
      ];
      await Promise.all(
        pkgs.map((x) => pyodide.loadPackage(this.getAssetPath(x)))
      );
      pyodide.runPython(`
      from pdf2docx import Converter

      def convert(pages):
          cv = Converter("/input.pdf")
          cv.convert("/output.docx", pages=pages)
          cv.close()
      `);
      return pyodide;
    });
  }
  getAssetPath(name) {
    return (this.assetPath || "./") + name;
  }
};
export {
  Pdf2Docx
};
