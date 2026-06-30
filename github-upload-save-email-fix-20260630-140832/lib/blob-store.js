const crypto = require("crypto");
const { del, put } = require("@vercel/blob");

function blobIsConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function safeFileName(name = "file") {
  const cleaned = String(name)
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "file";
}

function safeFolder(folder = "uploads") {
  return ["documents", "profile-photos"].includes(folder) ? folder : "uploads";
}

function dataUrlToFile(dataUrl = "", fallbackType = "application/octet-stream") {
  const match = String(dataUrl).match(/^data:([^;,]+)?;base64,(.+)$/);

  if (!match) {
    throw new Error("Upload data was not recognised.");
  }

  return {
    contentType: match[1] || fallbackType,
    body: Buffer.from(match[2], "base64")
  };
}

async function uploadBlobFile({ dataUrl, filename, contentType, folder }) {
  if (!blobIsConfigured()) {
    return {
      uploaded: false,
      reason: "Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel."
    };
  }

  const file = dataUrlToFile(dataUrl, contentType);
  return uploadBlobBuffer({
    body: file.body,
    filename,
    contentType: contentType || file.contentType || "application/octet-stream",
    folder
  });
}

async function uploadBlobBuffer({ body, filename, contentType, folder }) {
  if (!blobIsConfigured()) {
    return {
      uploaded: false,
      reason: "Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel."
    };
  }

  const fileBody = Buffer.isBuffer(body) ? body : Buffer.from(body || "");
  const pathname = `${safeFolder(folder)}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(filename)}`;
  const blob = await put(pathname, fileBody, {
    access: "public",
    contentType: contentType || "application/octet-stream",
    addRandomSuffix: false
  });

  return {
    uploaded: true,
    url: blob.url,
    downloadUrl: blob.downloadUrl || blob.url,
    pathname: blob.pathname,
    contentType: contentType || "",
    size: fileBody.length
  };
}

async function deleteBlobFile({ url, pathname }) {
  if (!blobIsConfigured()) {
    return {
      deleted: false,
      reason: "Blob storage is not configured."
    };
  }

  const target = pathname || url;

  if (!target) {
    return { deleted: true };
  }

  await del(target);
  return { deleted: true };
}

module.exports = {
  deleteBlobFile,
  uploadBlobBuffer,
  uploadBlobFile
};
