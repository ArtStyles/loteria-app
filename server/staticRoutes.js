import path from 'node:path';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

export function resolveStaticRequest(rootDir, urlPath) {
  if (urlPath.startsWith('/api/')) {
    return { type: 'not-found' };
  }

  const decodedPath = decodeURIComponent(urlPath);
  const targetPath = shouldServeAppShell(decodedPath) ? '/index.html' : decodedPath;
  const rootPath = path.resolve(rootDir);
  const filePath = path.resolve(rootPath, `.${targetPath}`);

  if (!isInsideRoot(rootPath, filePath)) {
    return { type: 'forbidden' };
  }

  return {
    type: 'file',
    filePath,
    contentType: getContentType(filePath),
  };
}

function shouldServeAppShell(urlPath) {
  return urlPath === '/' || path.extname(urlPath) === '';
}

function isInsideRoot(rootPath, filePath) {
  return filePath === rootPath || filePath.startsWith(`${rootPath}${path.sep}`);
}

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath)] || 'application/octet-stream';
}
