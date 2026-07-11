import { spawn } from 'node:child_process';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bridgePath = path.join(__dirname, 'excel_bridge.py');
const pythonBin = process.env.PYTHON_BIN
  || 'C:\\Users\\ACER NITRO\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';

export async function readDrawings(workbookPath) {
  return runBridge({ command: 'read', workbookPath });
}

export async function appendDrawing(workbookPath, drawing) {
  validateDrawing(drawing);
  return runBridge({ command: 'append', workbookPath, drawing });
}

export async function replaceWorkbook(workbookPath, uploadedPath, backupDir) {
  const uploadedDrawings = await readDrawings(uploadedPath);
  if (uploadedDrawings.length === 0) {
    throw new Error('El Excel no contiene tiradas en BASE DATOS FLORIDA.');
  }

  await mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `METODOS-3-backup-${timestamp()}.xlsx`);
  await copyFile(workbookPath, backupPath);
  await copyFile(uploadedPath, workbookPath);

  return {
    count: uploadedDrawings.length,
    backupPath,
  };
}

export function validateDrawing(drawing) {
  if (!drawing.date) {
    throw new Error('La fecha es obligatoria.');
  }

  if (!['T', 'N'].includes(String(drawing.shift || '').toUpperCase())) {
    throw new Error('El turno debe ser T o N.');
  }

  ['fijo', 'first', 'second'].forEach((field) => {
    const value = Number(drawing[field]);
    if (!Number.isInteger(value) || value < 0 || value > 99) {
      throw new Error('Los numeros deben estar entre 00 y 99.');
    }
  });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function runBridge(payload) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [bridgePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      let parsed;
      try {
        parsed = JSON.parse(stdout || '{}');
      } catch (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }

      if (code === 0 && parsed.ok) {
        resolve(parsed.data);
      } else {
        reject(new Error(parsed.error || stderr || 'No se pudo procesar el Excel.'));
      }
    });

    child.stdin.end(JSON.stringify(payload));
  });
}
